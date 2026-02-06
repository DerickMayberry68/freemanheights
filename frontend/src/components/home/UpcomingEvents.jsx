import { Link } from 'react-router-dom'
import { useEvents } from '../../lib/hooks'
import { format } from 'date-fns'
import { CalendarIcon } from '@heroicons/react/24/outline'

export default function UpcomingEvents() {
  const { data: events, loading } = useEvents(4)

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-secondary-dark mb-2">Upcoming Events</h2>
            <p className="text-secondary-light">What&apos;s happening at Freeman Heights</p>
          </div>
          <Link
            to="/calendar"
            className="text-primary font-semibold hover:underline hidden sm:block"
          >
            View All Events →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-50 rounded-xl h-48 animate-pulse" />
              ))}
            </>
          )}
          {!loading && events.length === 0 && (
            <div className="col-span-full text-center py-12 text-secondary-light">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No upcoming events at the moment. Check back soon!</p>
            </div>
          )}
          {!loading && events.map((event) => (
            <Link
              key={event.id}
              to="/calendar"
              className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="aspect-video bg-primary/20 flex items-center justify-center">
                <CalendarIcon className="h-16 w-16 text-primary/60" />
              </div>
              <div className="p-4">
                <p className="text-sm text-primary font-medium">
                  {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
                </p>
                <h3 className="font-semibold text-secondary-dark mt-1 line-clamp-2">{event.title}</h3>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link to="/calendar" className="text-primary font-semibold hover:underline">
            View All Events →
          </Link>
        </div>
      </div>
    </section>
  )
}
