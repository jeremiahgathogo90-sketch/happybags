import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useActiveFlashSale() {
  const [sale, setSale] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const now = new Date().toISOString()
      const { data: saleData } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .limit(1)
        .maybeSingle()

      if (!saleData) { setLoading(false); return }
      setSale(saleData)

      const { data: itemsData } = await supabase
        .from('flash_sale_items')
        .select('*, product:products(id, name, slug, price, thumbnail, stock_qty, rating_avg, rating_count)')
        .eq('flash_sale_id', saleData.id)
        .limit(12)

      setItems(itemsData ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  return { sale, items, loading }
}
