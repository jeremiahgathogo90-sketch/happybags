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

    const { data: settings } = await supabase
      .from("shipping_settings")
      .select("key, value")
      .in("key", ["mpesa_consumer_key","mpesa_consumer_secret","mpesa_shortcode","mpesa_passkey","mpesa_env","mpesa_account"])

    const s: Record<string, string> = {}
    ;(settings ?? []).forEach((r: any) => {
      s[r.key] = String(r.value).replace(/^"|"$/g, "").trim()
    })

    const consumerKey    = s.mpesa_consumer_key
    const consumerSecret = s.mpesa_consumer_secret
    const shortCode      = s.mpesa_shortcode
    const passKey        = s.mpesa_passkey
    const env            = s.mpesa_env
    const account        = s.mpesa_account || "HappyBags"

    const isSandbox = env === "sandbox"
    const baseUrl   = isSandbox ? "https://sandbox.safaricom.co.ke" : "https://api.safaricom.co.ke"

    console.log("Env:", env, "ShortCode:", shortCode, "Account:", account)

    const { phone, amount, orderId } = await req.json()
    console.log("Request - orderId:", orderId, "phone:", phone, "amount:", amount)

    if (!phone || !amount || !orderId) {
      return new Response(JSON.stringify({ error: "phone, amount and orderId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    let formattedPhone = String(phone).replace(/\s/g, "").replace(/^0/, "254").replace(/^\+/, "")
    if (!formattedPhone.startsWith("254")) formattedPhone = "254" + formattedPhone
    console.log("Phone:", formattedPhone)

    const auth     = btoa(consumerKey + ":" + consumerSecret)
    const tokenRes = await fetch(baseUrl + "/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: "Basic " + auth },
    })
    const tokenData   = await tokenRes.json()
    const accessToken = tokenData.access_token
    console.log("Token obtained:", !!accessToken)

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Failed to get token", details: tokenData }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const now = new Date()
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0")

    const password = btoa(shortCode + passKey + timestamp)

    const callbackUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1/mpesa-callback"

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
      AccountReference:  account,
      TransactionDesc:   "Payment for order " + orderId,
    }

    console.log("STK body prepared - Amount:", Math.ceil(amount))

    const stkRes  = await fetch(baseUrl + "/mpesa/stkpush/v1/processrequest", {
      method:  "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body:    JSON.stringify(stkBody),
    })

    const stkData = await stkRes.json()
    console.log("STK Response:", JSON.stringify(stkData))

    if (stkData.CheckoutRequestID) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ payment_reference: stkData.CheckoutRequestID, payment_status: "pending" })
        .eq("id", orderId)

      if (updateError) {
        console.error("Update error:", updateError.message)
      } else {
        console.log("Order updated successfully!")
      }
    }

    return new Response(JSON.stringify(stkData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error("Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})