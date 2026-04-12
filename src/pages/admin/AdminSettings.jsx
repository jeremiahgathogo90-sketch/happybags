import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Store, Phone, Mail, MapPin, Globe, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = {
  store_name: '',
  store_tagline: '',
  store_email: '',
  store_phone: '',
  store_address: '',
  store_logo: '',
  store_currency: 'KES',
  mpesa_shortcode: '',
  mpesa_till: '',
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  whatsapp_number: '',
}

export default function AdminSettings() {
  const [form, setForm]       = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('shipping_settings')
        .select('key, value')
        .in('key', Object.keys(EMPTY))

      if (data) {
        const merged = { ...EMPTY }
        data.forEach(row => { merged[row.key] = typeof row.value === 'string' ? row.value : JSON.stringify(row.value) })
        setForm(merged)
      }
      setLoading(false)
    }
    load()
  }, [])

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = 'logo.' + ext
    const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
      setForm(f => ({ ...f, store_logo: publicUrl }))
      toast.success('Logo uploaded!')
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    const entries = Object.entries(form)
    for (const [key, value] of entries) {
      await supabase.from('shipping_settings').upsert(
        { key, value: value || '', updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    }
    toast.success('Settings saved!')
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Store Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your store information and integrations</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60">
          <Save size={16} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Store Identity */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Store size={16} className="text-blue-600" /> Store Identity
        </h3>
        <div className="space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
            <div className="flex items-center gap-4">
              {form.store_logo ? (
                <div className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                  <img src={form.store_logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, store_logo: '' }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs text-center">
                  No logo
                </div>
              )}
              <div>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload Logo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">PNG or SVG recommended. Max 2MB.</p>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
              <input value={form.store_name} onChange={set('store_name')} placeholder="e.g. SokoHub" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input value={form.store_tagline} onChange={set('store_tagline')} placeholder="e.g. Kenya's Trusted Marketplace" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Phone size={16} className="text-blue-600" /> Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.store_email} onChange={set('store_email')} placeholder="support@yourstore.co.ke" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Phone</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.store_phone} onChange={set('store_phone')} placeholder="+254 700 000 000" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.whatsapp_number} onChange={set('whatsapp_number')} placeholder="254712345678 (no +)" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={form.store_address} onChange={set('store_address')} placeholder="Nairobi, Kenya" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* M-Pesa Settings */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span className="text-green-600 font-bold text-sm">M</span> M-Pesa Integration
        </h3>
        <p className="text-xs text-gray-400 mb-4">Get these from your Safaricom Daraja portal at developer.safaricom.co.ke</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Shortcode / Till</label>
            <input value={form.mpesa_shortcode} onChange={set('mpesa_shortcode')} placeholder="e.g. 174379" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buy Goods Till Number</label>
            <input value={form.mpesa_till} onChange={set('mpesa_till')} placeholder="e.g. 123456" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div className="mt-3 bg-green-50 rounded-xl p-3 text-xs text-green-700">
          <p className="font-medium mb-1">For full M-Pesa STK push you need to set these in Supabase Edge Function secrets:</p>
          <p className="font-mono">MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_CALLBACK_URL</p>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Globe size={16} className="text-blue-600" /> Social Media Links
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'social_facebook',  label: 'Facebook URL',  placeholder: 'https://facebook.com/yourstore' },
            { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/yourstore' },
            { key: 'social_twitter',   label: 'Twitter/X URL', placeholder: 'https://twitter.com/yourstore' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input value={form[key]} onChange={set(key)} placeholder={placeholder} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-60">
          <Save size={16} /> {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}