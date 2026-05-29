import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, Search, X, Upload, ChevronDown,
  Eye, EyeOff, FileText, Tags,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { slugify, truncate } from '@/lib/utils'
import toast from 'react-hot-toast'

const EMPTY = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  category_id: '',
  status: 'draft',
  is_featured: false,
  tags: '',
  seo_title: '',
  seo_description: '',
  og_image: '',
  canonical_url: '',
  noindex: false,
  published_at: '',
}

function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

function fromDatetimeLocal(value) {
  return value ? new Date(value).toISOString() : null
}

function formatDate(value) {
  if (!value) return 'Not scheduled'
  return new Date(value).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function compressImage(file, maxWidth = 1200, quality = 0.78) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    const image = new Image()
    image.onload = () => {
      let width = image.width
      let height = image.height
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0, width, height)
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality)
    }
    image.src = URL.createObjectURL(file)
  })
}

export default function AdminBlog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const fileRef = useRef(null)

  async function loadPosts() {
    setLoading(true)
    let query = supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image, status, is_featured, noindex, published_at, created_at, category:blog_categories(name, slug)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (search) query = query.ilike('title', '%' + search + '%')
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)

    const { data, error } = await query
    if (error) toast.error(error.message)
    setPosts(data ?? [])
    setLoading(false)
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('id, name, slug')
      .order('sort_order')
      .order('name')
    if (error) {
      console.error('Blog categories error:', error)
      return
    }
    setCategories(data ?? [])
  }

  useEffect(() => { loadPosts() }, [search, statusFilter])
  useEffect(() => { loadCategories() }, [])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openNew()
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  async function openEdit(id) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      toast.error('Could not load blog post')
      return
    }

    setEditing(data.id)
    setForm({
      title: data.title || '',
      slug: data.slug || '',
      excerpt: data.excerpt || '',
      content: data.content || '',
      cover_image: data.cover_image || '',
      category_id: data.category_id || '',
      status: data.status || 'draft',
      is_featured: data.is_featured ?? false,
      tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
      seo_title: data.seo_title || '',
      seo_description: data.seo_description || '',
      og_image: data.og_image || '',
      canonical_url: data.canonical_url || '',
      noindex: data.noindex ?? false,
      published_at: toDatetimeLocal(data.published_at),
    })
    setShowForm(true)
  }

  const set = key => e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(current => ({
      ...current,
      [key]: value,
      ...(key === 'title' && !editing ? { slug: slugify(value) } : {}),
    }))
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const compressed = await compressImage(file)
    const path = 'posts/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jpg'

    const { error } = await supabase.storage
      .from('blog-images')
      .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })

    if (error) {
      toast.error('Upload failed: ' + error.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(path)

    setForm(current => ({ ...current, cover_image: publicUrl, og_image: current.og_image || publicUrl }))
    toast.success('Cover image uploaded')
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    const name = categoryName.trim()
    if (!name) return

    const { error } = await supabase.from('blog_categories').insert({
      name,
      slug: slugify(name),
      is_active: true,
      sort_order: categories.length,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setCategoryName('')
    toast.success('Blog category added')
    loadCategories()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    setSaving(true)
    const publishTime = form.status === 'published'
      ? fromDatetimeLocal(form.published_at) || new Date().toISOString()
      : fromDatetimeLocal(form.published_at)

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_image: form.cover_image || null,
      category_id: form.category_id || null,
      status: form.status,
      is_featured: form.is_featured,
      tags: form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      og_image: form.og_image.trim() || form.cover_image || null,
      canonical_url: form.canonical_url.trim() || null,
      noindex: form.noindex,
      published_at: publishTime,
      updated_at: new Date().toISOString(),
    }

    const { error } = editing
      ? await supabase.from('blog_posts').update(payload).eq('id', editing)
      : await supabase.from('blog_posts').insert(payload)

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    toast.success(editing ? 'Blog post updated' : 'Blog post created')
    closeForm()
    loadPosts()
    setSaving(false)
  }

  async function handleDelete(post) {
    if (!confirm('Delete "' + post.title + '"? This cannot be undone.')) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', post.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Blog post deleted')
    loadPosts()
  }

  async function togglePublished(post) {
    const nextStatus = post.status === 'published' ? 'draft' : 'published'
    const payload = {
      status: nextStatus,
      published_at: nextStatus === 'published' ? (post.published_at || new Date().toISOString()) : post.published_at,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('blog_posts').update(payload).eq('id', post.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(nextStatus === 'published' ? 'Post published' : 'Post moved to draft')
    loadPosts()
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blog</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create packaging guides, SEO posts, and customer education content.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={16} /> Add Post
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="grid md:grid-cols-[1fr_180px] gap-3">
            <label className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <label className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </label>
          </div>
        </div>

        <form onSubmit={handleAddCategory} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tags size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Blog categories</h3>
          </div>
          <div className="flex gap-2">
            <input
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              placeholder="New category"
              className="min-w-0 flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-3 rounded-lg text-sm font-medium">
              Add
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">{categories.length} categories available</p>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Post</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Published</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">Loading blog posts...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">No blog posts yet. Click "Add Post" to start.</td></tr>
              ) : posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {post.cover_image ? (
                          <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FileText size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 max-w-[260px] truncate">{post.title}</p>
                        <p className="text-xs text-gray-400">{truncate(post.excerpt || post.slug, 80)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {post.is_featured && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Featured</span>}
                          {post.noindex && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Noindex</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{post.category?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(post.published_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => togglePublished(post)} className="inline-flex items-center gap-1 text-xs font-medium transition-colors">
                      {post.status === 'published'
                        ? <><Eye size={18} className="text-green-500" /><span className="text-green-600">Published</span></>
                        : <><EyeOff size={18} className="text-gray-400" /><span className="text-gray-500">{post.status}</span></>
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {post.status === 'published' && (
                        <Link to={'/blog/' + post.slug} target="_blank" className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Eye size={15} />
                        </Link>
                      )}
                      <button onClick={() => openEdit(post.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(post)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-8 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Blog Post' : 'Add Blog Post'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={form.title} onChange={set('title')} required placeholder="e.g. How to choose gift bags for events" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
                  <input value={form.slug} onChange={set('slug')} required placeholder="how-to-choose-gift-bags" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} placeholder="Short summary shown on blog cards and search previews." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea value={form.content} onChange={set('content')} rows={10} required placeholder="Write the blog post content here. Line breaks will be preserved on the website." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="relative">
                    <select value={form.category_id} onChange={set('category_id')} className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">No category</option>
                      {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="relative">
                    <select value={form.status} onChange={set('status')} className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publish date</label>
                  <input type="datetime-local" value={form.published_at} onChange={set('published_at')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                {form.cover_image && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img src={form.cover_image} alt="" className="w-full aspect-[16/7] object-cover" />
                  </div>
                )}
                <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-blue-600 font-medium">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">Click to upload cover image</p>
                      <p className="text-xs text-gray-400">JPG, PNG, or WebP. Image will be compressed.</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input value={form.tags} onChange={set('tags')} placeholder="packaging, gift bags, business" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
                  <input value={form.canonical_url} onChange={set('canonical_url')} placeholder="Leave blank for default blog URL" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                  <input value={form.seo_title} onChange={set('seo_title')} maxLength={70} placeholder="Optional search title" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                  <input value={form.seo_description} onChange={set('seo_description')} maxLength={160} placeholder="Optional search description" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Social Share Image URL</label>
                  <input value={form.og_image} onChange={set('og_image')} placeholder="Leave blank to use cover image" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Feature on blog page</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.noindex} onChange={set('noindex')} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Noindex this post</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
