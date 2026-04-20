import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Zap, Phone, ShoppingBag, Package, Star, Truck } from 'lucide-react'
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
      <div className="flex items-center gap-2">
        <div style={{ width: '4px', height: '22px', background: '#1d4ed8', borderRadius: '2px' }} />
        <h2 className="font-bold text-lg text-gray-900">{title}</h2>
      </div>
      {seeAllLink && (
        <Link to={seeAllLink} className="flex items-center gap-0.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          See All <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-7 h-7 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
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

  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [loadingNewest, setLoadingNewest]     = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadAll() {
      try {
        // Load everything in parallel — much faster!
        const [
          { data: bannersData },
          { data: catsData },
          { data: featuredData },
          { data: newestData },
          { data: popularData },
        ] = await Promise.all([
          supabase.from('banners').select('*').eq('is_active', true).order('sort_order').limit(5),
          supabase.from('categories').select('id, name, slug, icon, image_url').eq('is_active', true).order('sort_order').limit(8),
          supabase.from('products').select('id, name, slug, price, original_price, thumbnail, stock_qty, rating_avg, rating_count').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(10),
          supabase.from('products').select('id, name, slug, price, original_price, thumbnail, stock_qty, rating_avg, rating_count').eq('is_active', true).order('created_at', { ascending: false }).limit(10),
          supabase.from('products').select('id, name, slug, price, original_price, thumbnail, stock_qty, rating_avg, rating_count').eq('is_active', true).order('sold_count', { ascending: false }).limit(10),
        ])

        if (!mounted) return

        setBanners(bannersData ?? [])
        setCategories(catsData ?? [])
        setFeatured(featuredData ?? [])
        setNewest(newestData ?? [])
        setPopular(popularData ?? [])
        setLoadingFeatured(false)
        setLoadingNewest(false)

        // Load flash sale separately after main content
        const now = new Date().toISOString()
        const { data: saleData } = await supabase
          .from('flash_sales').select('*').eq('is_active', true)
          .lte('starts_at', now).gte('ends_at', now)
          .order('starts_at', { ascending: false }).limit(1).maybeSingle()

        if (!mounted) return

        if (saleData) {
          setFlashSale(saleData)
          const { data: itemsData } = await supabase
            .from('flash_sale_items')
            .select('*, product:products(id, name, slug, price, original_price, thumbnail, images, stock_qty, rating_avg, rating_count)')
            .eq('flash_sale_id', saleData.id).limit(10)
          if (mounted) setFlashItems(itemsData ?? [])
        }

      } catch (err) {
        console.error('HomePage load error:', err)
        if (mounted) {
          setLoadingFeatured(false)
          setLoadingNewest(false)
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
  const ROYAL_BLUE   = '#1d4ed8'
  const DARK_BLUE    = '#1e3a8a'
  const GOLD         = '#f59e0b'

  return (
    <main>
      {/* Announcement Bar */}
      <div style={{ background: ROYAL_BLUE, color: '#fff', padding: '7px 16px', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span>🛍️ Wholesale &amp; Retail — Quality Bags &amp; Packaging Solutions</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <a href="tel:+254716670629" style={{ color: '#fde68a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Phone size={11} /> 0716 670 629
        </a>
      </div>

      {/* Hero — uploaded banner OR default */}
      {banners.length > 0 ? (
        <div style={{ position: 'relative', overflow: 'hidden', background: DARK_BLUE }}>
          <img src={activeBanner.image_url} alt={activeBanner.title || 'Banner'} style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', display: 'block', opacity: 0.85 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(29,78,216,0.85) 0%, rgba(30,58,138,0.5) 60%, transparent 100%)', display: 'flex', alignItems: 'center', padding: '0 48px' }}>
            <div style={{ maxWidth: '480px' }}>
              <p style={{ color: GOLD, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Nairobi's Premier Packaging Store</p>
              <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, lineHeight: 1.2, marginBottom: '14px' }}>Quality Bags &amp;<br />Packaging Solutions</h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', lineHeight: 1.6, marginBottom: '22px' }}>Non-woven bags, gift bags, khaki bags, straws, disposable cups &amp; plates.</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link to="/products" style={{ background: GOLD, color: '#1e293b', fontWeight: 700, padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingBag size={15} /> Shop Now
                </Link>
                <a href="tel:+254716670629" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', fontWeight: 600, padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} /> Call Us
                </a>
              </div>
            </div>
          </div>
          {banners.length > 1 && (
            <>
              <button onClick={() => setBannerIdx(i => (i - 1 + banners.length) % banners.length)} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setBannerIdx(i => (i + 1) % banners.length)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ background: `linear-gradient(135deg, ${DARK_BLUE} 0%, ${ROYAL_BLUE} 60%, #3b82f6 100%)`, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="max-w-7xl mx-auto" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative' }}>
            <div style={{ maxWidth: '480px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '20px', padding: '3px 10px', marginBottom: '12px' }}>
                <Star size={11} color={GOLD} fill={GOLD} />
                <span style={{ color: GOLD, fontSize: '10px', fontWeight: 600, letterSpacing: '1px' }}>NAIROBI'S PREMIER PACKAGING STORE</span>
              </div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, lineHeight: 1.15, marginBottom: '10px' }}>
                Quality Bags &amp;<br /><span style={{ color: GOLD }}>Packaging Solutions</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
                Non-woven bags, gift bags, khaki bags, straws, disposable cups &amp; plates. Wholesale &amp; retail across Kenya.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <Link to="/products" style={{ background: GOLD, color: '#1e293b', fontWeight: 700, padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
                  <ShoppingBag size={15} /> Shop Now
                </Link>
                <a href="tel:+254716670629" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', fontWeight: 600, padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} /> Call Us
                </a>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <a href="tel:+254716670629" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={12} /> 0716 670 629</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div style={{ background: GOLD, padding: '8px 16px' }}>
        <div className="max-w-7xl mx-auto" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { icon: Truck,   text: 'Free CBD delivery over KSh 10,000' },
            { icon: Package, text: 'Wholesale & Retail' },
            { icon: Star,    text: 'Quality Guaranteed' },
            { icon: Phone,   text: '0716 670 629' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b', fontSize: '12px', fontWeight: 600 }}>
              <Icon size={13} /><span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 space-y-8">

        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <SectionHeader title="Shop by Category" seeAllLink="/products" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {categories.map(cat => (
                <Link key={cat.id} to={'/category/' + cat.slug} style={{ textDecoration: 'none' }}
                  className="flex flex-col items-center gap-1.5 p-2.5 bg-white rounded-xl border border-gray-100 hover:border-blue-400 hover:shadow-md transition-all group text-center">
                  {cat.image_url
                    ? <img src={cat.image_url} alt={cat.name} className="w-7 h-7 object-contain" />
                    : <span style={{ fontSize: '22px' }}>{cat.icon || '🛍️'}</span>
                  }
                  <span className="text-xs text-gray-700 group-hover:text-blue-600 font-medium leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Flash Sale */}
        {flashSale && (
          <section>
            <div style={{ background: '#dc2626', borderRadius: '12px 12px 0 0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={16} color="#fff" fill="#fff" />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>{flashSale.title}</span>
                <FlashTimer endsAt={flashSale.ends_at} />
              </div>
              <Link to="/products?flash=true" style={{ color: '#fff', fontSize: '12px', fontWeight: 500, textDecoration: 'none' }}>See All →</Link>
            </div>
            <div style={{ background: '#fef2f2', borderRadius: '0 0 12px 12px', padding: '14px' }}>
              <ProductGrid mobileMax={4}>
                {flashItems.map(item => item.product && <ProductCard key={item.id} product={item.product} flashPrice={item.sale_price} />)}
              </ProductGrid>
            </div>
          </section>
        )}

        {/* Featured */}
        <section>
          <SectionHeader title="Featured Products" seeAllLink="/products?featured=true" />
          {loadingFeatured ? <Spinner /> : featured.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', background: '#fff', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>No featured products yet.</p>
            </div>
          ) : (
            <ProductGrid mobileMax={4}>{featured.map(p => <ProductCard key={p.id} product={p} />)}</ProductGrid>
          )}
        </section>

        {/* Best Sellers */}
        {popular.length > 0 && (
          <section>
            <SectionHeader title="Best Sellers" seeAllLink="/products?sort=popular" />
            <ProductGrid mobileMax={4}>{popular.map(p => <ProductCard key={p.id} product={p} />)}</ProductGrid>
          </section>
        )}

        {/* New Arrivals */}
        <section>
          <SectionHeader title="New Arrivals" seeAllLink="/products?sort=newest" />
          {loadingNewest ? <Spinner /> : newest.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', background: '#fff', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>No products yet.</p>
            </div>
          ) : (
            <ProductGrid mobileMax={4}>{newest.map(p => <ProductCard key={p.id} product={p} />)}</ProductGrid>
          )}
        </section>

        {/* CTA */}
        <section style={{ background: `linear-gradient(135deg, ${DARK_BLUE} 0%, ${ROYAL_BLUE} 100%)`, borderRadius: '18px', padding: '32px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', boxShadow: '0 8px 28px rgba(29,78,216,0.22)' }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Happy Bags Merchant</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '4px' }}>📍 Nairobi CBD — Wholesale &amp; Retail</p>
            <p style={{ color: GOLD, fontSize: '13px', fontWeight: 600 }}>📞 0716 670 629 </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/products" style={{ background: GOLD, color: '#1e293b', fontWeight: 700, padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px' }}>Shop Now 🛍️</Link>
            <a href="tel:+254716670629" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', fontWeight: 600, padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px' }}>Call Us 📞</a>
          </div>
        </section>

      </div>
    </main>
  )
}