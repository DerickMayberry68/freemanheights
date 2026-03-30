import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import {
  PencilIcon, TrashIcon, PlusIcon, XMarkIcon,
  NoSymbolIcon, ArrowPathIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table'
import ImageUpload from './ImageUpload'

// ── Helpers ─────────────────────────────────────────────────────────────────

const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function ordSuffix(n) {
  if (n >= 11 && n <= 13) return 'th'
  return ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
}

function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return m === 0 ? `${hr} ${ampm}` : `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

function describeRecurrence(s) {
  if (!s) return ''
  const time = fmtTime(s.start_time)
  const end  = s.end_time ? ` – ${fmtTime(s.end_time)}` : ''
  if (s.recurrence_type === 'weekly')   return `Every ${DOW_NAMES[s.day_of_week]} at ${time}${end}`
  if (s.recurrence_type === 'biweekly') return `Every other ${DOW_NAMES[s.day_of_week]} at ${time}${end}`
  if (s.recurrence_type === 'monthly')  return `Monthly on the ${s.month_day}${ordSuffix(s.month_day)} at ${time}${end}`
  return ''
}

function toLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
function fromLocal(v) { return v ? new Date(v).toISOString() : null }

// ── Default state ────────────────────────────────────────────────────────────

const emptyEvent = {
  title: '', description: '', event_date: '', end_date: '',
  location: '', image_url: '', is_featured: false,
  is_cancelled: false, cancellation_note: '',
}

const emptySeriesForm = {
  title: '', description: '', location: '', image_url: '', is_featured: false,
  recurrence_type: 'weekly',
  day_of_week: 3,   // Wednesday default
  month_day: 1,
  start_time: '09:00',
  end_time: '',
  series_start: format(new Date(), 'yyyy-MM-dd'),
  series_end: '',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EventEditor() {
  const [activeTab, setActiveTab] = useState('events')

  // Events list
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)

  // Series list
  const [seriesList,    setSeriesList]    = useState([])
  const [seriesLoading, setSeriesLoading] = useState(false)

  // One-time / occurrence event form
  const [formOpen,       setFormOpen]       = useState(false)
  const [editingId,      setEditingId]      = useState(null)
  const [seriesCtx,      setSeriesCtx]      = useState(null)  // joined event_series row
  const [editScope,      setEditScope]      = useState('occurrence') // 'occurrence'|'series'
  const [form,           setForm]           = useState(emptyEvent)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState(null)

  // Series form (create / edit series definition)
  const [seriesFormOpen,  setSeriesFormOpen]  = useState(false)
  const [editingSeriesId, setEditingSeriesId] = useState(null)
  const [seriesForm,      setSeriesForm]      = useState(emptySeriesForm)
  const [seriesSaving,    setSeriesSaving]    = useState(false)
  const [seriesError,     setSeriesError]     = useState(null)

  // Confirm states
  const [deleteConfirm,      setDeleteConfirm]      = useState(null)
  const [cancelConfirm,      setCancelConfirm]      = useState(null)
  const [seriesDeleteConfirm, setSeriesDeleteConfirm] = useState(null)

  const [sorting, setSorting] = useState([{ id: 'event_date', desc: false }])

  const modalRef = useRef(null)

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadEvents = () => {
    setLoading(true)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('events')
      .select('*, event_series:series_id(id, title, recurrence_type, day_of_week, month_day, start_time, end_time)')
      .gte('event_date', since)
      .order('event_date', { ascending: true })
      .limit(300)
      .then(({ data }) => { setEvents(data || []); setLoading(false) })
  }

  const loadSeries = () => {
    setSeriesLoading(true)
    supabase
      .from('event_series')
      .select('*')
      .order('title')
      .then(({ data }) => { setSeriesList(data || []); setSeriesLoading(false) })
  }

  useEffect(() => {
    loadEvents()
    loadSeries()
    // Silently extend the rolling window each time the editor loads
    supabase.rpc('refresh_all_series').then(() => {}, () => {})
  }, [])

  // Escape key closes whichever modal is open
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Escape') return
      if (seriesFormOpen) { closeSeriesForm(); return }
      if (formOpen) closeForm()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [formOpen, seriesFormOpen])

  // ── One-time / occurrence CRUD ────────────────────────────────────────────

  const openCreate = () => {
    const now = new Date(); now.setMinutes(0)
    setEditingId(null); setSeriesCtx(null); setEditScope('occurrence')
    setForm({ ...emptyEvent, event_date: toLocal(now.toISOString()) })
    setError(null); setFormOpen(true)
  }

  const openEdit = (evt) => {
    setEditingId(evt.id)
    setSeriesCtx(evt.event_series ?? null)
    setEditScope('occurrence')
    setForm({
      title:             evt.title            || '',
      description:       evt.description      || '',
      event_date:        toLocal(evt.event_date),
      end_date:          toLocal(evt.end_date) || '',
      location:          evt.location         || '',
      image_url:         evt.image_url        || '',
      is_featured:       evt.is_featured      ?? false,
      is_cancelled:      evt.is_cancelled     ?? false,
      cancellation_note: evt.cancellation_note || '',
    })
    setError(null); setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false); setEditingId(null)
    setSeriesCtx(null); setEditScope('occurrence')
    setForm(emptyEvent); setError(null)
  }

  // Called when user selects "Edit entire series" scope
  const switchToSeriesEdit = () => {
    if (!seriesCtx) return
    closeForm()
    openSeriesEdit(seriesCtx)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Scope = series → hand off to series editor
    if (seriesCtx && editScope === 'series') {
      switchToSeriesEdit(); return
    }

    setSaving(true); setError(null)
    const payload = {
      title:             form.title.trim(),
      description:       form.description.trim() || null,
      event_date:        fromLocal(form.event_date),
      end_date:          form.end_date ? fromLocal(form.end_date) : null,
      location:          form.location.trim()  || null,
      image_url:         form.image_url.trim() || null,
      is_featured:       form.is_featured,
      is_cancelled:      form.is_cancelled,
      cancellation_note: form.is_cancelled ? (form.cancellation_note.trim() || null) : null,
    }
    if (!payload.title)      { setError('Title is required.');          setSaving(false); return }
    if (!payload.event_date) { setError('Date and time are required.'); setSaving(false); return }

    // Mark overridden when editing a generated occurrence individually
    if (seriesCtx && editScope === 'occurrence') payload.is_overridden = true

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
      loadEvents(); closeForm()
    } catch (err) {
      setError(err.message || 'Failed to save event.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setSaving(true)
    try {
      const { error: err } = await supabase.from('events').delete().eq('id', id)
      if (err) throw err
      toast.success('Event deleted.')
      loadEvents(); setDeleteConfirm(null)
    } catch (err) {
      toast.error(err.message || 'Failed to delete.')
    } finally { setSaving(false) }
  }

  const handleCancelOccurrence = async (id) => {
    setSaving(true)
    try {
      const { error: err } = await supabase.from('events')
        .update({ is_cancelled: true, is_overridden: true })
        .eq('id', id)
      if (err) throw err
      toast.success('Occurrence cancelled.')
      loadEvents(); setCancelConfirm(null)
    } catch (err) {
      toast.error(err.message || 'Failed to cancel.')
    } finally { setSaving(false) }
  }

  const handleRestoreOccurrence = async (id) => {
    setSaving(true)
    try {
      const { error: err } = await supabase.from('events')
        .update({ is_cancelled: false, cancellation_note: null })
        .eq('id', id)
      if (err) throw err
      toast.success('Occurrence restored.')
      loadEvents()
    } catch (err) {
      toast.error(err.message || 'Failed to restore.')
    } finally { setSaving(false) }
  }

  // ── Series CRUD ───────────────────────────────────────────────────────────

  const openSeriesCreate = () => {
    setEditingSeriesId(null)
    setSeriesForm({ ...emptySeriesForm })
    setSeriesError(null); setSeriesFormOpen(true)
  }

  const openSeriesEdit = (s) => {
    setEditingSeriesId(s.id)
    setSeriesForm({
      title:           s.title           || '',
      description:     s.description     || '',
      location:        s.location        || '',
      image_url:       s.image_url       || '',
      is_featured:     s.is_featured     ?? false,
      recurrence_type: s.recurrence_type || 'weekly',
      day_of_week:     s.day_of_week     ?? 3,
      month_day:       s.month_day       ?? 1,
      start_time:      s.start_time?.slice(0, 5) ?? '09:00',
      end_time:        s.end_time?.slice(0, 5)   ?? '',
      series_start:    s.series_start    || format(new Date(), 'yyyy-MM-dd'),
      series_end:      s.series_end      || '',
    })
    setSeriesError(null); setSeriesFormOpen(true)
  }

  const closeSeriesForm = () => {
    setSeriesFormOpen(false); setEditingSeriesId(null)
    setSeriesForm(emptySeriesForm); setSeriesError(null)
  }

  const handleSeriesSubmit = async (e) => {
    e.preventDefault()
    setSeriesSaving(true); setSeriesError(null)

    const payload = {
      title:           seriesForm.title.trim(),
      description:     seriesForm.description.trim() || null,
      location:        seriesForm.location.trim()    || null,
      image_url:       seriesForm.image_url.trim()   || null,
      is_featured:     seriesForm.is_featured,
      recurrence_type: seriesForm.recurrence_type,
      day_of_week:     seriesForm.recurrence_type !== 'monthly'
                         ? Number(seriesForm.day_of_week) : null,
      month_day:       seriesForm.recurrence_type === 'monthly'
                         ? Number(seriesForm.month_day) : null,
      start_time:      seriesForm.start_time || null,
      end_time:        seriesForm.end_time   || null,
      series_start:    seriesForm.series_start,
      series_end:      seriesForm.series_end || null,
      is_active:       true,
    }

    if (!payload.title)        { setSeriesError('Title is required.');      setSeriesSaving(false); return }
    if (!payload.series_start) { setSeriesError('Start date is required.'); setSeriesSaving(false); return }
    if (!payload.start_time)   { setSeriesError('Start time is required.'); setSeriesSaving(false); return }

    try {
      let seriesId = editingSeriesId

      if (editingSeriesId) {
        const { error: err } = await supabase.from('event_series').update(payload).eq('id', editingSeriesId)
        if (err) throw err
        // Drop future non-overridden occurrences so they regenerate with new rules
        await supabase.from('events')
          .delete()
          .eq('series_id', editingSeriesId)
          .eq('is_overridden', false)
          .eq('is_cancelled', false)
          .gte('event_date', new Date().toISOString())
        toast.success('Series updated. Regenerating…')
      } else {
        const { data, error: err } = await supabase
          .from('event_series').insert(payload).select().single()
        if (err) throw err
        seriesId = data.id
        toast.success('Series created. Generating occurrences…')
      }

      // Generate the rolling window of occurrences
      await supabase.rpc('generate_series_occurrences', { p_series_id: seriesId })
      loadEvents(); loadSeries(); closeSeriesForm()
    } catch (err) {
      setSeriesError(err.message || 'Failed to save series.')
    } finally {
      setSeriesSaving(false)
    }
  }

  const handleSeriesDelete = async (id) => {
    setSeriesSaving(true)
    try {
      const { error: err } = await supabase.from('event_series').delete().eq('id', id)
      if (err) throw err
      toast.success('Series and all generated occurrences deleted.')
      loadEvents(); loadSeries(); setSeriesDeleteConfirm(null)
    } catch (err) {
      toast.error(err.message || 'Failed to delete series.')
    } finally { setSeriesSaving(false) }
  }

  const handleSeriesToggleActive = async (s) => {
    try {
      const { error: err } = await supabase.from('event_series')
        .update({ is_active: !s.is_active }).eq('id', s.id)
      if (err) throw err
      toast.success(s.is_active ? 'Series paused.' : 'Series reactivated.')
      loadSeries()
    } catch (err) {
      toast.error(err.message || 'Failed to update series.')
    }
  }

  // ── Events table columns ──────────────────────────────────────────────────

  const columns = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => {
        const evt = row.original
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`font-medium ${evt.is_cancelled ? 'line-through text-secondary-light' : 'text-secondary-dark'}`}>
              {evt.title}
            </span>
            {evt.series_id && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">↻ Recurring</span>
            )}
            {evt.is_cancelled && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Cancelled</span>
            )}
            {evt.is_overridden && !evt.is_cancelled && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Modified</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'event_date',
      header: 'Date',
      cell: ({ getValue }) => format(new Date(getValue()), 'MMM d, yyyy • h:mm a'),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const evt = row.original
        const isSeries = !!evt.series_id
        return (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => openEdit(evt)}
              className="text-primary hover:underline flex items-center gap-1 text-sm"
            >
              <PencilIcon className="h-4 w-4" /> Edit
            </button>

            {isSeries ? (
              evt.is_cancelled ? (
                <button
                  type="button"
                  onClick={() => handleRestoreOccurrence(evt.id)}
                  disabled={saving}
                  className="text-green-600 hover:underline flex items-center gap-1 text-sm disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4" /> Restore
                </button>
              ) : cancelConfirm === evt.id ? (
                <span className="flex items-center gap-1 text-sm">
                  <span className="text-red-600 text-xs">Cancel this date?</span>
                  <button onClick={() => handleCancelOccurrence(evt.id)} disabled={saving} className="text-red-600 font-medium hover:underline">Yes</button>
                  <button onClick={() => setCancelConfirm(null)} className="text-secondary-light hover:underline">No</button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setCancelConfirm(evt.id)}
                  className="text-amber-600 hover:underline flex items-center gap-1 text-sm"
                >
                  <NoSymbolIcon className="h-4 w-4" /> Cancel
                </button>
              )
            ) : (
              deleteConfirm === evt.id ? (
                <span className="flex items-center gap-1 text-sm">
                  <span className="text-red-600 text-xs">Delete?</span>
                  <button onClick={() => handleDelete(evt.id)} disabled={saving} className="text-red-600 font-medium hover:underline">Yes</button>
                  <button onClick={() => setDeleteConfirm(null)} className="text-secondary-light hover:underline">No</button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(evt.id)}
                  className="text-red-600 hover:underline flex items-center gap-1 text-sm"
                >
                  <TrashIcon className="h-4 w-4" /> Delete
                </button>
              )
            )}
          </div>
        )
      },
    },
  ], [deleteConfirm, cancelConfirm, saving])

  const table = useReactTable({
    data: events, columns,
    state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary-dark">Events</h2>
          <p className="text-secondary-light mt-1">Manage one-time events and recurring series.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'events' && (
            <button
              type="button" onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90"
            >
              <PlusIcon className="h-5 w-5" /> Add event
            </button>
          )}
          {activeTab === 'series' && (
            <button
              type="button" onClick={openSeriesCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90"
            >
              <PlusIcon className="h-5 w-5" /> Add recurring series
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {[['events', 'Events'], ['series', 'Recurring Series']].map(([key, label]) => (
          <button
            key={key} type="button"
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary-light hover:text-secondary-dark'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Events tab ── */}
      {activeTab === 'events' && (
        loading ? (
          <p className="text-secondary-light py-4">Loading events…</p>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th
                        key={h.id}
                        onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined}
                        className={`px-6 py-3 text-xs font-medium text-secondary-light uppercase
                          ${h.id === 'actions' ? 'text-right' : 'text-left'}
                          ${h.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}
                      >
                        <span className="flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getCanSort() && (
                            <span className="text-gray-400">
                              {h.column.getIsSorted() === 'asc' ? '↑' : h.column.getIsSorted() === 'desc' ? '↓' : '↕'}
                            </span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row, idx) => (
                  <tr key={row.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${row.original.is_cancelled ? 'opacity-60' : ''}`}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 text-sm text-secondary-light">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <p className="p-8 text-center text-secondary-light">No upcoming events. Click "Add event" to create one.</p>
            )}
          </div>
        )
      )}

      {/* ── Series tab ── */}
      {activeTab === 'series' && (
        seriesLoading ? (
          <p className="text-secondary-light py-4">Loading series…</p>
        ) : seriesList.length === 0 ? (
          <p className="p-8 text-center text-secondary-light bg-white rounded-xl shadow">
            No recurring series yet. Click "Add recurring series" to create one.
          </p>
        ) : (
          <div className="bg-white rounded-xl shadow divide-y divide-gray-200">
            {seriesList.map((s) => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${s.is_active ? 'text-secondary-dark' : 'text-secondary-light line-through'}`}>
                      {s.title}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-light mt-0.5">{describeRecurrence(s)}</p>
                  {s.series_end && (
                    <p className="text-xs text-secondary-light mt-0.5">
                      Ends {format(new Date(s.series_end), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button" onClick={() => openSeriesEdit(s)}
                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                  >
                    <PencilIcon className="h-4 w-4" /> Edit
                  </button>
                  <button
                    type="button" onClick={() => handleSeriesToggleActive(s)}
                    className="text-secondary-light hover:text-secondary-dark flex items-center gap-1 text-sm"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    {s.is_active ? 'Pause' : 'Resume'}
                  </button>
                  {seriesDeleteConfirm === s.id ? (
                    <span className="flex items-center gap-1 text-sm">
                      <span className="text-red-600 text-xs">Delete all occurrences?</span>
                      <button onClick={() => handleSeriesDelete(s.id)} disabled={seriesSaving} className="text-red-600 font-medium hover:underline">Yes</button>
                      <button onClick={() => setSeriesDeleteConfirm(null)} className="text-secondary-light hover:underline">No</button>
                    </span>
                  ) : (
                    <button
                      type="button" onClick={() => setSeriesDeleteConfirm(s.id)}
                      className="text-red-600 hover:underline flex items-center gap-1 text-sm"
                    >
                      <TrashIcon className="h-4 w-4" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ════════════════════════════════════════════════════════
          Event form modal  (one-time OR occurrence edit)
          ════════════════════════════════════════════════════════ */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm() }}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            role="dialog" aria-modal="true"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-secondary-dark">
                {editingId ? 'Edit event' : 'New event'}
              </h3>
              <button type="button" onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Scope banner — only for series occurrences */}
            {seriesCtx && (
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-3">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                  ↻ Recurring — {describeRecurrence(seriesCtx)}
                </p>
                <div className="flex gap-6">
                  {[['occurrence', 'Edit this occurrence only'], ['series', 'Edit entire series']].map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 text-sm text-amber-900 cursor-pointer">
                      <input
                        type="radio" name="editScope" value={val}
                        checked={editScope === val}
                        onChange={() => setEditScope(val)}
                        className="accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">{error}</div>
              )}

              {editScope === 'series' ? (
                // When scope = series, show a prompt (actual editing happens in the series modal)
                <div className="py-6 text-center text-secondary-light">
                  <p className="text-sm">Click <strong>Open Series Editor</strong> to update the recurrence rule and all future occurrences.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary-dark mb-1">Title *</label>
                    <input type="text" value={form.title} required
                      onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-dark mb-1">Description</label>
                    <textarea rows={3} value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-secondary-dark mb-1">Start *</label>
                      <input type="datetime-local" value={form.event_date} required
                        onChange={(e) => setForm(f => ({ ...f, event_date: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-dark mb-1">End</label>
                      <input type="datetime-local" value={form.end_date}
                        onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-dark mb-1">Location</label>
                    <input type="text" value={form.location}
                      onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <ImageUpload
                    currentImageUrl={form.image_url}
                    onImageChange={(url) => setForm(f => ({ ...f, image_url: url }))}
                    folder="events" label="Event Image"
                  />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_featured" checked={form.is_featured}
                      onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                      className="rounded border-gray-300" />
                    <label htmlFor="is_featured" className="text-sm text-secondary-dark">Featured event</label>
                  </div>

                  {/* Cancellation — only shown when editing a series occurrence */}
                  {seriesCtx && (
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_cancelled" checked={form.is_cancelled}
                          onChange={(e) => setForm(f => ({ ...f, is_cancelled: e.target.checked }))}
                          className="rounded border-gray-300" />
                        <label htmlFor="is_cancelled" className="text-sm text-secondary-dark">Mark this occurrence as cancelled</label>
                      </div>
                      {form.is_cancelled && (
                        <div>
                          <label className="block text-sm font-medium text-secondary-dark mb-1">Cancellation note (optional)</label>
                          <input type="text" value={form.cancellation_note}
                            onChange={(e) => setForm(f => ({ ...f, cancellation_note: e.target.value }))}
                            placeholder="e.g. Holiday — no Awanas this week"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving…' : editScope === 'series' ? 'Open Series Editor' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          Series form modal  (create / edit series definition)
          ════════════════════════════════════════════════════════ */}
      {seriesFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) closeSeriesForm() }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            role="dialog" aria-modal="true">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-secondary-dark">
                {editingSeriesId ? 'Edit recurring series' : 'New recurring series'}
              </h3>
              <button type="button" onClick={closeSeriesForm} className="p-2 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSeriesSubmit} className="p-4 space-y-4">
              {seriesError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">{seriesError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Title *</label>
                <input type="text" value={seriesForm.title} required
                  onChange={(e) => setSeriesForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Description</label>
                <textarea rows={2} value={seriesForm.description}
                  onChange={(e) => setSeriesForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Location</label>
                <input type="text" value={seriesForm.location}
                  onChange={(e) => setSeriesForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>

              {/* ── Recurrence rule ── */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <p className="text-sm font-semibold text-secondary-dark">Recurrence</p>

                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Repeats</label>
                  <select value={seriesForm.recurrence_type}
                    onChange={(e) => setSeriesForm(f => ({ ...f, recurrence_type: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every two weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {seriesForm.recurrence_type !== 'monthly' ? (
                  <div>
                    <label className="block text-sm font-medium text-secondary-dark mb-1">Day of week</label>
                    <select value={seriesForm.day_of_week}
                      onChange={(e) => setSeriesForm(f => ({ ...f, day_of_week: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                      {DOW_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-secondary-dark mb-1">Day of month</label>
                    <select value={seriesForm.month_day}
                      onChange={(e) => setSeriesForm(f => ({ ...f, month_day: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}{ordSuffix(d)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-secondary-dark mb-1">Start time *</label>
                    <input type="time" value={seriesForm.start_time} required
                      onChange={(e) => setSeriesForm(f => ({ ...f, start_time: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-dark mb-1">End time</label>
                    <input type="time" value={seriesForm.end_time}
                      onChange={(e) => setSeriesForm(f => ({ ...f, end_time: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                </div>
              </div>

              {/* ── Date range ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Series starts *</label>
                  <input type="date" value={seriesForm.series_start} required
                    onChange={(e) => setSeriesForm(f => ({ ...f, series_start: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">
                    Series ends <span className="font-normal text-secondary-light">(leave blank = ongoing)</span>
                  </label>
                  <input type="date" value={seriesForm.series_end}
                    onChange={(e) => setSeriesForm(f => ({ ...f, series_end: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="sf_featured" checked={seriesForm.is_featured}
                  onChange={(e) => setSeriesForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="rounded border-gray-300" />
                <label htmlFor="sf_featured" className="text-sm text-secondary-dark">Featured event</label>
              </div>

              {editingSeriesId && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Saving will delete and regenerate all future auto-generated occurrences. Cancelled and individually modified occurrences are preserved.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeSeriesForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={seriesSaving}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                  {seriesSaving ? 'Saving…' : editingSeriesId ? 'Update series' : 'Create series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
