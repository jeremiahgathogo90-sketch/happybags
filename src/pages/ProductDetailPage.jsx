import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, Heart, Star, ChevronRight, Minus, Plus, Truck, Shield, RotateCcw, Check } from 'lucide-react'
import { formatKES, discountPct } from '@/lib/utils'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import ImageZoom from '@/components/ImageZoom'
import ProductCard from '@/components/product/ProductCard'
import toast from 'react-hot-toast'

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function ProductDetailPage() {
  const { slug }      = useParams()
  const { addToCart } = useCart()
  const { isLoggedIn } = useAuth()
  const navigate      = useNavigate()

  const [product, setProduct]         = useState(null)
  const [related, setRelated]         = useState([])
  const [reviews, setReviews]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [qty, setQty]                 = useState(1)
  const [wishlisted, setWishlisted]   = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(id, name, slug)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()

      if (!data) { navigate('/products'); return }
      setProduct(data)

      if (data.category_id) {
        const { data: rel } = await supabase
          .from('products')
          .select('id, name, slug, price, original_price, thumbnail, stock_qty, rating_avg, rating_count')
          .eq('category_id', data.category_id)
          .eq('is_active', true)
          .neq('id', data.id)
          .limit(5)
        setRelated(rel ?? [])
      }

      const { data: revs } = await supabase
        .from('reviews')
        .select('*, profile:profiles(full_name)')
        .eq('product_id', data.id)
        .order('created_at', { ascending: false })
        .limit(10)
      setReviews(revs ?? [])
      setLoading(false)
    }
    load()
  }, [slug, navigate])

  async function handleAddToCart() {
    // No login required — guests can add to cart
    await addToCart(product.id, qty)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  async function handleWishlist() {
    if (!isLoggedIn) { navigate('/login'); return }
    setWishlisted(v => !v)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!')
  }

  if (loading) return <Spinner />
  if (!product) return null

  const images    = [product.thumbnail, ...(product.images || [])].filter((v, i, a) => v && a.indexOf(v) === i)
  const discount  = discountPct(product.original_price, product.price)
  const outOfStock = product.stock_qty === 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight size={14} />
        <Link to="/products" className="hover:text-blue-600">Products</Link>
        {product.category && (
          <>
            <ChevronRight size={14} />
            <Link to={'/category/' + product.category.slug} className="hover:text-blue-600">{product.category.name}</Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-gray-800 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main product section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Image with zoom */}
          <div className="lg:w-2/5 flex-shrink-0">
            <ImageZoom images={images} alt={product.name} />
          </div>

          {/* Info */}
          <div className="flex-1">
            {product.brand && (
              <p className="text-sm text-blue-600 font-medium mb-1">{product.brand}</p>
            )}
            <h1 className="text-xl font-bold text-gray-900 mb-3 leading-snug">{product.name}</h1>

            {/* Rating */}
            {product.rating_count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={16} className={s <= Math.round(product.rating_avg) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-sm text-gray-600">{Number(product.rating_avg).toFixed(1)} ({product.rating_count} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4 flex-wrap">
              <span className="text-3xl font-bold text-gray-900">{formatKES(product.price)}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-lg text-gray-400 line-through">{formatKES(product.original_price)}</span>
              )}
              {discount > 0 && (
                <span className="bg-blue-600 text-white text-sm font-bold px-2.5 py-0.5 rounded-lg">-{discount}%</span>
              )}
            </div>

            {/* Stock */}
            <div className="mb-5">
              {outOfStock ? (
                <span className="text-sm text-red-500 font-medium">Out of stock</span>
              ) : (
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <Check size={14} /> In stock ({product.stock_qty} available)
                </span>
              )}
            </div>

            {/* Quantity */}
            {!outOfStock && (
              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium min-w-[40px] text-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock_qty, q + 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="flex-1 min-w-[160px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addedToCart
                  ? <><Check size={18} /> Added!</>
                  : <><ShoppingCart size={18} /> Add to Cart</>
                }
              </button>
              <button
                onClick={handleWishlist}
                className={['flex items-center gap-2 border px-4 py-3 rounded-xl transition-all font-medium text-sm', wishlisted ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-300 hover:border-gray-400 text-gray-700'].join(' ')}
              >
                <Heart size={18} className={wishlisted ? 'fill-red-500' : ''} />
                {wishlisted ? 'Wishlisted' : 'Wishlist'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
              {[
                { icon: Truck,     label: 'Fast Delivery',  sub: 'Countrywide' },
                { icon: Shield,    label: 'Secure Payment', sub: 'M-Pesa & Cards' },
                { icon: RotateCcw, label: 'Easy Returns',   sub: '7-day policy' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-1.5">
                    <Icon size={16} className="text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Product Description</h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Customer Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {(r.profile?.full_name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.profile?.full_name || 'Anonymous'}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                </div>
                {r.title && <p className="text-sm font-medium text-gray-800 mb-1">{r.title}</p>}
                {r.body  && <p className="text-sm text-gray-600">{r.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-4">Related Products</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}