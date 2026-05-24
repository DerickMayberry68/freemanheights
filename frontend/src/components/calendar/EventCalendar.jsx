import { useState, useEffect, useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { addDays, format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { XMarkIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline'
import { getHolidaysInRange } from '../../lib/holidays'
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('month')
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

  // Combine events with holidays
  const allEvents = useMemo(() => {
    const start = new Date()
    start.setFullYear(start.getFullYear() - 1)
    const end = new Date()
    end.setFullYear(end.getFullYear() + 2)

    const holidays = getHolidaysInRange(start, end)
    const holidayEvents = holidays.map((holiday) => ({
      id: `holiday-${holiday.type}-${holiday.date.getTime()}-${holiday.name}`,
      title: holiday.name,
      start: holiday.date,
      end: holiday.endDate && holiday.endDate > holiday.date
        ? addDays(holiday.endDate, 1)
        : holiday.date,
      allDay: true,
      resource: {
        isHoliday: true,
        holidayType: holiday.type,
        title: holiday.name,
        event_date: holiday.date.toISOString(),
        end_date: holiday.endDate?.toISOString(),
      },
    }))

    return [...events, ...holidayEvents]
  }, [events])

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource)
  }

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate)
  }

  const handleViewChange = (newView) => {
    setCurrentView(newView)
  }

  const eventStyleGetter = (event) => {
    let backgroundColor = '#D4A84B'
    let color = '#FFFFFF'
    let opacity = 1
    let textDecoration = 'none'

    if (event.resource?.is_cancelled) {
      backgroundColor = '#94A3B8' // slate-400 — greyed out
      textDecoration = 'line-through'
      opacity = 0.7
    } else if (event.resource?.isHoliday) {
      if (event.resource.holidayType === 'christian') {
        backgroundColor = '#8B5CF6'
      } else if (event.resource.holidayType === 'sbc') {
        backgroundColor = '#0F766E'
      } else {
        backgroundColor = '#3B82F6'
      }
    }

    return {
      style: {
        backgroundColor,
        color,
        borderRadius: '6px',
        cursor: 'pointer',
        border: 'none',
        fontSize: '0.85rem',
        opacity,
        textDecoration,
      },
    }
  }

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
    <div className="bg-white rounded-xl border border-primary/10 overflow-hidden p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1e3a8a' }}></div>
            <span className="text-secondary-dark">Church Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0F766E' }}></div>
            <span className="text-secondary-dark">SBC Observances</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8B5CF6' }}></div>
            <span className="text-secondary-dark">Core Christian Holidays</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
            <span className="text-secondary-dark">National Holidays</span>
          </div>
        </div>

        {approved && (
          <a
            href="/admin/events"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors shrink-0"
          >
            Manage Events
          </a>
        )}
      </div>
      <div className="rbc-calendar-wrapper rbc-calendar-fh">
        <Calendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ minHeight: 900, height: '80vh' }}
          views={['month', 'week', 'day', 'agenda']}
          view={currentView}
          date={currentDate}
          onNavigate={handleNavigate}
          onView={handleViewChange}
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
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-serif font-semibold text-secondary-dark">{selectedEvent.title}</h3>
                {selectedEvent.isHoliday && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedEvent.holidayType === 'christian'
                      ? 'bg-purple-100 text-purple-700'
                      : selectedEvent.holidayType === 'sbc'
                        ? 'bg-teal-100 text-teal-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedEvent.holidayType === 'christian'
                      ? 'Core Christian'
                      : selectedEvent.holidayType === 'sbc'
                        ? 'SBC Observance'
                        : 'National'}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => setSelectedEvent(null)} className="p-2 rounded-lg hover:bg-primary-50 transition-colors">
                <XMarkIcon className="h-5 w-5 text-secondary" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {selectedEvent.is_cancelled && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-sm font-semibold text-red-700">This event has been cancelled</p>
                  {selectedEvent.cancellation_note && (
                    <p className="text-sm text-red-600 mt-0.5">{selectedEvent.cancellation_note}</p>
                  )}
                </div>
              )}
              <div className="flex items-start gap-3">
                <ClockIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-secondary-dark">
                    {selectedEvent.isHoliday && selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.event_date
                      ? `${format(new Date(selectedEvent.event_date), 'MMMM d')} - ${format(new Date(selectedEvent.end_date), 'MMMM d, yyyy')}`
                      : format(new Date(selectedEvent.event_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  {!selectedEvent.isHoliday && (
                    <p className="text-sm text-secondary-light">
                      {format(new Date(selectedEvent.event_date), 'h:mm a')}
                      {selectedEvent.end_date && ` – ${format(new Date(selectedEvent.end_date), 'h:mm a')}`}
                    </p>
                  )}
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
            <div className="p-5 border-t border-primary/10 flex justify-end gap-2">
              {approved && !selectedEvent.isHoliday && (
                <a
                  href={`/admin/events?edit=${selectedEvent.id}`}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark text-sm transition-colors"
                >
                  Edit Event
                </a>
              )}
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
