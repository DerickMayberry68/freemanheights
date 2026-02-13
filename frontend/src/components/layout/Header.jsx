import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon, HandRaisedIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/AuthContext'
import PrayerRequestModal from '../prayer/PrayerRequestModal'

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
  const [prayerModalOpen, setPrayerModalOpen] = useState(false)
  const { session, signOut } = useAuth()
  const location = useLocation()

  return (
    <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-primary/10">
      <div className="h-1 bg-gradient-to-r from-primary-dark via-primary to-primary-light" />
      <nav className="w-full px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/images/redCross.png"
              alt=""
              className="h-11 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div className="flex flex-col">
              <span className="text-lg font-serif font-bold text-secondary-dark leading-tight group-hover:text-primary transition-colors">Freeman Heights</span>
              <span className="text-xs font-medium text-secondary-light tracking-wider uppercase hidden sm:block">Baptist Church</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to))
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-primary bg-primary-50'
                      : 'text-secondary hover:text-primary hover:bg-primary-50/50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="w-px h-6 bg-primary/15 mx-2" />
            <button
              type="button"
              onClick={() => setPrayerModalOpen(true)}
              className="px-3 py-2 text-sm font-medium text-primary hover:bg-primary-50 rounded-md transition-colors flex items-center gap-1.5"
            >
              <HandRaisedIcon className="h-4 w-4" />
              Prayer Request
            </button>
            <div className="w-px h-6 bg-primary/15 mx-2" />
            <Link
              to="/admin"
              className="px-3 py-2 text-sm font-medium text-accent hover:text-primary rounded-md transition-colors"
            >
              Admin
            </Link>
            {session && (
              <button
                type="button"
                onClick={() => signOut()}
                className="ml-1 px-3 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors flex items-center gap-1.5 rounded-md"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Sign out
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-secondary hover:bg-primary-50 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="relative z-50">
        <div className="fixed inset-0 bg-secondary-dark/20 backdrop-blur-sm" />
        <DialogPanel className="fixed inset-y-0 right-0 w-full max-w-sm bg-cream shadow-xl">
          <div className="h-1 bg-gradient-to-r from-primary-dark via-primary to-primary-light" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <span className="font-serif font-bold text-secondary-dark text-lg">Menu</span>
              <button
                type="button"
                className="p-2 rounded-lg text-secondary hover:bg-primary-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to))
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-primary bg-primary-50'
                        : 'text-secondary hover:text-primary hover:bg-primary-50/50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="h-px bg-primary/10 my-3" />
              <button
                type="button"
                onClick={() => { setPrayerModalOpen(true); setMobileMenuOpen(false); }}
                className="px-4 py-3 text-base font-medium text-primary hover:bg-primary-50 rounded-lg transition-colors text-left flex items-center gap-2 w-full"
              >
                <HandRaisedIcon className="h-5 w-5" />
                Prayer Request
              </button>
              <div className="h-px bg-primary/10 my-3" />
              <Link
                to="/admin"
                className="px-4 py-3 text-base font-medium text-accent hover:text-primary rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
              {session && (
                <button
                  type="button"
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="px-4 py-3 text-base font-medium text-secondary hover:text-primary text-left flex items-center gap-2 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Sign out
                </button>
              )}
            </div>
          </div>
        </DialogPanel>
      </Dialog>

      <PrayerRequestModal
        isOpen={prayerModalOpen}
        onClose={() => setPrayerModalOpen(false)}
      />
    </header>
  )
}
