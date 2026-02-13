import { HandRaisedIcon } from '@heroicons/react/24/outline'
import PrayerRequestForm from './PrayerRequestForm'

export default function PrayerRequestSection({
  title = 'Prayer Request',
  description = 'We would love to pray for you and your needs',
  backgroundColor = 'bg-white',
  showIcon = true
}) {
  return (
    <section className={`py-20 ${backgroundColor}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          {showIcon && (
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
              <HandRaisedIcon className="h-7 w-7 text-primary" />
            </div>
          )}
          <h2 className="text-3xl font-serif font-bold text-secondary-dark mb-3">{title}</h2>
          <div className="w-12 h-0.5 bg-primary mx-auto mb-4" />
          <p className="text-secondary-light">{description}</p>
        </div>
        <div className="max-w-2xl mx-auto">
          <PrayerRequestForm />
        </div>
      </div>
    </section>
  )
}
