import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { XMarkIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

function mapEvent(row) {
  const start = new Date(row.event_date)
  const end = row.end_date ? new Date(row.end_date) : new Date(start.getTime() + 60 * 60 * 1000)
  return {
    id: row.id,
    title: row.title,
    start,
    end,
    resource: row,
  }
}

export default function EventCalendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const { approved } = useAuth()

  useEffect(() => {
    const start = new Date()
    start.setMonth(start.getMonth() - 1)
    start.setDate(1)
    const end = new Date()
    end.setFullYear(end.getFullYear() + 1)
    end.setMonth(11)
    end.setDate(31)

    supabase
      .from('events')
      .select('*')
      .gte('event_date', start.toISOString())
      .lte('event_date', end.toISOString())
      .order('event_date')
      .then(({ data }) => {
        setEvents((data || []).map(mapEvent))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedEvent(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedEvent])

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource)
  }

  const eventStyleGetter = () => ({
    style: {
      backgroundColor: '#D4A84B',
      borderRadius: '6px',
      cursor: 'pointer',
      border: 'none',
    },
  })

  const messages = {
    today: 'Today',
    previous: 'Back',
    next: 'Next',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda',
    date: 'Date',
    time: 'Time',
    event: 'Event',
    noEventsInRange: 'No events in this range.',
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-primary/10 p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-secondary-light">Loading calendar...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-primary/10 overflow-hidden p-4 md:p-6">
      {approved && (
        <div className="mb-4 flex justify-end">
          <a
            href="/admin/events"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            Manage Events
          </a>
        </div>
      )}
      <div className="rbc-calendar-wrapper rbc-calendar-fh">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ minHeight: 500 }}
          views={['month', 'agenda']}
          defaultView="month"
          popup
          eventPropGetter={eventStyleGetter}
          messages={messages}
          className="freeman-calendar"
          onSelectEvent={handleSelectEvent}
        />
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-dark/30 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setSelectedEvent(null) }}>
          <div className="bg-white rounded-xl border border-primary/10 max-w-md w-full" role="dialog" aria-modal="true" aria-label="Event details">
            <div className="flex items-center justify-between p-5 border-b border-primary/10">
              <h3 className="text-lg font-serif font-semibold text-secondary-dark">{selectedEvent.title}</h3>
              <button type="button" onClick={() => setSelectedEvent(null)} className="p-2 rounded-lg hover:bg-primary-50 transition-colors">
                <XMarkIcon className="h-5 w-5 text-secondary" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <ClockIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-secondary-dark">
                    {format(new Date(selectedEvent.event_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-secondary-light">
                    {format(new Date(selectedEvent.event_date), 'h:mm a')}
                    {selectedEvent.end_date && ` \u2013 ${format(new Date(selectedEvent.end_date), 'h:mm a')}`}
                  </p>
                </div>
              </div>
              {selectedEvent.location && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-secondary-dark">{selectedEvent.location}</p>
                </div>
              )}
              {selectedEvent.description && (
                <p className="text-sm text-secondary-light pt-2 border-t border-primary/10">{selectedEvent.description}</p>
              )}
            </div>
            <div className="p-5 border-t border-primary/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 border border-primary/20 rounded-lg font-medium hover:bg-primary-50 text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
