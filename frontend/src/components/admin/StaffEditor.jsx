import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-toastify'
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table'
import ImageUpload from './ImageUpload'

const emptyStaff = {
  name: '',
  role: '',
  bio: '',
  email: '',
  phone: '',
  image_url: '',
  display_order: 0,
  is_active: true,
}

export default function StaffEditor() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyStaff)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [sorting, setSorting] = useState([])
  const modalRef = useRef(null)

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: info => <span className="font-medium text-secondary-dark">{info.getValue()}</span>
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: info => info.getValue()
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: info => info.getValue() || '—'
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
    data: staff,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const loadStaff = () => {
    setLoading(true)
    supabase
      .from('staff')
      .select('*')
      .order('display_order')
      .then(({ data }) => {
        setStaff(data || [])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadStaff()
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
    setForm({ ...emptyStaff, display_order: staff.length })
    setFormOpen(true)
    setError(null)
  }

  const openEdit = (staffMember) => {
    setEditingId(staffMember.id)
    setForm({
      name: staffMember.name || '',
      role: staffMember.role || '',
      bio: staffMember.bio || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      image_url: staffMember.image_url || '',
      display_order: staffMember.display_order ?? 0,
      is_active: staffMember.is_active ?? true,
    })
    setFormOpen(true)
    setError(null)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyStaff)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      bio: form.bio.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      image_url: form.image_url.trim() || null,
      display_order: form.display_order,
      is_active: form.is_active,
    }
    if (!payload.name) {
      setError('Name is required.')
      setSaving(false)
      return
    }
    if (!payload.role) {
      setError('Role is required.')
      setSaving(false)
      return
    }
    try {
      if (editingId) {
        const { error: err } = await supabase.from('staff').update(payload).eq('id', editingId)
        if (err) throw err
        toast.success('Staff member updated.')
      } else {
        const { error: err } = await supabase.from('staff').insert(payload)
        if (err) throw err
        toast.success('Staff member created.')
      }
      loadStaff()
      closeForm()
    } catch (err) {
      setError(err.message || 'Failed to save staff member.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setSaving(true)
    setError(null)
    try {
      const { error: err } = await supabase.from('staff').delete().eq('id', id)
      if (err) throw err
      toast.success('Staff member deleted.')
      loadStaff()
      setDeleteConfirm(null)
    } catch (err) {
      setError(err.message || 'Failed to delete staff member.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-secondary-light">Loading staff...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary-dark">Staff</h2>
          <p className="text-secondary-light mt-1">Add, edit, and delete staff members. They appear on the Our Staff page.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90"
        >
          <PlusIcon className="h-5 w-5" />
          Add staff member
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
        {staff.length === 0 && (
          <p className="p-8 text-center text-secondary-light">No staff members yet. Click &quot;Add staff member&quot; to create one.</p>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) closeForm() }}>
          <div ref={modalRef} className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit staff member' : 'New staff member'}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-secondary-dark">
                {editingId ? 'Edit staff member' : 'New staff member'}
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
                <label className="block text-sm font-medium text-secondary-dark mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Role *</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Senior Pastor, Worship Leader"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
              <ImageUpload
                currentImageUrl={form.image_url}
                onImageChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                folder="staff"
                label="Staff Photo"
              />
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
