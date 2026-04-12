import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Mail, Lock, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from     = location.state?.from?.pathname || '/'

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Welcome back!')
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-orange-500 flex-col items-center justify-center p-12 text-white">
        <ShoppingBag size={64} className="mb-6 opacity-90" />
        <h1 className="text-4xl font-bold mb-4 text-center">Welcome back to HappyBags</h1>
        <p className="text-orange-100 text-center text-lg max-w-sm">
          Kenya's trusted marketplace. Thousands of products, fast delivery, M-Pesa accepted.
        </p>
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          {[['10K+','Products'],['50K+','Customers'],['24/7','Support']].map(([num, label]) => (
            <div key={label}>
              <p className="text-3xl font-bold">{num}</p>
              <p className="text-orange-200 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6">
              <span className="font-bold text-3xl text-orange-500">Happy<span className="text-gray-800">Bags</span></span>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="text-gray-500 mt-2 text-sm">Enter your details below</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300" />
                  Remember me
                </label>
                <a href="#" className="text-orange-500 hover:text-orange-600 font-medium">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium py-3 rounded-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              New to HappyBags?{' '}
              <Link to="/register" className="text-orange-500 hover:text-orange-600 font-medium">Create an account</Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in you agree to our{' '}
            <a href="#" className="underline hover:text-gray-600">Terms of Service</a> and{' '}
            <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
