import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import LivePlayer from '../components/livestream/LivePlayer'
import SermonArchive from '../components/livestream/SermonArchive'
import { CHURCH, LIVESTREAM } from '../lib/constants'
import { CalendarDaysIcon, MapPinIcon, RadioIcon } from '@heroicons/react/24/outline'

export default function LivestreamPage() {
  const [livestreamUrl, setLivestreamUrl] = useState(LIVESTREAM.defaultLiveUrl)

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'livestream_url').maybeSingle().then(({ data }) => {
      setLivestreamUrl(data?.value?.trim() || LIVESTREAM.defaultLiveUrl)
    })
  }, [])

  return (
    <div className="bg-cream">
      <section className="border-b border-primary/10 bg-secondary-dark text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.72fr] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/85">
              <RadioIcon className="h-4 w-4 text-primary-light" />
              Live worship from Berryville, Arkansas
            </div>
            <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl">Livestream</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
              Worship with Freeman Heights online, then browse recent services and messages anytime.
            </p>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/8 p-4">
              <div className="flex items-center gap-2 font-semibold text-white">
                <CalendarDaysIcon className="h-5 w-5 text-primary-light" />
                Service Times
              </div>
              <p className="mt-3 text-white/75">Sunday mornings at 9:30 a.m. and 10:45 a.m.</p>
              <p className="mt-1 text-white/75">Sunday evenings at 6:00 p.m.</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/8 p-4">
              <div className="flex items-center gap-2 font-semibold text-white">
                <MapPinIcon className="h-5 w-5 text-primary-light" />
                In Person
              </div>
              <a href={CHURCH.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-white/75 hover:text-white">
                {CHURCH.fullAddress}
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="py-10">
        <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <section>
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Live Now</p>
                <h2 className="mt-1 font-serif text-3xl font-bold text-secondary-dark">Watch the Current Service</h2>
              </div>
            </div>
            <LivePlayer videoUrl={livestreamUrl} />
            <p className="mt-4 text-sm leading-6 text-secondary-light">
              If the player is waiting, it will update when the next livestream is available through the church media system.
            </p>
          </section>

          <div className="grid gap-4 border-y border-primary/10 py-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-secondary-dark">Sunday Morning</p>
              <p className="mt-1 text-sm text-secondary-light">9:30 a.m. and 10:45 a.m.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-dark">Sunday Evening</p>
              <p className="mt-1 text-sm text-secondary-light">6:00 p.m.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-dark">Need Help?</p>
              <p className="mt-1 text-sm text-secondary-light">Refresh the page near service time or open the archive link.</p>
            </div>
          </div>

          <section>
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Previous Livestreams</p>
              <h2 className="mt-1 font-serif text-3xl font-bold text-secondary-dark">Recent Services</h2>
            </div>
            <SermonArchive />
          </section>
        </div>
      </div>
    </div>
  )
}
