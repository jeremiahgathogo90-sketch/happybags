import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

// Guest cart uses localStorage
const GUEST_CART_KEY = 'happybags_guest_cart'

function getGuestCart() {
  try { return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]') } catch { return [] }
}

function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (user) {
      // Logged in — fetch from Supabase
      setLoading(true)
      const { data } = await supabase
        .from('cart_items')
        .select('*, product:products(id, name, slug, price, thumbnail, stock_qty, original_price)')
        .eq('user_id', user.id)
      setItems(data ?? [])
      setLoading(false)
    } else {
      // Guest — fetch from localStorage and get product details
      const guestCart = getGuestCart()
      if (guestCart.length === 0) { setItems([]); return }

      const productIds = guestCart.map(i => i.product_id)
      const { data: products } = await supabase
        .from('products')
        .select('id, name, slug, price, thumbnail, stock_qty, original_price')
        .in('id', productIds)

      const enriched = guestCart.map(i => ({
        ...i,
        product: products?.find(p => p.id === i.product_id) || null,
      }))
      setItems(enriched)
    }
  }, [user])

  useEffect(() => { fetchCart() }, [fetchCart])

  // Real-time for logged in users
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('cart-' + user.id)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: 'user_id=eq.' + user.id },
        () => fetchCart()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchCart])

  async function addToCart(productId, quantity = 1) {
    if (user) {
      // Logged in — save to Supabase
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
          .insert({ user_id: user.id, product_id: productId, quantity })
        if (!error) toast.success('Added to cart!')
        else toast.error(error.message)
      }
    } else {
      // Guest — save to localStorage
      const guestCart = getGuestCart()
      const existing  = guestCart.find(i => i.product_id === productId)
      if (existing) {
        existing.quantity += quantity
      } else {
        guestCart.push({ id: 'guest-' + Date.now(), product_id: productId, quantity })
      }
      saveGuestCart(guestCart)
      await fetchCart()
      toast.success('Added to cart!')
    }
  }

  async function removeFromCart(cartItemId) {
    if (user) {
      const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId)
      if (error) toast.error(error.message)
    } else {
      const guestCart = getGuestCart().filter(i => i.id !== cartItemId)
      saveGuestCart(guestCart)
      await fetchCart()
    }
  }

  async function updateQuantity(cartItemId, quantity) {
    if (quantity < 1) return removeFromCart(cartItemId)
    if (user) {
      const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId)
      if (error) toast.error(error.message)
    } else {
      const guestCart = getGuestCart().map(i => i.id === cartItemId ? { ...i, quantity } : i)
      saveGuestCart(guestCart)
      await fetchCart()
    }
  }

  async function clearCart() {
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id)
    } else {
      saveGuestCart([])
      setItems([])
    }
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