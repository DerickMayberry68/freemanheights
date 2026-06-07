import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'

export default function ProtectedRoute({ children }) {
  const {
    session,
    loading,
    approved,
    approvalLoading,
    sessionExpired,
    refreshApproval,
    signOut,
  } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-secondary-light">Loading...</p>
      </div>
    )
  }

  if (!session) {
    const reason = sessionExpired ? '&reason=session_expired' : ''
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}${reason}`}
        state={{ from: location }}
        replace
      />
    )
  }

  if (approvalLoading || approved === null) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-secondary-light">Checking access...</p>
      </div>
    )
  }

  if (!approved) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-secondary-dark mb-2">Pending approval</h2>
          <p className="text-secondary-light mb-6">
            Your account has been created. An existing admin must approve your access before you can use the admin area.
          </p>
          <p className="text-sm text-secondary-light mb-4">
            You can <Link to="/" className="text-primary hover:underline">return to the site</Link> or sign out and try again later.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => refreshApproval()}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-secondary-dark font-medium rounded-lg"
            >
              Check again
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-4 py-2 border border-gray-300 text-secondary hover:bg-gray-50 font-medium rounded-lg"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
