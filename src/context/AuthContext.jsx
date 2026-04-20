import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      setProfile(data)
      return data
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Always stop loading after 1.5 seconds no matter what
    const hardTimeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 1500)

    // Get session immediately on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      clearTimeout(hardTimeout)
      setUser(session?.user ?? null)
      if (session?.user) {
        // Fetch profile in background — don't block page load
        fetchProfile(session.user.id)
      }
      setLoading(false)
    }).catch(() => {
      if (mounted) setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      // Only handle these specific events
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setUser(session?.user ?? null)
        if (session?.user && event === 'SIGNED_IN') {
          fetchProfile(session.user.id)
        }
        setLoading(false)
        return
      }

      // INITIAL_SESSION — already handled by getSession above
      setLoading(false)
    })

    // Auto refresh every 50 minutes
    const refreshInterval = setInterval(async () => {
      if (!mounted) return
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) await supabase.auth.refreshSession()
      } catch {}
    }, 50 * 60 * 1000)

    return () => {
      mounted = false
      clearTimeout(hardTimeout)
      clearInterval(refreshInterval)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const isAdmin    = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isLoggedIn = !!user

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isLoggedIn, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}