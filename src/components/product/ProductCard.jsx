import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
import { formatKES, discountPct, truncate } from '@/lib/utils'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

export default function ProductCard({ product, flashPrice = null }) {
  const { addToCart }  = useCart()
  const { isLoggedIn } = useAuth()
  const navigate       = useNavigate()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError]   = useState(false)

  const displayPrice  = flashPrice ?? product.price
  const originalPrice = flashPrice ? product.price : product.original_price
  const discount      = discountPct(originalPrice, displayPrice)
  const outOfStock    = product.stock_qty === 0
  const thumbnail     = product.thumbnail || product.images?.[0] || null

  function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) { navigate('/login'); return }
    addToCart(product.id)
  }

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '14px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      border: '1px solid #e2e8f0',
      width: '100%',
    }}>

      {/* Discount badge */}
      {discount > 0 && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 10,
          background: '#2563eb', color: '#fff', fontSize: '11px',
          fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
          pointerEvents: 'none',
        }}>
          -{discount}%
        </div>
      )}

      {/* Image */}
      <Link to={'/products/' + product.slug} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          background: '#dde6f5',
          width: '100%',
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Skeleton shimmer while loading */}
          {!imgLoaded && !imgError && thumbnail && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, #dde6f5 25%, #c8d8ee 50%, #dde6f5 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
          )}

          {thumbnail && !imgError ? (
            <img
              src={thumbnail}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: imgLoaded ? '0 4px 14px rgba(0,0,0,0.18)' : 'none',
                background: '#ffffff',
                display: 'block',
                opacity: imgLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', borderRadius: '8px',
              background: '#f1f5f9', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', fontSize: '12px',
            }}>
              No image
            </div>
          )}
        </div>
      </Link>

      {/* Divider */}
      <div style={{ height: '1px', background: '#e2e8f0' }} />

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
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
              {formatKES(displayPrice)}
            </span>
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
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '5px', padding: '8px 0',
              borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              cursor: outOfStock ? 'not-allowed' : 'pointer',
              border: outOfStock ? '1px solid #e2e8f0' : '1.5px solid #93c5fd',
              background: outOfStock ? '#f8fafc' : '#eff6ff',
              color: outOfStock ? '#94a3b8' : '#2563eb',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!outOfStock) {
                e.currentTarget.style.background = '#2563eb'
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.border = '1.5px solid #2563eb'
              }
            }}
            onMouseLeave={e => {
              if (!outOfStock) {
                e.currentTarget.style.background = '#eff6ff'
                e.currentTarget.style.color = '#2563eb'
                e.currentTarget.style.border = '1.5px solid #93c5fd'
              }
            }}
          >
            <ShoppingCart size={13} />
            {outOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}