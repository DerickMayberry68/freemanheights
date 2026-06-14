import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ApplicantRegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const redirect = searchParams.get('redirect') || '/opportunities'
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      const emailRedirectTo = `${window.location.origin}/opportunities/login?redirect=${encodeURIComponent(redirect)}&email_verified=1`
      const { session } = await signUp(form.email, form.password, {
        emailRedirectTo,
        data: { account_type: 'applicant' },
      })
      if (session) navigate(redirect)
      else setSuccess('Account created. Check your email, verify your address, then sign in to continue.')
    } catch (err) {
      setError(err.message || 'Account creation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[65vh] bg-cream-dark/30 px-4 py-14">
      <div className="mx-auto max-w-md rounded-lg border border-primary/10 bg-white p-8">
        <h1 className="font-serif text-3xl font-bold text-secondary-dark">Create applicant account</h1>
        <p className="mt-2 text-sm leading-6 text-secondary-light">Use this account to apply and return to see your application status.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}
          <label className="block text-sm font-semibold text-secondary-dark">Email
            <input type="email" required autoComplete="email" value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-semibold text-secondary-dark">Password
            <input type="password" required autoComplete="new-password" value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
          </label>
          <label className="block text-sm font-semibold text-secondary-dark">Confirm password
            <input type="password" required autoComplete="new-password" value={form.confirmPassword}
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
          </label>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-secondary-light">
          Already have an account? <Link to={`/opportunities/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
