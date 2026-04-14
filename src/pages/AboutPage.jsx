import { Link } from 'react-router-dom'
import { ShoppingBag, Truck, Shield, Heart, Star, Phone, Mail, MapPin, MessageCircle } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: '24px',
        padding: '48px 32px',
        textAlign: 'center',
        color: '#fff',
        marginBottom: '48px',
      }}>
        <div style={{
          width: '80px', height: '80px', background: 'rgba(255,255,255,0.15)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <ShoppingBag size={40} color="#fff" />
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>
          About HappyBags Kenya
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
          Kenya's trusted online bag store. We bring you the best quality bags at affordable prices, delivered right to your doorstep.
        </p>
      </div>

      {/* Our Story */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>Our Story</h2>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', lineHeight: 1.8, color: '#475569', fontSize: '15px' }}>
          <p style={{ marginBottom: '16px' }}>
            HappyBags was started with a simple mission — to make it easy for Kenyans to buy quality bags online at fair prices. We noticed that many people struggled to find good bags without travelling far or paying too much.
          </p>
          <p style={{ marginBottom: '16px' }}>
            We stock a wide variety of bags including Nigerian bags, gift bags, non-woven bags, tote bags and many more. All our products are carefully selected for quality and durability.
          </p>
          <p>
            We serve customers across Kenya with fast delivery and accept M-Pesa payments for your convenience. Your satisfaction is our happiness — that's what HappyBags is all about!
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '20px' }}>Why Choose HappyBags?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { icon: ShoppingBag, color: '#2563eb', bg: '#eff6ff', title: 'Wide Selection', desc: 'Nigerian bags, gift bags, non-woven bags and much more' },
            { icon: Truck,       color: '#16a34a', bg: '#f0fdf4', title: 'Fast Delivery',  desc: 'We deliver across all 47 counties in Kenya' },
            { icon: Shield,      color: '#7c3aed', bg: '#f5f3ff', title: 'Secure Payment', desc: 'Pay safely with M-Pesa — Kenya\'s most trusted payment' },
            { icon: Heart,       color: '#dc2626', bg: '#fef2f2', title: 'Quality Products', desc: 'Every bag is checked for quality before we sell it' },
            { icon: Star,        color: '#d97706', bg: '#fffbeb', title: 'Best Prices',    desc: 'Affordable prices that fit every budget' },
            { icon: MessageCircle, color: '#0891b2', bg: '#ecfeff', title: '24/7 Support',  desc: 'Chat with us on WhatsApp anytime you need help' },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} style={{
              background: '#fff', borderRadius: '14px', padding: '20px',
              border: '1px solid #e2e8f0', textAlign: 'center',
            }}>
              <div style={{
                width: '48px', height: '48px', background: bg,
                borderRadius: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 12px',
              }}>
                <Icon size={22} color={color} />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>{title}</h3>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '20px' }}>Contact Us</h2>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {[
            { icon: Phone,   color: '#16a34a', label: 'Phone / WhatsApp', value: '+254 716 670 629', href: 'tel:+254716670629' },
            { icon: Mail,    color: '#2563eb', label: 'website',            value: 'www.happybags.co.ke', href: 'https://www.happybags.co.ke' },
            { icon: MapPin,  color: '#dc2626', label: 'Location',         value: 'Nairobi, Kenya', href: null },
            { icon: MessageCircle, color: '#25D366', label: 'WhatsApp',   value: 'Chat with us now', href: 'https://wa.me/254716670629' },
          ].map(({ icon: Icon, color, label, value, href }, i, arr) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px 20px',
              borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: color + '15', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{label}</p>
                {href ? (
                  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                    style={{ fontSize: '14px', fontWeight: 500, color: color, textDecoration: 'none' }}>
                    {value}
                  </a>
                ) : (
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        borderRadius: '20px', padding: '32px', textAlign: 'center', color: '#fff',
      }}>
        <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Ready to Shop?</h3>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px', fontSize: '14px' }}>
          Browse our collection of bags and get yours delivered today!
        </p>
        <Link to="/products" style={{
          display: 'inline-block', background: '#fff', color: '#1e40af',
          fontWeight: 700, padding: '12px 32px', borderRadius: '12px',
          textDecoration: 'none', fontSize: '14px',
        }}>
          Shop Now 🛍️
        </Link>
      </div>

    </div>
  )
}