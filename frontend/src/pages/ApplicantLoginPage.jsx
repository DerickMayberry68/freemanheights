import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ApplicantLoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const redirect = searchParams.get('redirect') || '/my-applications'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err.message?.toLowerCase().includes('email not confirmed')
        ? 'Please verify your email before signing in.'
        : err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[65vh] bg-cream-dark/30 px-4 py-14">
      <div className="mx-auto max-w-md rounded-lg border border-primary/10 bg-white p-8">
        <h1 className="font-serif text-3xl font-bold text-secondary-dark">Applicant sign in</h1>
        <p className="mt-2 text-sm text-secondary-light">Continue an application or review your status.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {searchParams.get('email_verified') === '1' && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">Email verified. You can sign in now.</div>}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <label className="block text-sm font-semibold text-secondary-dark">Email
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-semibold text-secondary-dark">Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
          </label>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-secondary-light">
          Need an account? <Link to={`/opportunities/register?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
