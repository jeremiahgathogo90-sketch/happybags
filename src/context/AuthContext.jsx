import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    // Timeout so loading never hangs forever on Chrome
    const timeout = setTimeout(() => setLoading(false), 3000)

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      setUser(session?.user ?? null)
      if (session?.user) await fetchProfile(session.user.id)
      setLoading(false)
    })

    // Listen for auth changes — handles token refresh, sign in, sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      clearTimeout(timeout)
      console.log('Auth event:', event)

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        // Token refreshed — update user but don't reload profile
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

    // Auto refresh session every 50 minutes to prevent expiry
    const refreshInterval = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Session refresh error:', error)
        return
      }
      if (session) {
        await supabase.auth.refreshSession()
        console.log('Session refreshed at', new Date().toLocaleTimeString())
      }
    }, 50 * 60 * 1000) // every 50 minutes

    return () => {
      clearTimeout(timeout)
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