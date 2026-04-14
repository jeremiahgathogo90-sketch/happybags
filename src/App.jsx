import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'

import Navbar  from '@/components/layout/Navbar'
import Footer  from '@/components/layout/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'

import HomePage          from '@/pages/HomePage'
import ProductsPage      from '@/pages/ProductsPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CartPage          from '@/pages/CartPage'
import WishlistPage      from '@/pages/WishlistPage'
import CheckoutPage      from '@/pages/CheckoutPage'
import OrderConfirmPage  from '@/pages/OrderConfirmPage'
import OrdersPage        from '@/pages/OrdersPage'
import ProfilePage       from '@/pages/ProfilePage'
import AboutPage         from '@/pages/AboutPage'

import LoginPage    from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import AuthCallback from '@/pages/auth/AuthCallback'

import AdminLogin      from '@/pages/admin/AdminLogin'
import AdminLayout     from '@/pages/admin/AdminLayout'
import AdminDashboard  from '@/pages/admin/AdminDashboard'
import AdminProducts   from '@/pages/admin/AdminProducts'
import AdminOrders     from '@/pages/admin/AdminOrders'
import AdminUsers      from '@/pages/admin/AdminUsers'
import AdminCategories from '@/pages/admin/AdminCategories'
import AdminFlashSales from '@/pages/admin/AdminFlashSales'
import AdminBanners    from '@/pages/admin/AdminBanners'
import AdminShipping   from '@/pages/admin/AdminShipping'
import AdminSettings   from '@/pages/admin/AdminSettings'

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 32, height: 32, border: '4px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return <Spinner />
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAdmin, isLoggedIn, loading } = useAuth()
  if (loading) return <Spinner />
  if (!isLoggedIn) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: '#64748b', fontWeight: 500 }}>You do not have admin access.</p>
      <a href="/" style={{ color: '#2563eb', fontSize: 14 }}>Go to store</a>
    </div>
  )
  return children
}

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/"               element={<><Navbar /><HomePage /><Footer /></>} />
        <Route path="/products"       element={<><Navbar /><ProductsPage /><Footer /></>} />
        <Route path="/products/:slug" element={<><Navbar /><ProductDetailPage /><Footer /></>} />
        <Route path="/category/:slug" element={<><Navbar /><ProductsPage /><Footer /></>} />
        <Route path="/search"         element={<><Navbar /><ProductsPage /><Footer /></>} />
        <Route path="/about"          element={<><Navbar /><AboutPage /><Footer /></>} />

        {/* Auth */}
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/register"      element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected customer routes */}
        <Route path="/cart"                element={<ProtectedRoute><Navbar /><CartPage /><Footer /></ProtectedRoute>} />
        <Route path="/wishlist"            element={<ProtectedRoute><Navbar /><WishlistPage /><Footer /></ProtectedRoute>} />
        <Route path="/checkout"            element={<ProtectedRoute><Navbar /><CheckoutPage /></ProtectedRoute>} />
        <Route path="/order-confirmed/:id" element={<ProtectedRoute><Navbar /><OrderConfirmPage /><Footer /></ProtectedRoute>} />
        <Route path="/orders"              element={<ProtectedRoute><Navbar /><OrdersPage /><Footer /></ProtectedRoute>} />
        <Route path="/profile"             element={<ProtectedRoute><Navbar /><ProfilePage /><Footer /></ProtectedRoute>} />

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin panel */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index              element={<AdminDashboard />} />
          <Route path="products"    element={<AdminProducts />} />
          <Route path="orders"      element={<AdminOrders />} />
          <Route path="users"       element={<AdminUsers />} />
          <Route path="categories"  element={<AdminCategories />} />
          <Route path="flash-sales" element={<AdminFlashSales />} />
          <Route path="banners"     element={<AdminBanners />} />
          <Route path="shipping"    element={<AdminShipping />} />
          <Route path="settings"    element={<AdminSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* WhatsApp float button — shows on all pages except admin */}
      <WhatsAppButton
        phone="254716670629"
        message="Hello HappyBags! I need help with my order."
      />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' },
              success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}