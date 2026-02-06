import { Link } from 'react-router-dom'
import { MapPinIcon, ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export default function ExplorePage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary-dark mb-2">Explore Freeman Heights</h1>
          <p className="text-secondary-light">
            Find us, connect with us, and join us
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6">
            <MapPinIcon className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold text-secondary-dark mb-2">Location</h3>
            <p className="text-secondary-light mb-4">
              522 Freeman Street<br />
              Berryville, AR 72616
            </p>
            <a
              href="https://maps.google.com/?q=522+Freeman+Street+Berryville+AR+72616"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              Get Directions →
            </a>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <ClockIcon className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold text-secondary-dark mb-2">Service Times</h3>
            <p className="text-secondary-light mb-4">
              Sunday: 10:30 AM & 6:00 PM<br />
              Wednesday: 6:00 PM
            </p>
            <Link to="/" className="text-primary font-medium hover:underline">
              View Full Schedule →
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <EnvelopeIcon className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold text-secondary-dark mb-2">Contact</h3>
            <p className="text-secondary-light mb-4">
              Visit our Staff page for contact information, or submit a prayer request.
            </p>
            <Link to="/staff" className="text-primary font-medium hover:underline">
              Our Staff →
            </Link>
          </div>
        </div>

        <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-200">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3185.8824454338984!2d-93.5679677!3d36.3648644!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87cf9bc00d6e5b29%3A0x0!2s522%20Freeman%20St%2C%20Berryville%2C%20AR%2072616!5e0!3m2!1sen!2sus!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Map of Freeman Heights Baptist Church"
          />
        </div>
      </div>
    </div>
  )
}
