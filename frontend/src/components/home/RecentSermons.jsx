import { Link } from 'react-router-dom'
import { useSermons } from '../../lib/hooks'
import { format } from 'date-fns'
import { PlayIcon } from '@heroicons/react/24/solid'
import { getYouTubeVideoId, getYouTubeThumbnail } from '../../lib/constants'

export default function RecentSermons() {
  const { data: sermons, loading } = useSermons(4)

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-secondary-dark mb-3">Recent Sermons</h2>
            <div className="w-12 h-0.5 bg-primary" />
          </div>
          <Link
            to="/livestream"
            className="text-primary font-medium hover:text-primary-dark transition-colors hidden sm:flex items-center gap-1"
          >
            View All Sermons <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-cream rounded-xl h-64 animate-pulse border border-primary/10" />
              ))}
            </>
          )}
          {!loading && sermons.length === 0 && (
            <div className="col-span-full text-center py-14 text-secondary-light">
              <PlayIcon className="h-16 w-16 mx-auto mb-4 text-primary/30" />
              <p>No sermons available yet. Check back after our next service!</p>
            </div>
          )}
          {!loading && sermons.map((sermon) => {
            const thumbnail = getYouTubeThumbnail(sermon.video_url)
            return (
              <Link
                key={sermon.id}
                to="/livestream"
                className="block bg-white rounded-xl overflow-hidden border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <div className="aspect-video bg-secondary-dark/5 relative">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={sermon.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-cream-dark flex items-center justify-center">
                      <PlayIcon className="h-14 w-14 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-secondary-dark/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <PlayIcon className="h-7 w-7 text-primary ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-primary font-medium">{sermon.speaker}</p>
                  <h3 className="font-semibold text-secondary-dark mt-1 line-clamp-2 group-hover:text-primary transition-colors">{sermon.title}</h3>
                  <p className="text-sm text-secondary-light mt-1">
                    {format(new Date(sermon.sermon_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link to="/livestream" className="text-primary font-medium hover:text-primary-dark transition-colors">
            View All Sermons &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
