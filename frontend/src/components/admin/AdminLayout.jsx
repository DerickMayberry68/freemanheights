import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'

const adminNav = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/sermons', label: 'Sermons' },
  { to: '/admin/ministries', label: 'Ministries' },
]

export default function AdminLayout({ children }) {
  const location = useLocation()

  return (
    <div className="flex min-h-[60vh]">
      <aside className="w-64 bg-secondary-dark text-white p-6 flex flex-col">
        <h2 className="text-lg font-bold text-primary mb-6">Admin</h2>
        <nav className="space-y-2">
          {adminNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                location.pathname === item.to
                  ? 'bg-primary text-secondary-dark'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/"
          className="mt-auto text-sm text-gray-400 hover:text-white"
        >
          ← Back to Site
        </Link>
      </aside>
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  )
}
