import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvents } from '../../lib/hooks'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

export default function EventTicker() {
  const { data: events, loading: eventsLoading } = useEvents(5, {
    includeCancelled: true,
    fromStartOfDay: true,
    daysAhead: 7,
  })
  const [opportunities, setOpportunities] = useState([])
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('opportunities')
      .select('id, title, slug, closing_date')
      .eq('opportunity_type', 'paid')
      .eq('status', 'published')
      .order('display_order')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        if (error) {
          console.error('Ticker opportunities load failed:', error)
          setOpportunities([])
        } else {
          const today = new Date().toISOString().slice(0, 10)
          setOpportunities((data || []).filter((opportunity) => (
            !opportunity.closing_date || opportunity.closing_date >= today
          )))
        }
        setOpportunitiesLoading(false)
      })
  }, [])

  const loading = eventsLoading || opportunitiesLoading
  const tickerItems = [
    ...events.map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      to: `/calendar?event=${event.id}`,
      detail: format(new Date(event.event_date), 'EEE, MMM d'),
      cancelled: event.is_cancelled,
      type: 'Event',
    })),
    ...opportunities.map((opportunity) => ({
      id: `opportunity-${opportunity.id}`,
      title: opportunity.title,
      to: `/opportunities/${opportunity.slug}`,
      detail: opportunity.closing_date
        ? `Apply by ${format(new Date(`${opportunity.closing_date}T12:00:00`), 'MMM d')}`
        : 'Open until filled',
      cancelled: false,
      type: 'Opportunity',
    })),
  ]

  return (
    <div className="bg-primary-dark text-white flex items-stretch" style={{ height: '2.5rem' }}>
      <div className="flex items-center gap-2 px-4 shrink-0 bg-primary z-10 text-white/90 text-xs font-semibold tracking-widest uppercase">
        <CalendarDaysIcon className="h-4 w-4" />
        <span>Events</span>
      </div>

      <div className="relative flex-1 overflow-hidden flex items-center">
        {loading && (
          <div className="px-6 text-sm text-white/50 animate-pulse">Loading events...</div>
        )}
        {!loading && tickerItems.length === 0 && (
          <Link
            to="/calendar"
            className="px-6 text-sm text-white/85 hover:text-white transition-colors"
          >
            View our calendar for upcoming services and activities -&gt;
          </Link>
        )}
        {!loading && tickerItems.length > 0 && (
          <div className="absolute inset-y-0 flex items-center animate-ticker whitespace-nowrap hover:[animation-play-state:paused]">
            {tickerItems.map((item, index) => (
              <Link
                key={item.id}
                to={item.to}
                className="inline-flex items-center gap-2 px-8 text-sm text-white/80 hover:text-white transition-colors shrink-0"
              >
                {item.type === 'Opportunity' && (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[0.625rem] font-bold uppercase text-secondary-dark">
                    Opportunity
                  </span>
                )}
                <span className="font-medium text-white/95">
                  {item.title}
                  {item.cancelled && (
                    <span className="ml-1 text-red-300">(Cancelled)</span>
                  )}
                </span>
                <span className="text-primary-light text-xs">
                  {item.detail}
                </span>
                {index < tickerItems.length - 1 && (
                  <span className="text-white/30 mx-4">{'\u2022'}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
