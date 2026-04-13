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
    const { data: settings } = await supabase
      .from("shipping_settings")
      .select("key, value")
      .in("key", ["mpesa_consumer_key", "mpesa_consumer_secret", "mpesa_shortcode", "mpesa_passkey", "mpesa_env"])

    const s: Record<string, string> = {}
    ;(settings ?? []).forEach((r: any) => {
      s[r.key] = String(r.value).replace(/^"|"$/g, "")
    })

    const {
      mpesa_consumer_key: consumerKey,
      mpesa_consumer_secret: consumerSecret,
      mpesa_shortcode: shortCode,
      mpesa_passkey: passKey,
      mpesa_env: env,
    } = s

    const isSandbox = env === "sandbox"
    const baseUrl = isSandbox
      ? "https://sandbox.safaricom.co.ke"
      : "https://api.safaricom.co.ke"

    // Get request body
    const { phone, amount, orderId } = await req.json()

    if (!phone || !amount || !orderId) {
      return new Response(
        JSON.stringify({ error: "phone, amount and orderId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Format phone — remove leading 0 or +254 and add 254
    let formattedPhone = phone.replace(/\s/g, "").replace(/^0/, "254").replace(/^\+/, "")
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone
    }

    // Step 1 — Get OAuth token
    const auth = btoa(consumerKey + ":" + consumerSecret)
    const tokenRes = await fetch(baseUrl + "/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: "Basic " + auth },
    })
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
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
    const password = btoa(passwordStr)

    // Step 3 — STK Push
    const stkRes = await fetch(baseUrl + "/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(amount),
        PartyA: formattedPhone,
        PartyB: shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: Deno.env.get("SUPABASE_URL") + "/functions/v1/mpesa-callback",
        AccountReference: "HappyBags-" + orderId,
        TransactionDesc: "Payment for order " + orderId,
      }),
    })

    const stkData = await stkRes.json()

    // Step 4 — Update order with checkout request ID
    if (stkData.CheckoutRequestID) {
      await supabase
        .from("orders")
        .update({
          payment_reference: stkData.CheckoutRequestID,
          payment_status: "pending",
        })
        .eq("id", orderId)
    }

    return new Response(JSON.stringify(stkData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})