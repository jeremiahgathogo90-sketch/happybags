import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { timeRemaining, pad2 } from '@/lib/utils'
import ProductCard from '@/components/product/ProductCard'
import ProductGrid from '@/components/product/ProductGrid'

function FlashTimer({ endsAt }) {
  const [t, setT] = useState(timeRemaining(endsAt))
  useEffect(() => {
    const id = setInterval(() => setT(timeRemaining(endsAt)), 1000)
    return () => clearInterval(id)
  }, [endsAt])
  if (t.expired) return null
  return (
    <div className="flex items-center gap-1 text-white text-sm font-mono font-bold">
      <span>Time Left:</span>
      <span className="bg-black/30 px-1.5 py-0.5 rounded">{pad2(t.hours)}h</span>
      <span>:</span>
      <span className="bg-black/30 px-1.5 py-0.5 rounded">{pad2(t.minutes)}m</span>
      <span>:</span>
      <span className="bg-black/30 px-1.5 py-0.5 rounded">{pad2(t.seconds)}s</span>
    </div>
  )
}

function SectionHeader({ title, seeAllLink }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-lg text-gray-900">{title}</h2>
      {seeAllLink && (
        <Link to={seeAllLink} className="flex items-center gap-0.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
          See All <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function HomePage() {
  const [banners, setBanners]       = useState([])
  const [bannerIdx, setBannerIdx]   = useState(0)
  const [categories, setCategories] = useState([])
  const [flashSale, setFlashSale]   = useState(null)
  const [flashItems, setFlashItems] = useState([])
  const [featured, setFeatured]     = useState([])
  const [newest, setNewest]         = useState([])
  const [popular, setPopular]       = useState([])
  const [storeName, setStoreName]   = useState('HappyBags')

  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [loadingNewest, setLoadingNewest]     = useState(true)
  const [loadingFlash, setLoadingFlash]       = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadAll() {
      try {
        const { data: bannersData } = await supabase
          .from('banners').select('*').eq('is_active', true).order('sort_order').limit(5)
        if (mounted) setBanners(bannersData ?? [])

        const { data: catsData } = await supabase
          .from('categories').select('id, name, slug, icon, image_url')
          .eq('is_active', true).order('sort_order').limit(12)
        if (mounted) setCategories(catsData ?? [])

        const { data: nameData } = await supabase
          .from('shipping_settings').select('value').eq('key', 'store_name').maybeSingle()
        if (mounted && nameData) setStoreName(String(nameData.value).replace(/^"|"$/g, ''))

        const { data: featuredData } = await supabase
          .from('products')
          .select('id, name, slug, price, original_price, thumbnail, stock_qty, rating_avg, rating_count')
          .eq('is_active', true).eq('is_featured', true)
          .order('created_at', { ascending: false }).limit(10)
        if (mounted) { setFeatured(featuredData ?? []); setLoadingFeatured(false) }

        const { data: newestData } = await supabase
          .from('products')
          .select('id, name, slug, price, original_price, thumbnail, stock_qty, rating_avg, rating_count')
          .eq('is_active', true).order('created_at', { ascending: false }).limit(10)
        if (mounted) { setNewest(newestData ?? []); setLoadingNewest(false) }

        const { data: popularData } = await supabase
          .from('products')
          .select('id, name, slug, price, original_price, thumbnail, stock_qty, rating_avg, rating_count')
          .eq('is_active', true).order('sold_count', { ascending: false }).limit(10)
        if (mounted) setPopular(popularData ?? [])

        const now = new Date().toISOString()
        const { data: saleData } = await supabase
          .from('flash_sales').select('*').eq('is_active', true)
          .lte('starts_at', now).gte('ends_at', now)
          .order('starts_at', { ascending: false }).limit(1).maybeSingle()

        if (mounted) {
          if (saleData) {
            setFlashSale(saleData)
            const { data: itemsData } = await supabase
              .from('flash_sale_items')
              .select('*, product:products(id, name, slug, price, original_price, thumbnail, images, stock_qty, rating_avg, rating_count)')
              .eq('flash_sale_id', saleData.id).limit(10)
            if (mounted) setFlashItems(itemsData ?? [])
          }
          setLoadingFlash(false)
        }

      } catch (err) {
        console.error('HomePage load error:', err)
        if (mounted) {
          setLoadingFeatured(false)
          setLoadingNewest(false)
          setLoadingFlash(false)
        }
      }
    }

    loadAll()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const id = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 5000)
    return () => clearInterval(id)
  }, [banners])

  const activeBanner = banners[bannerIdx]

  return (
    <main>
      {/* Banner */}
      {banners.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-5">
          <div className="relative overflow-hidden" style={{ borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', minHeight: '200px', background: '#1e40af' }}>
            {activeBanner.image_url ? (
              <img src={activeBanner.image_url} alt={activeBanner.title || 'Banner'} style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block', borderRadius: '20px' }} />
            ) : (
              <div className="px-8 py-16 text-white">
                <h1 className="font-bold text-3xl md:text-5xl mb-4">{activeBanner.title}</h1>
                {activeBanner.subtitle && <p className="text-blue-100 mb-6 text-lg">{activeBanner.subtitle}</p>}
                {activeBanner.link_url && (
                  <Link to={activeBanner.link_url} className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-xl">
                    Shop Now <ChevronRight size={18} />
                  </Link>
                )}
              </div>
            )}
            {activeBanner.image_url && (activeBanner.title || activeBanner.link_url) && (
              <div className="absolute inset-0 flex items-end" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)', borderRadius: '20px' }}>
                <div className="px-8 py-8 w-full">
                  {activeBanner.title && <h1 className="font-bold text-2xl md:text-4xl text-white mb-2 max-w-lg">{activeBanner.title}</h1>}
                  {activeBanner.subtitle && <p className="text-white/90 mb-4 max-w-md">{activeBanner.subtitle}</p>}
                  {activeBanner.link_url && (
                    <Link to={activeBanner.link_url} className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm">
                      Shop Now <ChevronRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            )}
            {banners.length > 1 && (
              <>
                <button onClick={() => setBannerIdx(i => (i - 1 + banners.length) % banners.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setBannerIdx(i => (i + 1) % banners.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center">
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setBannerIdx(i)} className={['rounded-full transition-all', i === bannerIdx ? 'bg-white w-5 h-2' : 'bg-white/50 w-2 h-2'].join(' ')} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">

        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <SectionHeader title="Shop by Category" seeAllLink="/products" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
              {categories.map(cat => (
                <Link key={cat.id} to={'/category/' + cat.slug} className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all group text-center">
                  {cat.image_url
                    ? <img src={cat.image_url} alt={cat.name} className="w-8 h-8 object-contain" />
                    : <span style={{ fontSize: '24px' }}>{cat.icon || '🛍️'}</span>
                  }
                  <span className="text-xs text-gray-700 group-hover:text-blue-600 font-medium leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Flash Sale */}
        {!loadingFlash && flashSale && (
          <section>
            <div className="bg-red-600 rounded-t-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-white fill-white" />
                <span className="font-bold text-white text-sm">{flashSale.title}</span>
                <FlashTimer endsAt={flashSale.ends_at} />
              </div>
              <Link to="/products?flash=true" className="text-white text-sm font-medium hover:underline flex items-center gap-1">
                See All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="bg-red-50 rounded-b-xl p-4">
              {flashItems.length === 0 ? (
                <p className="text-center text-gray-500 py-6 text-sm">No products in this flash sale yet.</p>
              ) : (
                <ProductGrid>
                  {flashItems.map(item => item.product && <ProductCard key={item.id} product={item.product} flashPrice={item.sale_price} />)}
                </ProductGrid>
              )}
            </div>
          </section>
        )}

        {/* Featured */}
        <section>
          <SectionHeader title="Featured Products" seeAllLink="/products?featured=true" />
          {loadingFeatured ? <Spinner /> : featured.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No featured products yet.</p>
              <p className="text-gray-400 text-xs mt-1">Go to Admin then Products and mark products as Featured.</p>
            </div>
          ) : (
            <ProductGrid>
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </ProductGrid>
          )}
        </section>

        {/* Best Sellers */}
        {popular.length > 0 && (
          <section>
            <SectionHeader title="Best Sellers" seeAllLink="/products?sort=popular" />
            <ProductGrid>
              {popular.map(p => <ProductCard key={p.id} product={p} />)}
            </ProductGrid>
          </section>
        )}

        {/* New Arrivals */}
        <section>
          <SectionHeader title="New Arrivals" seeAllLink="/products?sort=newest" />
          {loadingNewest ? <Spinner /> : newest.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No products yet.</p>
            </div>
          ) : (
            <ProductGrid>
              {newest.map(p => <ProductCard key={p.id} product={p} />)}
            </ProductGrid>
          )}
        </section>

        {/* CTA */}
        <section className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', boxShadow: '0 8px 32px rgba(30,58,138,0.25)' }}>
          <div>
            <h3 className="font-bold text-2xl mb-2">Get the {storeName} App</h3>
            <p className="text-blue-300 text-sm">Shop faster. Track orders. Exclusive app-only deals.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a href="#" className="bg-white text-gray-900 font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">App Store</a>
            <a href="#" className="bg-blue-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-blue-400 transition-colors">Google Play</a>
          </div>
        </section>

      </div>
    </main>
  )
}