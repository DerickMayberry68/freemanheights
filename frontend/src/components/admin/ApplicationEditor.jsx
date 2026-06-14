import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { ArrowDownTrayIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const statuses = [
  ['new', 'New'],
  ['reviewing', 'Reviewing'],
  ['interview', 'Interview'],
  ['accepted', 'Accepted'],
  ['declined', 'Declined'],
  ['withdrawn', 'Withdrawn'],
]

export default function ApplicationEditor() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [selected, setSelected] = useState(null)
  const [draftStatus, setDraftStatus] = useState('new')
  const [draftNotes, setDraftNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [applicationResult, profileResult] = await Promise.all([
      supabase.from('opportunity_applications')
        .select('*, opportunities(title, slug, opportunity_type, application_questions)')
        .order('submitted_at', { ascending: false }),
      supabase.from('applicant_profiles').select('*'),
    ])
    if (applicationResult.error || profileResult.error) {
      toast.error(applicationResult.error?.message || profileResult.error?.message)
    }
    setApplications(applicationResult.data || [])
    setProfiles(Object.fromEntries((profileResult.data || []).map((profile) => [profile.user_id, profile])))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return applications.filter((application) => {
      const profile = profiles[application.applicant_id]
      const statusMatches = statusFilter === 'all'
        || (statusFilter === 'active' && !['declined', 'withdrawn'].includes(application.status))
        || application.status === statusFilter
      const text = `${profile?.first_name || ''} ${profile?.last_name || ''} ${application.opportunities?.title || ''}`.toLowerCase()
      return statusMatches && (!query || text.includes(query))
    })
  }, [applications, profiles, search, statusFilter])

  const openApplication = (application) => {
    setSelected(application)
    setDraftStatus(application.status)
    setDraftNotes(application.staff_notes || '')
  }

  const save = async () => {
    setSaving(true)
    const { data, error } = await supabase.from('opportunity_applications').update({
      status: draftStatus,
      staff_notes: draftNotes.trim() || null,
      reviewed_by: user?.id || null,
    }).eq('id', selected.id).select().single()
    if (error) toast.error(error.message)
    else {
      setApplications((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item))
      setSelected((current) => ({ ...current, ...data }))
      toast.success('Application updated.')
    }
    setSaving(false)
  }

  const openResume = async () => {
    if (!selected?.resume_path) return
    const { data, error } = await supabase.storage.from('application-resumes').createSignedUrl(selected.resume_path, 300, {
      download: selected.resume_name || 'resume',
    })
    if (error) toast.error(error.message)
    else window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const profile = selected ? profiles[selected.applicant_id] : null

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-dark">Applications</h2>
        <p className="mt-1 text-secondary-light">Review applicants for paid and volunteer opportunities.</p>
      </div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-light" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applicant or position"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3" />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5">
          <option value="active">Active</option><option value="all">All</option>
          {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {loading ? <p className="p-8 text-secondary-light">Loading applications...</p> : filtered.length === 0 ? (
          <p className="p-8 text-center text-secondary-light">No applications match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-secondary-light">
                <tr><th className="px-4 py-3">Applicant</th><th className="px-4 py-3">Position</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((application) => {
                  const applicant = profiles[application.applicant_id]
                  return (
                    <tr key={application.id} tabIndex={0} role="button"
                      aria-label={`Open application from ${applicant?.first_name || ''} ${applicant?.last_name || ''}`}
                      onClick={() => openApplication(application)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openApplication(application)
                        }
                      }}
                      className="cursor-pointer hover:bg-primary-50">
                      <td className="px-4 py-3 font-semibold text-secondary-dark">{applicant?.first_name} {applicant?.last_name}</td>
                      <td className="px-4 py-3 text-secondary">{application.opportunities?.title}</td>
                      <td className="px-4 py-3 text-secondary">{new Date(application.submitted_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 capitalize text-secondary">{application.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            {selected && (
              <DialogPanel className="w-full max-w-4xl rounded-lg bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b px-5 py-4">
                  <div>
                    <DialogTitle className="font-serif text-2xl font-bold text-secondary-dark">{profile?.first_name} {profile?.last_name}</DialogTitle>
                    <p className="mt-1 text-sm text-secondary-light">{selected.opportunities?.title}</p>
                  </div>
                  <button type="button" title="Close" onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
                </div>
                <div className="grid max-h-[82vh] gap-6 overflow-y-auto p-5 md:grid-cols-[1fr_0.8fr]">
                  <div className="space-y-5">
                    <section>
                      <h3 className="font-bold text-secondary-dark">Contact</h3>
                      <div className="mt-2 space-y-1 text-sm text-secondary">
                        <p>{profile?.email || 'No email provided'}</p>
                        <p>{profile?.phone || 'No phone provided'}</p>
                        <p>{[profile?.address_line1, profile?.city, profile?.state, profile?.postal_code].filter(Boolean).join(', ') || 'No address provided'}</p>
                      </div>
                    </section>
                    {profile?.experience && <section><h3 className="font-bold text-secondary-dark">Experience</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-secondary">{profile.experience}</p></section>}
                    {selected.cover_message && <section><h3 className="font-bold text-secondary-dark">Interest</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-secondary">{selected.cover_message}</p></section>}
                    {Object.keys(selected.answers || {}).length > 0 && (
                      <section>
                        <h3 className="font-bold text-secondary-dark">Application answers</h3>
                        <div className="mt-3 space-y-4">
                          {(selected.opportunities?.application_questions || []).map((question) => (
                            <div key={question.id}><p className="text-sm font-semibold text-secondary-dark">{question.label}</p><p className="mt-1 whitespace-pre-wrap text-sm text-secondary">{selected.answers?.[question.id] || '-'}</p></div>
                          ))}
                        </div>
                      </section>
                    )}
                    {selected.resume_path && (
                      <button type="button" onClick={openResume}
                        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-4 py-2.5 font-semibold text-primary hover:bg-primary-50">
                        <ArrowDownTrayIcon className="h-5 w-5" /> Download {selected.resume_name || 'résumé'}
                      </button>
                    )}
                  </div>
                  <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                    <label className="block text-sm font-semibold text-secondary-dark">Status
                      <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5">
                        {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold text-secondary-dark">Private staff notes
                      <textarea rows={10} maxLength={5000} value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5" />
                    </label>
                    <button type="button" onClick={save} disabled={saving}
                      className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
                      {saving ? 'Saving...' : 'Save review'}
                    </button>
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
