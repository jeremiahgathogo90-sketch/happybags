import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'

import Navbar  from '@/components/layout/Navbar'
import Footer  from '@/components/layout/Footer'

import HomePage          from '@/pages/HomePage'
import ProductsPage      from '@/pages/ProductsPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CartPage          from '@/pages/CartPage'
import WishlistPage      from '@/pages/WishlistPage'
import CheckoutPage      from '@/pages/CheckoutPage'
import OrderConfirmPage  from '@/pages/OrderConfirmPage'
import OrdersPage        from '@/pages/OrdersPage'
import ProfilePage       from '@/pages/ProfilePage'

import LoginPage    from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

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

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAdmin, isLoggedIn, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isLoggedIn) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return (
    <div className="flex items-center justify-center min-h-screen flex-col gap-3">
      <p className="text-gray-600 font-medium">You do not have admin access.</p>
      <a href="/" className="text-blue-600 underline text-sm">Go to store</a>
    </div>
  )
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"               element={<><Navbar /><HomePage /><Footer /></>} />
      <Route path="/products"       element={<><Navbar /><ProductsPage /><Footer /></>} />
      <Route path="/products/:slug" element={<><Navbar /><ProductDetailPage /><Footer /></>} />
      <Route path="/category/:slug" element={<><Navbar /><ProductsPage /><Footer /></>} />
      <Route path="/search"         element={<><Navbar /><ProductsPage /><Footer /></>} />

      {/* Auth */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected customer routes */}
      <Route path="/cart"                element={<ProtectedRoute><Navbar /><CartPage /><Footer /></ProtectedRoute>} />
      <Route path="/wishlist"            element={<ProtectedRoute><Navbar /><WishlistPage /><Footer /></ProtectedRoute>} />
      <Route path="/checkout"            element={<ProtectedRoute><Navbar /><CheckoutPage /></ProtectedRoute>} />
      <Route path="/order-confirmed/:id" element={<ProtectedRoute><Navbar /><OrderConfirmPage /><Footer /></ProtectedRoute>} />
      <Route path="/orders"              element={<ProtectedRoute><Navbar /><OrdersPage /><Footer /></ProtectedRoute>} />
      <Route path="/profile"             element={<ProtectedRoute><Navbar /><ProfilePage /><Footer /></ProtectedRoute>} />

      {/* Admin login - separate from customer login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin panel */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index                element={<AdminDashboard />} />
        <Route path="products"      element={<AdminProducts />} />
        <Route path="orders"        element={<AdminOrders />} />
        <Route path="users"         element={<AdminUsers />} />
        <Route path="categories"    element={<AdminCategories />} />
        <Route path="flash-sales"   element={<AdminFlashSales />} />
        <Route path="banners"       element={<AdminBanners />} />
        <Route path="shipping"      element={<AdminShipping />} />
        <Route path="settings"      element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
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