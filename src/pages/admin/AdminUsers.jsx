import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, X, Shield } from 'lucide-react'
import { initials } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, is_active, created_at')
      .ilike('full_name', '%' + search + '%')
      .order('created_at', { ascending: false })
      .limit(100)
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  async function toggleRole(user) {
    const newRole = user.role === 'admin' ? 'customer' : 'admin'
    if (!confirm(`Make ${user.full_name || 'this user'} ${newRole === 'admin' ? 'an Admin' : 'a Customer'}?`)) return
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
    if (error) { toast.error(error.message); return }
    toast.success('Role updated')
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
  }

  async function toggleActive(user) {
    const { error } = await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id)
    if (error) { toast.error(error.message); return }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
  }

  const ROLE_COLORS = { super_admin: 'bg-purple-100 text-purple-700', admin: 'bg-blue-100 text-blue-700', customer: 'bg-gray-100 text-gray-600' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage customer accounts and roles</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…" className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={15} /></button>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400">No customers found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials(u.full_name)}
                    </div>
                    <span className="font-medium text-gray-800">{u.full_name || 'No name'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString('en-KE')}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    {u.role !== 'super_admin' && (
                      <button onClick={() => toggleRole(u)} title={u.role === 'admin' ? 'Remove admin' : 'Make admin'} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Shield size={15} />
                      </button>
                    )}
                    <button onClick={() => toggleActive(u)} className={`text-xs px-2 py-1 rounded font-medium transition-colors ${u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                      {u.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}