import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ParentRegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const redirect = searchParams.get('redirect') || '/calendar'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const emailRedirectTo = `${window.location.origin}/login?redirect=${encodeURIComponent(redirect)}&email_verified=1`
      const { session } = await signUp(email, password, {
        emailRedirectTo,
        data: { account_type: 'parent' },
      })
      if (session) {
        navigate(redirect)
        return
      }
      setSuccess('Account created. Check your email, verify your address, then sign in to continue registration.')
    } catch (err) {
      setError(err.message || 'Account creation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-14 px-4 bg-cream-dark/30">
      <div className="w-full max-w-md bg-white rounded-lg border border-primary/10 p-8">
        <h1 className="text-2xl font-serif font-bold text-secondary-dark">Create Parent Account</h1>
        <p className="text-sm text-secondary-light mt-2 mb-6">
          Use this account to register your children for Freeman Heights events.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          {success && <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>}
          <div>
            <label htmlFor="parent-email" className="block text-sm font-medium text-secondary-dark mb-1">Email</label>
            <input id="parent-email" type="email" required autoComplete="email" value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream" />
          </div>
          <div>
            <label htmlFor="parent-password" className="block text-sm font-medium text-secondary-dark mb-1">Password</label>
            <input id="parent-password" type="password" required autoComplete="new-password" value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream" />
          </div>
          <div>
            <label htmlFor="parent-confirm-password" className="block text-sm font-medium text-secondary-dark mb-1">Confirm password</label>
            <input id="parent-confirm-password" type="password" required autoComplete="new-password" value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-secondary-light">
          Already have an account?{' '}
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
