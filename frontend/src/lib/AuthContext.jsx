import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approved, setApproved] = useState(null)
  const [approvalLoading, setApprovalLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setApproved(null)
    })
    return () => subscription?.unsubscribe()
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

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async (email, password, options = {}) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshApproval = () => fetchApproval()

  const value = {
    session,
    loading,
    approved, // true | false | null (null = not yet checked)
    approvalLoading,
    signIn,
    signUp,
    signOut,
    user: session?.user,
    refreshApproval,
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
