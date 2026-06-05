import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const emptyProfile = { firstName: '', lastName: '', phone: '' }
const emptyChild = { firstName: '', lastName: '', dateOfBirth: '', notes: '', relationshipTypeId: 6 }

export default function EventRegistrationPage() {
  const { eventId } = useParams()
  const { session, loading: authLoading } = useAuth()
  const [event, setEvent] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState(emptyProfile)
  const [children, setChildren] = useState([])
  const [relationshipTypes, setRelationshipTypes] = useState([])
  const [childForm, setChildForm] = useState(emptyChild)
  const [selectedChildIds, setSelectedChildIds] = useState([])
  const [registrationNotes, setRegistrationNotes] = useState('')
  const [permissionSigned, setPermissionSigned] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadFamily = async () => {
    if (!session?.user?.id) return
    const [{ data: profileData }, { data: guardianRows }, { data: relationships }] = await Promise.all([
      supabase.from('member_profiles').select('*').eq('id', session.user.id).maybeSingle(),
      supabase.from('child_guardians')
        .select('child_id, children(id, first_name, last_name, date_of_birth, notes)')
        .eq('member_id', session.user.id),
      supabase.from('relationship_types').select('id, name').order('id'),
    ])
    setProfile(profileData || null)
    if (profileData) {
      setProfileForm({
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        phone: profileData.phone || '',
      })
    }
    const familyChildren = (guardianRows || []).map((row) => row.children).filter(Boolean)
    setChildren(familyChildren)
    setSelectedChildIds((current) => {
      const availableIds = new Set(familyChildren.map((child) => child.id))
      return current.filter((childId) => availableIds.has(childId))
    })
    setRelationshipTypes(relationships || [])
  }

  useEffect(() => {
    supabase.from('events').select('*').eq('id', eventId).maybeSingle()
      .then(({ data, error: eventError }) => {
        if (eventError || !data) setError('Event not found.')
        else setEvent(data)
        setLoading(false)
      })
  }, [eventId])

  useEffect(() => {
    loadFamily()
  }, [session?.user?.id])

  const saveProfile = async (submitEvent) => {
    submitEvent.preventDefault()
    setSaving(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('upsert_parent_profile', {
      p_first_name: profileForm.firstName,
      p_last_name: profileForm.lastName,
      p_phone: profileForm.phone || null,
    })
    if (rpcError) setError(rpcError.message)
    else setProfile(data)
    setSaving(false)
  }

  const addChild = async (submitEvent) => {
    submitEvent.preventDefault()
    setSaving(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('add_parent_child', {
      p_first_name: childForm.firstName,
      p_last_name: childForm.lastName,
      p_date_of_birth: childForm.dateOfBirth || null,
      p_notes: childForm.notes || null,
      p_relationship_type_id: Number(childForm.relationshipTypeId),
    })
    if (rpcError) {
      setError(rpcError.message)
    } else {
      setChildForm(emptyChild)
      await loadFamily()
      setSelectedChildIds((current) => [...new Set([...current, data.id])])
    }
    setSaving(false)
  }

  const registerChild = async (submitEvent) => {
    submitEvent.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const results = await Promise.all(selectedChildIds.map(async (childId) => {
      const child = children.find((item) => item.id === childId)
      const { data, error: rpcError } = await supabase.rpc('register_child_for_event', {
        p_event_id: eventId,
        p_child_id: childId,
        p_notes: registrationNotes || null,
        p_permission_slip_signed: permissionSigned,
      })
      return { childId, child, data, error: rpcError }
    }))

    const failed = results.filter((result) => result.error)
    const successful = results.filter((result) => !result.error)

    if (failed.length > 0) {
      setError(failed.map((result) => (
        `${result.child?.first_name || 'Child'}: ${result.error.message}`
      )).join(' '))
    }
    if (successful.length > 0) {
      const waitlisted = successful.filter((result) => result.data?.status === 'Waitlisted').length
      const submitted = successful.length - waitlisted
      const messages = []
      if (submitted > 0) messages.push(`${submitted} registration${submitted === 1 ? '' : 's'} submitted for staff review.`)
      if (waitlisted > 0) messages.push(`${waitlisted} child${waitlisted === 1 ? '' : 'ren'} added to the waitlist.`)
      setSuccess(messages.join(' '))
      setRegistrationNotes('')
      setSelectedChildIds(failed.map((result) => result.childId))
    }
    setSaving(false)
  }

  const toggleChild = (childId) => {
    setSelectedChildIds((current) => (
      current.includes(childId)
        ? current.filter((id) => id !== childId)
        : [...current, childId]
    ))
  }

  if (loading || authLoading) return <div className="py-16 text-center text-secondary-light">Loading registration...</div>
  if (!event) return <div className="py-16 text-center text-red-700">{error || 'Event not found.'}</div>

  const registrationOpen = event.requires_registration && !event.registration_url
    && !event.is_cancelled && new Date(event.event_date) > new Date()

  return (
    <div className="py-10 bg-cream-dark/20 min-h-[70vh]">
      <div className="mx-auto max-w-3xl px-4">
        <div className="bg-white border border-primary/10 rounded-lg p-6 mb-6">
          <p className="text-sm font-semibold text-primary uppercase">Event Registration</p>
          <h1 className="text-3xl font-serif font-bold text-secondary-dark mt-1">{event.title}</h1>
          <p className="text-secondary-light mt-2">{format(new Date(event.event_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
          {event.location && <p className="text-secondary-light">{event.location}</p>}
        </div>

        {!registrationOpen ? (
          <div className="bg-white border border-primary/10 rounded-lg p-6 text-secondary-dark">
            Registration is not available for this event.
          </div>
        ) : !session ? (
          <div className="bg-white border border-primary/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-secondary-dark">Sign in to register a child</h2>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link to={`/login?redirect=${encodeURIComponent(`/events/${eventId}/register`)}`}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium">Sign in</Link>
              <Link to={`/parent/register?redirect=${encodeURIComponent(`/events/${eventId}/register`)}`}
                className="px-4 py-2 border border-primary/30 text-secondary-dark rounded-lg font-medium">Create parent account</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4 text-sm text-secondary-dark">
              Enter your contact information, add your children, then select one or more children to register.
              Returning parents can select children they have already added.
            </div>
            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
            {success && <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">{success}</div>}

            <form onSubmit={saveProfile} className="bg-white border border-primary/10 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold text-secondary-dark">Parent or guardian</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input required placeholder="First name" value={profileForm.firstName}
                  onChange={(e) => setProfileForm((form) => ({ ...form, firstName: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2" />
                <input required placeholder="Last name" value={profileForm.lastName}
                  onChange={(e) => setProfileForm((form) => ({ ...form, lastName: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <input type="tel" required placeholder="Phone number" value={profileForm.phone}
                onChange={(e) => setProfileForm((form) => ({ ...form, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium disabled:opacity-50">
                {profile ? 'Update contact information' : 'Save contact information'}
              </button>
            </form>

            {profile && (
              <form onSubmit={addChild} className="bg-white border border-primary/10 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-secondary-dark">Add a child</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input required placeholder="Child first name" value={childForm.firstName}
                    onChange={(e) => setChildForm((form) => ({ ...form, firstName: e.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2" />
                  <input required placeholder="Child last name" value={childForm.lastName}
                    onChange={(e) => setChildForm((form) => ({ ...form, lastName: e.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-dark mb-1">Date of birth *</label>
                    <input type="date" required value={childForm.dateOfBirth}
                      onChange={(e) => setChildForm((form) => ({ ...form, dateOfBirth: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-dark mb-1">Relationship</label>
                    <select required value={childForm.relationshipTypeId}
                      onChange={(e) => setChildForm((form) => ({ ...form, relationshipTypeId: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                      {relationshipTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea rows={2} placeholder="Medical, dietary, or other notes" value={childForm.notes}
                  onChange={(e) => setChildForm((form) => ({ ...form, notes: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                <button type="submit" disabled={saving}
                  className="px-4 py-2 border border-primary/30 text-secondary-dark rounded-lg font-medium disabled:opacity-50">
                  Add child
                </button>
              </form>
            )}

            {children.length > 0 && (
              <form onSubmit={registerChild} className="bg-white border border-primary/10 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-secondary-dark">Register for this event</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {children.length > 1 && (
                    <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-secondary-dark">
                      <input type="checkbox"
                        checked={selectedChildIds.length === children.length}
                        onChange={(e) => setSelectedChildIds(e.target.checked ? children.map((child) => child.id) : [])} />
                      Select all children
                    </label>
                  )}
                  <div className="divide-y divide-gray-100">
                    {children.map((child) => (
                      <label key={child.id} className="flex items-center gap-3 px-4 py-3 text-secondary-dark">
                        <input type="checkbox" checked={selectedChildIds.includes(child.id)}
                          onChange={() => toggleChild(child.id)} />
                        {child.first_name} {child.last_name}
                      </label>
                    ))}
                  </div>
                </div>
                <textarea rows={3} placeholder="Notes for event staff" value={registrationNotes}
                  onChange={(e) => setRegistrationNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                {event.requires_permission_slip && (
                  <label className="flex items-start gap-2 text-sm text-secondary-dark">
                    <input type="checkbox" required checked={permissionSigned}
                      onChange={(e) => setPermissionSigned(e.target.checked)} className="mt-1" />
                    I am the parent or authorized guardian and give permission for the selected child or children to participate.
                  </label>
                )}
                <button type="submit" disabled={saving || selectedChildIds.length === 0}
                  className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-50">
                  {saving ? 'Submitting...' : 'Submit registration'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
