import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table'

const emptySermon = {
  title: '',
  speaker: '',
  sermon_date: '',
  scripture_reference: '',
  description: '',
  video_url: '',
  audio_url: '',
  notes_url: '',
  series: '',
  is_featured: false,
}

export default function SermonEditor() {
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptySermon)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [sorting, setSorting] = useState([])
  const modalRef = useRef(null)

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: info => <span className="font-medium text-secondary-dark">{info.getValue()}</span>
      },
      {
        accessorKey: 'speaker',
        header: 'Speaker',
        cell: info => info.getValue() || '—'
      },
      {
        accessorKey: 'sermon_date',
        header: 'Date',
        cell: info => format(new Date(info.getValue()), 'MMM d, yyyy')
      },
      {
        accessorKey: 'series',
        header: 'Series',
        cell: info => info.getValue() || '—'
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            {deleteConfirm === row.original.id ? (
              <span className="flex items-center justify-end gap-2">
                <span className="text-red-600 text-xs">Delete?</span>
                <button
                  type="button"
                  onClick={() => handleDelete(row.original.id)}
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
                  onClick={() => openEdit(row.original)}
                  className="text-primary hover:underline flex items-center gap-1"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(row.original.id)}
                  className="text-red-600 hover:underline flex items-center gap-1"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </span>
            )}
          </div>
        )
      }
    ],
    [deleteConfirm, saving]
  )

  const table = useReactTable({
    data: sermons,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const loadSermons = () => {
    setLoading(true)
    supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setSermons(data || [])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadSermons()
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
    setForm({
      ...emptySermon,
      sermon_date: new Date().toISOString().split('T')[0],
    })
    setFormOpen(true)
    setError(null)
  }

  const openEdit = (sermon) => {
    setEditingId(sermon.id)
    setForm({
      title: sermon.title || '',
      speaker: sermon.speaker || '',
      sermon_date: sermon.sermon_date ? sermon.sermon_date.split('T')[0] : '',
      scripture_reference: sermon.scripture_reference || '',
      description: sermon.description || '',
      video_url: sermon.video_url || '',
      audio_url: sermon.audio_url || '',
      notes_url: sermon.notes_url || '',
      series: sermon.series || '',
      is_featured: sermon.is_featured ?? false,
    })
    setFormOpen(true)
    setError(null)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptySermon)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      title: form.title.trim(),
      speaker: form.speaker.trim() || null,
      sermon_date: form.sermon_date || null,
      scripture_reference: form.scripture_reference.trim() || null,
      description: form.description.trim() || null,
      video_url: form.video_url.trim() || null,
      audio_url: form.audio_url.trim() || null,
      notes_url: form.notes_url.trim() || null,
      series: form.series.trim() || null,
      is_featured: form.is_featured,
    }
    if (!payload.title) {
      setError('Title is required.')
      setSaving(false)
      return
    }
    if (!payload.sermon_date) {
      setError('Date is required.')
      setSaving(false)
      return
    }
    try {
      if (editingId) {
        const { error: err } = await supabase.from('sermons').update(payload).eq('id', editingId)
        if (err) throw err
        toast.success('Sermon updated.')
      } else {
        const { error: err } = await supabase.from('sermons').insert(payload)
        if (err) throw err
        toast.success('Sermon created.')
      }
      loadSermons()
      closeForm()
    } catch (err) {
      setError(err.message || 'Failed to save sermon.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase.from('sermons').delete().eq('id', id)
      if (err) throw err
      toast.success('Sermon deleted.')
      loadSermons()
      setDeleteConfirm(null)
    } catch (err) {
      setError(err.message || 'Failed to delete sermon.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-secondary-light">Loading sermons...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary-dark">Sermons</h2>
          <p className="text-secondary-light mt-1">Add, edit, and delete sermons. They appear on the Livestream page and home page.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90"
        >
          <PlusIcon className="h-5 w-5" />
          Add sermon
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
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`px-6 py-3 ${header.id === 'actions' ? 'text-right' : 'text-left'} text-xs font-medium text-secondary-light uppercase ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
                          {header.column.getIsSorted() === 'asc' && '↑'}
                          {header.column.getIsSorted() === 'desc' && '↓'}
                          {!header.column.getIsSorted() && '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-secondary-light">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {sermons.length === 0 && (
          <p className="p-8 text-center text-secondary-light">No sermons yet. Click &quot;Add sermon&quot; to create one.</p>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) closeForm() }}>
          <div ref={modalRef} className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit sermon' : 'New sermon'}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-secondary-dark">
                {editingId ? 'Edit sermon' : 'New sermon'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Speaker</label>
                  <input
                    type="text"
                    value={form.speaker}
                    onChange={(e) => setForm((f) => ({ ...f, speaker: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.sermon_date}
                    onChange={(e) => setForm((f) => ({ ...f, sermon_date: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Scripture Reference</label>
                  <input
                    type="text"
                    value={form.scripture_reference}
                    onChange={(e) => setForm((f) => ({ ...f, scripture_reference: e.target.value }))}
                    placeholder="e.g. John 3:16"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Series</label>
                  <input
                    type="text"
                    value={form.series}
                    onChange={(e) => setForm((f) => ({ ...f, series: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
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
                <label className="block text-sm font-medium text-secondary-dark mb-1">YouTube Video URL</label>
                <input
                  type="url"
                  value={form.video_url}
                  onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Audio URL</label>
                  <input
                    type="url"
                    value={form.audio_url}
                    onChange={(e) => setForm((f) => ({ ...f, audio_url: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Notes URL</label>
                  <input
                    type="url"
                    value={form.notes_url}
                    onChange={(e) => setForm((f) => ({ ...f, notes_url: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sermon_featured"
                  checked={form.is_featured}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="sermon_featured" className="text-sm text-secondary-dark">Featured sermon</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
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
