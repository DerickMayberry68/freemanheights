import { Link } from 'react-router-dom'
import { useServiceTimes } from '../../lib/hooks'
import { ClockIcon } from '@heroicons/react/24/outline'
import { CHURCH } from '../../lib/constants'

const fallbackTimes = [
  { day_of_week: 'Sunday', time: '10:30 AM', service_type: 'Sunday Morning Worship' },
  { day_of_week: 'Sunday', time: '6:00 PM', service_type: 'Sunday Evening' },
  { day_of_week: 'Wednesday', time: '6:00 PM', service_type: 'Midweek Service' },
]

export default function ServiceTimes() {
  const { data: serviceTimes, loading } = useServiceTimes()
  const times = serviceTimes.length > 0 ? serviceTimes : fallbackTimes

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-serif font-bold text-secondary-dark mb-3">Join Us for Worship</h2>
          <div className="section-divider mb-4" />
          <p className="text-secondary-light">We would love to see you this week</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {!loading && times.map((st) => (
            <div
              key={st.id || `${st.day_of_week}-${st.time}`}
              className="bg-cream rounded-xl p-8 text-center border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                <ClockIcon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-secondary-dark">{st.day_of_week}</h3>
              <p className="text-2xl font-bold text-primary mt-2">{st.time}</p>
              <p className="text-secondary-light mt-1">{st.service_type}</p>
            </div>
          ))}
          {loading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-cream rounded-xl p-8 animate-pulse border border-primary/10">
                  <div className="h-14 w-14 bg-primary/10 rounded-full mx-auto mb-4" />
                  <div className="h-5 bg-primary/10 rounded w-24 mx-auto mb-2" />
                  <div className="h-8 bg-primary/10 rounded w-32 mx-auto mb-2" />
                </div>
              ))}
            </>
          )}
        </div>
        <p className="text-center mt-10 text-secondary-light">
          {CHURCH.fullAddress} &middot;{' '}
          <Link to="/explore" className="text-primary hover:text-primary-dark font-medium transition-colors">Get Directions</Link>
        </p>
      </div>
    </section>
  )
}
