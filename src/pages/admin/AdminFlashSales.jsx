import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, X, Zap, Search } from 'lucide-react'
import { formatKES } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminFlashSales() {
  const [sales, setSales]       = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [saleItems, setSaleItems]       = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [form, setForm] = useState({ title: '', starts_at: '', ends_at: '', is_active: true })

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('flash_sales').select('*').order('starts_at', { ascending: false })
    setSales(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!productSearch) { setProducts([]); return }
    supabase.from('products').select('id, name, price, thumbnail').eq('is_active', true).ilike('name', '%' + productSearch + '%').limit(10)
      .then(({ data }) => setProducts(data ?? []))
  }, [productSearch])

  useEffect(() => {
    if (!selectedSale) { setSaleItems([]); return }
    supabase.from('flash_sale_items').select('*, product:products(id, name, price, thumbnail)').eq('flash_sale_id', selectedSale.id)
      .then(({ data }) => setSaleItems(data ?? []))
  }, [selectedSale])

  async function createSale(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('flash_sales').insert({ ...form })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Flash sale created!'); setShowForm(false); load(); setSaving(false)
    setForm({ title: '', starts_at: '', ends_at: '', is_active: true })
  }

  async function addItem(product) {
    if (!selectedSale) return
    const salePrice = prompt(`Sale price for "${product.name}" (normal: ${formatKES(product.price)}):`)
    if (!salePrice || isNaN(Number(salePrice))) return
    const { error } = await supabase.from('flash_sale_items').insert({ flash_sale_id: selectedSale.id, product_id: product.id, sale_price: Number(salePrice) })
    if (error) { toast.error(error.message); return }
    toast.success('Product added to flash sale')
    setProductSearch('')
    setProducts([])
    const { data } = await supabase.from('flash_sale_items').select('*, product:products(id, name, price, thumbnail)').eq('flash_sale_id', selectedSale.id)
    setSaleItems(data ?? [])
  }

  async function removeItem(itemId) {
    await supabase.from('flash_sale_items').delete().eq('id', itemId)
    setSaleItems(prev => prev.filter(i => i.id !== itemId))
    toast.success('Removed')
  }

  async function toggleSale(sale) {
    await supabase.from('flash_sales').update({ is_active: !sale.is_active }).eq('id', sale.id)
    setSales(prev => prev.map(s => s.id === sale.id ? { ...s, is_active: !s.is_active } : s))
  }

  async function deleteSale(id) {
    if (!confirm('Delete this flash sale and all its items?')) return
    await supabase.from('flash_sales').delete().eq('id', id)
    toast.success('Flash sale deleted'); setSelectedSale(null); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Flash Sales</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create time-limited deals to boost sales</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={16} /> New Flash Sale
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales list */}
        <div className="space-y-3">
          {loading ? <div className="text-center py-8 text-gray-400">Loading…</div> :
           sales.length === 0 ? <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">No flash sales yet</div> :
           sales.map(s => (
            <div key={s.id} onClick={() => setSelectedSale(s)} className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${selectedSale?.id === s.id ? 'border-blue-400 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Zap size={16} className={s.is_active ? 'text-orange-500' : 'text-gray-300'} />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{s.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(s.starts_at).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })} →{' '}
                      {new Date(s.ends_at).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); toggleSale(s) }} className={`text-xs px-2 py-1 rounded-full font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteSale(s.id) }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sale items */}
        {selectedSale && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Products in "{selectedSale.title}"</h3>

            {/* Search products to add */}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products to add…" className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            {products.length > 0 && (
              <div className="border border-gray-200 rounded-lg mb-3 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {products.map(p => (
                  <button key={p.id} onClick={() => addItem(p)} className="flex items-center gap-3 w-full px-3 py-2 hover:bg-blue-50 transition-colors text-left">
                    <img src={p.thumbnail || 'https://placehold.co/32x32?text=?'} alt="" className="w-8 h-8 object-contain rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{formatKES(p.price)}</p>
                    </div>
                    <Plus size={14} className="text-blue-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Current items */}
            <div className="space-y-2">
              {saleItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Search and add products above</p>
              ) : saleItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <img src={item.product?.thumbnail || 'https://placehold.co/32x32?text=?'} alt="" className="w-8 h-8 object-contain rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{item.product?.name}</p>
                    <p className="text-xs text-gray-500"><span className="line-through">{formatKES(item.product?.price)}</span> → <span className="text-green-600 font-medium">{formatKES(item.sale_price)}</span></p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create sale modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">New Flash Sale</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={createSale} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Flash Sale | Live Now" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                <input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                <input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
                  {saving ? 'Creating…' : 'Create Flash Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}