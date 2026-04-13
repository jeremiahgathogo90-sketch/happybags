import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Get M-Pesa settings from DB
    const { data: settings, error: settingsError } = await supabase
      .from("shipping_settings")
      .select("key, value")
      .in("key", ["mpesa_consumer_key", "mpesa_consumer_secret", "mpesa_shortcode", "mpesa_passkey", "mpesa_env"])

    if (settingsError) {
      console.error("Settings error:", settingsError)
      return new Response(JSON.stringify({ error: "Failed to load settings" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const s: Record<string, string> = {}
    ;(settings ?? []).forEach((r: any) => {
      // Handle both quoted and unquoted JSON values
      let val = r.value
      if (typeof val === 'string') {
        val = val.replace(/^"|"$/g, "").trim()
      }
      s[r.key] = val
    })

    console.log("Settings loaded:", Object.keys(s))
    console.log("Shortcode:", s.mpesa_shortcode)
    console.log("Env:", s.mpesa_env)

    const consumerKey    = s.mpesa_consumer_key
    const consumerSecret = s.mpesa_consumer_secret
    const shortCode      = s.mpesa_shortcode
    const passKey        = s.mpesa_passkey
    const env            = s.mpesa_env

    if (!consumerKey || !consumerSecret || !shortCode || !passKey) {
      console.error("Missing credentials:", { consumerKey: !!consumerKey, consumerSecret: !!consumerSecret, shortCode: !!shortCode, passKey: !!passKey })
      return new Response(JSON.stringify({ error: "M-Pesa credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const isSandbox = env === "sandbox"
    const baseUrl   = isSandbox
      ? "https://sandbox.safaricom.co.ke"
      : "https://api.safaricom.co.ke"

    console.log("Using base URL:", baseUrl)

    // Get request body
    const { phone, amount, orderId } = await req.json()
    console.log("Request:", { phone, amount, orderId })

    if (!phone || !amount || !orderId) {
      return new Response(
        JSON.stringify({ error: "phone, amount and orderId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Format phone
    let formattedPhone = String(phone).replace(/\s/g, "").replace(/^0/, "254").replace(/^\+/, "")
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone
    }
    console.log("Formatted phone:", formattedPhone)

    // Step 1 — Get OAuth token
    const auth = btoa(consumerKey + ":" + consumerSecret)
    console.log("Getting OAuth token...")

    const tokenRes = await fetch(baseUrl + "/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: "Basic " + auth },
    })
    const tokenData = await tokenRes.json()
    console.log("Token response:", JSON.stringify(tokenData))

    const accessToken = tokenData.access_token

    if (!accessToken) {
      console.error("No access token:", tokenData)
      return new Response(
        JSON.stringify({ error: "Failed to get M-Pesa token", details: tokenData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Step 2 — Generate timestamp and password
    const now = new Date()
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0")

    const passwordStr = shortCode + passKey + timestamp
    const password    = btoa(passwordStr)
    console.log("Timestamp:", timestamp)

    // Step 3 — STK Push
    const callbackUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1/mpesa-callback"
    console.log("Callback URL:", callbackUrl)

    const stkBody = {
      BusinessShortCode: shortCode,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   "CustomerPayBillOnline",
      Amount:            Math.ceil(amount),
      PartyA:            formattedPhone,
      PartyB:            shortCode,
      PhoneNumber:       formattedPhone,
      CallBackURL:       callbackUrl,
      AccountReference:  "HappyBags-" + orderId,
      TransactionDesc:   "Payment for order " + orderId,
    }

    console.log("STK Push body:", JSON.stringify(stkBody))

    const stkRes = await fetch(baseUrl + "/mpesa/stkpush/v1/processrequest", {
      method:  "POST",
      headers: {
        Authorization:  "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkBody),
    })

    const stkData = await stkRes.json()
    console.log("STK Push response:", JSON.stringify(stkData))

    // Update order with checkout request ID
    if (stkData.CheckoutRequestID) {
      await supabase
        .from("orders")
        .update({
          payment_reference: stkData.CheckoutRequestID,
          payment_status:    "pending",
        })
        .eq("id", orderId)
    }

    return new Response(JSON.stringify(stkData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error("Unexpected error:", err.message, err.stack)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})