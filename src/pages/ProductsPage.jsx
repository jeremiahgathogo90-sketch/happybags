import { useState, useEffect } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { SlidersHorizontal, ChevronDown, X, Search } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { slug: categorySlug }          = useParams()

  const [products, setProducts]       = useState([])
  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [total, setTotal]             = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const sort      = searchParams.get('sort')  || 'newest'
  const search    = searchParams.get('q')     || ''
  const catFilter = searchParams.get('cat')   || categorySlug || ''
  const minPrice  = searchParams.get('min')   || ''
  const maxPrice  = searchParams.get('max')   || ''
  const page      = parseInt(searchParams.get('page') || '1')
  const PER_PAGE  = 20

  useEffect(() => {
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)

      let q = supabase
        .from('products')
        .select('id, name, slug, price, original_price, thumbnail, images, stock_qty, rating_avg, rating_count, category_id', { count: 'exact' })
        .eq('is_active', true)
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

      if (search)   q = q.ilike('name', '%' + search + '%')
      if (minPrice) q = q.gte('price', Number(minPrice))
      if (maxPrice) q = q.lte('price', Number(maxPrice))

      if (catFilter) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', catFilter)
          .maybeSingle()
        if (cat) q = q.eq('category_id', cat.id)
      }

      if (sort === 'price_asc')       q = q.order('price', { ascending: true })
      else if (sort === 'price_desc') q = q.order('price', { ascending: false })
      else if (sort === 'popular')    q = q.order('sold_count', { ascending: false })
      else                            q = q.order('created_at', { ascending: false })

      const { data, count, error } = await q

      if (error) {
        console.error('Products query error:', error)
        setProducts([])
      } else {
        // Filter out any null/undefined items just in case
        setProducts((data ?? []).filter(p => p && p.id && p.price !== undefined))
      }

      setTotal(count ?? 0)
      setLoading(false)
    }
    load()
  }, [sort, search, catFilter, minPrice, maxPrice, page])

  function setParam(key, val) {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val); else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const totalPages = Math.ceil(total / PER_PAGE)
  const activeCat  = categories.find(c => c.slug === catFilter)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <span>/</span>
        {activeCat ? (
          <>
            <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">{activeCat.name}</span>
          </>
        ) : (
          <span className="text-gray-800 font-medium">
            {search ? 'Search: "' + search + '"' : 'All Products'}
          </span>
        )}
      </div>

      <div className="flex gap-6">

        {/* Sidebar */}
        <aside className={[showFilters ? 'block' : 'hidden', 'lg:block w-52 flex-shrink-0'].join(' ')}>
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Filters</h3>

            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Category</p>
              <ul className="space-y-0.5">
                <li>
                  <button
                    onClick={() => setParam('cat', '')}
                    className={['text-sm w-full text-left px-2 py-1.5 rounded-lg transition-colors', !catFilter ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'].join(' ')}
                  >
                    All Categories
                  </button>
                </li>
                {categories.map(cat => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setParam('cat', cat.slug)}
                      className={['text-sm w-full text-left px-2 py-1.5 rounded-lg transition-colors', catFilter === cat.slug ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'].join(' ')}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Price (KSh)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setParam('min', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setParam('max', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {(catFilter || minPrice || maxPrice || search) && (
              <button
                onClick={() => setSearchParams({})}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 mt-2"
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(v => !v)}
                className="lg:hidden flex items-center gap-1.5 text-sm border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <SlidersHorizontal size={15} /> Filters
              </button>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : (
                  <><span className="font-medium text-gray-800">{total.toLocaleString()}</span> products</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort:</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => setParam('sort', e.target.value)}
                  className="appearance-none border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <Spinner />
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="font-bold text-gray-700 text-lg mb-2">No products found</h3>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or search term</p>
              <button
                onClick={() => setSearchParams({})}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
                {products.map(p => (
                  p && p.price !== undefined
                    ? <ProductCard key={p.id} product={p} />
                    : null
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => setParam('page', String(page - 1))}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setParam('page', String(page + 1))}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
