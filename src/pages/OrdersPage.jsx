import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Package, ChevronRight, Clock, Truck, CheckCircle, XCircle } from 'lucide-react'
import { formatKES } from '@/lib/utils'

const STATUS_CONFIG = {
  pending:    { color: 'bg-yellow-100 text-yellow-700',  icon: Clock,        label: 'Pending' },
  confirmed:  { color: 'bg-blue-100 text-blue-700',      icon: CheckCircle,  label: 'Confirmed' },
  processing: { color: 'bg-purple-100 text-purple-700',  icon: Package,      label: 'Processing' },
  shipped:    { color: 'bg-indigo-100 text-indigo-700',  icon: Truck,        label: 'Shipped' },
  delivered:  { color: 'bg-green-100 text-green-700',    icon: CheckCircle,  label: 'Delivered' },
  cancelled:  { color: 'bg-red-100 text-red-700',        icon: XCircle,      label: 'Cancelled' },
}

export default function OrdersPage() {
  const { user }          = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [itemsMap, setItemsMap] = useState({})

  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data ?? []); setLoading(false) })
  }, [user])

  async function toggleOrder(orderId) {
    if (expanded === orderId) { setExpanded(null); return }
    setExpanded(orderId)
    if (!itemsMap[orderId]) {
      const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId)
      setItemsMap(m => ({ ...m, [orderId]: data ?? [] }))
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-blue-400" />
          </div>
          <h3 className="font-bold text-gray-700 text-lg mb-2">No orders yet</h3>
          <p className="text-gray-500 text-sm mb-6">Start shopping and your orders will appear here</p>
          <Link to="/products" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors">
            Start Shopping <ChevronRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const Icon   = config.icon
            const isOpen = expanded === order.id

            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Order header */}
                <button onClick={() => toggleOrder(order.id)} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color.split(' ')[0]}`}>
                    <Icon size={18} className={config.color.split(' ')[1]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono font-bold text-gray-800 text-sm">{order.order_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>{config.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })} · {formatKES(order.total)}
                    </p>
                  </div>
                  <ChevronRight size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                </button>

                {/* Expanded items */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-4">
                    {/* Progress bar */}
                    <div className="flex items-center gap-1 mb-5">
                      {['pending','confirmed','processing','shipped','delivered'].map((s, i) => {
                        const steps = ['pending','confirmed','processing','shipped','delivered']
                        const currentIdx = steps.indexOf(order.status)
                        const active = i <= currentIdx
                        return (
                          <div key={s} className="flex-1 flex items-center gap-1">
                            <div className={`h-1.5 flex-1 rounded-full ${active ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            {i === steps.length - 1 && (
                              <div className={`w-3 h-3 rounded-full ${active ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Items */}
                    <div className="space-y-3 mb-4">
                      {(itemsMap[order.id] || []).map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={item.product_image || 'https://placehold.co/40x40?text=?'} alt="" className="w-full h-full object-contain p-1" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">{item.product_name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatKES(item.unit_price)}</p>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{formatKES(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                      <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatKES(order.subtotal)}</span></div>
                      <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{order.delivery_fee === 0 ? 'FREE' : formatKES(order.delivery_fee)}</span></div>
                      <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{formatKES(order.total)}</span></div>
                    </div>

                    {/* Payment status */}
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        Payment: {order.payment_status}
                      </span>
                      {order.payment_method && (
                        <span className="text-xs text-gray-500 capitalize">{order.payment_method === 'mpesa' ? 'M-Pesa' : order.payment_method}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}