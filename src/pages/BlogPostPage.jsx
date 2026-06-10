import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, ArrowLeft, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import SEO, { SITE_URL, absoluteUrl, truncateText } from '@/components/SEO'
import BlogCard from '@/components/blog/BlogCard'
import BlogContent, { markdownToPlainText } from '@/components/blog/BlogContent'

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, category:blog_categories(id, name, slug)')
        .eq('slug', slug)
        .eq('status', 'published')
        .or('published_at.is.null,published_at.lte.' + now)
        .maybeSingle()

      if (error) console.error('Blog post error:', error)
      setPost(data || null)

      if (data?.category_id) {
        const { data: relatedPosts } = await supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, cover_image, og_image, tags, published_at, created_at, category:blog_categories(name, slug)')
          .eq('status', 'published')
          .eq('category_id', data.category_id)
          .neq('id', data.id)
          .or('published_at.is.null,published_at.lte.' + now)
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(3)
        setRelated(relatedPosts ?? [])
      } else {
        setRelated([])
      }

      setLoading(false)
    }

    load()
  }, [slug])

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Spinner />
      </main>
    )
  }

  if (!post) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <SEO
          title="Blog Post Not Found | HappyBags Kenya"
          description="This HappyBags Kenya blog post could not be found."
          path={'/blog/' + slug}
          robots="noindex, follow"
        />
        <div className="text-center border border-dashed border-gray-300 rounded-xl bg-gray-50 py-16 px-4">
          <h1 className="text-2xl font-bold text-gray-900">Blog post not found</h1>
          <p className="text-sm text-gray-500 mt-2">The post may be unpublished or the link may have changed.</p>
          <Link to="/blog" className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-blue-700">
            <ArrowLeft size={16} /> Back to blog
          </Link>
        </div>
      </main>
    )
  }

  const description = post.seo_description || post.excerpt || truncateText(markdownToPlainText(post.content), 155)
  const image = post.og_image || post.cover_image || '/og-image.png'
  const canonical = post.canonical_url || '/blog/' + post.slug
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image: absoluteUrl(image),
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: {
      '@type': 'Organization',
      name: 'HappyBags Kenya',
    },
    publisher: {
      '@type': 'Organization',
      name: 'HappyBags Kenya',
      logo: {
        '@type': 'ImageObject',
        url: SITE_URL + '/logo.png',
      },
    },
    mainEntityOfPage: absoluteUrl('/blog/' + post.slug),
    articleSection: post.category?.name,
    keywords: Array.isArray(post.tags) ? post.tags.join(', ') : undefined,
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <SEO
        title={post.seo_title || post.title + ' | HappyBags Kenya Blog'}
        description={description}
        path={canonical}
        image={image}
        imageAlt={post.title}
        type="article"
        robots={post.noindex ? 'noindex, follow' : 'index, follow'}
        jsonLd={articleJsonLd}
      />

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-700">Home</Link>
        <span>/</span>
        <Link to="/blog" className="hover:text-blue-700">Blog</Link>
        {post.category && (
          <>
            <span>/</span>
            <Link to={'/blog?category=' + post.category.slug} className="hover:text-blue-700">{post.category.name}</Link>
          </>
        )}
      </div>

      <article>
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
            {post.category && (
              <Link to={'/blog?category=' + post.category.slug} className="font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                {post.category.name}
              </Link>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar size={15} />
              {formatDate(post.published_at || post.created_at)}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-gray-600 leading-8 mt-4">{post.excerpt}</p>}
        </header>

        <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mb-8">
          <img
            src={image}
            alt={post.title}
            className="w-full aspect-[16/9] object-cover"
            onError={e => { e.currentTarget.src = '/og-image.png' }}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
          <BlogContent content={post.content} />

          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
              {post.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-full">
                  <Tag size={12} /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related guides</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map(item => <BlogCard key={item.id} post={item} />)}
          </div>
        </section>
      )}
    </main>
  )
}
