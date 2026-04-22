import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag,
  Zap, Image, LogOut, Menu, X, Store, ChevronRight,
  Truck, Settings
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const NAV = [
  { to: '/admin',             icon: LayoutDashboard, label: 'Dashboard',  end: true },
  { to: '/admin/products',    icon: Package,         label: 'Products' },
  { to: '/admin/categories',  icon: Tag,             label: 'Categories' },
  { to: '/admin/orders',      icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/users',       icon: Users,           label: 'Customers' },
  { to: '/admin/flash-sales', icon: Zap,             label: 'Flash Sales' },
  { to: '/admin/banners',     icon: Image,           label: 'Banners' },
  { to: '/admin/shipping',    icon: Truck,           label: 'Shipping' },
  { to: '/admin/settings',    icon: Settings,        label: 'Settings' },
]

export default function AdminLayout() {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',        // Full viewport height
      overflow: 'hidden',     // Nothing escapes this container
      background: '#f1f5f9',
    }}>

      {/* Sidebar — fixed height, scrollable nav */}
      <aside style={{
        width: open ? '224px' : '64px',
        minWidth: open ? '224px' : '64px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',      // Full height always
        overflow: 'hidden',   // Sidebar never scrolls horizontally
        transition: 'width 0.2s ease, min-width 0.2s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
      }}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '16px', borderBottom: '1px solid #e2e8f0',
          overflow: 'hidden', flexShrink: 0,
        }}>
          <div style={{
            width: '32px', height: '32px', background: '#2563eb',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <Store size={16} color="#fff" />
          </div>
          {open && (
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', whiteSpace: 'nowrap' }}>
              HappyBags Admin
            </span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px', color: '#94a3b8', background: 'none', border: 'none',
            cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#475569'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Nav — scrollable if many items */}
        <nav style={{
          flex: 1, padding: '8px',
          display: 'flex', flexDirection: 'column', gap: '2px',
          overflowY: 'auto', overflowX: 'hidden',
        }}>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px',
                textDecoration: 'none', fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#2563eb' : '#64748b',
                background: isActive ? '#eff6ff' : 'transparent',
                transition: 'all 0.15s',
                overflow: 'hidden', whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes('eff6ff')) {
                  e.currentTarget.style.background = '#f8fafc'
                  e.currentTarget.style.color = '#1e293b'
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.background.includes('eff6ff')) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                }
              }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* View Store */}
        {open && (
          <Link
            to="/"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 16px', color: '#64748b',
              textDecoration: 'none', fontSize: '13px',
              borderTop: '1px solid #e2e8f0', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <ChevronRight size={14} /> View Store
          </Link>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 16px', color: '#94a3b8',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', borderTop: '1px solid #e2e8f0',
            textAlign: 'left', overflow: 'hidden', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {open && 'Sign out'}
        </button>
      </aside>

      {/* Right side — header + scrollable content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',      // Full height
        overflow: 'hidden',   // Contain the scroll
        minWidth: 0,
      }}>

        {/* Top bar — fixed, never scrolls */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,       // Never shrinks
        }}>
          <h1 style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8', margin: 0 }}>
            Store Management
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: '#dbeafe', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700,
            }}>
              {(profile?.full_name || 'A')[0].toUpperCase()}
            </div>
            {profile?.full_name && (
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                {profile.full_name}
              </span>
            )}
          </div>
        </header>

        {/* Page content — ONLY this scrolls */}
        <main style={{
          flex: 1,
          overflowY: 'auto',   // Only this scrolls
          overflowX: 'hidden',
          padding: '24px',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}