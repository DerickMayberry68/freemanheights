import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircleIcon, HeartIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'

const connectionTypes = [
  ['first_time_guest', 'First-time guest'],
  ['returning_guest', 'Returning guest'],
  ['current_member', 'Current member'],
  ['membership_interest', 'Interested in membership'],
]

const ministryOptions = [
  ['children', 'Children'],
  ['students', 'Students'],
  ['women', 'Women'],
  ['men', 'Men'],
  ['worship', 'Worship'],
  ['missions', 'Missions'],
  ['small_groups', 'Small groups'],
  ['volunteering', 'Volunteering'],
]

const informationOptions = [
  ['membership', 'Membership'],
  ['baptism', 'Baptism'],
  ['salvation', 'Following Jesus'],
  ['small_groups', 'Small groups'],
  ['serving', 'Serving'],
  ['children', 'Children'],
  ['students', 'Students'],
  ['pastoral_contact', 'Speak with a pastor'],
]

const initialForm = {
  connectionType: 'first_time_guest',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  preferredContact: 'email',
  addressLine1: '',
  city: '',
  state: '',
  postalCode: '',
  householdNotes: '',
  ministryInterests: [],
  informationRequests: [],
  prayerRequest: '',
  emailConsent: false,
  textConsent: false,
  website: '',
}

function Field({ label, id, children, optional = false }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-secondary-dark">
        {label}{optional && <span className="ml-1 font-normal text-secondary-light">(optional)</span>}
      </label>
      {children}
    </div>
  )
}

function CheckboxGroup({ legend, options, selected, onToggle }) {
  return (
    <fieldset>
      <legend className="mb-3 text-base font-semibold text-secondary-dark">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 hover:border-primary/40">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-secondary-dark">{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function ConnectPage() {
  const [searchParams] = useSearchParams()
  const startedAt = useRef(Date.now())
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const source = (searchParams.get('source') || 'website').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || 'website'
  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-secondary-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const toggleList = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: current[name].includes(value)
        ? current[name].filter((item) => item !== value)
        : [...current[name], value],
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.email.trim() && !form.phone.trim()) {
      setError('Please enter an email address or phone number so we can follow up.')
      return
    }

    setSubmitting(true)
    const { data, error: submitError } = await supabase.functions.invoke('submit-connection', {
      body: {
        ...form,
        source,
        elapsedMs: Date.now() - startedAt.current,
      },
    })

    if (submitError || !data?.success) {
      let message = data?.error || submitError?.message || 'We could not send your connection card. Please try again.'
      if (submitError?.context?.json) {
        try {
          const body = await submitError.context.json()
          message = body?.error || message
        } catch {
          // Keep the original client error when the response has no JSON body.
        }
      }
      setError(message)
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <section className="min-h-[70vh] bg-cream-dark/30 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
          <CheckCircleIcon className="mx-auto h-14 w-14 text-green-600" />
          <h1 className="mt-4 font-serif text-3xl font-bold text-secondary-dark">Thank you for connecting</h1>
          <p className="mt-3 leading-7 text-secondary">
            Your information has been received. Someone from Freeman Heights will follow up with you soon.
          </p>
          <Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-dark">
            Return home
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-cream-dark/30 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <HeartIcon className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 text-sm font-semibold uppercase text-primary">Freeman Heights Baptist Church</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-secondary-dark sm:text-4xl">Let&apos;s connect</h1>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-secondary">
            Whether this is your first visit or you have been here for years, tell us how we can help you take your next step.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border border-primary/10 bg-white p-5 shadow-sm sm:p-8">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <fieldset>
            <legend className="mb-3 text-base font-semibold text-secondary-dark">How are you connected with us?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {connectionTypes.map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition ${
                    form.connectionType === value ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="connectionType"
                    value={value}
                    checked={form.connectionType === value}
                    onChange={(event) => update('connectionType', event.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-secondary-dark">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <h2 className="mb-4 text-xl font-semibold text-secondary-dark">Your information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" id="firstName">
                <input id="firstName" required autoComplete="given-name" maxLength={80} value={form.firstName}
                  onChange={(event) => update('firstName', event.target.value)} className={inputClass} />
              </Field>
              <Field label="Last name" id="lastName">
                <input id="lastName" required autoComplete="family-name" maxLength={80} value={form.lastName}
                  onChange={(event) => update('lastName', event.target.value)} className={inputClass} />
              </Field>
              <Field label="Email" id="email" optional>
                <input id="email" type="email" autoComplete="email" maxLength={254} value={form.email}
                  onChange={(event) => update('email', event.target.value)} className={inputClass} />
              </Field>
              <Field label="Phone" id="phone" optional>
                <input id="phone" type="tel" autoComplete="tel" maxLength={50} value={form.phone}
                  onChange={(event) => update('phone', event.target.value)} className={inputClass} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="How should we contact you?" id="preferredContact">
                <select id="preferredContact" value={form.preferredContact}
                  onChange={(event) => update('preferredContact', event.target.value)}
                  className={inputClass}>
                  <option value="email">Email</option>
                  <option value="phone">Phone call</option>
                  <option value="text">Text message</option>
                  <option value="none">No follow-up needed</option>
                </select>
              </Field>
            </div>
          </div>

          <details className="rounded-lg border border-gray-200 px-4 py-3">
            <summary className="cursor-pointer font-semibold text-secondary-dark">Add address or household details</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Street address" id="addressLine1" optional>
                  <input id="addressLine1" autoComplete="street-address" maxLength={160} value={form.addressLine1}
                    onChange={(event) => update('addressLine1', event.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label="City" id="city" optional>
                <input id="city" autoComplete="address-level2" maxLength={100} value={form.city}
                  onChange={(event) => update('city', event.target.value)} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="State" id="state" optional>
                  <input id="state" autoComplete="address-level1" maxLength={50} value={form.state}
                    onChange={(event) => update('state', event.target.value)} className={inputClass} />
                </Field>
                <Field label="ZIP" id="postalCode" optional>
                  <input id="postalCode" autoComplete="postal-code" maxLength={20} value={form.postalCode}
                    onChange={(event) => update('postalCode', event.target.value)} className={inputClass} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Household or family notes" id="householdNotes" optional>
                  <textarea id="householdNotes" rows={3} maxLength={1000} value={form.householdNotes}
                    onChange={(event) => update('householdNotes', event.target.value)} className={inputClass} />
                </Field>
              </div>
            </div>
          </details>

          <CheckboxGroup legend="Ministries you are interested in" options={ministryOptions}
            selected={form.ministryInterests} onToggle={(value) => toggleList('ministryInterests', value)} />
          <CheckboxGroup legend="I would like more information about" options={informationOptions}
            selected={form.informationRequests} onToggle={(value) => toggleList('informationRequests', value)} />

          <Field label="How can we pray for you?" id="prayerRequest" optional>
            <textarea id="prayerRequest" rows={5} maxLength={3000} value={form.prayerRequest}
              onChange={(event) => update('prayerRequest', event.target.value)} className={inputClass} />
          </Field>

          <div className="space-y-3 border-t border-gray-200 pt-6">
            <label className="flex items-start gap-3 text-sm text-secondary">
              <input type="checkbox" checked={form.emailConsent}
                onChange={(event) => update('emailConsent', event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              I agree to receive occasional church news and updates by email.
            </label>
            <label className="flex items-start gap-3 text-sm text-secondary">
              <input type="checkbox" checked={form.textConsent}
                onChange={(event) => update('textConsent', event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              I agree to receive text messages from Freeman Heights. Message and data rates may apply.
            </label>
          </div>

          <div className="absolute -left-[10000px]" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" tabIndex="-1" autoComplete="off" value={form.website}
              onChange={(event) => update('website', event.target.value)} />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full rounded-lg bg-primary px-5 py-3.5 font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Sending...' : 'Send connection card'}
          </button>
          <p className="text-center text-xs leading-5 text-secondary-light">
            Your information is shared only with Freeman Heights staff for ministry and follow-up.
          </p>
        </form>
      </div>
    </section>
  )
}
