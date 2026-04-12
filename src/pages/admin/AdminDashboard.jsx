import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ShoppingBag, Package, Users, TrendingUp, Clock, ChevronRight, AlertCircle, Tag, Zap, Image } from 'lucide-react'
import { formatKES } from '@/lib/utils'

export default function AdminDashboard() {
  const [stats, setStats]   = useState({ orders: 0, products: 0, customers: 0, revenue: 0 })
  const [recent, setRecent] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const [ordersRes, productsRes, customersRes, revenueRes, recentRes, lowRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('orders').select('total').eq('payment_status', 'paid'),
        supabase.from('orders').select('id, order_number, total, status, created_at, phone').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('id, name, stock_qty, thumbnail').eq('is_active', true).lte('stock_qty', 5).order('stock_qty').limit(5),
      ])

      const revenue = (revenueRes.data ?? []).reduce((sum, o) => sum + Number(o.total), 0)
      setStats({
        orders:    ordersRes.count ?? 0,
        products:  productsRes.count ?? 0,
        customers: customersRes.count ?? 0,
        revenue,
      })
      setRecent(recentRes.data ?? [])
      setLowStock(lowRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const STATUS_COLORS = {
    pending:    'bg-yellow-100 text-yellow-700',
    confirmed:  'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped:    'bg-indigo-100 text-indigo-700',
    delivered:  'bg-green-100 text-green-700',
    cancelled:  'bg-red-100 text-red-700',
  }

  const STAT_CARDS = [
    { label: 'Total Revenue',  value: formatKES(stats.revenue), icon: TrendingUp, color: 'bg-blue-500',   link: '/admin/orders' },
    { label: 'Total Orders',   value: stats.orders,             icon: ShoppingBag, color: 'bg-indigo-500', link: '/admin/orders' },
    { label: 'Active Products',value: stats.products,           icon: Package,     color: 'bg-cyan-500',   link: '/admin/products' },
    { label: 'Customers',      value: stats.customers,          icon: Users,       color: 'bg-sky-500',    link: '/admin/users' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening in your store.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                <Icon size={20} className="text-white" />
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recent.map(order => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{order.order_number}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> {new Date(order.created_at).toLocaleDateString('en-KE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{formatKES(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock alert */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-500" /> Low Stock
            </h3>
            <Link to="/admin/products" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Manage</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">All products well stocked</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={p.thumbnail || 'https://placehold.co/40x40?text=?'} alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{p.name}</p>
                    <p className={`text-xs font-medium ${p.stock_qty === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                      {p.stock_qty === 0 ? 'Out of stock' : `${p.stock_qty} left`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Product',    to: '/admin/products?new=1',    icon: Package,    color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
            { label: 'Add Category',   to: '/admin/categories?new=1',  icon: Tag,        color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
            { label: 'Create Flash Sale', to: '/admin/flash-sales?new=1', icon: Zap,     color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
            { label: 'Add Banner',     to: '/admin/banners?new=1',     icon: Image,      color: 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100' },
          ].map(({ label, to, icon: Icon, color }) => (
            <Link key={label} to={to} className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center font-medium text-sm ${color}`}>
              <Icon size={22} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
