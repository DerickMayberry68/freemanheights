import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

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
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-primary/10 bg-white shadow-sm">
            <div className="border-b border-primary/10 p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                <CurrencyDollarIcon className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-serif text-3xl font-semibold text-secondary-dark">Give Online</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-secondary-light">
                Online giving is currently handled through our secure Subsplash giving platform.
              </p>
            </div>
            <iframe
              src="https://subsplash.com/u/-GQTDCX/give?embed=true"
              title="Freeman Heights online giving"
              className="h-[760px] w-full border-0"
              loading="lazy"
              allow="payment"
            />
          </div>

          <div className="mt-8 rounded-xl border border-primary/10 bg-cream-dark p-6">
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
