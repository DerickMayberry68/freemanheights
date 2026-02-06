import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

// Update with actual giving platform URLs when available
const GIVING_PLATFORM_URL = 'https://pushpay.com'
const PLACEHOLDER_URL = '#'

export default function GivePage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-secondary-dark mb-2">Give</h1>
          <p className="text-secondary-light">
            Thank you for your generosity. Your giving helps Freeman Heights fulfill our mission.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
          <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <CurrencyDollarIcon className="h-10 w-10 text-primary" />
          </div>
          <p className="text-secondary-light">
            Online giving is available through our secure giving platform. Click below to make a one-time or recurring gift.
          </p>
          <a
            href={GIVING_PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full max-w-sm py-4 bg-primary hover:bg-primary-dark text-secondary-dark font-bold rounded-lg transition-colors"
          >
            Give Online →
          </a>
          <p className="text-sm text-secondary-light">
            You can also give in person during any of our services.
          </p>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left">
          <h3 className="font-semibold text-secondary-dark mb-2">Other Ways to Give</h3>
          <ul className="text-secondary-light space-y-1 text-sm">
            <li>• In person at 522 Freeman Street, Berryville, AR 72616</li>
            <li>• Mail checks payable to Freeman Heights Baptist Church</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
