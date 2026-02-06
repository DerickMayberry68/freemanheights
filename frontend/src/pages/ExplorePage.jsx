import { Link } from 'react-router-dom'
import { MapPinIcon, ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { CHURCH } from '../lib/constants'

export default function ExplorePage() {
  return (
    <div>
      <div className="page-banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1>Explore {CHURCH.shortName}</h1>
          <p>Find us, connect with us, and join us</p>
        </div>
      </div>

      <div className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-14">
            <div className="bg-white rounded-xl border border-primary/10 p-7 hover:border-primary/30 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                <MapPinIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-serif font-bold text-secondary-dark mb-2">Location</h3>
              <p className="text-secondary-light mb-4 leading-relaxed">
                {CHURCH.address}<br />
                {CHURCH.city}, {CHURCH.state} {CHURCH.zip}
              </p>
              <a
                href={CHURCH.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1"
              >
                Get Directions <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
            <div className="bg-white rounded-xl border border-primary/10 p-7 hover:border-primary/30 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                <ClockIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-serif font-bold text-secondary-dark mb-2">Service Times</h3>
              <p className="text-secondary-light mb-4 leading-relaxed">
                Sunday: 10:30 AM &amp; 6:00 PM<br />
                Wednesday: 6:00 PM
              </p>
              <Link to="/" className="text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1">
                View Full Schedule <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-primary/10 p-7 hover:border-primary/30 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                <EnvelopeIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-serif font-bold text-secondary-dark mb-2">Contact</h3>
              <p className="text-secondary-light mb-4 leading-relaxed">
                Visit our Staff page for contact information, or submit a prayer request.
              </p>
              <Link to="/staff" className="text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1">
                Our Staff <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="aspect-video rounded-xl overflow-hidden border border-primary/10 bg-cream-dark">
            <iframe
              src={CHURCH.mapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map of ${CHURCH.name}`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
