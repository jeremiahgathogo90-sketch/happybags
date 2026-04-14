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

    const { orderId } = await req.json()

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Get order details
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    if (!order.payment_reference) {
      return new Response(JSON.stringify({ error: "No payment reference found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Get M-Pesa credentials
    const { data: settings } = await supabase
      .from("shipping_settings")
      .select("key, value")
      .in("key", ["mpesa_consumer_key", "mpesa_consumer_secret", "mpesa_shortcode", "mpesa_passkey", "mpesa_env"])

    const s: Record<string, string> = {}
    ;(settings ?? []).forEach((r: any) => {
      s[r.key] = String(r.value).replace(/^"|"$/g, "").trim()
    })

    const isSandbox = s.mpesa_env === "sandbox"
    const baseUrl   = isSandbox ? "https://sandbox.safaricom.co.ke" : "https://api.safaricom.co.ke"

    // Get token
    const auth = btoa(s.mpesa_consumer_key + ":" + s.mpesa_consumer_secret)
    const tokenRes  = await fetch(baseUrl + "/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: "Basic " + auth },
    })
    const tokenData = await tokenRes.json()
    const token     = tokenData.access_token

    if (!token) {
      return new Response(JSON.stringify({ error: "Could not get token" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Generate timestamp and password
    const now = new Date()
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0")

    const password = btoa(s.mpesa_shortcode + s.mpesa_passkey + timestamp)

    // Query STK status
    const queryRes = await fetch(baseUrl + "/mpesa/stkpushquery/v1/query", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: s.mpesa_shortcode,
        Password:          password,
        Timestamp:         timestamp,
        CheckoutRequestID: order.payment_reference,
      }),
    })

    const queryData = await queryRes.json()
    console.log("Query response:", JSON.stringify(queryData))

    // If paid, update order
    if (queryData.ResultCode === "0" || queryData.ResultCode === 0) {
      await supabase
        .from("orders")
        .update({ payment_status: "paid", status: "processing" })
        .eq("id", orderId)

      return new Response(JSON.stringify({ paid: true, message: "Payment confirmed!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    return new Response(JSON.stringify({ paid: false, message: queryData.ResultDesc || "Payment pending", details: queryData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (err) {
    console.error("Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})