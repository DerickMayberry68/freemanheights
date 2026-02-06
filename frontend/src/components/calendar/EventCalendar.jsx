import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
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

  const eventStyleGetter = () => ({
    style: {
      backgroundColor: 'var(--tw-gradient-from, #D4A84B)',
      borderRadius: '6px',
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
      <div className="bg-white rounded-xl shadow-md p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-secondary-light">Loading calendar...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden p-4 md:p-6">
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
        />
      </div>
    </div>
  )
}
