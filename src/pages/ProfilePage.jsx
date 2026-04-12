import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { User, Phone, Mail, Save, ShoppingBag, Heart, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { initials } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, profile, fetchProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [orderCount, setOrderCount] = useState(0)

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
  }, [profile])

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => setOrderCount(count ?? 0))
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone }).eq('id', user.id)
    if (error) { toast.error(error.message); setSaving(false); return }
    await fetchProfile(user.id)
    toast.success('Profile updated!')
    setSaving(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

      {/* Avatar card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold flex-shrink-0">
          {initials(profile?.full_name || user?.email)}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">{profile?.full_name || 'No name set'}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">{profile?.role || 'customer'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link to="/orders" className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-blue-200 transition-colors">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <ShoppingBag size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{orderCount}</p>
            <p className="text-xs text-gray-500">Total Orders</p>
          </div>
        </Link>
        <Link to="/wishlist" className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-red-200 transition-colors">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <Heart size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-500">Wishlist Items</p>
          </div>
        </Link>
      </div>

      {/* Edit profile form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <h2 className="font-bold text-gray-900 mb-4">Personal Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (M-Pesa Number)</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0712 345 678" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={user?.email || ''} disabled className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pl-9 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm">
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <button onClick={handleSignOut} className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium text-sm transition-colors">
          <LogOut size={16} /> Sign out of my account
        </button>
      </div>
    </div>
  )
}