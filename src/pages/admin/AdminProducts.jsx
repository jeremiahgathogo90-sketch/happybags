import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Search, X, Upload, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatKES, slugify } from '@/lib/utils'
import toast from 'react-hot-toast'

const EMPTY = {
  name: '', slug: '', description: '', category_id: '',
  brand: '', price: '', original_price: '', stock_qty: '',
  is_active: true, is_featured: false, tags: ''
}

async function compressImage(file, maxWidth = 800, quality = 0.75) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    const img    = new Image()
    img.onload = () => {
      let w = img.width
      let h = img.height
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w)
        w = maxWidth
      }
      canvas.width  = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality)
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function AdminProducts() {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [images, setImages]         = useState([])
  const fileRef = useRef()

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, stock_qty, is_active, is_featured, thumbnail, category_id, category:categories(name)')
      .ilike('name', '%' + search + '%')
      .order('created_at', { ascending: false })
      .limit(50)
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  useEffect(() => {
    supabase.from('categories').select('id, name').eq('is_active', true).order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setImages([])
    setShowForm(true)
  }

  async function openEdit(productId) {
    const { data: p, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error || !p) { toast.error('Could not load product data'); return }

    setEditing(p.id)
    setForm({
      name:           p.name           || '',
      slug:           p.slug           || '',
      description:    p.description    || '',
      category_id:    p.category_id    || '',
      brand:          p.brand          || '',
      price:          p.price          ?? '',
      original_price: p.original_price ?? '',
      stock_qty:      p.stock_qty      ?? '',
      is_active:      p.is_active      ?? true,
      is_featured:    p.is_featured    ?? false,
      tags:           Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
    })
    setImages(p.images || (p.thumbnail ? [p.thumbnail] : []))
    setShowForm(true)
  }

  const set = key => e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({
      ...f,
      [key]: v,
      ...(key === 'name' && !editing ? { slug: slugify(v) } : {})
    }))
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const urls = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress('Compressing ' + (i + 1) + '/' + files.length + '...')

      // Compress image before upload
      const compressed = await compressImage(file, 800, 0.75)
      const path = 'products/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jpg'

      setUploadProgress('Uploading ' + (i + 1) + '/' + files.length + '...')

      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path)
        urls.push(publicUrl)
      } else {
        toast.error('Upload failed: ' + error.message)
      }
    }

    setImages(prev => [...prev, ...urls])
    if (urls.length) toast.success(urls.length + ' image(s) uploaded and compressed!')
    setUploading(false)
    setUploadProgress('')
    // Clear input so same file can be re-uploaded
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || form.price === '' || form.stock_qty === '') {
      toast.error('Name, price and stock are required')
      return
    }
    setSaving(true)

    const payload = {
      name:           form.name,
      slug:           form.slug || slugify(form.name),
      description:    form.description  || null,
      category_id:    form.category_id  || null,
      brand:          form.brand        || null,
      price:          Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      stock_qty:      Number(form.stock_qty),
      is_active:      form.is_active,
      is_featured:    form.is_featured,
      tags:           form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      images:         images,
      thumbnail:      images[0] || null,
    }

    const { error } = editing
      ? await supabase.from('products').update(payload).eq('id', editing)
      : await supabase.from('products').insert(payload)

    if (error) { toast.error(error.message); setSaving(false); return }

    toast.success(editing ? 'Product updated!' : 'Product added!')
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY)
    setImages([])
    load()
    setSaving(false)
  }

  async function handleDelete(id, name) {
    if (!confirm('Delete "' + name + '"? This cannot be undone.')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Product deleted')
    load()
  }

  async function toggleActive(p) {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY)
    setImages([])
    setUploadProgress('')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">Add, edit or remove products from your store</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No products found. Click "Add Product" to get started.</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={p.thumbnail ? p.thumbnail + '?width=80&quality=60' : 'https://placehold.co/40x40?text=?'}
                          alt=""
                          className="w-full h-full object-contain p-1"
                          onError={e => { e.target.src = 'https://placehold.co/40x40?text=?' }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 max-w-[180px] truncate">{p.name}</p>
                        {p.is_featured && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Featured</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatKES(p.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={['font-medium', p.stock_qty === 0 ? 'text-red-500' : p.stock_qty <= 5 ? 'text-orange-500' : 'text-gray-700'].join(' ')}>
                      {p.stock_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(p)} className="inline-flex items-center gap-1 text-xs font-medium transition-colors">
                      {p.is_active
                        ? <><ToggleRight size={20} className="text-green-500" /><span className="text-green-600">Active</span></>
                        : <><ToggleLeft size={20} className="text-gray-400" /><span className="text-gray-500">Hidden</span></>
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(p.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input value={form.name} onChange={set('name')} required placeholder="e.g. Gift Bag Large" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
                <input value={form.slug} onChange={set('slug')} required placeholder="gift-bag-large" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <p className="text-xs text-gray-400 mt-1">Auto-filled from name. Must be unique.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input value={form.brand} onChange={set('brand')} placeholder="e.g. HappyBags" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="relative">
                    <select value={form.category_id} onChange={set('category_id')} className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KSh) *</label>
                  <input type="number" value={form.price} onChange={set('price')} required min="0" placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (KSh)</label>
                  <input type="number" value={form.original_price} onChange={set('original_price')} min="0" placeholder="Leave blank if no discount" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <input type="number" value={form.stock_qty} onChange={set('stock_qty')} required min="0" placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input value={form.tags} onChange={set('tags')} placeholder="new, sale, trending" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Describe the product..." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>

             {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images ({images.length} uploaded)
                  <span className="text-xs text-gray-400 ml-2 font-normal">Auto-compressed — upload as many as you want</span>
                </label>

                {/* Image previews */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group flex-shrink-0">
                      {i === 0 && (
                        <div className="absolute top-1 left-1 z-10 bg-blue-600 text-white text-xs px-1 rounded font-medium">Main</div>
                      )}
                      <img
                        src={url + '?width=80&quality=60'}
                        alt=""
                        className="w-full h-full object-contain p-1"
                        onError={e => { e.target.src = url }}
                      />
                      <button
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white rounded-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload area */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-blue-600 font-medium">{uploadProgress}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">Click to upload images</p>
                      <p className="text-xs text-gray-400">Select multiple images at once — JPG, PNG, WebP</p>
                      <p className="text-xs text-gray-400">Images auto-compressed for fast loading</p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-1.5">First image becomes the main thumbnail shown on product cards.</p>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Active (visible on store)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Featured on homepage</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}