import { Link } from 'react-router-dom'
import { Calendar, ArrowRight } from 'lucide-react'
import { truncate } from '@/lib/utils'

function formatDate(value) {
  if (!value) return 'Not dated'
  return new Date(value).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function BlogCard({ post, featured = false }) {
  const image = post.cover_image || post.og_image || '/og-image.png'
  const category = post.category?.name || 'HappyBags Guide'

  return (
    <article className={[
      'bg-white border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow',
      featured ? 'grid md:grid-cols-2 rounded-xl' : 'rounded-xl flex flex-col',
    ].join(' ')}>
      <Link to={'/blog/' + post.slug} className="block bg-gray-100 overflow-hidden">
        <div className={featured ? 'aspect-[4/3] md:h-full' : 'aspect-[16/10]'}>
          <img
            src={image}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.src = '/og-image.png' }}
          />
        </div>
      </Link>

      <div className={featured ? 'p-6 md:p-8 flex flex-col' : 'p-5 flex flex-col flex-1'}>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md">{category}</span>
          <span className="inline-flex items-center gap-1">
            <Calendar size={13} />
            {formatDate(post.published_at || post.created_at)}
          </span>
        </div>

        <h2 className={featured ? 'text-2xl font-bold text-gray-900 leading-tight mb-3' : 'text-lg font-bold text-gray-900 leading-snug mb-2'}>
          <Link to={'/blog/' + post.slug} className="hover:text-blue-700 transition-colors">
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="text-sm text-gray-600 leading-6 mb-4">
            {truncate(post.excerpt, featured ? 180 : 120)}
          </p>
        )}

        <Link
          to={'/blog/' + post.slug}
          className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          Read guide <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  )
}
