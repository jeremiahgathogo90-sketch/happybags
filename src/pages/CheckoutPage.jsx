import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { formatKES } from '@/lib/utils'
import { MapPin, Phone, ChevronRight, Lock, Smartphone, Truck, CheckCircle, User, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const COUNTIES = [
  'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Kiambu',
  'Machakos','Kajiado','Nyeri','Meru','Kilifi','Malindi','Kakamega',
  'Uasin Gishu','Garissa','Kitale',"Murang'a",'Kirinyaga','Laikipia',
  'Bungoma','Busia','Embu','Homa Bay','Isiolo','Kericho','Kwale',
  'Lamu','Mandera','Marsabit','Migori','Narok','Nandi','Nyandarua',
  'Nyamira','Samburu','Siaya','Taita Taveta','Tana River','Tharaka Nithi',
  'Trans Nzoia','Turkana','Vihiga','Wajir','West Pokot'
].sort()

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user, profile }              = useAuth()
  const navigate                       = useNavigate()

  const [step, setStep]     = useState(1)
  const [saving, setSaving] = useState(false)
  const [method, setMethod] = useState('cod')
  const [notes, setNotes]   = useState('')

  const [threshold, setThreshold]     = useState(2000)
  const [defaultFee, setDefaultFee]   = useState(200)
  const [countyRates, setCountyRates] = useState({})
  const [delivery, setDelivery]       = useState(200)

  const [address, setAddress] = useState({
    full_name: profile?.full_name || '',
    phone:     profile?.phone || '',
    email:     user?.email || '',
    county:    '',
    town:      '',
    street:    '',
  })

  useEffect(() => {
    async function loadShipping() {
      const { data } = await supabase.from('shipping_settings').select('key, value')
      if (data) {
        let thresh = 2000, defFee = 200, rates = {}
        data.forEach(row => {
          const val = String(row.value).replace(/^"|"$/g, '')
          if (row.key === 'free_delivery_threshold') thresh = Number(val)
          if (row.key === 'default_delivery_fee')    defFee = Number(val)
          if (row.key === 'county_rates') {
            try { rates = typeof row.value === 'string' ? JSON.parse(row.value) : row.value } catch {}
          }
        })
        setThreshold(thresh)
        setDefaultFee(defFee)
        setCountyRates(rates)
        setDelivery(subtotal >= thresh ? 0 : defFee)
      }
    }
    loadShipping()
  }, [])

  useEffect(() => {
    if (subtotal >= threshold) { setDelivery(0); return }
    if (address.county && countyRates[address.county] !== undefined) {
      setDelivery(countyRates[address.county])
    } else {
      setDelivery(defaultFee)
    }
  }, [address.county, subtotal, threshold, defaultFee, countyRates])

  const total = subtotal + delivery
  const setA  = key => e => setAddress(a => ({ ...a, [key]: e.target.value }))

  async function placeOrder() {
    setSaving(true)
    const loadingToast = toast.loading('Creating order...')

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id:          user?.id || null,
          status:           'pending',
          payment_status:   'unpaid',
          payment_method:   method,
          subtotal,
          delivery_fee:     delivery,
          discount_amount:  0,
          total,
          phone:            address.phone,
          delivery_address: address,
          guest_email:      !user ? address.email : null,
          notes:            notes || null,
        })
        .select()
        .single()

      if (orderError) {
        toast.dismiss(loadingToast)
        toast.error('Failed to place order: ' + orderError.message)
        setSaving(false)
        return
      }

      const orderItems = items.map(item => ({
        order_id:      order.id,
        product_id:    item.product_id,
        product_name:  item.product?.name || '',
        product_image: item.product?.thumbnail || '',
        unit_price:    item.product?.price || 0,
        quantity:      item.quantity,
        subtotal:      (item.product?.price || 0) * item.quantity,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

      if (itemsError) {
        toast.dismiss(loadingToast)
        toast.error('Order created but items failed. Contact support.')
        setSaving(false)
        return
      }

      toast.dismiss(loadingToast)
      toast.success('Order placed! Pay cash on delivery.', { duration: 5000, icon: '✅' })

      await clearCart()
      setSaving(false)
      navigate('/order-confirmed/' + order.id)

    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Something went wrong: ' + err.message)
      setSaving(false)
    }
  }

  if (items.length === 0) { navigate('/cart'); return null }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Delivery & Notes', 'Payment', 'Review'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={['flex items-center gap-2', step > i + 1 ? 'text-green-600' : step === i + 1 ? 'text-blue-600' : 'text-gray-400'].join(' ')}>
              <div className={['w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all', step > i + 1 ? 'bg-green-600 border-green-600 text-white' : step === i + 1 ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-400'].join(' ')}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s}</span>
            </div>
            {i < 2 && <ChevronRight size={16} className="text-gray-300" />}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">

          {/* Step 1 — Delivery & Notes */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">

              {!user && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex items-start gap-3">
                  <User size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Checking out as guest</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      <Link to="/login" className="underline font-medium">Sign in</Link> to track your orders and save your details for next time.
                    </p>
                  </div>
                </div>
              )}

              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" /> Delivery Address
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input value={address.full_name} onChange={setA('full_name')} required placeholder="Jane Wanjiru" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={address.phone} onChange={setA('phone')} required placeholder="0712 345 678" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>

                {!user && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input type="email" value={address.email} onChange={setA('email')} required placeholder="jane@example.com" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <p className="text-xs text-gray-400 mt-1">Order confirmation will be sent here</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">County *</label>
                    <select value={address.county} onChange={setA('county')} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                      <option value="">Select county</option>
                      {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Town / Area *</label>
                    <input value={address.town} onChange={setA('town')} required placeholder="e.g. Westlands" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street / Building</label>
                  <input value={address.street} onChange={setA('street')} placeholder="e.g. Kimathi Street, ABC Building" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>

                {address.county && (
                  <div className={['flex items-center gap-3 p-3 rounded-xl text-sm', delivery === 0 ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'].join(' ')}>
                    <Truck size={16} className="flex-shrink-0" />
                    <span>
                      Delivery to <strong>{address.county}</strong>:{' '}
                      {delivery === 0
                        ? <span className="font-bold text-green-600">FREE</span>
                        : <span className="font-bold">{formatKES(delivery)}</span>
                      }
                    </span>
                  </div>
                )}

                {/* Order Notes */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FileText size={15} className="text-blue-500" />
                    Order Notes / Special Instructions
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Describe your requirements here...&#10;&#10;e.g. I need 100 blue non-woven bags size 30x40cm. Please call me before delivery. I also want 50 gift bags with red ribbons."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    💡 Specify sizes, colors, quantities, printing requirements or any special requests
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (!address.full_name || !address.phone || !address.county || !address.town) {
                      toast.error('Please fill in all required fields')
                      return
                    }
                    if (!user && !address.email) {
                      toast.error('Please enter your email address')
                      return
                    }
                    setStep(2)
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Payment */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Lock size={18} className="text-blue-600" /> Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all border-blue-500 bg-blue-50">
                  <input type="radio" name="method" value="cod" checked={method === 'cod'} onChange={() => setMethod('cod')} className="text-blue-600" />
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-100">
                    <MapPin size={20} className="text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Pay on Delivery</p>
                    <p className="text-xs text-gray-500">Cash when order arrives</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium flex-shrink-0">Available</span>
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl">Review Order</button>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <CheckCircle size={18} className="text-blue-600" /> Review Your Order
              </h2>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Delivering to</p>
                <p className="font-medium text-gray-800">{address.full_name}</p>
                <p className="text-sm text-gray-600">{address.street && address.street + ', '}{address.town}, {address.county}</p>
                <p className="text-sm text-gray-600">{address.phone}</p>
                {!user && address.email && <p className="text-sm text-gray-600">{address.email}</p>}
              </div>

              {/* Show notes in review */}
              {notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <FileText size={12} /> Order Notes
                  </p>
                  <p className="text-sm text-amber-800 whitespace-pre-wrap">{notes}</p>
                </div>
              )}

              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.product?.thumbnail || 'https://placehold.co/40x40?text=?'} alt="" className="w-10 h-10 object-contain rounded-lg bg-gray-50 p-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">{formatKES((item.product?.price || 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Payment Method</p>
                <p className="font-medium text-gray-800 flex items-center gap-2">
                  <MapPin size={16} className="text-orange-600" /> Pay on Delivery
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">Back</button>
                <button
                  onClick={placeOrder}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                    : 'Place Order ✅'
                  }
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-gray-600">
                  <span className="truncate mr-2">{item.product?.name} x{item.quantity}</span>
                  <span className="flex-shrink-0">{formatKES((item.product?.price || 0) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatKES(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery {address.county && '(' + address.county + ')'}</span>
                <span className={delivery === 0 ? 'text-green-600 font-medium' : ''}>
                  {delivery === 0 ? 'FREE' : formatKES(delivery)}
                </span>
              </div>
              {subtotal < threshold && delivery > 0 && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-2.5 py-2">
                  Add {formatKES(threshold - subtotal)} more for free delivery!
                </p>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                <span>Total</span><span>{formatKES(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}