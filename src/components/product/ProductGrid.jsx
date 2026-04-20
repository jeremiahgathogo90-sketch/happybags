import { useState, useEffect } from 'react'

export default function ProductGrid({ children, mobileMax = null }) {
  const [cols, setCols] = useState(2)

  useEffect(() => {
    function updateCols() {
      const w = window.innerWidth
      if (w >= 1280) setCols(5)
      else if (w >= 1024) setCols(4)
      else if (w >= 640)  setCols(3)
      else setCols(2)
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [])

  const allItems = Array.isArray(children)
    ? children.flat().filter(Boolean)
    : children ? [children] : []

  // Only limit on mobile if mobileMax is explicitly passed
  const isMobile     = cols === 2
  const visibleItems = (mobileMax && isMobile)
    ? allItems.slice(0, mobileMax)
    : allItems

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: isMobile ? '10px' : '14px',
    }}>
      {visibleItems}
    </div>
  )
}