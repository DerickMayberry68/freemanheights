import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ClockIcon,
  HandRaisedIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const typeLabels = { paid: 'Paid position', volunteer: 'Volunteer opportunity' }

function OpportunityCard({ opportunity }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          opportunity.opportunity_type === 'paid'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {typeLabels[opportunity.opportunity_type]}
        </span>
        {opportunity.closing_date && (
          <span className="text-xs text-secondary-light">
            Closes {new Date(`${opportunity.closing_date}T12:00:00`).toLocaleDateString()}
          </span>
        )}
      </div>
      <h2 className="mt-4 font-serif text-2xl font-bold text-secondary-dark">{opportunity.title}</h2>
      <p className="mt-3 flex-1 leading-7 text-secondary">{opportunity.summary}</p>
      <div className="mt-5 space-y-2 text-sm text-secondary-light">
        {opportunity.location && <p className="flex items-center gap-2"><MapPinIcon className="h-4 w-4" />{opportunity.location}</p>}
        {opportunity.schedule && <p className="flex items-center gap-2"><ClockIcon className="h-4 w-4" />{opportunity.schedule}</p>}
      </div>
      <Link to={`/opportunities/${opportunity.slug}`}
        className="mt-5 inline-flex justify-center rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-dark">
        View opportunity
      </Link>
    </article>
  )
}

export default function OpportunitiesPage() {
  const { slug } = useParams()
  const { session } = useAuth()
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase.from('opportunities').select('*').order('display_order').order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => {
        if (loadError) setError('Unable to load opportunities right now.')
        const today = new Date().toISOString().slice(0, 10)
        setOpportunities((data || []).filter((item) => (
          item.status === 'published'
          && (!item.closing_date || item.closing_date >= today)
        )))
        setLoading(false)
      })
  }, [])

  const selected = slug ? opportunities.find((item) => item.slug === slug) : null
  const filtered = useMemo(() => (
    filter === 'all' ? opportunities : opportunities.filter((item) => item.opportunity_type === filter)
  ), [filter, opportunities])

  if (loading) return <div className="py-20 text-center text-secondary-light">Loading opportunities...</div>

  if (slug) {
    if (!selected) return <div className="py-20 text-center text-secondary-light">This opportunity is not available.</div>
    return (
      <div className="bg-cream-dark/20 py-10 sm:py-14">
        <article className="mx-auto max-w-4xl px-4">
          <Link to="/opportunities" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
            <ArrowLeftIcon className="h-4 w-4" /> Back to opportunities
          </Link>
          <div className="mt-6 rounded-lg border border-primary/10 bg-white p-6 shadow-sm sm:p-9">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
              selected.opportunity_type === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
            }`}>{typeLabels[selected.opportunity_type]}</span>
            <h1 className="mt-4 font-serif text-4xl font-bold text-secondary-dark">{selected.title}</h1>
            <p className="mt-4 text-lg leading-8 text-secondary">{selected.summary}</p>
            <div className="mt-6 grid gap-3 border-y border-gray-200 py-5 text-sm text-secondary sm:grid-cols-2">
              {selected.location && <p className="flex items-center gap-2"><MapPinIcon className="h-5 w-5 text-primary" />{selected.location}</p>}
              {selected.schedule && <p className="flex items-center gap-2"><ClockIcon className="h-5 w-5 text-primary" />{selected.schedule}</p>}
              {selected.compensation && <p className="flex items-center gap-2"><BriefcaseIcon className="h-5 w-5 text-primary" />{selected.compensation}</p>}
              {selected.closing_date && <p className="flex items-center gap-2"><CalendarDaysIcon className="h-5 w-5 text-primary" />Apply by {new Date(`${selected.closing_date}T12:00:00`).toLocaleDateString()}</p>}
            </div>
            {selected.description && <div className="mt-7 whitespace-pre-wrap leading-7 text-secondary">{selected.description}</div>}
            {selected.responsibilities?.length > 0 && (
              <section className="mt-8">
                <h2 className="font-serif text-2xl font-bold text-secondary-dark">Responsibilities</h2>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-secondary">
                  {selected.responsibilities.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            )}
            {selected.requirements?.length > 0 && (
              <section className="mt-8">
                <h2 className="font-serif text-2xl font-bold text-secondary-dark">What we are looking for</h2>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-secondary">
                  {selected.requirements.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            )}
            <div className="mt-9 flex flex-wrap gap-3 border-t border-gray-200 pt-6">
              <Link to={`/opportunities/${selected.slug}/apply`}
                className="rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-dark">
                Apply now
              </Link>
              {session && (
                <Link to="/my-applications" className="rounded-lg border border-primary/30 px-5 py-3 font-semibold text-primary hover:bg-primary-50">
                  My applications
                </Link>
              )}
            </div>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div>
      <div className="page-banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1>Opportunities</h1>
          <p>Use your gifts, serve our community, and join the work happening at Freeman Heights</p>
        </div>
      </div>
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="inline-flex w-fit rounded-lg border border-gray-200 bg-white p-1">
              {[['all', 'All'], ['paid', 'Paid'], ['volunteer', 'Volunteer']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setFilter(value)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold ${filter === value ? 'bg-primary text-white' : 'text-secondary hover:bg-gray-50'}`}>
                  {label}
                </button>
              ))}
            </div>
            {session && <Link to="/my-applications" className="font-semibold text-primary hover:underline">View my applications</Link>}
          </div>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
          {!error && filtered.length === 0 ? (
            <div className="py-16 text-center">
              <HandRaisedIcon className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 font-serif text-2xl font-bold text-secondary-dark">No open opportunities right now</h2>
              <p className="mt-2 text-secondary-light">Please check back soon as new ways to serve and work with us are added.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
