import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey) : null

const AuthContext = createContext({})

function withTimeout(promise, timeoutMs, timeoutMessage) {
  const ms = Number(timeoutMs) || 0
  if (ms <= 0) return promise

  let timerId
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(timeoutMessage || `Timeout after ${ms}ms`))
    }, ms)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timerId) clearTimeout(timerId)
  })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  const isAdminEmail = (email) => {
    const configured = String(import.meta.env.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
    const e = String(email || '').toLowerCase()
    if (!e) return false
    return configured.length > 0 ? configured.includes(e) : e === 'contact@faketect.com'
  }

  const clearLocalAuthState = () => {
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const clearSupabaseStorage = () => {
    try {
      const storages = [window?.localStorage, window?.sessionStorage].filter(Boolean)
      for (const storage of storages) {
        const keys = []
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i)
          if (k) keys.push(k)
        }
        for (const k of keys) {
          // Supabase v2 default: sb-<project-ref>-auth-token
          if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
            storage.removeItem(k)
          }
        }
      }
    } catch {}
  }

  useEffect(() => {
    if (!supabase) { 
      console.log('⚠️ Supabase not configured')
      setLoading(false)
      return 
    }

    // Avoid infinite loading if Supabase hangs (client/network/extension issues).
    withTimeout(
      supabase.auth.getSession(),
      8000,
      'Supabase getSession timeout'
    )
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Supabase session error:', error)
          setLoading(false)
          return
        }
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id, session.user.email)
        setLoading(false)
      })
      .catch(err => {
        // Covers network issues and timeouts.
        console.warn('Supabase connection issue:', err)
        clearLocalAuthState()
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // Don't block auth updates on profile fetch.
        fetchProfile(session.user.id, session.user.email)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId, email) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) {
        console.error('Error fetching profile:', error)
        return
      }
      if (isAdminEmail(email)) {
        setProfile({
          ...(data || {}),
          plan: 'enterprise',
          analyses_limit: 1000000,
          role: 'admin'
        })
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
    }
  }

  const signUp = async (email, password, fullName) => {
    return supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
  }

  const signIn = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signInWithOAuth = async (provider) => {
    return supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } })
  }

  const signOut = async () => {
    // Always clear local UI state immediately, even if Supabase is slow or blocked.
    clearLocalAuthState()
    clearSupabaseStorage()

    try {
      // Prefer local sign-out to avoid network hangs.
      const { error } = await withTimeout(
        supabase.auth.signOut({ scope: 'local' }),
        4000,
        'Supabase signOut timeout'
      )
      return { error }
    } catch (err) {
      // Best-effort: we already cleared local state.
      console.warn('Supabase signOut issue:', err)
      return { error: err }
    }
  }

  const getAccessToken = () => session?.access_token

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, signUp, signIn, signInWithOAuth, signOut,
      getAccessToken, isAuthenticated: !!user, supabase
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
