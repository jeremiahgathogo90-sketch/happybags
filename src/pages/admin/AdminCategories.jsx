import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'

const EMPTY = { name: '', slug: '', description: '', icon: '', sort_order: 0, is_active: true }
const ICONS = ['🛍️','🎁','👜','🧴','🥤','🍽️','🥛','📦','🎀','🛒','🏪','💼','🎒','👝','🧺','🪣','🗃️','📫','🎊','🛵']

export default function AdminCategories() {
  const [cats, setCats]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCats(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(c) {
    setEditing(c.id)
    setForm({ name: c.name, slug: c.slug, description: c.description || '', icon: c.icon || '', sort_order: c.sort_order, is_active: c.is_active })
    setShowForm(true)
  }

  const set = key => e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [key]: v, ...(key === 'name' && !editing ? { slug: slugify(v) } : {}) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name) { toast.error('Category name is required'); return }
    setSaving(true)
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      icon: form.icon,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    }
    const { error } = editing
      ? await supabase.from('categories').update(payload).eq('id', editing)
      : await supabase.from('categories').insert(payload)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success(editing ? 'Category updated!' : 'Category added!')
    setShowForm(false); load(); setSaving(false)
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? Products in this category will lose their category.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Category deleted'); load()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-500 mt-0.5">{cats.length} categories</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading...</div>
      ) : cats.length === 0 ? (
        <div className="py-12 text-center text-gray-400">No categories yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {cats.map(c => (
            <div key={c.id} style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {/* Icon */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '12px',
                background: c.is_active ? '#f0fdf4' : '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px', flexShrink: 0,
              }}>
                {c.icon || '🛍️'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: '#1e293b', fontSize: '15px', marginBottom: '2px' }}>{c.name}</p>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>{c.slug}</p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(c)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#64748b',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#93c5fd' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#64748b',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl mt-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input value={form.name} onChange={set('name')} required placeholder="e.g. Gift Bags" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
                <input value={form.slug} onChange={set('slug')} required placeholder="gift-bags" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon (click to select)</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      className={`w-9 h-9 text-xl rounded-lg border-2 transition-all ${form.icon === ic ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-200'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
                <input value={form.icon} onChange={set('icon')} placeholder="or type any emoji" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={set('sort_order')} min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Optional description" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}