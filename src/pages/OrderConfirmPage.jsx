import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Package, Truck, Phone, MapPin, ArrowRight, Printer } from 'lucide-react'
import { formatKES } from '@/lib/utils'
import ReceiptPrint from '@/components/ReceiptPrint'

export default function OrderConfirmPage() {
  const { id }                          = useParams()
  const [order, setOrder]               = useState(null)
  const [items, setItems]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [showReceipt, setShowReceipt]   = useState(false)

  useEffect(() => {
    async function load() {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      setOrder(orderData)

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id)

      setItems(itemsData ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="text-center py-20 text-gray-500">Order not found.</div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {showReceipt && (
        <ReceiptPrint orderId={id} onClose={() => setShowReceipt(false)} />
      )}

      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={44} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-500 text-sm">Thank you! We will process your order right away.</p>
        <div className="inline-block bg-blue-50 text-blue-700 font-mono font-bold px-4 py-2 rounded-xl mt-3 text-sm">
          {order.order_number}
        </div>
      </div>

      {order.payment_method === 'mpesa' && order.payment_status === 'unpaid' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <Phone size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800 text-sm">M-Pesa Payment Request Sent</p>
            <p className="text-green-700 text-xs mt-1">
              Check {order.phone} for the STK push and enter your M-Pesa PIN to complete payment.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="font-bold text-gray-900 mb-4">Order Details</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.product_image || 'https://placehold.co/40x40?text=?'}
                  alt=""
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity} x {formatKES(item.unit_price)}</p>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatKES(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>{formatKES(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery</span>
            <span>{order.delivery_fee === 0 ? 'FREE' : formatKES(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base">
            <span>Total</span><span>{formatKES(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-blue-600" /> Delivery Address
        </h2>
        <p className="text-sm text-gray-700">{order.delivery_address && order.delivery_address.full_name}</p>
        <p className="text-sm text-gray-600">
          {order.delivery_address && order.delivery_address.street && order.delivery_address.street + ', '}
          {order.delivery_address && order.delivery_address.town}, {order.delivery_address && order.delivery_address.county}
        </p>
        <p className="text-sm text-gray-600">{order.phone}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Truck size={16} className="text-blue-600" /> What Happens Next
        </h2>
        <div className="space-y-3">
          {[
            { icon: CheckCircle, label: 'Order received',   sub: 'We have your order',       done: true  },
            { icon: Package,     label: 'Processing',       sub: 'Preparing your items',      done: false },
            { icon: Truck,       label: 'Out for delivery', sub: 'Your order is on its way',  done: false },
            { icon: CheckCircle, label: 'Delivered',        sub: 'Enjoy your purchase!',      done: false },
          ].map(({ icon: Icon, label, sub, done }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={['w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', done ? 'bg-green-100' : 'bg-gray-100'].join(' ')}>
                <Icon size={16} className={done ? 'text-green-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className={['text-sm font-medium', done ? 'text-gray-900' : 'text-gray-500'].join(' ')}>{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowReceipt(true)}
          className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-medium py-3 px-5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          <Printer size={16} /> Print Receipt
        </button>
        <Link
          to="/orders"
          className="flex-1 border border-blue-200 text-blue-600 font-medium py-3 rounded-xl text-center text-sm hover:bg-blue-50 transition-colors"
        >
          View My Orders
        </Link>
        <Link
          to="/products"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-center text-sm transition-colors flex items-center justify-center gap-2"
        >
          Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}