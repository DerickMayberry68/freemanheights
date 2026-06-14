import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

export default function OpenPositionsSection() {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('opportunities')
      .select('id, title, slug, summary, location, schedule, closing_date')
      .eq('opportunity_type', 'paid')
      .eq('status', 'published')
      .order('display_order')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Open positions load failed:', error)
          setPositions([])
        } else {
          const today = new Date().toISOString().slice(0, 10)
          setPositions((data || []).filter((position) => (
            !position.closing_date || position.closing_date >= today
          )))
        }
        setLoading(false)
      })
  }, [])

  if (loading || positions.length === 0) return null

  return (
    <section className="border-y border-primary/10 bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Now Hiring</p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-secondary-dark">Open Positions</h2>
            <div className="mt-3 h-0.5 w-12 bg-accent" />
          </div>
          <Link to="/opportunities" className="hidden font-semibold text-primary hover:underline sm:inline-flex">
            View all opportunities <span aria-hidden="true">&nbsp;&rarr;</span>
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {positions.map((position) => (
            <article key={position.id} className="flex flex-col rounded-lg border border-gray-200 bg-cream/40 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-primary-50 p-2.5 text-primary">
                  <BriefcaseIcon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-secondary-dark">{position.title}</h3>
                  <p className="mt-2 leading-7 text-secondary">{position.summary}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-secondary-light">
                {position.location && <span className="inline-flex items-center gap-1.5"><MapPinIcon className="h-4 w-4" />{position.location}</span>}
                {position.schedule && <span className="inline-flex items-center gap-1.5"><ClockIcon className="h-4 w-4" />{position.schedule}</span>}
              </div>
              <Link to={`/opportunities/${position.slug}`}
                className="mt-6 inline-flex w-fit rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-dark">
                View position
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-7 sm:hidden">
          <Link to="/opportunities" className="font-semibold text-primary hover:underline">
            View all opportunities &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
