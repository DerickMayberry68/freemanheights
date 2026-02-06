import { Link } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/livestream', label: 'Livestream' },
  { to: '/ministries', label: 'Ministries' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/staff', label: 'Our Staff' },
  { to: '/give', label: 'Give' },
  { to: '/explore', label: 'Explore' },
]

export default function Navigation() {
  return (
    <nav className="flex gap-8">
      {navLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="text-sm font-medium text-secondary hover:text-primary transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
