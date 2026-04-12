import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtime(table, onUpdate) {
  useEffect(() => {
    const channel = supabase
      .channel(table + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onUpdate()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table])
}
