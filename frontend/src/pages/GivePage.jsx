import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { CurrencyDollarIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function GivePage() {
  const [comingSoonOpen, setComingSoonOpen] = useState(false)

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
            <button
              type="button"
              onClick={() => setComingSoonOpen(true)}
              className="inline-block w-full max-w-sm py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
            >
              Give Online &rarr;
            </button>
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

      <Dialog open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-secondary-dark/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
                  <CurrencyDollarIcon className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="font-serif text-2xl font-semibold text-secondary-dark">
                  Online Giving Coming Soon
                </DialogTitle>
                <p className="mt-3 text-sm leading-6 text-secondary-light">
                  We&apos;re preparing online giving for Freeman Heights. For now, please give in person during services or mail checks payable to Freeman Heights Baptist Church.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComingSoonOpen(false)}
                className="rounded-lg p-2 text-secondary-light hover:bg-primary-50 hover:text-secondary-dark"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setComingSoonOpen(false)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
