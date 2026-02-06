import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PrayerRequestForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    request: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('prayer_requests').insert({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      request: form.request,
    })
    setLoading(false)
    if (error) {
      alert('Sorry, there was an error submitting your request. Please try again or contact the church directly.')
      return
    }
    setSubmitted(true)
    setForm({ name: '', email: '', phone: '', request: '' })
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <h3 className="text-xl font-semibold text-green-800 mb-2">Thank You</h3>
        <p className="text-green-700">
          Your prayer request has been received. Our prayer team will be praying for you.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-4">
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary hover:bg-primary-dark text-secondary-dark font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Prayer Request'}
      </button>
    </form>
  )
}
