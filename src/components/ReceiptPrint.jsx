import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { formatKES } from '@/lib/utils'
import { Printer, X } from 'lucide-react'

export default function ReceiptPrint({ orderId, onClose }) {
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const printRef = useRef()

  useEffect(() => {
    async function load() {
      const [orderRes, itemsRes, settingsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).maybeSingle(),
        supabase.from('order_items').select('*').eq('order_id', orderId),
        supabase.from('shipping_settings').select('key, value').in('key', ['store_name','store_phone','store_address','receipt_footer','whatsapp_number']),
      ])
      setOrder(orderRes.data)
      setItems(itemsRes.data ?? [])
      const s = {}
      ;(settingsRes.data ?? []).forEach(r => { s[r.key] = String(r.value).replace(/^"|"$/g, '') })
      setSettings(s)
      setLoading(false)
    }
    load()
  }, [orderId])

  function handlePrint() {
    const win = window.open('', '_blank', 'width=400,height=700')
    win.document.write('<html><head><style>body{font-family:Courier New,monospace;font-size:12px;padding:8px;width:80mm;} .center{text-align:center;} .bold{font-weight:bold;} .row{display:flex;justify-content:space-between;margin:2px 0;} .divider{border-top:1px dashed #000;margin:6px 0;} .divider2{border-top:2px solid #000;margin:4px 0;}</style></head><body>' + printRef.current.innerHTML + '</body></html>')
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!order) return null

  const storeName = settings.store_name || 'MY STORE'
  const date = new Date(order.created_at)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Printer size={18} className="text-blue-600" /> Print Receipt
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-4 overflow-y-auto max-h-96">
          <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50">
            <div ref={printRef} style={{fontFamily:'Courier New,monospace',fontSize:'12px',lineHeight:'1.5'}}>
              <div className="text-center font-bold text-base mb-1">{storeName.toUpperCase()}</div>
              {settings.store_phone && <div className="text-center text-xs">Tel: {settings.store_phone}</div>}
              {settings.store_address && <div className="text-center text-xs">{settings.store_address}</div>}
              <div style={{borderTop:'2px solid #000',margin:'6px 0'}} />
              <div className="flex justify-between text-xs"><span>Receipt:</span><span className="font-bold">{order.order_number}</span></div>
              <div className="flex justify-between text-xs"><span>Date:</span><span>{date.toLocaleDateString('en-KE')}</span></div>
              <div className="flex justify-between text-xs"><span>Phone:</span><span>{order.phone}</span></div>
              <div style={{borderTop:'1px dashed #000',margin:'6px 0'}} />
              <div className="flex justify-between font-bold text-xs mb-1"><span>ITEM</span><span>AMOUNT</span></div>
              <div style={{borderTop:'1px dashed #000',margin:'4px 0'}} />
              {items.map((item, i) => (
                <div key={i}>
                  <div className="text-xs font-medium">{item.product_name}</div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{item.quantity} x {formatKES(item.unit_price)}</span>
                    <span>{formatKES(item.subtotal)}</span>
                  </div>
                </div>
              ))}
              <div style={{borderTop:'1px dashed #000',margin:'6px 0'}} />
              <div className="flex justify-between text-xs"><span>Subtotal</span><span>{formatKES(order.subtotal)}</span></div>
              <div className="flex justify-between text-xs"><span>Delivery</span><span>{order.delivery_fee === 0 ? 'FREE' : formatKES(order.delivery_fee)}</span></div>
              <div style={{borderTop:'2px solid #000',margin:'4px 0'}} />
              <div className="flex justify-between font-bold"><span>TOTAL</span><span>{formatKES(order.total)}</span></div>
              <div style={{borderTop:'1px dashed #000',margin:'6px 0'}} />
              <div className="flex justify-between text-xs"><span>Payment</span><span className="font-bold uppercase">{order.payment_method === 'mpesa' ? 'M-PESA' : order.payment_method}</span></div>
              <div className="flex justify-between text-xs"><span>Status</span><span className="font-bold uppercase">{order.payment_status}</span></div>
              {order.mpesa_receipt && <div className="flex justify-between text-xs"><span>Ref</span><span>{order.mpesa_receipt}</span></div>}
              <div style={{borderTop:'1px dashed #000',margin:'6px 0'}} />
              <div className="text-center text-xs font-bold mt-2">{settings.receipt_footer || 'Thank you for your purchase!'}</div>
              {settings.whatsapp_number && <div className="text-center text-xs">WhatsApp: {settings.whatsapp_number}</div>}
              <div className="text-center text-xs text-gray-400 mt-2">*** CUSTOMER COPY ***</div>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handlePrint} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>
    </div>
  )
}
