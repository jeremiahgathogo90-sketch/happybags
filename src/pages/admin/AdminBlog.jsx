import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronDown, Eye, EyeOff, FileText, Pencil,
  Plus, Search, Tags, Trash2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { slugify, truncate } from '@/lib/utils'
import toast from 'react-hot-toast'

function formatDate(value) {
  if (!value) return 'Not scheduled'
  return new Date(value).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminBlog() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryName, setCategoryName] = useState('')

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
      toast.error('Could not load blog categories')
      return
    }
    setCategories(data ?? [])
  }

  useEffect(() => { loadPosts() }, [search, statusFilter])
  useEffect(() => { loadCategories() }, [])

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

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 text-balance">Blog</h2>
          <p className="text-sm text-gray-500 mt-0.5 text-pretty">Manage packaging guides, SEO posts, and customer education content.</p>
        </div>
        <button
          onClick={() => navigate('/admin/blog/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus size={16} aria-hidden="true" /> Write Post
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="grid md:grid-cols-[1fr_180px] gap-3">
            <label className="relative">
              <span className="sr-only">Search blog posts</span>
              <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search blog posts..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Filter by status</span>
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
              <ChevronDown size={14} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </label>
          </div>
        </div>

        <form onSubmit={handleAddCategory} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tags size={16} aria-hidden="true" className="text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Blog categories</h3>
          </div>
          <div className="flex gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">New category name</span>
              <input
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
                placeholder="New category"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2">
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
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <FileText size={32} aria-hidden="true" className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-4">No blog posts found.</p>
                    <button onClick={() => navigate('/admin/blog/new')} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                      Write the first post
                    </button>
                  </td>
                </tr>
              ) : posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {post.cover_image ? (
                          <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FileText size={18} aria-hidden="true" />
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
                  <td className="px-4 py-3 text-gray-600 tabular-nums">{formatDate(post.published_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePublished(post)}
                      aria-label={post.status === 'published' ? 'Move post to draft' : 'Publish post'}
                      className="inline-flex items-center gap-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      {post.status === 'published'
                        ? <><Eye size={18} aria-hidden="true" className="text-green-500" /><span className="text-green-600">Published</span></>
                        : <><EyeOff size={18} aria-hidden="true" className="text-gray-400" /><span className="text-gray-500">{post.status}</span></>
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {post.status === 'published' && (
                        <Link
                          to={'/blog/' + post.slug}
                          target="_blank"
                          aria-label={'View ' + post.title}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <Eye size={15} aria-hidden="true" />
                        </Link>
                      )}
                      <button
                        onClick={() => navigate('/admin/blog/' + post.id + '/edit')}
                        aria-label={'Edit ' + post.title}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        aria-label={'Delete ' + post.title}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
