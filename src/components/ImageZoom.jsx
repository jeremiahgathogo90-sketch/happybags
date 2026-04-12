import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

export default function ImageZoom({ images = [], alt = '' }) {
  const [activeIdx, setActiveIdx]   = useState(0)
  const [lightbox, setLightbox]     = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [zoomed, setZoomed]         = useState(false)
  const [pos, setPos]               = useState({ x: 50, y: 50 })

  const allImages = images.filter(Boolean)
  if (allImages.length === 0) return (
    <div style={{ background: '#dde6f5', borderRadius: '16px', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
      No image
    </div>
  )

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightbox) return
    function onKey(e) {
      if (e.key === 'Escape')      { setLightbox(false); setZoomed(false) }
      if (e.key === 'ArrowRight')  setLightboxIdx(i => (i + 1) % allImages.length)
      if (e.key === 'ArrowLeft')   setLightboxIdx(i => (i - 1 + allImages.length) % allImages.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, allImages.length])

  // Prevent body scroll when lightbox open
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
      {/* Main image display */}
      <div>
        {/* Primary image */}
        <div
          onClick={() => openLightbox(activeIdx)}
          style={{
            background: '#dde6f5',
            borderRadius: '16px',
            aspectRatio: '1 / 1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-in',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <img
            src={allImages[activeIdx]}
            alt={alt}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '10px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              background: '#fff',
              display: 'block',
              transition: 'transform 0.3s ease',
            }}
            onError={e => { e.target.style.display = 'none' }}
          />
          {/* Zoom hint */}
          <div style={{
            position: 'absolute', bottom: '12px', right: '12px',
            background: 'rgba(0,0,0,0.45)', color: '#fff',
            borderRadius: '8px', padding: '4px 8px',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', backdropFilter: 'blur(4px)',
          }}>
            <ZoomIn size={12} /> Click to zoom
          </div>
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  flexShrink: 0,
                  width: '64px',
                  height: '64px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: i === activeIdx ? '2px solid #2563eb' : '2px solid transparent',
                  background: '#dde6f5',
                  padding: '4px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <img
                  src={img}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px', background: '#fff' }}
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
          onClick={() => { if (!zoomed) { setLightbox(false) } }}
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
              color: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)', zIndex: 10,
              fontSize: '18px',
            }}
          >
            <X size={20} />
          </button>

          {/* Image counter */}
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

          {/* Prev arrow */}
          {allImages.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + allImages.length) % allImages.length); setZoomed(false) }}
              style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)', zIndex: 10,
              }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Next arrow */}
          {allImages.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % allImages.length); setZoomed(false) }}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
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
              maxWidth: '90vw',
              maxHeight: '85vh',
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

          {/* Zoom tip */}
          <div style={{
            position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.6)', fontSize: '12px', textAlign: 'center',
          }}>
            {zoomed ? 'Move mouse to pan · Click to zoom out' : 'Click image to zoom in · Arrow keys to navigate'}
          </div>

          {/* Thumbnail strip at bottom */}
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
                    width: '48px', height: '48px', borderRadius: '8px',
                    overflow: 'hidden', border: i === lightboxIdx ? '2px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                    background: '#1e293b', padding: '2px', cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}