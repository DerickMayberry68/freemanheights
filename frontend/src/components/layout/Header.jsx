import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/AuthContext'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/livestream', label: 'Livestream' },
  { to: '/ministries', label: 'Ministries' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/staff', label: 'Our Staff' },
  { to: '/give', label: 'Give' },
  { to: '/explore', label: 'Explore' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { session, signOut } = useAuth()

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-3">
            <img
              src="/images/rustynailsforme.png"
              alt=""
              className="h-12 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <span className="text-xl font-bold text-primary">Freeman Heights</span>
            <span className="text-sm text-secondary-light hidden sm:inline">Baptist Church</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link to="/admin" className="text-sm font-medium text-primary hover:underline">
              Admin
            </Link>
            {session && (
              <button
                type="button"
                onClick={() => signOut()}
                className="text-sm font-medium text-secondary hover:text-primary transition-colors flex items-center gap-1"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Sign out
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-secondary hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" />
        <DialogPanel className="fixed inset-y-0 right-0 w-full max-w-sm bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <span className="font-bold text-primary">Menu</span>
            <button
              type="button"
              className="p-2 rounded-lg text-secondary hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-base font-medium text-secondary hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/admin"
              className="text-base font-medium text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
            {session && (
              <button
                type="button"
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="text-base font-medium text-secondary hover:text-primary text-left flex items-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Sign out
              </button>
            )}
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}
