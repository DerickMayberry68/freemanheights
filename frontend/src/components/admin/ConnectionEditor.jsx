import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  ArchiveBoxIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const statusOptions = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['follow_up', 'Follow-up'],
  ['completed', 'Completed'],
  ['archived', 'Archived'],
]

const typeLabels = {
  first_time_guest: 'First-time guest',
  returning_guest: 'Returning guest',
  current_member: 'Current member',
  membership_interest: 'Membership interest',
}

const itemLabels = {
  children: 'Children',
  students: 'Students',
  women: 'Women',
  men: 'Men',
  worship: 'Worship',
  missions: 'Missions',
  small_groups: 'Small groups',
  volunteering: 'Volunteering',
  membership: 'Membership',
  baptism: 'Baptism',
  salvation: 'Following Jesus',
  serving: 'Serving',
  pastoral_contact: 'Pastoral contact',
}

const statusClasses = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  follow_up: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-700',
}

const formatDate = (value) => new Date(value).toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function DetailList({ title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <h4 className="text-sm font-semibold text-secondary-dark">{title}</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary">
            {itemLabels[item] || item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ConnectionEditor() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [selected, setSelected] = useState(null)
  const [draftStatus, setDraftStatus] = useState('new')
  const [draftNotes, setDraftNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadSubmissions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('connection_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Unable to load connection cards')
      console.error('Connection card load failed:', error)
    } else {
      setSubmissions(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSubmissions()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return submissions.filter((submission) => {
      const statusMatches = statusFilter === 'all'
        || (statusFilter === 'active' && submission.status !== 'archived')
        || submission.status === statusFilter
      const searchMatches = !query || [
        submission.first_name,
        submission.last_name,
        submission.email,
        submission.phone,
        submission.source,
      ].filter(Boolean).join(' ').toLowerCase().includes(query)
      return statusMatches && searchMatches
    })
  }, [search, statusFilter, submissions])

  const openSubmission = (submission) => {
    setSelected(submission)
    setDraftStatus(submission.status)
    setDraftNotes(submission.staff_notes || '')
  }

  const saveSubmission = async () => {
    if (!selected) return
    setSaving(true)
    const now = new Date().toISOString()
    const updates = {
      status: draftStatus,
      staff_notes: draftNotes.trim() || null,
      assigned_to: selected.assigned_to || user?.id || null,
    }
    if (['contacted', 'follow_up', 'completed'].includes(draftStatus) && !selected.contacted_at) {
      updates.contacted_at = now
    }
    if (draftStatus === 'completed' && !selected.completed_at) {
      updates.completed_at = now
    }

    const { data, error } = await supabase
      .from('connection_submissions')
      .update(updates)
      .eq('id', selected.id)
      .select()
      .single()

    if (error) {
      toast.error('Unable to save this connection card')
      console.error('Connection card update failed:', error)
    } else {
      setSubmissions((current) => current.map((item) => item.id === data.id ? data : item))
      setSelected(data)
      toast.success('Connection card updated')
    }
    setSaving(false)
  }

  const archiveSubmission = async () => {
    setDraftStatus('archived')
    setSaving(true)
    const { data, error } = await supabase
      .from('connection_submissions')
      .update({ status: 'archived', assigned_to: selected.assigned_to || user?.id || null })
      .eq('id', selected.id)
      .select()
      .single()

    if (error) {
      toast.error('Unable to archive this connection card')
    } else {
      setSubmissions((current) => current.map((item) => item.id === data.id ? data : item))
      setSelected(null)
      toast.success('Connection card archived')
    }
    setSaving(false)
  }

  return (
    <div className="py-4">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold text-secondary-dark">Connections</h2>
        <p className="mt-1 text-secondary-light">Review connection cards and keep follow-up moving.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-light" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone, or source"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-secondary-dark">
          <option value="active">Active</option>
          <option value="all">All statuses</option>
          {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <p className="p-8 text-center text-secondary-light">Loading connection cards...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-secondary-light">No connection cards match these filters.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-secondary-light">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((submission) => (
                    <tr
                      key={submission.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open connection card for ${submission.first_name} ${submission.last_name}`}
                      onClick={() => openSubmission(submission)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openSubmission(submission)
                        }
                      }}
                      className="cursor-pointer hover:bg-primary-50/60">
                      <td className="px-4 py-3 font-semibold text-secondary-dark">{submission.first_name} {submission.last_name}</td>
                      <td className="px-4 py-3 text-sm text-secondary">{typeLabels[submission.connection_type]}</td>
                      <td className="px-4 py-3 text-sm text-secondary">{submission.email || submission.phone}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-secondary">{formatDate(submission.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[submission.status]}`}>
                          {statusOptions.find(([value]) => value === submission.status)?.[1]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-gray-100 md:hidden">
              {filtered.map((submission) => (
                <button key={submission.id} type="button" onClick={() => openSubmission(submission)}
                  className="block w-full p-4 text-left hover:bg-primary-50">
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block font-semibold text-secondary-dark">{submission.first_name} {submission.last_name}</span>
                      <span className="mt-1 block text-sm text-secondary">{typeLabels[submission.connection_type]}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[submission.status]}`}>
                      {statusOptions.find(([value]) => value === submission.status)?.[1]}
                    </span>
                  </span>
                  <span className="mt-3 block text-xs text-secondary-light">{formatDate(submission.created_at)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            {selected && (
              <DialogPanel className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
                  <div>
                    <DialogTitle className="font-serif text-2xl font-bold text-secondary-dark">
                      {selected.first_name} {selected.last_name}
                    </DialogTitle>
                    <p className="mt-1 text-sm text-secondary-light">{typeLabels[selected.connection_type]} · {formatDate(selected.created_at)}</p>
                  </div>
                  <button type="button" onClick={() => setSelected(null)} title="Close"
                    className="rounded-lg p-2 text-secondary hover:bg-gray-100">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-6 p-5 md:grid-cols-[1fr_0.9fr]">
                  <div className="space-y-5">
                    <div className="space-y-2 text-sm text-secondary-dark">
                      {selected.email && <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-primary hover:underline"><EnvelopeIcon className="h-4 w-4" />{selected.email}</a>}
                      {selected.phone && <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-primary hover:underline"><PhoneIcon className="h-4 w-4" />{selected.phone}</a>}
                      <p>Preferred contact: {selected.preferred_contact}</p>
                      {(selected.address_line1 || selected.city) && (
                        <p>{[selected.address_line1, selected.city, selected.state, selected.postal_code].filter(Boolean).join(', ')}</p>
                      )}
                      {selected.household_notes && <p className="whitespace-pre-wrap"><strong>Household:</strong> {selected.household_notes}</p>}
                    </div>

                    <DetailList title="Ministry interests" items={selected.ministry_interests} />
                    <DetailList title="Information requested" items={selected.information_requests} />

                    {selected.prayer_request && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <h4 className="text-sm font-semibold text-secondary-dark">Prayer request</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-secondary">{selected.prayer_request}</p>
                      </div>
                    )}

                    <div className="text-xs leading-5 text-secondary-light">
                      <p>Source: {selected.source}</p>
                      <p>Email updates: {selected.email_consent ? 'Yes' : 'No'} · Text messages: {selected.text_consent ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                    <div>
                      <label htmlFor="connection-status" className="mb-1.5 block text-sm font-semibold text-secondary-dark">Follow-up status</label>
                      <select id="connection-status" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5">
                        {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="connection-notes" className="mb-1.5 block text-sm font-semibold text-secondary-dark">Staff notes</label>
                      <textarea id="connection-notes" rows={8} maxLength={5000} value={draftNotes}
                        onChange={(event) => setDraftNotes(event.target.value)}
                        placeholder="Record calls, conversations, and next steps..."
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5" />
                    </div>
                    <button type="button" onClick={saveSubmission} disabled={saving}
                      className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
                      {saving ? 'Saving...' : 'Save follow-up'}
                    </button>
                    {selected.status !== 'archived' && (
                      <button type="button" onClick={archiveSubmission} disabled={saving}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-secondary hover:bg-gray-100 disabled:opacity-60">
                        <ArchiveBoxIcon className="h-5 w-5" />
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </DialogPanel>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}
