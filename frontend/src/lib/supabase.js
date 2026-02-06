import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Mock that returns empty data when env vars are missing (prevents crash; add env vars in Vercel for real data)
const emptyChain = () => ({
  select: () => emptyChain(),
  eq: () => emptyChain(),
  gte: () => emptyChain(),
  lte: () => emptyChain(),
  or: () => emptyChain(),
  order: () => emptyChain(),
  limit: () => emptyChain(),
  then: (cb) => Promise.resolve(cb({ data: [], error: null })),
})
const mockSupabase = {
  from: (table) => ({
    ...emptyChain(),
    insert: () => ({ then: (cb) => cb({ error: { message: 'Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.' } }) }),
  }),
  auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase
