import { Link } from 'react-router-dom'
import { HeartIcon } from '@heroicons/react/24/solid'
import { CHURCH } from '../../lib/constants'

const socialLinks = [
  { name: 'Facebook', href: 'https://www.facebook.com/fhbaptist/', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { name: 'Instagram', href: 'https://www.instagram.com/fhbaptist', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
  { name: 'Spotify', href: 'https://open.spotify.com/playlist/009coFfvwrGkf7ieiEPOYG', icon: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' },
]

const quickLinks = [
  { to: '/livestream', label: 'Livestream' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/give', label: 'Give' },
  { to: '/staff', label: 'Our Staff' },
]

export default function Footer() {
  return (
    <footer className="bg-cream-dark border-t border-primary/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/images/accent_fh_cross.png"
                alt=""
                className="h-12 w-auto object-contain"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <h3 className="text-lg font-serif font-bold text-secondary-dark">{CHURCH.name}</h3>
            </div>
            <p className="text-secondary-light text-sm mb-4 leading-relaxed">
              {CHURCH.address}<br />
              {CHURCH.city}, {CHURCH.state} {CHURCH.zip}
            </p>
            <a
              href={CHURCH.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-medium transition-colors"
            >
              Get Directions
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-secondary-dark mb-4">Quick Links</h4>
            <div className="w-8 h-0.5 bg-primary mb-4" />
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-secondary hover:text-primary text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-secondary-dark mb-4">Connect</h4>
            <div className="w-8 h-0.5 bg-primary mb-4" />
            <div className="flex gap-4">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white border border-primary/20 flex items-center justify-center text-secondary hover:text-primary hover:border-primary transition-all"
                >
                  <span className="sr-only">{item.name}</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={item.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-primary/10 text-center text-sm text-secondary-light space-y-2">
          <p>&copy; {new Date().getFullYear()} {CHURCH.name}. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1.5">
            Created with <HeartIcon className="h-4 w-4 text-primary inline" /> Studio X Consulting &copy; 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
