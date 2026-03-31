import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PrayerRequestForm({ onSuccess }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [recipientOptions, setRecipientOptions] = useState([])
  const [recipientsLoading, setRecipientsLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    request: '',
    recipient_staff_id: '',
    recipient_label: '',
  })

  useEffect(() => {
    let active = true

    const loadRecipients = async () => {
      setRecipientsLoading(true)
      const { data, error: recipientsError } = await supabase.rpc('get_prayer_request_recipients')

      if (!active) return

      if (recipientsError) {
        setRecipientOptions([])
      } else {
        setRecipientOptions(data || [])
      }
      setRecipientsLoading(false)
    }

    loadRecipients()

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const selectedRecipient = recipientOptions.find(
      (recipient) => recipient.staff_id === form.recipient_staff_id
    )

    const { error: err } = await supabase.from('prayer_requests').insert({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      birthday: form.birthday || null,
      request: form.request,
      recipient_staff_id: form.recipient_staff_id || null,
      recipient_label: selectedRecipient?.display_name || null,
    })
    setLoading(false)
    if (err) {
      setError('Sorry, there was an error submitting your request. Please try again or contact the church directly.')
      return
    }
    setSubmitted(true)
    setForm({
      name: '',
      email: '',
      phone: '',
      birthday: '',
      request: '',
      recipient_staff_id: '',
      recipient_label: '',
    })

    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess()
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <h3 className="text-xl font-serif font-semibold text-green-800 mb-2">Thank You</h3>
        <p className="text-green-700">
          Your prayer request has been received. Our prayer team will be praying for you.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-primary/10 p-7 space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-secondary-dark mb-1">
          Your Name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-secondary-dark mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-secondary-dark mb-1">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>
      <div>
        <label htmlFor="birthday" className="block text-sm font-medium text-secondary-dark mb-1">
          Birthday <span className="text-secondary-light text-xs">(optional, helps us personalize our response)</span>
        </label>
        <input
          id="birthday"
          type="date"
          value={form.birthday}
          onChange={(e) => setForm({ ...form, birthday: e.target.value })}
          className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>
      <div>
        <label htmlFor="recipient_staff_id" className="block text-sm font-medium text-secondary-dark mb-1">
          Send To
        </label>
        <select
          id="recipient_staff_id"
          value={form.recipient_staff_id}
          onChange={(e) => {
            const selectedRecipient = recipientOptions.find(
              (recipient) => recipient.staff_id === e.target.value
            )
            setForm({
              ...form,
              recipient_staff_id: e.target.value,
              recipient_label: selectedRecipient?.display_name || '',
            })
          }}
          disabled={recipientsLoading}
          className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-60"
        >
          <option value="">
            {recipientsLoading ? 'Loading available recipients...' : 'Prayer Team'}
          </option>
          {recipientOptions.map((recipient) => (
            <option key={recipient.staff_id} value={recipient.staff_id}>
              {recipient.title
                ? `${recipient.display_name} (${recipient.title})`
                : recipient.display_name}
            </option>
          ))}
        </select>
        <p className="text-xs text-secondary-light mt-1">
          Choose a specific staff member to receive this request, or leave it as Prayer Team.
        </p>
      </div>
      <div>
        <label htmlFor="request" className="block text-sm font-medium text-secondary-dark mb-1">
          Prayer Request *
        </label>
        <textarea
          id="request"
          required
          rows={4}
          value={form.request}
          onChange={(e) => setForm({ ...form, request: e.target.value })}
          className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Prayer Request'}
      </button>
    </form>
  )
}
