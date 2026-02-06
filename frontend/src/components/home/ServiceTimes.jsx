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
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-secondary-dark mb-2">Join Us for Worship</h2>
          <p className="text-secondary-light">We would love to see you this week</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {!loading && times.map((st) => (
            <div
              key={st.id || `${st.day_of_week}-${st.time}`}
              className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow"
            >
              <ClockIcon className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-secondary-dark">{st.day_of_week}</h3>
              <p className="text-2xl font-bold text-primary mt-2">{st.time}</p>
              <p className="text-secondary-light mt-1">{st.service_type}</p>
            </div>
          ))}
          {loading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 rounded mx-auto mb-3" />
                  <div className="h-5 bg-gray-200 rounded w-24 mx-auto mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-2" />
                </div>
              ))}
            </>
          )}
        </div>
        <p className="text-center mt-8 text-secondary-light">
          {CHURCH.fullAddress} •{' '}
          <Link to="/explore" className="text-primary hover:underline">Get Directions</Link>
        </p>
      </div>
    </section>
  )
}
