import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { PlayIcon } from '@heroicons/react/24/solid'

function getYouTubeEmbedId(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\s]+)/)
  return match ? match[1] : null
}

export default function SermonArchive() {
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let query = supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
      .limit(24)

    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,speaker.ilike.%${search}%,scripture_reference.ilike.%${search}%`)
    }

    query.then(({ data }) => {
      setSermons(data || [])
      setLoading(false)
    })
  }, [search])

  return (
    <div>
      <div className="mb-6">
        <input
          type="search"
          placeholder="Search sermons by title, speaker, or Scripture..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl h-72 animate-pulse shadow-md" />
            ))}
          </>
        )}
        {!loading && sermons.map((sermon) => {
          const videoId = getYouTubeEmbedId(sermon.video_url)
          return (
            <div
              key={sermon.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100"
            >
              <a href={sermon.video_url || '#'} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="aspect-video bg-gray-900 relative">
                  {videoId ? (
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
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
              </a>
              <div className="p-4">
                <p className="text-sm text-primary font-medium">{sermon.speaker}</p>
                <h3 className="font-semibold text-secondary-dark mt-1">{sermon.title}</h3>
                {sermon.scripture_reference && (
                  <p className="text-sm text-secondary-light mt-1">{sermon.scripture_reference}</p>
                )}
                <p className="text-sm text-secondary-light mt-1">
                  {format(new Date(sermon.sermon_date), 'MMM d, yyyy')}
                </p>
                {(sermon.notes_url || sermon.audio_url) && (
                  <div className="flex gap-2 mt-2">
                    {sermon.notes_url && (
                      <a
                        href={sermon.notes_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Download Notes
                      </a>
                    )}
                    {sermon.audio_url && (
                      <a
                        href={sermon.audio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Listen
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {!loading && sermons.length === 0 && (
        <p className="text-center text-secondary-light py-12">No sermons found.</p>
      )}
    </div>
  )
}
