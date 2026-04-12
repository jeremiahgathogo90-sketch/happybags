import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { formatKES } from '@/lib/utils'

export default function CartPage() {
  const { items, loading, itemCount, subtotal, removeFromCart, updateQuantity } = useCart()
  const navigate = useNavigate()

  const delivery = subtotal >= 2000 ? 0 : 200
  const total    = subtotal + delivery

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (items.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingBag size={36} className="text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-8">Browse our products and discover the best deals!</p>
      <Link to="/products" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl transition-colors">
        Start Shopping <ArrowRight size={18} />
      </Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Cart ({itemCount} items)</h1>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Cart items */}
        <div className="flex-1 space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
              {/* Image */}
              <Link to={'/products/' + item.product?.slug} className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.product?.thumbnail || 'https://placehold.co/80x80?text=?'}
                  alt={item.product?.name}
                  className="w-full h-full object-contain p-1"
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={'/products/' + item.product?.slug} className="font-medium text-gray-800 text-sm hover:text-blue-600 transition-colors line-clamp-2">
                  {item.product?.name}
                </Link>
                <p className="text-blue-600 font-bold mt-1">{formatKES(item.product?.price)}</p>

                <div className="flex items-center justify-between mt-3">
                  {/* Quantity */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-gray-100 transition-colors text-gray-600">
                      <Minus size={13} />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-medium min-w-[32px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.product?.stock_qty || 99)}
                      className="px-2.5 py-1.5 hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-40"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Subtotal + delete */}
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 text-sm">
                      {formatKES((item.product?.price || 0) * item.quantity)}
                    </span>
                    <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemCount} items)</span>
                <span>{formatKES(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery fee</span>
                <span className={delivery === 0 ? 'text-green-600 font-medium' : ''}>
                  {delivery === 0 ? 'FREE' : formatKES(delivery)}
                </span>
              </div>
              {delivery > 0 && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                  Add {formatKES(2000 - subtotal)} more for free delivery!
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>{formatKES(total)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>

            <Link to="/products" className="block text-center text-sm text-gray-500 hover:text-blue-600 mt-3 transition-colors">
              Continue Shopping
            </Link>

            {/* Payment methods */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-2">We accept</p>
              <div className="flex justify-center gap-2">
                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded font-medium">M-Pesa</span>
                <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded font-medium">Visa</span>
                <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded font-medium">Mastercard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}