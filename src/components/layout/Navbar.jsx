import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, Heart, User, ChevronDown, Menu, X, LogOut, Package, Settings } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'
import { initials } from '@/lib/utils'

export default function Navbar() {
  const { user, profile, isLoggedIn, isAdmin, signOut } = useAuth()
  const { itemCount } = useCart()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [query, setQuery]           = useState('')
  const [menuOpen, setMenuOpen]     = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const accountRef = useRef(null)

  // Load categories from Supabase
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, slug, icon')
      .eq('is_active', true)
      .order('sort_order')
      .limit(12)
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) navigate('/search?q=' + encodeURIComponent(query.trim()))
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Main top bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1 text-gray-600"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo - TODO: replace span with your <img> logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="font-bold text-2xl text-blue-600">
              Happy<span className="text-gray-800">Bags</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden sm:flex">
            <div className="flex w-full rounded-lg overflow-hidden border border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products, brands and categories"
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-white"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 transition-colors"
              >
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">

            {/* Account dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => isLoggedIn ? setAccountOpen(o => !o) : navigate('/login')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
              >
                {isLoggedIn ? (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {initials(profile?.full_name || user?.email)}
                  </div>
                ) : (
                  <User size={20} />
                )}
                <span className="hidden sm:block">
                  {isLoggedIn ? (profile?.full_name?.split(' ')[0] || 'Account') : 'Account'}
                </span>
                <ChevronDown size={14} className="hidden sm:block" />
              </button>

              {accountOpen && isLoggedIn && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800 truncate">{profile?.full_name || 'Customer'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link to="/profile"  onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings size={15} /> My Account
                  </Link>
                  <Link to="/orders"   onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Package size={15} /> My Orders
                  </Link>
                  <Link to="/wishlist" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Heart size={15} /> Wishlist
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium">
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link to="/wishlist" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
              <Heart size={22} />
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
              <ShoppingCart size={22} />
              <span className="hidden sm:block text-sm">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-3 sm:hidden">
          <form onSubmit={handleSearch} className="flex rounded-lg overflow-hidden border border-gray-300">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-3 py-2.5 text-sm outline-none"
            />
            <button type="submit" className="bg-blue-600 text-white px-4">
              <Search size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Category nav bar - dynamically loaded from Supabase */}
      <div className="border-t border-gray-100 bg-gray-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-1 h-10 overflow-x-auto no-scrollbar">
            <Link
              to="/products"
              className="whitespace-nowrap px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium flex-shrink-0"
            >
              All Products
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={'/category/' + cat.slug}
                className="whitespace-nowrap px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {cat.icon && <span style={{fontSize:'14px'}}>{cat.icon}</span>}
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          {/* Mobile search already shown above */}
          <nav className="p-3 space-y-0.5 max-h-96 overflow-y-auto">
            <Link
              to="/products"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium"
            >
              All Products
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={'/category/' + cat.slug}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                {cat.icon && <span style={{fontSize:'16px'}}>{cat.icon}</span>}
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
