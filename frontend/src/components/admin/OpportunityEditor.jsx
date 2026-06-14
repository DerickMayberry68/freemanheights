import { useEffect, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { PlusIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const churchId = '00000000-0000-0000-0000-000000000001'
const emptyForm = {
  opportunity_type: 'volunteer',
  title: '',
  slug: '',
  summary: '',
  description: '',
  responsibilities: '',
  requirements: '',
  location: '',
  schedule: '',
  compensation: '',
  closing_date: '',
  status: 'draft',
  display_order: 0,
  application_questions: [],
}

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const lines = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean)

export default function OpportunityEditor() {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error: loadError } = await supabase.from('opportunities')
      .select('*').order('display_order').order('created_at', { ascending: false })
    if (loadError) toast.error(loadError.message)
    setOpportunities(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const create = () => {
    setEditingId(null)
    setForm({ ...emptyForm, display_order: opportunities.length })
    setError('')
    setOpen(true)
  }

  const edit = (item) => {
    setEditingId(item.id)
    setForm({
      ...item,
      responsibilities: (item.responsibilities || []).join('\n'),
      requirements: (item.requirements || []).join('\n'),
      closing_date: item.closing_date || '',
      application_questions: item.application_questions || [],
    })
    setError('')
    setOpen(true)
  }

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const updateQuestion = (index, field, value) => setForm((current) => ({
    ...current,
    application_questions: current.application_questions.map((question, questionIndex) => (
      questionIndex === index ? { ...question, [field]: value } : question
    )),
  }))

  const addQuestion = () => setForm((current) => ({
    ...current,
    application_questions: [...current.application_questions, {
      id: crypto.randomUUID(),
      label: '',
      type: 'text',
      required: false,
      options: [],
    }],
  }))

  const removeQuestion = (index) => setForm((current) => ({
    ...current,
    application_questions: current.application_questions.filter((_, questionIndex) => questionIndex !== index),
  }))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      church_id: churchId,
      opportunity_type: form.opportunity_type,
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      summary: form.summary.trim(),
      description: form.description.trim() || null,
      responsibilities: lines(form.responsibilities),
      requirements: lines(form.requirements),
      location: form.location.trim() || null,
      schedule: form.schedule.trim() || null,
      compensation: form.opportunity_type === 'paid' ? form.compensation.trim() || null : null,
      closing_date: form.closing_date || null,
      status: form.status,
      display_order: Number(form.display_order) || 0,
      application_questions: form.application_questions.map((question) => ({
        ...question,
        label: question.label.trim(),
        options: question.type === 'select'
          ? (Array.isArray(question.options) ? question.options : String(question.options).split(',')).map((option) => option.trim()).filter(Boolean)
          : [],
      })).filter((question) => question.label),
    }

    if (!payload.title || !payload.slug || !payload.summary) {
      setError('Title, URL slug, and summary are required.')
      setSaving(false)
      return
    }

    const result = editingId
      ? await supabase.from('opportunities').update(payload).eq('id', editingId)
      : await supabase.from('opportunities').insert({ ...payload, created_by: user?.id || null })

    if (result.error) {
      setError(result.error.message)
    } else {
      toast.success(editingId ? 'Opportunity updated.' : 'Opportunity created.')
      setOpen(false)
      load()
    }
    setSaving(false)
  }

  const changeStatus = async (item, status) => {
    const { error: updateError } = await supabase.from('opportunities').update({ status }).eq('id', item.id)
    if (updateError) toast.error(updateError.message)
    else {
      toast.success(`Opportunity marked ${status}.`)
      load()
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-dark">Opportunities</h2>
          <p className="mt-1 text-secondary-light">Add and publish paid or volunteer openings.</p>
        </div>
        <button type="button" onClick={create}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-dark">
          <PlusIcon className="h-5 w-5" /> Add opportunity
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {loading ? <p className="p-8 text-secondary-light">Loading opportunities...</p> : opportunities.length === 0 ? (
          <p className="p-8 text-center text-secondary-light">No opportunities yet. Add the first opening when you are ready.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-secondary-light">
                <tr><th className="px-4 py-3">Position</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Closing</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {opportunities.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3"><p className="font-semibold text-secondary-dark">{item.title}</p><p className="text-xs text-secondary-light">/{item.slug}</p></td>
                    <td className="px-4 py-3 capitalize text-secondary">{item.opportunity_type}</td>
                    <td className="px-4 py-3 text-secondary">{item.closing_date ? new Date(`${item.closing_date}T12:00:00`).toLocaleDateString() : 'Open until filled'}</td>
                    <td className="px-4 py-3 capitalize text-secondary">{item.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => edit(item)} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><PencilIcon className="h-4 w-4" />Edit</button>
                        {item.status !== 'published' && item.status !== 'archived' && <button type="button" onClick={() => changeStatus(item, 'published')} className="font-semibold text-green-700 hover:underline">Publish</button>}
                        {item.status === 'published' && <button type="button" onClick={() => changeStatus(item, 'closed')} className="font-semibold text-amber-700 hover:underline">Close</button>}
                        {item.status !== 'archived' && <button type="button" onClick={() => changeStatus(item, 'archived')} className="font-semibold text-secondary hover:underline">Archive</button>}
                        {item.status === 'archived' && <button type="button" onClick={() => changeStatus(item, 'draft')} className="font-semibold text-primary hover:underline">Restore</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <DialogPanel className="w-full max-w-3xl rounded-lg bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <DialogTitle className="text-xl font-bold text-secondary-dark">{editingId ? 'Edit opportunity' : 'New opportunity'}</DialogTitle>
                <button type="button" title="Close" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
              </div>
              <form onSubmit={save} className="max-h-[82vh] space-y-5 overflow-y-auto p-5">
                {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-secondary-dark">Type
                    <select value={form.opportunity_type} onChange={(event) => setField('opportunity_type', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5">
                      <option value="volunteer">Volunteer</option><option value="paid">Paid</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-secondary-dark">Status
                    <select value={form.status} onChange={(event) => setField('status', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5">
                      <option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="archived">Archived</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-secondary-dark">Title *
                    <input required value={form.title} onChange={(event) => setField('title', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                  </label>
                  <label className="text-sm font-semibold text-secondary-dark">URL slug *
                    <input required value={form.slug || slugify(form.title)} onChange={(event) => setField('slug', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-secondary-dark">Summary *
                  <textarea required maxLength={500} rows={3} value={form.summary} onChange={(event) => setField('summary', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                </label>
                <label className="block text-sm font-semibold text-secondary-dark">Full description
                  <textarea rows={5} value={form.description || ''} onChange={(event) => setField('description', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-secondary-dark">Responsibilities <span className="font-normal text-secondary-light">(one per line)</span>
                    <textarea rows={5} value={form.responsibilities} onChange={(event) => setField('responsibilities', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                  </label>
                  <label className="text-sm font-semibold text-secondary-dark">Requirements <span className="font-normal text-secondary-light">(one per line)</span>
                    <textarea rows={5} value={form.requirements} onChange={(event) => setField('requirements', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-secondary-dark">Location
                    <input value={form.location || ''} onChange={(event) => setField('location', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                  </label>
                  <label className="text-sm font-semibold text-secondary-dark">Schedule
                    <input value={form.schedule || ''} onChange={(event) => setField('schedule', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                  </label>
                  {form.opportunity_type === 'paid' && <label className="text-sm font-semibold text-secondary-dark">Compensation
                    <input value={form.compensation || ''} onChange={(event) => setField('compensation', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                  </label>}
                  <label className="text-sm font-semibold text-secondary-dark">Closing date
                    <input type="date" value={form.closing_date || ''} onChange={(event) => setField('closing_date', event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5" />
                  </label>
                </div>

                <div className="border-t pt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-secondary-dark">Application questions</h3>
                    <button type="button" onClick={addQuestion} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><PlusIcon className="h-4 w-4" />Add question</button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {form.application_questions.map((question, index) => (
                      <div key={question.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
                          <input value={question.label} onChange={(event) => updateQuestion(index, 'label', event.target.value)} placeholder="Question" className="rounded-lg border border-gray-300 px-3 py-2" />
                          <select value={question.type} onChange={(event) => updateQuestion(index, 'type', event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2">
                            <option value="text">Short answer</option><option value="textarea">Long answer</option><option value="select">Select</option>
                          </select>
                          <button type="button" onClick={() => removeQuestion(index)} title="Remove question" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><XMarkIcon className="h-5 w-5" /></button>
                        </div>
                        <label className="mt-2 flex items-center gap-2 text-sm text-secondary"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(index, 'required', event.target.checked)} /> Required</label>
                        {question.type === 'select' && <input value={Array.isArray(question.options) ? question.options.join(', ') : question.options || ''} onChange={(event) => updateQuestion(index, 'options', event.target.value)} placeholder="Options separated by commas" className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-5">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">{saving ? 'Saving...' : 'Save opportunity'}</button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
