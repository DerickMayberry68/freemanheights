import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(value) {
  if (!value) return null
  return new Date(value).toISOString()
}

const emptyEvent = {
  title: '',
  description: '',
  event_date: '',
  end_date: '',
  location: '',
  is_featured: false,
}

export default function EventEditor() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyEvent)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const modalRef = useRef(null)

  const loadEvents = () => {
    setLoading(true)
    supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setEvents(data || [])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (!formOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeForm()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [formOpen])

  const openCreate = () => {
    setEditingId(null)
    const now = new Date()
    now.setMinutes(0)
    setForm({
      ...emptyEvent,
      event_date: toDatetimeLocal(now.toISOString()),
    })
    setFormOpen(true)
    setError(null)
  }

  const openEdit = (event) => {
    setEditingId(event.id)
    setForm({
      title: event.title || '',
      description: event.description || '',
      event_date: toDatetimeLocal(event.event_date),
      end_date: toDatetimeLocal(event.end_date) || '',
      location: event.location || '',
      is_featured: event.is_featured ?? false,
    })
    setFormOpen(true)
    setError(null)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyEvent)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: fromDatetimeLocal(form.event_date),
      end_date: form.end_date ? fromDatetimeLocal(form.end_date) : null,
      location: form.location.trim() || null,
      is_featured: form.is_featured,
    }
    if (!payload.title) {
      setError('Title is required.')
      setSaving(false)
      return
    }
    if (!payload.event_date) {
      setError('Date and time are required.')
      setSaving(false)
      return
    }
    try {
      if (editingId) {
        const { error: err } = await supabase.from('events').update(payload).eq('id', editingId)
        if (err) throw err
        toast.success('Event updated.')
      } else {
        const { error: err } = await supabase.from('events').insert(payload)
        if (err) throw err
        toast.success('Event created.')
      }
      loadEvents()
      closeForm()
    } catch (err) {
      setError(err.message || 'Failed to save event.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase.from('events').delete().eq('id', id)
      if (err) throw err
      toast.success('Event deleted.')
      loadEvents()
      setDeleteConfirm(null)
    } catch (err) {
      setError(err.message || 'Failed to delete event.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-secondary-light">Loading events...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary-dark">Events</h2>
          <p className="text-secondary-light mt-1">Add, edit, and delete calendar events. Changes appear on the public Calendar page.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-secondary-dark font-medium rounded-lg hover:opacity-90"
        >
          <PlusIcon className="h-5 w-5" />
          Add event
        </button>
      </div>

      {error && !formOpen && deleteConfirm === null && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Location</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-light uppercase">Actions</th>
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
                <td className="px-6 py-4 text-sm text-right">
                  {deleteConfirm === event.id ? (
                    <span className="flex items-center justify-end gap-2">
                      <span className="text-red-600 text-xs">Delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(event.id)}
                        disabled={saving}
                        className="text-red-600 font-medium hover:underline disabled:opacity-50"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(null)}
                        className="text-secondary-light hover:underline"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(event)}
                        className="text-primary hover:underline flex items-center gap-1"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(event.id)}
                        className="text-red-600 hover:underline flex items-center gap-1"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="p-8 text-center text-secondary-light">No events yet. Click &quot;Add event&quot; to create one.</p>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) closeForm() }}>
          <div ref={modalRef} className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit event' : 'New event'}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-secondary-dark">
                {editingId ? 'Edit event' : 'New event'}
              </h3>
              <button type="button" onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Start date & time *</label>
                <input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">End date & time (optional)</label>
                <input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. 522 Freeman Street, Berryville, AR"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={form.is_featured}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_featured" className="text-sm text-secondary-dark">Featured event</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-secondary-dark font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
