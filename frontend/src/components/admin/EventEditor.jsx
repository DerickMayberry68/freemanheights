import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'

export default function EventEditor() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setEvents(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading events...</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-secondary-dark mb-4">Events</h2>
      <p className="text-secondary-light mb-6">
        View events. Full admin auth and editing will be added when Supabase auth is configured.
      </p>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-6 py-4 text-sm font-medium text-secondary-dark">{event.title}</td>
                <td className="px-6 py-4 text-sm text-secondary-light">
                  {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
                </td>
                <td className="px-6 py-4 text-sm text-secondary-light">{event.location || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="p-8 text-center text-secondary-light">No events yet.</p>
        )}
      </div>
    </div>
  )
}
