import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { formatKES, discountPct } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const { user }        = useAuth()
  const { addToCart }   = useCart()
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!user) return
    const { data } = await supabase
      .from('wishlist_items')
      .select('id, product:products(id, name, slug, price, original_price, thumbnail, stock_qty)')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  async function removeItem(id) {
    await supabase.from('wishlist_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Removed from wishlist')
  }

  async function moveToCart(item) {
    await addToCart(item.product.id)
    await removeItem(item.id)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Heart size={24} className="text-red-500 fill-red-500" /> My Wishlist ({items.length})
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-red-300" />
          </div>
          <h3 className="font-bold text-gray-700 text-lg mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 text-sm mb-6">Save items you love and come back to them anytime</p>
          <Link to="/products" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map(item => {
            const p        = item.product
            const discount = discountPct(p?.original_price, p?.price)
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
                {discount > 0 && (
                  <span className="absolute m-2 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded z-10">-{discount}%</span>
                )}
                <Link to={'/products/' + p?.slug} className="block aspect-square bg-gray-50 overflow-hidden relative">
                  <img src={p?.thumbnail || 'https://placehold.co/200x200?text=?'} alt={p?.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                </Link>
                <div className="p-3">
                  <Link to={'/products/' + p?.slug} className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {p?.name}
                  </Link>
                  <div className="flex items-baseline gap-1.5 mt-1.5 mb-3">
                    <span className="font-bold text-gray-900">{formatKES(p?.price)}</span>
                    {p?.original_price && p.original_price > p.price && (
                      <span className="text-xs text-gray-400 line-through">{formatKES(p.original_price)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => moveToCart(item)} disabled={p?.stock_qty === 0} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <ShoppingCart size={13} />
                      {p?.stock_qty === 0 ? 'Out of stock' : 'Add to cart'}
                    </button>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}