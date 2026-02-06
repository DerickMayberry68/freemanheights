import { Link } from 'react-router-dom'
import { useSermons } from '../../lib/hooks'
import { format } from 'date-fns'
import { PlayIcon } from '@heroicons/react/24/solid'
import { getYouTubeVideoId, getYouTubeThumbnail } from '../../lib/constants'

export default function RecentSermons() {
  const { data: sermons, loading } = useSermons(4)

  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-secondary-dark mb-2">Recent Sermons</h2>
            <p className="text-secondary-light">Catch up on recent messages</p>
          </div>
          <Link
            to="/livestream"
            className="text-primary font-semibold hover:underline hidden sm:block"
          >
            View All Sermons →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
              ))}
            </>
          )}
          {!loading && sermons.length === 0 && (
            <div className="col-span-full text-center py-12 text-secondary-light">
              <PlayIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No sermons available yet. Check back after our next service!</p>
            </div>
          )}
          {!loading && sermons.map((sermon) => {
            const thumbnail = getYouTubeThumbnail(sermon.video_url)
            return (
              <Link
                key={sermon.id}
                to="/livestream"
                className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 group"
              >
                <div className="aspect-video bg-gray-900 relative">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={sermon.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <PlayIcon className="h-16 w-16 text-white/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayIcon className="h-14 w-14 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-primary font-medium">{sermon.speaker}</p>
                  <h3 className="font-semibold text-secondary-dark mt-1 line-clamp-2">{sermon.title}</h3>
                  <p className="text-sm text-secondary-light mt-1">
                    {format(new Date(sermon.sermon_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link to="/livestream" className="text-primary font-semibold hover:underline">
            View All Sermons →
          </Link>
        </div>
      </div>
    </section>
  )
}
