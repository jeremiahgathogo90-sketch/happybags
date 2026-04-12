import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useProducts({ categorySlug, search, featured, limit = 20, sort = 'created_at' } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      let q = supabase
        .from('products')
        .select('id, name, slug, price, original_price, thumbnail, images, rating_avg, rating_count, stock_qty, is_featured')
        .eq('is_active', true)
        .limit(limit)

      if (featured) q = q.eq('is_featured', true)
      if (sort === 'price_asc')    q = q.order('price', { ascending: true })
      else if (sort === 'price_desc') q = q.order('price', { ascending: false })
      else if (sort === 'popular') q = q.order('sold_count', { ascending: false })
      else                         q = q.order('created_at', { ascending: false })

      const { data } = await q
      setProducts(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [categorySlug, search, featured, limit, sort])

  return { products, loading }
}
