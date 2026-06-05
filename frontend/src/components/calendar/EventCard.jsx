import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'

export default function EventCard({ event }) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-primary/10 hover:border-primary/30 transition-all">
      <div className="flex-shrink-0 w-16 h-16 bg-primary-50 rounded-lg flex flex-col items-center justify-center text-primary">
        <span className="text-xs font-medium uppercase">
          {format(new Date(event.event_date), 'MMM')}
        </span>
        <span className="text-xl font-bold">{format(new Date(event.event_date), 'd')}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-secondary-dark">{event.title}</h4>
        <p className="text-sm text-secondary-light mt-1">
          {format(new Date(event.event_date), 'EEEE, MMM d \u2022 h:mm a')}
        </p>
        {event.location && (
          <p className="text-sm text-secondary-light mt-1 flex items-center gap-1">
            <MapPinIcon className="h-4 w-4 flex-shrink-0 text-primary/60" />
            {event.location}
          </p>
        )}
        {event.description && (
          <p className="text-secondary-light mt-2 text-sm line-clamp-2">{event.description}</p>
        )}
        {event.registration_url && (
          <a
            href={event.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-primary font-medium hover:text-primary-dark transition-colors"
          >
            Register <span aria-hidden="true">&rarr;</span>
          </a>
        )}
        {event.requires_registration && !event.registration_url && !event.is_cancelled && (
          <Link
            to={`/events/${event.id}/register`}
            className="inline-flex items-center gap-1 mt-2 text-primary font-medium hover:text-primary-dark transition-colors"
          >
            Register <span aria-hidden="true">&rarr;</span>
          </Link>
        )}
      </div>
    </div>
  )
}
