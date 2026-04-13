import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Package, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'

export default function Navbar() {
  const { isLoggedIn, profile, signOut } = useAuth()
  const { itemCount } = useCart()
  const navigate  = useNavigate()

  const [categories, setCategories]   = useState([])
  const [search, setSearch]           = useState('')
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)

  useEffect(() => {
    supabase.from('categories').select('id, name, slug, icon').eq('is_active', true).order('sort_order').limit(8)
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) {
      navigate('/products?q=' + encodeURIComponent(search.trim()))
      setSearch('')
      setMobileOpen(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    setAccountOpen(false)
    navigate('/')
  }

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/logo.png"
              alt="HappyBags"
              style={{
                width: '38px',
                height: '38px',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
              onError={e => { e.target.style.display = 'none' }}
            />
            <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.3px' }}>
              <span style={{ color: '#2563eb' }}>Happy</span>
              <span style={{ color: '#1e293b' }}>Bags</span>
            </span>
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex max-w-xl">
            <div className="flex w-full rounded-lg overflow-hidden border border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products, brands and categories"
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-white"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 flex items-center justify-center transition-colors">
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 md:gap-3 ml-auto md:ml-0">

            {/* Account dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen(v => !v)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: isLoggedIn ? '#dbeafe' : '#f1f5f9',
                  color: isLoggedIn ? '#2563eb' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, flexShrink: 0,
                }}>
                  {isLoggedIn ? (profile?.full_name?.[0] || 'U').toUpperCase() : <User size={14} />}
                </div>
                <span className="hidden md:block">
                  {isLoggedIn ? (profile?.full_name?.split(' ')[0] || 'Account') : 'Account'}
                </span>
                <ChevronDown size={14} className="hidden md:block text-gray-400" />
              </button>

              {accountOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: '180px', zIndex: 100, overflow: 'hidden',
                }}>
                  {isLoggedIn ? (
                    <>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{profile?.full_name || 'User'}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{profile?.email || ''}</p>
                      </div>
                      {[
                        { to: '/profile', icon: User,    label: 'My Profile' },
                        { to: '/orders',  icon: Package, label: 'My Orders' },
                      ].map(({ to, icon: Icon, label }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setAccountOpen(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 16px', fontSize: '13px', color: '#374151',
                            textDecoration: 'none', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Icon size={15} className="text-gray-400" /> {label}
                        </Link>
                      ))}
                      <button
                        onClick={handleSignOut}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 16px', fontSize: '13px', color: '#ef4444',
                          background: 'none', border: 'none', cursor: 'pointer',
                          width: '100%', textAlign: 'left',
                          borderTop: '1px solid #f1f5f9', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setAccountOpen(false)}
                        style={{
                          display: 'block', padding: '12px 16px', fontSize: '13px',
                          fontWeight: 600, color: '#2563eb', textDecoration: 'none',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setAccountOpen(false)}
                        style={{
                          display: 'block', padding: '12px 16px', fontSize: '13px',
                          color: '#374151', textDecoration: 'none',
                        }}
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
              <Heart size={20} />
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span style={{
                  position: 'absolute', top: '2px', right: '2px',
                  background: '#2563eb', color: '#fff',
                  borderRadius: '50%', width: '18px', height: '18px',
                  fontSize: '10px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(v => !v)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Category nav — desktop */}
        {categories.length > 0 && (
          <div className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto">
            <Link
              to="/products"
              className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              All Products
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={'/category/' + cat.slug}
                className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '16px' }}>
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="flex mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2.5 text-sm outline-none"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 rounded-r-lg">
              <Search size={16} />
            </button>
          </form>

          {/* Mobile categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Link to="/products" onClick={() => setMobileOpen(false)} className="text-xs px-3 py-1.5 bg-gray-100 rounded-full text-gray-700">
              All Products
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={'/category/' + cat.slug}
                onClick={() => setMobileOpen(false)}
                className="text-xs px-3 py-1.5 bg-gray-100 rounded-full text-gray-700"
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>

          {/* Mobile auth links */}
          {!isLoggedIn && (
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}