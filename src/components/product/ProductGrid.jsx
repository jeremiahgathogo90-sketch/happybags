import { useState, useEffect } from 'react'

export default function ProductGrid({ children, max = 10 }) {
  const [cols, setCols] = useState(2)

  useEffect(() => {
    function updateCols() {
      const w = window.innerWidth
      if (w >= 1280) setCols(5)
      else if (w >= 1024) setCols(4)
      else if (w >= 640) setCols(3)
      else setCols(2)
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [])

  const items = Array.isArray(children) ? children.slice(0, max) : children

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: cols === 2 ? '10px' : '14px',
    }}>
      {items}
    </div>
  )
}