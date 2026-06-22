import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

const adminNavGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard' },
    ],
  },
  {
    label: 'People & Access',
    items: [
      { to: '/admin/approvals', label: 'Approvals' },
      { to: '/admin/login-history', label: 'Login History' },
      { to: '/admin/profile', label: 'Profile Settings' },
    ],
  },
  {
    label: 'Connections',
    items: [
      { to: '/admin/connections', label: 'Connections' },
    ],
  },
  {
    label: 'Church Content',
    items: [
      { to: '/admin/events', label: 'Events' },
      { to: '/admin/sermons', label: 'Sermons' },
      { to: '/admin/ministries', label: 'Ministries' },
      { to: '/admin/staff', label: 'Staff' },
      { to: '/admin/bible-verses', label: 'Bible Verses' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/registrations', label: 'Registrations' },
      { to: '/admin/opportunities', label: 'Opportunities' },
      { to: '/admin/applications', label: 'Applications' },
      { to: '/admin/prayer-requests', label: 'Prayer Requests' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/admin/ai-assistant', label: 'AI Bible Assistant' },
    ],
  },
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
        <nav className="space-y-5">
          {adminNavGroups.map((group) => (
            <div key={group.label}>
              <p className="px-4 text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
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
              </div>
            </div>
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
            Back to Site
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  )
}
