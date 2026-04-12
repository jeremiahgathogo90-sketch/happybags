import { Link } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
import { formatKES, discountPct, truncate } from '@/lib/utils'
import { useCart } from '@/context/CartContext'

export default function ProductCard({ product, flashPrice = null }) {
  const { addToCart } = useCart()
  const displayPrice  = flashPrice ?? product.price
  const originalPrice = flashPrice ? product.price : product.original_price
  const discount      = discountPct(originalPrice, displayPrice)
  const outOfStock    = product.stock_qty === 0
  const thumbnail = product.thumbnail || product.images?.[0] || null

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow flex flex-col group relative overflow-hidden">
      {discount > 0 && (
        <span className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">-{discount}%</span>
      )}
      <Link to={'/products/' + product.slug} className="block overflow-hidden bg-gray-50 aspect-square">
        <img src={thumbnail} alt={product.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" onError={e => { e.target.style.display='none' }} />
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link to={'/products/' + product.slug} className="text-sm text-gray-800 hover:text-blue-600 transition-colors leading-snug mb-1 line-clamp-2">
          {truncate(product.name, 55)}
        </Link>
        {product.rating_count > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-500">{Number(product.rating_avg).toFixed(1)} ({product.rating_count})</span>
          </div>
        )}
        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-bold text-base text-gray-900">{formatKES(displayPrice)}</span>
            {originalPrice && originalPrice > displayPrice && (
              <span className="text-xs text-gray-400 line-through">{formatKES(originalPrice)}</span>
            )}
          </div>
          <button onClick={() => addToCart(product.id)} disabled={outOfStock} className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
            <ShoppingCart size={13} />
            {outOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
