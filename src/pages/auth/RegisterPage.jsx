import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Mail, Lock, User, Phone, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone } },
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Account created! Check your email to verify.')
    navigate('/login')
  }

  const fields = [
    { key: 'full_name', label: 'Full name',              type: 'text',     icon: User,  placeholder: 'Jane Wanjiru' },
    { key: 'email',     label: 'Email address',          type: 'email',    icon: Mail,  placeholder: 'you@example.com' },
    { key: 'phone',     label: 'Phone (M-Pesa number)',  type: 'tel',      icon: Phone, placeholder: '0712 345 678' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-orange-500 flex-col items-center justify-center p-12 text-white">
        <ShoppingBag size={64} className="mb-6 opacity-90" />
        <h1 className="text-4xl font-bold mb-4 text-center">Join HappyBags today</h1>
        <p className="text-orange-100 text-center text-lg max-w-sm">
          Create your free account and start shopping thousands of products with fast delivery across Kenya.
        </p>
        <ul className="mt-10 space-y-3 text-orange-100 text-sm">
          {['Free account, no hidden fees','M-Pesa & card payments accepted','Track your orders in real time','Easy 7-day returns'].map(item => (
            <li key={item} className="flex items-center gap-2">
              <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">?</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6">
              <span className="font-bold text-3xl text-orange-500">Happy<span className="text-gray-800">Bags</span></span>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-500 mt-2 text-sm">It's free and takes less than a minute</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(({ key, label, type, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <div className="relative">
                    <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={type}
                      value={form[key]}
                      onChange={set(key)}
                      required={key !== 'phone'}
                      placeholder={placeholder}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    required
                    placeholder="Min. 6 characters"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={set('confirm')}
                    required
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
