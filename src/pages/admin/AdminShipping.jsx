import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Plus, Trash2, Truck, Package, Info } from 'lucide-react'
import { formatKES } from '@/lib/utils'
import toast from 'react-hot-toast'

const COUNTIES = [
  'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Kiambu',
  'Machakos','Kajiado','Nyeri','Meru','Kilifi','Malindi','Kakamega',
  'Uasin Gishu','Garissa','Kitale',"Murang'a",'Kirinyaga','Laikipia',
  'Bungoma','Busia','Embu','Homa Bay','Isiolo','Kericho','Kwale',
  'Lamu','Mandera','Marsabit','Migori','Narok','Nandi','Nyandarua',
  'Nyamira','Samburu','Siaya','Taita Taveta','Tana River','Tharaka Nithi',
  'Trans Nzoia','Turkana','Vihiga','Wajir','West Pokot'
]

export default function AdminShipping() {
  const [threshold, setThreshold]   = useState('2000')
  const [defaultFee, setDefaultFee] = useState('200')
  const [countyRates, setCountyRates] = useState({})
  const [newCounty, setNewCounty]   = useState('')
  const [newRate, setNewRate]       = useState('')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('shipping_settings')
        .select('key, value')

      if (data) {
        data.forEach(row => {
          if (row.key === 'free_delivery_threshold') setThreshold(String(row.value))
          if (row.key === 'default_delivery_fee')    setDefaultFee(String(row.value))
          if (row.key === 'county_rates')            setCountyRates(typeof row.value === 'string' ? JSON.parse(row.value) : row.value)
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function saveSettings() {
    setSaving(true)
    const updates = [
      { key: 'free_delivery_threshold', value: threshold },
      { key: 'default_delivery_fee',    value: defaultFee },
      { key: 'county_rates',            value: countyRates },
    ]

    for (const u of updates) {
      const { error } = await supabase
        .from('shipping_settings')
        .upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      if (error) { toast.error('Error saving: ' + error.message); setSaving(false); return }
    }

    toast.success('Shipping settings saved!')
    setSaving(false)
  }

  function addCounty() {
    if (!newCounty || !newRate) { toast.error('Select a county and enter a rate'); return }
    if (isNaN(Number(newRate)) || Number(newRate) < 0) { toast.error('Enter a valid rate'); return }
    setCountyRates(prev => ({ ...prev, [newCounty]: Number(newRate) }))
    setNewCounty('')
    setNewRate('')
  }

  function removeCounty(county) {
    setCountyRates(prev => {
      const copy = { ...prev }
      delete copy[county]
      return copy
    })
  }

  function updateRate(county, val) {
    setCountyRates(prev => ({ ...prev, [county]: Number(val) }))
  }

  const availableCounties = COUNTIES.filter(c => !countyRates[c])
  const sortedCounties    = Object.entries(countyRates).sort((a, b) => a[1] - b[1])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shipping Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Set delivery fees per county and free delivery threshold</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          <Save size={16} /> {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>

      {/* General settings */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={16} className="text-blue-600" /> General Delivery Settings
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Free Delivery Threshold (KSh)
            </label>
            <input
              type="number"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1">Orders above this amount get free delivery</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Default Delivery Fee (KSh)
            </label>
            <input
              type="number"
              value={defaultFee}
              onChange={e => setDefaultFee(e.target.value)}
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1">Used for counties not in the list below</p>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 bg-blue-50 rounded-xl p-4 flex items-start gap-3">
          <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Current rules:</p>
            <ul className="space-y-0.5 text-xs text-blue-600">
              <li>• Orders above {formatKES(threshold)} → <span className="font-bold text-green-600">FREE delivery</span></li>
              <li>• Orders below {formatKES(threshold)} → county-specific rate applies</li>
              <li>• Counties not listed → default fee of {formatKES(defaultFee)}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* County rates */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Truck size={16} className="text-blue-600" /> Delivery Rates by County
        </h3>

        {/* Add county */}
        <div className="flex gap-2 mb-5">
          <select
            value={newCounty}
            onChange={e => setNewCounty(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="">Select county to add…</option>
            {availableCounties.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">KSh</span>
            <input
              type="number"
              value={newRate}
              onChange={e => setNewRate(e.target.value)}
              placeholder="Rate"
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <button
            onClick={addCounty}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex-shrink-0"
          >
            <Plus size={15} /> Add
          </button>
        </div>

        {/* County list */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 grid grid-cols-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span>County</span>
            <span className="text-center">Delivery Fee (KSh)</span>
            <span className="text-right">Action</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {sortedCounties.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No county rates set. Add counties above.
              </div>
            ) : sortedCounties.map(([county, rate]) => (
              <div key={county} className="grid grid-cols-3 items-center px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-800">{county}</span>
                <div className="flex justify-center">
                  <input
                    type="number"
                    value={rate}
                    onChange={e => updateRate(county, e.target.value)}
                    min="0"
                    className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => removeCounty(county)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          {Object.keys(countyRates).length} counties configured · Click any rate to edit it inline
        </p>
      </div>

      {/* Save button at bottom too */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
        >
          <Save size={16} /> {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}