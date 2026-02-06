import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline'

export default function EventCard({ event }) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-gray-100 hover:border-primary/30 transition-colors">
      <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center text-primary">
        <span className="text-xs font-medium uppercase">
          {format(new Date(event.event_date), 'MMM')}
        </span>
        <span className="text-xl font-bold">{format(new Date(event.event_date), 'd')}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-secondary-dark">{event.title}</h4>
        <p className="text-sm text-secondary-light mt-1">
          {format(new Date(event.event_date), 'EEEE, MMM d • h:mm a')}
        </p>
        {event.location && (
          <p className="text-sm text-secondary-light mt-1 flex items-center gap-1">
            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
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
            className="inline-block mt-2 text-primary font-medium hover:underline"
          >
            Register →
          </a>
        )}
      </div>
    </div>
  )
}
