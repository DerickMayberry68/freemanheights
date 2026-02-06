import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import EventCard from './EventCard'

export default function EventCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    supabase
      .from('events')
      .select('*')
      .gte('event_date', start.toISOString())
      .lte('event_date', end.toISOString())
      .order('event_date')
      .then(({ data }) => {
        setEvents(data || [])
        setLoading(false)
      })
  }, [currentMonth])

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // Pad start of month to align first day
  const startPadding = startOfMonth(currentMonth).getDay()
  const paddedDays = [...Array(startPadding).fill(null), ...days]

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-secondary"
        >
          ← Previous
        </button>
        <h2 className="text-xl font-bold text-secondary-dark">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-secondary"
        >
          Next →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-sm font-semibold text-secondary-light py-2">
            {d}
          </div>
        ))}
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="aspect-square" />
          const dayEvents = events.filter((e) => isSameDay(new Date(e.event_date), day))
          return (
            <div
              key={day.toISOString()}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm ${
                isSameMonth(day, currentMonth)
                  ? 'bg-gray-50 text-secondary-dark'
                  : 'text-gray-300'
              }`}
            >
              <span>{format(day, 'd')}</span>
              {dayEvents.length > 0 && (
                <span className="text-primary font-bold text-xs">•</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-semibold text-secondary-dark mb-4">Events this month</h3>
        {loading && <p className="text-secondary-light">Loading...</p>}
        {!loading && events.length === 0 && (
          <p className="text-secondary-light">No events scheduled this month.</p>
        )}
        {!loading && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
