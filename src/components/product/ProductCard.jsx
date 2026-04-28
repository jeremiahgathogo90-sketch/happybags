import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
import { formatKES, discountPct, truncate } from '@/lib/utils'
import { useCart } from '@/context/CartContext'

export default function ProductCard({ product, flashPrice = null }) {
  const { addToCart }                   = useCart()
  const [imgError, setImgError]         = useState(false)
  const [isHovered, setIsHovered]       = useState(false)

  const displayPrice  = flashPrice ?? product.price
  const originalPrice = flashPrice ? product.price : product.original_price
  const discount      = discountPct(originalPrice, displayPrice)
  const outOfStock    = product.stock_qty === 0
  const raw           = product.thumbnail || product.images?.[0] || null
  const thumbnail     = raw && raw.includes('supabase') ? raw + '?width=400&quality=70' : raw

  function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product.id)
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #e2e8f0',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.14)' : '0 2px 8px rgba(0,0,0,0.07)',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Discount badge */}
      {discount > 0 && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 10,
          background: '#2563eb', color: '#fff', fontSize: '11px',
          fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
        }}>
          -{discount}%
        </div>
      )}

      {/* Out of stock badge */}
      {outOfStock && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 10,
          background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px',
          fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
        }}>
          Out of stock
        </div>
      )}

      {/* Image — fills the card, zooms on hover */}
      <Link
        to={'/products/' + product.slug}
        style={{ display: 'block', textDecoration: 'none', overflow: 'hidden' }}
      >
        <div style={{
          width: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          background: '#f1f5f9',
          position: 'relative',
        }}>
          {thumbnail && !imgError ? (
            <img
              src={thumbnail}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',        // Fills the whole card like pic 2
                objectPosition: 'center',
                display: 'block',
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',  // Zoom on hover
                transition: 'transform 0.4s ease',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', fontSize: '12px', background: '#f8fafc',
            }}>
              No image
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Link
          to={'/products/' + product.slug}
          style={{
            fontSize: '13px', fontWeight: 500, color: '#1e293b',
            textDecoration: 'none', lineHeight: '1.45', marginBottom: '6px',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}
        >
          {truncate(product.name, 55)}
        </Link>

        {product.rating_count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Star size={11} style={{ fill: '#facc15', color: '#facc15' }} />
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {Number(product.rating_avg).toFixed(1)} ({product.rating_count})
            </span>
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{formatKES(displayPrice)}</span>
            {originalPrice && originalPrice > displayPrice && (
              <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                {formatKES(originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '8px 0', borderRadius: '8px',
              fontSize: '12px', fontWeight: 600,
              cursor: outOfStock ? 'not-allowed' : 'pointer',
              border: outOfStock ? '1px solid #e2e8f0' : '1.5px solid #93c5fd',
              background: outOfStock
                ? '#f8fafc'
                : isHovered ? '#2563eb' : '#eff6ff',
              color: outOfStock
                ? '#94a3b8'
                : isHovered ? '#fff' : '#2563eb',
              transition: 'all 0.2s ease',
            }}
          >
            <ShoppingCart size={13} />
            {outOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  )
}