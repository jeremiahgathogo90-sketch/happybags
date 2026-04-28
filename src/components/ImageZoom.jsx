import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

export default function ImageZoom({ images = [], alt = '' }) {
  const [activeIdx, setActiveIdx]     = useState(0)
  const [lightbox, setLightbox]       = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [zoomed, setZoomed]           = useState(false)
  const [pos, setPos]                 = useState({ x: 50, y: 50 })
  const [hovered, setHovered]         = useState(false)

  const allImages = images.filter(Boolean)

  if (allImages.length === 0) return (
    <div style={{ background: '#dde6f5', borderRadius: '16px', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
      No image
    </div>
  )

  useEffect(() => {
    if (!lightbox) return
    function onKey(e) {
      if (e.key === 'Escape')     { setLightbox(false); setZoomed(false) }
      if (e.key === 'ArrowRight') setLightboxIdx(i => (i + 1) % allImages.length)
      if (e.key === 'ArrowLeft')  setLightboxIdx(i => (i - 1 + allImages.length) % allImages.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, allImages.length])

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  function openLightbox(idx) {
    setLightboxIdx(idx)
    setZoomed(false)
    setLightbox(true)
  }

  function handleMouseMove(e) {
    if (!zoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPos({ x, y })
  }

  return (
    <>
      <div>
        {/* Main image — cover + zoom on hover */}
        <div
          onClick={() => openLightbox(activeIdx)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            borderRadius: '16px',
            aspectRatio: '1 / 1',
            cursor: 'zoom-in',
            position: 'relative',
            overflow: 'hidden',
            background: '#f1f5f9',
            boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.18)' : '0 2px 12px rgba(0,0,0,0.08)',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          <img
            src={allImages[activeIdx]}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',          // fills whole card
              objectPosition: 'center',
              display: 'block',
              transform: hovered ? 'scale(1.07)' : 'scale(1)',  // zoom on hover
              transition: 'transform 0.4s ease',
            }}
            onError={e => { e.target.style.display = 'none' }}
          />

          {/* Zoom hint */}
          <div style={{
            position: 'absolute', bottom: '12px', right: '12px',
            background: 'rgba(0,0,0,0.45)', color: '#fff',
            borderRadius: '8px', padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', backdropFilter: 'blur(4px)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}>
            <ZoomIn size={12} /> Click to zoom
          </div>
        </div>

        {/* Thumbnails — also cover */}
        {allImages.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  flexShrink: 0,
                  width: '68px',
                  height: '68px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: i === activeIdx ? '2.5px solid #2563eb' : '2px solid #e2e8f0',
                  background: '#f1f5f9',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, transform 0.15s',
                  transform: i === activeIdx ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (i !== activeIdx) e.currentTarget.style.borderColor = '#93c5fd' }}
                onMouseLeave={e => { if (i !== activeIdx) e.currentTarget.style.borderColor = '#e2e8f0' }}
              >
                <img
                  src={img}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',      // thumbnails also cover
                    objectPosition: 'center',
                    display: 'block',
                  }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => { if (!zoomed) setLightbox(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* Close */}
          <button
            onClick={() => { setLightbox(false); setZoomed(false) }}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)', zIndex: 10,
            }}
          >
            <X size={20} />
          </button>

          {/* Counter */}
          {allImages.length > 1 && (
            <div style={{
              position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              borderRadius: '20px', padding: '4px 14px', fontSize: '13px',
              backdropFilter: 'blur(4px)',
            }}>
              {lightboxIdx + 1} / {allImages.length}
            </div>
          )}

          {/* Prev */}
          {allImages.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + allImages.length) % allImages.length); setZoomed(false) }}
              style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)', zIndex: 10,
              }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Next */}
          {allImages.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % allImages.length); setZoomed(false) }}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)', zIndex: 10,
              }}
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Zoom image */}
          <div
            onClick={e => { e.stopPropagation(); setZoomed(z => !z) }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { if (zoomed) setPos({ x: 50, y: 50 }) }}
            style={{
              position: 'relative',
              maxWidth: '90vw', maxHeight: '85vh',
              cursor: zoomed ? 'zoom-out' : 'zoom-in',
              overflow: zoomed ? 'hidden' : 'visible',
              borderRadius: '12px',
              width: zoomed ? '80vw' : 'auto',
              height: zoomed ? '80vh' : 'auto',
            }}
          >
            <img
              src={allImages[lightboxIdx]}
              alt={alt}
              style={{
                display: 'block',
                maxWidth: zoomed ? 'none' : '90vw',
                maxHeight: zoomed ? 'none' : '85vh',
                width: zoomed ? '200%' : 'auto',
                height: zoomed ? '200%' : 'auto',
                objectFit: 'contain',
                borderRadius: zoomed ? '0' : '12px',
                transformOrigin: zoomed ? pos.x + '% ' + pos.y + '%' : 'center',
                transition: zoomed ? 'none' : 'all 0.3s ease',
                position: zoomed ? 'absolute' : 'relative',
                top: zoomed ? (-pos.y) + '%' : 'auto',
                left: zoomed ? (-pos.x) + '%' : 'auto',
                userSelect: 'none',
              }}
              onError={e => { e.target.style.display = 'none' }}
              draggable={false}
            />
          </div>

          <div style={{
            position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.6)', fontSize: '12px', textAlign: 'center',
          }}>
            {zoomed ? 'Move mouse to pan · Click to zoom out' : 'Click image to zoom in · Arrow keys to navigate'}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div style={{
              position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '8px',
            }}>
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIdx(i); setZoomed(false) }}
                  style={{
                    width: '52px', height: '52px', borderRadius: '8px',
                    overflow: 'hidden',
                    border: i === lightboxIdx ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                    background: '#1e293b', padding: 0, cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}