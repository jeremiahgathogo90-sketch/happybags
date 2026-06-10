import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, ChevronDown, Eye,
  FileText, Image as ImageIcon, Search, Upload,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import MarkdownEditor from '@/components/blog/MarkdownEditor'
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
      canvas.getContext('2d').drawImage(image, 0, 0, width, height)
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality)
    }
    image.src = URL.createObjectURL(file)
  })
}

function WritingGuide() {
  return (
    <aside className="lg:sticky lg:top-0 self-start bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="font-bold text-gray-900 text-balance">Blog writing guide</h2>
        <p className="text-xs text-gray-500 mt-1 text-pretty">Use this checklist to make every post useful and search-friendly.</p>
      </div>

      <div className="p-5 space-y-6 text-sm">
        <section>
          <h3 className="font-semibold text-gray-900 mb-2">Recommended structure</h3>
          <ol className="space-y-2 text-gray-600">
            {[
              'Use a clear title that matches what customers search for.',
              'Open with the problem and tell readers what they will learn.',
              'Break the article into sections using Heading 2.',
              'Use lists for steps, options, benefits, or comparisons.',
              'Add useful links to relevant products or categories.',
              'Finish with a simple next step or recommendation.',
            ].map((item, index) => (
              <li key={item} className="flex gap-2">
                <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">{index + 1}</span>
                <span className="leading-5">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-gray-100 pt-5">
          <h3 className="font-semibold text-gray-900 mb-2">Formatting examples</h3>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Section heading</dt>
              <dd><code className="rounded bg-gray-100 px-1.5 py-1 text-gray-800">## Heading</code></dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Bold text</dt>
              <dd><code className="rounded bg-gray-100 px-1.5 py-1 text-gray-800">**important**</code></dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Bullet item</dt>
              <dd><code className="rounded bg-gray-100 px-1.5 py-1 text-gray-800">- Item</code></dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Link</dt>
              <dd><code className="rounded bg-gray-100 px-1.5 py-1 text-gray-800">[text](URL)</code></dd>
            </div>
          </dl>
        </section>

        <section className="border-t border-gray-100 pt-5">
          <h3 className="font-semibold text-gray-900 mb-2">Before publishing</h3>
          <ul className="space-y-2 text-gray-600">
            {[
              'Preview the post and scan all headings and lists.',
              'Check every link opens the correct page.',
              'Add a clear excerpt and cover image.',
              'Keep the SEO title under 70 characters.',
              'Keep the SEO description under 160 characters.',
              'Choose Published only when the article is ready.',
            ].map(item => (
              <li key={item} className="flex gap-2 leading-5">
                <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-green-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  )
}

export default function AdminBlogEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const editing = Boolean(id)
  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    async function load() {
      const categoriesPromise = supabase
        .from('blog_categories')
        .select('id, name')
        .order('sort_order')
        .order('name')

      const postPromise = editing
        ? supabase.from('blog_posts').select('*').eq('id', id).single()
        : Promise.resolve({ data: null, error: null })

      const [categoriesResult, postResult] = await Promise.all([categoriesPromise, postPromise])
      setCategories(categoriesResult.data ?? [])

      if (categoriesResult.error) {
        toast.error('Could not load blog categories')
      }

      if (postResult.error || (editing && !postResult.data)) {
        toast.error('Could not load blog post')
        navigate('/admin/blog', { replace: true })
        return
      }

      if (postResult.data) {
        const post = postResult.data
        setForm({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          cover_image: post.cover_image || '',
          category_id: post.category_id || '',
          status: post.status || 'draft',
          is_featured: post.is_featured ?? false,
          tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
          seo_title: post.seo_title || '',
          seo_description: post.seo_description || '',
          og_image: post.og_image || '',
          canonical_url: post.canonical_url || '',
          noindex: post.noindex ?? false,
          published_at: toDatetimeLocal(post.published_at),
        })
      }

      setLoading(false)
    }

    load()
  }, [editing, id, navigate])

  const set = key => e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(current => ({
      ...current,
      [key]: value,
      ...(key === 'title' && !editing ? { slug: slugify(value) } : {}),
    }))
    setFormError('')
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
      setFormError('Image upload failed: ' + error.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(path)
    setForm(current => ({ ...current, cover_image: publicUrl, og_image: current.og_image || publicUrl }))
    toast.success('Cover image uploaded')
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Title and content are required.')
      return
    }

    setSaving(true)
    setFormError('')
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
      ? await supabase.from('blog_posts').update(payload).eq('id', id)
      : await supabase.from('blog_posts').insert(payload)

    if (error) {
      setFormError(error.message)
      setSaving(false)
      return
    }

    toast.success(editing ? 'Blog post updated' : 'Blog post created')
    navigate('/admin/blog')
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-500">Loading blog post...</div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link to="/admin/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-700 mb-2">
            <ArrowLeft size={15} aria-hidden="true" /> Back to blog posts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 text-balance">{editing ? 'Edit blog post' : 'Write a new blog post'}</h1>
          <p className="text-sm text-gray-500 mt-1 text-pretty">Write, preview, optimize, and publish from one focused page.</p>
        </div>
        {editing && form.status === 'published' && (
          <Link
            to={'/blog/' + form.slug}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Eye size={16} aria-hidden="true" /> View live post
          </Link>
        )}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg">
          <div className="p-5 md:p-6 space-y-6">
            {formError && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} aria-hidden="true" className="text-blue-600" />
                <h2 className="font-bold text-gray-900">Article</h2>
              </div>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="blog-title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input id="blog-title" value={form.title} onChange={set('title')} required placeholder="How to choose the right packaging" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label htmlFor="blog-slug" className="block text-sm font-medium text-gray-700 mb-1">URL slug *</label>
                    <input id="blog-slug" value={form.slug} onChange={set('slug')} required placeholder="how-to-choose-packaging" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
                <div>
                  <label htmlFor="blog-excerpt" className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea id="blog-excerpt" value={form.excerpt} onChange={set('excerpt')} rows={3} placeholder="Summarize the article in one or two sentences." className="w-full resize-y border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label htmlFor="blog-content" className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                  <MarkdownEditor id="blog-content" value={form.content} onChange={set('content')} required />
                </div>
              </div>
            </section>

            <section className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon size={18} aria-hidden="true" className="text-blue-600" />
                <h2 className="font-bold text-gray-900">Cover image</h2>
              </div>
              {form.cover_image && (
                <img src={form.cover_image} alt="Current blog cover" className="w-full aspect-[16/7] object-cover rounded-lg border border-gray-200 mb-3" />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Upload size={24} aria-hidden="true" className="mx-auto text-gray-400 mb-2" />
                <span className="block text-sm font-medium text-gray-700">{uploading ? 'Uploading image...' : 'Upload cover image'}</span>
                <span className="block text-xs text-gray-500 mt-1">JPG, PNG, or WebP. Images are compressed automatically.</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </section>

            <section className="border-t border-gray-200 pt-6">
              <h2 className="font-bold text-gray-900 mb-4">Publishing</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="blog-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="relative">
                    <select id="blog-category" value={form.category_id} onChange={set('category_id')} className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="">No category</option>
                      {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                    <ChevronDown size={14} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="blog-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="relative">
                    <select id="blog-status" value={form.status} onChange={set('status')} className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                    <ChevronDown size={14} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="blog-date" className="block text-sm font-medium text-gray-700 mb-1">Publish date</label>
                  <input id="blog-date" type="datetime-local" value={form.published_at} onChange={set('published_at')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="blog-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input id="blog-tags" value={form.tags} onChange={set('tags')} placeholder="packaging, gift bags, business" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="size-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Feature on blog page</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.noindex} onChange={set('noindex')} className="size-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">Keep out of search results</span>
                </label>
              </div>
            </section>

            <section className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Search size={18} aria-hidden="true" className="text-blue-600" />
                <h2 className="font-bold text-gray-900">Search and sharing</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="seo-title" className="block text-sm font-medium text-gray-700 mb-1">SEO title</label>
                  <input id="seo-title" value={form.seo_title} onChange={set('seo_title')} maxLength={70} placeholder="Optional search title" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <p className="text-xs text-gray-400 mt-1 tabular-nums">{form.seo_title.length}/70 characters</p>
                </div>
                <div>
                  <label htmlFor="seo-description" className="block text-sm font-medium text-gray-700 mb-1">SEO description</label>
                  <textarea id="seo-description" value={form.seo_description} onChange={set('seo_description')} maxLength={160} rows={3} placeholder="Optional search description" className="w-full resize-y border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <p className="text-xs text-gray-400 mt-1 tabular-nums">{form.seo_description.length}/160 characters</p>
                </div>
                <div>
                  <label htmlFor="canonical-url" className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
                  <input id="canonical-url" value={form.canonical_url} onChange={set('canonical_url')} placeholder="Leave blank to use the blog post URL" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label htmlFor="og-image" className="block text-sm font-medium text-gray-700 mb-1">Social share image URL</label>
                  <input id="og-image" value={form.og_image} onChange={set('og_image')} placeholder="Leave blank to use the cover image" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 md:px-6">
            <button type="button" onClick={() => navigate('/admin/blog')} className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Create post'}
            </button>
          </div>
        </form>

        <WritingGuide />
      </div>
    </div>
  )
}
