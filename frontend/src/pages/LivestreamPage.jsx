import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import LivePlayer from '../components/livestream/LivePlayer'
import SermonArchive from '../components/livestream/SermonArchive'

export default function LivestreamPage() {
  const [livestreamUrl, setLivestreamUrl] = useState(null)

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'livestream_url').maybeSingle().then(({ data }) => {
      setLivestreamUrl(data?.value?.trim() || null)
    })
  }, [])

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary-dark mb-2">Livestream</h1>
          <p className="text-secondary-light">Join us live or catch up on previous sermons</p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-secondary-dark mb-6">Live Now</h2>
          <LivePlayer videoUrl={livestreamUrl} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-secondary-dark mb-6">Previous Sermons</h2>
          <SermonArchive />
        </div>
      </div>
    </div>
  )
}
