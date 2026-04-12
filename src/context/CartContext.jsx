import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(id, name, slug, price, thumbnail, stock_qty, original_price)')
      .eq('user_id', user.id)
    setItems(data ?? [])
    setLoading(false)
  }, [user])

  // Initial load
  useEffect(() => { fetchCart() }, [fetchCart])

  // Real-time cart updates
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('cart-changes-' + user.id)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: 'user_id=eq.' + user.id },
        () => fetchCart()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchCart])

  async function addToCart(productId, quantity = 1, attributes = {}) {
    if (!user) { toast.error('Please log in to add to cart'); return }
    const existing = items.find(i => i.product_id === productId)
    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
      if (!error) toast.success('Cart updated')
      else toast.error(error.message)
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({ user_id: user.id, product_id: productId, quantity, attributes })
      if (!error) toast.success('Added to cart!')
      else toast.error(error.message)
    }
  }

  async function removeFromCart(cartItemId) {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId)
    if (error) toast.error(error.message)
  }

  async function updateQuantity(cartItemId, quantity) {
    if (quantity < 1) return removeFromCart(cartItemId)
    const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId)
    if (error) toast.error(error.message)
  }

  async function clearCart() {
    if (!user) return
    await supabase.from('cart_items').delete().eq('user_id', user.id)
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal  = items.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, loading, itemCount, subtotal, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}