import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

const emptyVerse = {
  verse_text: '',
  reference: '',
  book: '',
  chapter: null,
  verse_start: null,
  verse_end: null,
  category: '',
  display_order: 0,
  is_active: true,
}

export default function BibleVerseEditor() {
  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyVerse)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const modalRef = useRef(null)

  const loadVerses = () => {
    setLoading(true)
    supabase
      .from('bible_verses')
      .select('*')
      .order('display_order')
      .then(({ data }) => {
        setVerses(data || [])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadVerses()
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
    setForm({ ...emptyVerse, display_order: verses.length })
    setFormOpen(true)
    setError(null)
  }

  const openEdit = (verse) => {
    setEditingId(verse.id)
    setForm({
      verse_text: verse.verse_text || '',
      reference: verse.reference || '',
      book: verse.book || '',
      chapter: verse.chapter || null,
      verse_start: verse.verse_start || null,
      verse_end: verse.verse_end || null,
      category: verse.category || '',
      display_order: verse.display_order ?? 0,
      is_active: verse.is_active ?? true,
    })
    setFormOpen(true)
    setError(null)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyVerse)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      verse_text: form.verse_text.trim(),
      reference: form.reference.trim(),
      book: form.book.trim(),
      chapter: form.chapter || null,
      verse_start: form.verse_start || null,
      verse_end: form.verse_end || null,
      category: form.category.trim() || null,
      display_order: form.display_order,
      is_active: form.is_active,
    }
    if (!payload.verse_text) {
      setError('Verse text is required.')
      setSaving(false)
      return
    }
    if (!payload.reference) {
      setError('Reference is required.')
      setSaving(false)
      return
    }
    if (!payload.book) {
      setError('Book is required.')
      setSaving(false)
      return
    }
    try {
      if (editingId) {
        const { error: err } = await supabase.from('bible_verses').update(payload).eq('id', editingId)
        if (err) throw err
        toast.success('Bible verse updated.')
      } else {
        const { error: err } = await supabase.from('bible_verses').insert(payload)
        if (err) throw err
        toast.success('Bible verse created.')
      }
      loadVerses()
      closeForm()
    } catch (err) {
      setError(err.message || 'Failed to save Bible verse.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase.from('bible_verses').delete().eq('id', id)
      if (err) throw err
      toast.success('Bible verse deleted.')
      loadVerses()
      setDeleteConfirm(null)
    } catch (err) {
      setError(err.message || 'Failed to delete Bible verse.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-secondary-light">Loading Bible verses...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary-dark">Bible Verses</h2>
          <p className="text-secondary-light mt-1">Manage rotating Bible verses displayed on the home page hero section.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90"
        >
          <PlusIcon className="h-5 w-5" />
          Add verse
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
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Verse Text</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Active</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-light uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {verses.map((verse) => (
              <tr key={verse.id}>
                <td className="px-6 py-4 text-sm font-medium text-secondary-dark">{verse.reference}</td>
                <td className="px-6 py-4 text-sm text-secondary-light max-w-md truncate">{verse.verse_text}</td>
                <td className="px-6 py-4 text-sm text-secondary-light">{verse.category || '—'}</td>
                <td className="px-6 py-4 text-sm text-secondary-light">
                  <span className={`inline-block w-2 h-2 rounded-full ${verse.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {deleteConfirm === verse.id ? (
                    <span className="flex items-center justify-end gap-2">
                      <span className="text-red-600 text-xs">Delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(verse.id)}
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
                        onClick={() => openEdit(verse)}
                        className="text-primary hover:underline flex items-center gap-1"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(verse.id)}
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
        {verses.length === 0 && (
          <p className="p-8 text-center text-secondary-light">No Bible verses yet. Click &quot;Add verse&quot; to create one.</p>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) closeForm() }}>
          <div ref={modalRef} className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit Bible verse' : 'New Bible verse'}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-secondary-dark">
                {editingId ? 'Edit Bible verse' : 'New Bible verse'}
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
                <label className="block text-sm font-medium text-secondary-dark mb-1">Verse Text *</label>
                <textarea
                  value={form.verse_text}
                  onChange={(e) => setForm((f) => ({ ...f, verse_text: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="For God so loved the world..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Reference *</label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                    placeholder="John 3:16"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Book *</label>
                  <input
                    type="text"
                    value={form.book}
                    onChange={(e) => setForm((f) => ({ ...f, book: e.target.value }))}
                    placeholder="John"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Chapter</label>
                  <input
                    type="number"
                    value={form.chapter || ''}
                    onChange={(e) => setForm((f) => ({ ...f, chapter: parseInt(e.target.value) || null }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Verse Start</label>
                  <input
                    type="number"
                    value={form.verse_start || ''}
                    onChange={(e) => setForm((f) => ({ ...f, verse_start: parseInt(e.target.value) || null }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="16"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Verse End</label>
                  <input
                    type="number"
                    value={form.verse_end || ''}
                    onChange={(e) => setForm((f) => ({ ...f, verse_end: parseInt(e.target.value) || null }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="17"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g., Hope, Faith, Love"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-secondary-dark">Active (visible on site)</span>
                  </label>
                </div>
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
