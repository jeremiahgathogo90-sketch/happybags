import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const body = await req.json()
    const callback = body?.Body?.stkCallback

    if (!callback) {
      return new Response(JSON.stringify({ error: "Invalid callback" }), { status: 400 })
    }

    const checkoutRequestId = callback.CheckoutRequestID
    const resultCode       = callback.ResultCode
    const resultDesc       = callback.ResultDesc

    if (resultCode === 0) {
      // Payment successful
      const metadata = callback.CallbackMetadata?.Item ?? []
      const getMeta  = (name: string) => metadata.find((i: any) => i.Name === name)?.Value

      const mpesaCode  = getMeta("MpesaReceiptNumber")
      const amount     = getMeta("Amount")
      const phone      = getMeta("PhoneNumber")

      await supabase
        .from("orders")
        .update({
          payment_status:    "paid",
          status:            "processing",
          payment_reference: mpesaCode,
          paid_at:           new Date().toISOString(),
        })
        .eq("payment_reference", checkoutRequestId)

    } else {
      // Payment failed or cancelled
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          status:         "cancelled",
        })
        .eq("payment_reference", checkoutRequestId)
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})