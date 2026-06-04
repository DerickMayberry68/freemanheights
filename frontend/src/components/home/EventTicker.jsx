import { Link } from 'react-router-dom'
import { useEvents } from '../../lib/hooks'
import { format } from 'date-fns'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

export default function EventTicker() {
  const { data: events, loading } = useEvents(5, {
    includeCancelled: true,
    fromStartOfDay: true,
    daysAhead: 30,
  })

  return (
    <div className="bg-primary-dark text-white flex items-stretch" style={{ height: '2.5rem' }}>
      <div className="flex items-center gap-2 px-4 shrink-0 bg-primary z-10 text-white/90 text-xs font-semibold tracking-widest uppercase">
        <CalendarDaysIcon className="h-4 w-4" />
        <span>Events</span>
      </div>

      <div className="relative flex-1 overflow-hidden flex items-center">
        {loading && (
          <div className="px-6 text-sm text-white/50 animate-pulse">Loading events...</div>
        )}
        {!loading && events.length === 0 && (
          <Link
            to="/calendar"
            className="px-6 text-sm text-white/85 hover:text-white transition-colors"
          >
            View our calendar for upcoming services and activities -&gt;
          </Link>
        )}
        {!loading && events.length > 0 && (
          <div className="absolute inset-y-0 flex items-center animate-ticker whitespace-nowrap">
            {events.map((event, index) => (
              <Link
                key={event.id}
                to="/calendar"
                className="inline-flex items-center gap-2 px-8 text-sm text-white/80 hover:text-white transition-colors shrink-0"
              >
                <span className="font-medium text-white/95">
                  {event.title}
                  {event.is_cancelled && (
                    <span className="ml-1 text-red-300">(Cancelled)</span>
                  )}
                </span>
                <span className="text-primary-light text-xs">
                  {format(new Date(event.event_date), 'EEE, MMM d')}
                </span>
                {index < events.length - 1 && (
                  <span className="text-white/30 mx-4">{'\u2022'}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
