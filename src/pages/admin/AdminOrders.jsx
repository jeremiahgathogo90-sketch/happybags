import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, X, ChevronDown, Eye, Printer } from 'lucide-react'
import { formatKES } from '@/lib/utils'
import ReceiptPrint from '@/components/ReceiptPrint'
import toast from 'react-hot-toast'

const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded']

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  refunded:   'bg-gray-100 text-gray-600',
}

export default function AdminOrders() {
  const [orders, setOrders]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected]         = useState(null)
  const [printOrderId, setPrintOrderId] = useState(null)

  async function load() {
    setLoading(true)
    let q = supabase
      .from('orders')
      .select('id, order_number, total, status, payment_status, phone, created_at, delivery_address, notes, payment_method, mpesa_receipt')
      .order('created_at', { ascending: false })
      .limit(100)

    if (search)       q = q.or('order_number.ilike.%' + search + '%,phone.ilike.%' + search + '%')
    if (statusFilter) q = q.eq('status', statusFilter)

    const { data } = await q
    setOrders(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search, statusFilter])

  async function updateStatus(orderId, status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) { toast.error(error.message); return }
    toast.success('Order updated')
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    if (selected && selected.id === orderId) setSelected(prev => ({ ...prev, status }))
  }

  async function markPaid(orderId) {
    const { error } = await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId)
    if (error) { toast.error(error.message); return }
    toast.success('Marked as paid')
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'paid' } : o))
    if (selected && selected.id === orderId) setSelected(prev => ({ ...prev, payment_status: 'paid' }))
  }

  return (
    <div>
      {printOrderId && (
        <ReceiptPrint orderId={printOrderId} onClose={() => setPrintOrderId(null)} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage orders and print receipts</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order number or phone"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none border border-gray-300 rounded-lg pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="">All statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Payment</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Update</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No orders found</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 text-xs">{o.delivery_address && o.delivery_address.full_name ? o.delivery_address.full_name : '-'}</p>
                    <p className="text-gray-400 text-xs">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString('en-KE')}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{formatKES(o.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={['text-xs px-2 py-1 rounded-full font-medium', STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'].join(' ')}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={['text-xs px-2 py-1 rounded-full font-medium', o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'].join(' ')}>
                        {o.payment_status}
                      </span>
                      {o.payment_status !== 'paid' && (
                        <button onClick={() => markPaid(o.id)} className="text-xs text-green-600 hover:underline">
                          Mark paid
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="relative inline-block">
                      <select
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        className="appearance-none text-xs border border-gray-200 rounded-lg pl-2 pr-6 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer"
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <button
                        onClick={() => setSelected(o)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setPrintOrderId(o.id)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Printer size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{selected.order_number}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={['text-xs px-2 py-1 rounded-full font-medium', STATUS_COLORS[selected.status]].join(' ')}>{selected.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                <span className={['font-medium', selected.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'].join(' ')}>{selected.payment_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium uppercase">{selected.payment_method}</span>
              </div>
              {selected.mpesa_receipt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">M-Pesa Ref</span>
                  <span className="font-mono text-xs font-bold">{selected.mpesa_receipt}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-lg">{formatKES(selected.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span>{selected.phone}</span>
              </div>
              {selected.delivery_address && selected.delivery_address.town && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span>{selected.delivery_address.town}, {selected.delivery_address.county}</span>
                </div>
              )}
              <div className="pt-2">
                <p className="text-gray-500 mb-2 text-xs font-medium uppercase tracking-wider">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={['text-xs px-3 py-1.5 rounded-lg font-medium transition-colors', selected.status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'].join(' ')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 flex gap-2">
                {selected.payment_status !== 'paid' && (
                  <button
                    onClick={() => markPaid(selected.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-lg font-medium transition-colors"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={() => { setSelected(null); setPrintOrderId(selected.id) }}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg font-medium transition-colors"
                >
                  <Printer size={14} /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}