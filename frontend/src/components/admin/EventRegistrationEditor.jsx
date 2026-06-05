import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'

export default function EventRegistrationEditor() {
  const [events, setEvents] = useState([])
  const [eventId, setEventId] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('events').select('id, title, event_date')
        .eq('requires_registration', true).gte('event_date', new Date().toISOString()).order('event_date'),
      supabase.from('registration_status_types').select('id, name').order('id'),
    ]).then(([eventsResult, statusesResult]) => {
      const eventRows = eventsResult.data || []
      setEvents(eventRows)
      setEventId(eventRows[0]?.id || '')
      setStatuses(statusesResult.data || [])
      setLoading(false)
    })
  }, [])

  const loadRegistrations = async () => {
    if (!eventId) {
      setRegistrations([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('event_registrations')
      .select(`
        id, status_id, permission_slip_signed, notes, registered_at,
        children(first_name, last_name, date_of_birth),
        member_profiles!event_registrations_registered_by_fkey(first_name, last_name, phone),
        registration_status_types(name)
      `)
      .eq('event_id', eventId)
      .order('registered_at')
    if (error) toast.error(error.message)
    setRegistrations(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadRegistrations()
  }, [eventId])

  const updateStatus = async (registrationId, statusId) => {
    const { error } = await supabase.from('event_registrations')
      .update({ status_id: Number(statusId) })
      .eq('id', registrationId)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Registration status updated.')
    loadRegistrations()
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary-dark">Event Registrations</h2>
          <p className="text-sm text-secondary-light mt-1">Review parent submissions and manage event rosters.</p>
        </div>
        <div className="min-w-72">
          <label className="block text-sm font-medium text-secondary-dark mb-1">Event</label>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} - {format(new Date(event.event_date), 'MMM d, yyyy')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        {loading ? (
          <p className="p-6 text-secondary-light">Loading registrations...</p>
        ) : registrations.length === 0 ? (
          <p className="p-6 text-secondary-light">No registrations for this event.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-secondary-dark">
              <tr>
                <th className="px-4 py-3">Child</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Permission</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registrations.map((registration) => (
                <tr key={registration.id}>
                  <td className="px-4 py-3 font-medium text-secondary-dark">
                    {registration.children?.first_name} {registration.children?.last_name}
                  </td>
                  <td className="px-4 py-3 text-secondary-light">
                    <div>{registration.member_profiles?.first_name} {registration.member_profiles?.last_name}</div>
                    <div className="text-xs">{registration.member_profiles?.phone || 'No phone'}</div>
                  </td>
                  <td className="px-4 py-3">{registration.permission_slip_signed ? 'Signed' : 'Not required/signed'}</td>
                  <td className="px-4 py-3 max-w-xs text-secondary-light">{registration.notes || '-'}</td>
                  <td className="px-4 py-3">
                    <select value={registration.status_id}
                      onChange={(e) => updateStatus(registration.id, e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 bg-white">
                      {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
