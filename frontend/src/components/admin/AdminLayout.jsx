import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

const adminNav = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/approvals', label: 'Approvals' },
  { to: '/admin/login-history', label: 'Login History' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/registrations', label: 'Registrations' },
  { to: '/admin/connections', label: 'Connections' },
  { to: '/admin/sermons', label: 'Sermons' },
  { to: '/admin/ministries', label: 'Ministries' },
  { to: '/admin/staff', label: 'Staff' },
  { to: '/admin/bible-verses', label: 'Bible Verses' },
  { to: '/admin/ai-assistant', label: 'AI Bible Assistant' },
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-[60vh]">
      <aside className="w-64 bg-secondary-dark text-white p-6 flex flex-col">
        <h2 className="text-lg font-bold text-white mb-6">Admin</h2>
        {user?.email && (
          <p className="text-xs text-gray-400 mb-4 truncate" title={user.email}>{user.email}</p>
        )}
        <nav className="space-y-2">
          {adminNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                location.pathname === item.to
                  ? 'bg-primary text-white font-semibold'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Sign out
          </button>
          <Link
            to="/"
            className="block text-sm text-gray-400 hover:text-white"
          >
            ← Back to Site
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  )
}
