import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

const GIVING_PLATFORM_URL = 'https://pushpay.com'

export default function GivePage() {
  return (
    <div>
      <div className="page-banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1>Give</h1>
          <p>Thank you for your generosity. Your giving helps Freeman Heights fulfill our mission.</p>
        </div>
      </div>

      <div className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-primary/10 p-10 text-center">
            <div className="w-20 h-20 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-6">
              <CurrencyDollarIcon className="h-10 w-10 text-primary" />
            </div>
            <p className="text-secondary-light mb-8 max-w-md mx-auto">
              Online giving is available through our secure giving platform. Click below to make a one-time or recurring gift.
            </p>
            <a
              href={GIVING_PLATFORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full max-w-sm py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
            >
              Give Online &rarr;
            </a>
            <p className="text-sm text-secondary-light mt-6">
              You can also give in person during any of our services.
            </p>
          </div>

          <div className="mt-8 p-6 bg-cream-dark rounded-xl border border-primary/10">
            <h3 className="font-serif font-semibold text-secondary-dark mb-3">Other Ways to Give</h3>
            <ul className="text-secondary-light space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&bull;</span>
                In person at 522 Freeman Street, Berryville, AR 72616
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">&bull;</span>
                Mail checks payable to Freeman Heights Baptist Church
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
