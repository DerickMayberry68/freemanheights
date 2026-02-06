import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
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
      const { user } = await signUp(email, password)
      if (user?.id) {
        await supabase.rpc('ensure_approval_exists', { p_user_id: user.id, p_email: email }).catch(() => {})
      }
      setSuccess('Account created! Your access is pending approval from an existing admin. You can sign in to see your status.')
      setTimeout(() => navigate('/login?redirect=/admin'), 3000)
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-14 px-4 bg-cream-dark/30">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-primary/10 p-8">
          <h1 className="text-2xl font-serif font-bold text-secondary-dark mb-2">Create Admin Account</h1>
          <p className="text-secondary-light text-sm mb-6">Register to access the admin area.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-dark mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-dark mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <p className="text-xs text-secondary-light mt-1">At least 6 characters</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-dark mb-1">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-secondary-light">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:text-primary-dark transition-colors">
              Sign in
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center">
          <Link to="/" className="text-sm text-secondary-light hover:text-primary transition-colors">&larr; Back to site</Link>
        </p>
      </div>
    </div>
  )
}
