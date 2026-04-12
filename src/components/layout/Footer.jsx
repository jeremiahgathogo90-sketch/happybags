import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="font-bold text-2xl text-blue-400">Happy<span className="text-white">Bags</span></span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">Kenya's trusted online marketplace. Fast delivery countrywide.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4 text-sm">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/products?flash=true" className="hover:text-white transition-colors">Flash Sales</Link></li>
              <li><Link to="/products?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4 text-sm">My Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">My Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4 text-sm">We Accept</h4>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-gray-800 text-xs px-2.5 py-1 rounded font-medium text-green-400">M-Pesa</span>
              <span className="bg-gray-800 text-xs px-2.5 py-1 rounded font-medium text-blue-400">Visa</span>
              <span className="bg-gray-800 text-xs px-2.5 py-1 rounded font-medium text-red-400">Mastercard</span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} HappyBags. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
