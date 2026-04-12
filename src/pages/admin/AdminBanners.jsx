import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, X, Upload, Link as LinkIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { title: '', subtitle: '', link_url: '', is_active: true }

export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]        = useState(EMPTY)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const fileRef = useRef()

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    setBanners(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `banner-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
      setImageUrl(publicUrl)
      toast.success('Image uploaded')
    }
    setUploading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!imageUrl) { toast.error('Please upload a banner image'); return }
    setSaving(true)
    const { error } = await supabase.from('banners').insert({ ...form, image_url: imageUrl, sort_order: banners.length })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Banner added!'); setShowForm(false); setImageUrl(''); setForm(EMPTY); load(); setSaving(false)
  }

  async function deleteBanner(id) {
    if (!confirm('Delete this banner?')) return
    await supabase.from('banners').delete().eq('id', id)
    toast.success('Banner deleted'); load()
  }

  async function toggleActive(b) {
    await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id)
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Banners</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage homepage hero banners and promotional images</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {loading ? <div className="text-center py-8 text-gray-400">Loading…</div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">No banners yet. Add your first banner!</div>}
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                {!b.is_active && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white text-sm font-medium">Hidden</span></div>}
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-800 text-sm">{b.title || 'Untitled banner'}</p>
                {b.subtitle && <p className="text-xs text-gray-500 mt-0.5">{b.subtitle}</p>}
                {b.link_url && <p className="text-xs text-blue-500 mt-1 flex items-center gap-1 truncate"><LinkIcon size={10} />{b.link_url}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => toggleActive(b)} className={`text-xs px-2 py-1 rounded font-medium flex-1 transition-colors ${b.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {b.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button onClick={() => deleteBanner(b.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Add Banner</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image *</label>
                {imageUrl ? (
                  <div className="relative rounded-lg overflow-hidden aspect-video bg-gray-100">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImageUrl('')} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><X size={14} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                    <Upload size={24} className="mb-2" />
                    <span className="text-sm">{uploading ? 'Uploading…' : 'Click to upload banner image'}</span>
                    <span className="text-xs mt-1">Recommended: 1200×400px</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Mega Sale — Up to 50% Off" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="e.g. Limited time offer" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
                <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="e.g. /products?cat=electronics" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
                  {saving ? 'Adding…' : 'Add Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}