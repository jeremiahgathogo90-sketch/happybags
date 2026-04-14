import { useState, useEffect } from 'react'

export default function ProductGrid({ children, mobileMax = 4 }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 640) }
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Convert children to array and filter nulls
  const allItems = Array.isArray(children)
    ? children.flat().filter(Boolean)
    : children ? [children] : []

  // On mobile limit to mobileMax, on desktop show all
  const visibleItems = isMobile ? allItems.slice(0, mobileMax) : allItems

  const cols = (() => {
    const w = window.innerWidth
    if (w >= 1280) return 5
    if (w >= 1024) return 4
    if (w >= 640)  return 3
    return 2
  })()

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