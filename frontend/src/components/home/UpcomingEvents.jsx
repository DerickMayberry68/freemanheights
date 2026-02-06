import { Link } from 'react-router-dom'
import { useEvents } from '../../lib/hooks'
import { format } from 'date-fns'
import { CalendarIcon } from '@heroicons/react/24/outline'

export default function UpcomingEvents() {
  const { data: events, loading } = useEvents(4)

  return (
    <section className="py-20 bg-cream-dark/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-secondary-dark mb-3">Upcoming Events</h2>
            <div className="w-12 h-0.5 bg-primary" />
          </div>
          <Link
            to="/calendar"
            className="text-primary font-medium hover:text-primary-dark transition-colors hidden sm:flex items-center gap-1"
          >
            View All Events <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl h-48 animate-pulse border border-primary/10" />
              ))}
            </>
          )}
          {!loading && events.length === 0 && (
            <div className="col-span-full text-center py-14 text-secondary-light">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-primary/30" />
              <p>No upcoming events at the moment. Check back soon!</p>
            </div>
          )}
          {!loading && events.map((event) => (
            <Link
              key={event.id}
              to="/calendar"
              className="block bg-white rounded-xl overflow-hidden border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="aspect-video bg-primary-50 flex items-center justify-center">
                <CalendarIcon className="h-14 w-14 text-primary/40 group-hover:text-primary/60 transition-colors" />
              </div>
              <div className="p-5">
                <p className="text-sm text-primary font-medium">
                  {format(new Date(event.event_date), 'MMM d, yyyy \u2022 h:mm a')}
                </p>
                <h3 className="font-semibold text-secondary-dark mt-1 line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h3>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link to="/calendar" className="text-primary font-medium hover:text-primary-dark transition-colors">
            View All Events &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
