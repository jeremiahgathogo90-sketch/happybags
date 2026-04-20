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
    } catch (err) {
      console.error('fetchProfile error:', err)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Hard timeout — no matter what, stop loading after 2 seconds
    const hardTimeout = setTimeout(() => {
      if (mounted) {
        console.log('Auth hard timeout fired')
        setLoading(false)
      }
    }, 5000)

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
      } catch (err) {
        console.error('initAuth error:', err)
      } finally {
        if (mounted) {
          clearTimeout(hardTimeout)
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      console.log('Auth event:', event)

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null)
        setLoading(false)
        return
      }

      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    // Auto refresh session every 50 minutes
    const refreshInterval = setInterval(async () => {
      if (!mounted) return
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) await supabase.auth.refreshSession()
      } catch (err) {
        console.error('Session refresh error:', err)
      }
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
    setProfile(null)
    setUser(null)
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