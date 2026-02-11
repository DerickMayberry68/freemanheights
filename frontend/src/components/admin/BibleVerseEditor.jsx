import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useBibleTranslations } from '../../lib/hooks'
import { fetchBibleVerse, isTranslationSupported, parseBibleReference } from '../../lib/bibleApi'
import { toast } from 'react-toastify'
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table'

const emptyVerse = {
  verse_text: '',
  reference: '',
  book: '',
  chapter: null,
  verse_start: null,
  verse_end: null,
  category: '',
  translation: 'ESV',
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
  const [sorting, setSorting] = useState([])
  const [fetchingVerse, setFetchingVerse] = useState(false)
  const { data: translations, loading: translationsLoading } = useBibleTranslations()
  const modalRef = useRef(null)

  const columns = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        cell: info => <span className="font-medium text-secondary-dark">{info.getValue()}</span>
      },
      {
        accessorKey: 'verse_text',
        header: 'Verse Text',
        cell: info => (
          <div className="max-w-md">
            <span className="line-clamp-2">{info.getValue()}</span>
          </div>
        )
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: info => info.getValue() || '—'
      },
      {
        accessorKey: 'translation',
        header: 'Translation',
        cell: info => <span className="font-medium text-secondary-dark">{info.getValue() || 'ESV'}</span>
      },
      {
        accessorKey: 'is_active',
        header: 'Active',
        cell: info => (
          <span className={`inline-block w-2 h-2 rounded-full ${info.getValue() ? 'bg-green-500' : 'bg-gray-300'}`} />
        )
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
    data: verses,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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
      translation: verse.translation || 'ESV',
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

  const fetchVerseText = async (book, chapter, verseStart, verseEnd, translation) => {
    setFetchingVerse(true)
    setError(null)

    try {
      const verseText = await fetchBibleVerse({
        book,
        chapter,
        verseStart,
        verseEnd,
        translation
      })

      if (verseText) {
        setForm((f) => ({ ...f, verse_text: verseText }))
        toast.success(`Verse text fetched successfully from ${translation}`)
      }
    } catch (err) {
      console.error('Error fetching verse:', err)
      toast.error(err.message || 'Failed to fetch verse. You can manually enter the text.', {
        duration: 5000
      })
    } finally {
      setFetchingVerse(false)
    }
  }

  const handleReferenceChange = (referenceText) => {
    // Update the reference field
    setForm((f) => ({ ...f, reference: referenceText }))

    // Try to parse the reference
    const parsed = parseBibleReference(referenceText)

    if (parsed) {
      // Auto-fill the parsed fields
      setForm((f) => ({
        ...f,
        reference: referenceText,
        book: parsed.book,
        chapter: parsed.chapter,
        verse_start: parsed.verse_start,
        verse_end: parsed.verse_end
      }))

      // Automatically fetch the verse text
      fetchVerseText(
        parsed.book,
        parsed.chapter,
        parsed.verse_start,
        parsed.verse_end,
        form.translation
      )
    }
  }

  const handleTranslationChange = async (newTranslation) => {
    // Update the form with new translation
    setForm((f) => ({ ...f, translation: newTranslation }))

    // Only fetch if we have enough information
    if (!form.book || !form.chapter || !form.verse_start) {
      return
    }

    // Fetch verse text for the new translation
    fetchVerseText(
      form.book,
      form.chapter,
      form.verse_start,
      form.verse_end,
      newTranslation
    )
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
      translation: form.translation || 'ESV',
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-secondary-dark">
                    Verse Text * {fetchingVerse && <span className="text-primary text-xs">(Fetching...)</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchVerseText(form.book, form.chapter, form.verse_start, form.verse_end, form.translation)}
                    disabled={fetchingVerse || !form.book || !form.chapter || !form.verse_start}
                    className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Fetch verse text from API"
                  >
                    Fetch Verse
                  </button>
                </div>
                <textarea
                  value={form.verse_text}
                  onChange={(e) => setForm((f) => ({ ...f, verse_text: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="For God so loved the world..."
                  required
                  disabled={fetchingVerse}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">
                    Reference * <span className="text-xs text-secondary-light font-normal">(Auto-fills fields)</span>
                  </label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={(e) => handleReferenceChange(e.target.value)}
                    placeholder="e.g., John 3:16 or Philippians 4:13"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                    disabled={fetchingVerse}
                  />
                  <p className="text-xs text-secondary-light mt-1">
                    Type a reference to auto-fill all fields and fetch verse text
                  </p>
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
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Translation *</label>
                  <select
                    value={form.translation}
                    onChange={(e) => handleTranslationChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                    disabled={translationsLoading || fetchingVerse}
                  >
                    {translationsLoading ? (
                      <option>Loading translations...</option>
                    ) : (
                      translations.map(trans => (
                        <option key={trans.code} value={trans.code}>
                          {trans.abbreviation} - {trans.name}
                        </option>
                      ))
                    )}
                  </select>
                  {fetchingVerse && (
                    <p className="text-xs text-secondary-light mt-1">Fetching verse text using Claude AI...</p>
                  )}
                </div>
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
