import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approved, setApproved] = useState(null)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [userPreferences, setUserPreferences] = useState(null)
  const [preferencesLoading, setPreferencesLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return
      setSession(s)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession((prevSession) => {
        const prevUserId = prevSession?.user?.id
        const nextUserId = newSession?.user?.id

        // Only reset approval if user actually changed (logged out/in), not on token refresh.
        if (prevUserId !== nextUserId) {
          setApproved(null)
          setUserPreferences(null)
        }

        return newSession
      })
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const fetchApproval = async () => {
    const { data: { session: s } } = await supabase.auth.getSession()
    if (!s?.user?.id) {
      setApproved(null)
      setApprovalLoading(false)
      return
    }
    setApprovalLoading(true)
    let done = false
    const timeout = setTimeout(() => {
      if (done) return
      done = true
      setApproved(false)
      setApprovalLoading(false)
    }, 8000)
    try {
      const { data, error } = await supabase.rpc('get_my_approval')
      if (done) return
      done = true
      setApproved(error ? false : Boolean(data))
    } catch {
      if (!done) {
        done = true
        setApproved(false)
      }
    } finally {
      clearTimeout(timeout)
      setApprovalLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.user?.id) {
      setApproved(null)
      return
    }
    const t = setTimeout(() => fetchApproval(), 100)
    return () => clearTimeout(t)
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) return undefined

    const refreshAccess = () => {
      if (document.visibilityState === 'visible') {
        void fetchApproval()
      }
    }
    const intervalId = setInterval(refreshAccess, 30000)
    window.addEventListener('focus', refreshAccess)
    document.addEventListener('visibilitychange', refreshAccess)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', refreshAccess)
      document.removeEventListener('visibilitychange', refreshAccess)
    }
  }, [session?.user?.id])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    try {
      const { data: hasAccess, error: approvalError } = await supabase.rpc('get_my_approval')
      if (!approvalError && hasAccess) {
        const { error: logError } = await supabase.functions.invoke('admin-user-access', {
          body: { action: 'record-login' },
        })
        if (logError) {
          console.warn('Admin login logging failed:', logError.message)
        }
      }
    } catch (logError) {
      console.warn('Admin login logging failed:', logError)
    }

    return data
  }

  const signUp = async (email, password, options = {}) => {
    const emailRedirectTo =
      options?.emailRedirectTo ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}/login?redirect=${encodeURIComponent('/admin')}&email_verified=1`
        : undefined)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...options,
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const fetchUserPreferences = async () => {
    const { data: { session: s } } = await supabase.auth.getSession()
    if (!s?.user?.id) {
      setUserPreferences(null)
      setPreferencesLoading(false)
      return
    }
    setPreferencesLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', s.user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error fetching user preferences:', error)
        setUserPreferences({ preferred_bible_translation: 'KJV' })
      } else if (data) {
        setUserPreferences(data)
      } else {
        // No preferences found, use defaults
        setUserPreferences({ preferred_bible_translation: 'KJV' })
      }
    } catch (err) {
      console.error('Error fetching user preferences:', err)
      setUserPreferences({ preferred_bible_translation: 'KJV' })
    } finally {
      setPreferencesLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.user?.id) {
      setUserPreferences(null)
      return
    }
    const t = setTimeout(() => fetchUserPreferences(), 100)
    return () => clearTimeout(t)
  }, [session?.user?.id])

  const refreshApproval = () => fetchApproval()
  const refreshUserPreferences = () => fetchUserPreferences()

  const value = {
    session,
    loading,
    approved, // true | false | null (null = not yet checked)
    approvalLoading,
    userPreferences,
    preferencesLoading,
    signIn,
    signUp,
    signOut,
    user: session?.user,
    refreshApproval,
    refreshUserPreferences,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
