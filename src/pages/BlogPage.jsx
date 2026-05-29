import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import SEO, { SITE_URL } from '@/components/SEO'
import BlogCard from '@/components/blog/BlogCard'

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const categorySlug = searchParams.get('category') || ''

  useEffect(() => {
    async function load() {
      setLoading(true)
      const now = new Date().toISOString()
      const [postsRes, categoriesRes] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, cover_image, og_image, tags, is_featured, published_at, created_at, category:blog_categories(name, slug)')
          .eq('status', 'published')
          .or('published_at.is.null,published_at.lte.' + now)
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('blog_categories')
          .select('id, name, slug')
          .eq('is_active', true)
          .order('sort_order')
          .order('name'),
      ])

      if (postsRes.error) console.error('Blog posts error:', postsRes.error)
      if (categoriesRes.error) console.error('Blog categories error:', categoriesRes.error)

      setPosts(postsRes.data ?? [])
      setCategories(categoriesRes.data ?? [])
      setLoading(false)
    }

    load()
  }, [])

  const activeCategory = categories.find(cat => cat.slug === categorySlug)
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesCategory = !categorySlug || post.category?.slug === categorySlug
      const text = [post.title, post.excerpt, post.category?.name, ...(post.tags || [])].join(' ').toLowerCase()
      const matchesSearch = !query.trim() || text.includes(query.trim().toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [categorySlug, posts, query])

  const featuredPost = filteredPosts.find(post => post.is_featured) || filteredPosts[0]
  const otherPosts = featuredPost ? filteredPosts.filter(post => post.id !== featuredPost.id) : []
  const isFiltered = Boolean(categorySlug || query.trim())
  const pageTitle = activeCategory
    ? activeCategory.name + ' Guides | HappyBags Kenya Blog'
    : 'HappyBags Blog | Packaging Tips and Bag Guides in Kenya'
  const pageDescription = activeCategory
    ? 'Read ' + activeCategory.name.toLowerCase() + ' tips, bag buying advice, and packaging guides from HappyBags Kenya.'
    : 'Read packaging tips, bag buying guides, gift packaging ideas, and business packaging advice from HappyBags Kenya.'
  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': SITE_URL + '/blog#blog',
    name: 'HappyBags Kenya Blog',
    url: SITE_URL + '/blog',
    description: pageDescription,
    publisher: {
      '@type': 'Organization',
      name: 'HappyBags Kenya',
      url: SITE_URL + '/',
      logo: SITE_URL + '/logo.png',
    },
  }

  function selectCategory(slug) {
    const params = new URLSearchParams(searchParams)
    if (slug) params.set('category', slug)
    else params.delete('category')
    setSearchParams(params)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <SEO
        title={pageTitle}
        description={pageDescription}
        path="/blog"
        robots={isFiltered ? 'noindex, follow' : 'index, follow'}
        jsonLd={blogJsonLd}
      />

      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-blue-700">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Blog</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">
              <BookOpen size={16} />
              Packaging guides
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{activeCategory ? activeCategory.name + ' Guides' : 'HappyBags Blog'}</h1>
            <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-6">{pageDescription}</p>
          </div>

          <label className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search blog guides"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => selectCategory('')}
          className={[
            'text-xs font-medium px-3 py-1.5 rounded-full transition-colors',
            !categorySlug ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700',
          ].join(' ')}
        >
          All posts
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => selectCategory(category.slug)}
            className={[
              'text-xs font-medium px-3 py-1.5 rounded-full transition-colors',
              categorySlug === category.slug ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700',
            ].join(' ')}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-300 rounded-xl bg-gray-50">
          <BookOpen size={44} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-800">No blog posts yet</h2>
          <p className="text-sm text-gray-500 mt-2">Published blog posts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {featuredPost && <BlogCard post={featuredPost} featured />}

          {otherPosts.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherPosts.map(post => <BlogCard key={post.id} post={post} />)}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
