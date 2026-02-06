import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { PlayIcon } from '@heroicons/react/24/solid'
import { getYouTubeThumbnail } from '../../lib/constants'

export default function SermonArchive() {
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef(null)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearch(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  useEffect(() => {
    let query = supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
      .limit(24)

    if (debouncedSearch.trim()) {
      query = query.or(`title.ilike.%${debouncedSearch}%,speaker.ilike.%${debouncedSearch}%,scripture_reference.ilike.%${debouncedSearch}%`)
    }

    query.then(({ data }) => {
      setSermons(data || [])
      setLoading(false)
    })
  }, [debouncedSearch])

  return (
    <div>
      <div className="mb-8">
        <input
          type="search"
          placeholder="Search sermons by title, speaker, or Scripture..."
          value={search}
          onChange={handleSearchChange}
          className="w-full max-w-md px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl h-72 animate-pulse border border-primary/10" />
            ))}
          </>
        )}
        {!loading && sermons.map((sermon) => {
          const thumbnail = getYouTubeThumbnail(sermon.video_url)
          return (
            <div
              key={sermon.id}
              className="bg-white rounded-xl overflow-hidden border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <a href={sermon.video_url || '#'} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="aspect-video bg-cream-dark relative">
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
              </a>
              <div className="p-5">
                <p className="text-sm text-primary font-medium">{sermon.speaker}</p>
                <h3 className="font-semibold text-secondary-dark mt-1">{sermon.title}</h3>
                {sermon.scripture_reference && (
                  <p className="text-sm text-secondary-light mt-1">{sermon.scripture_reference}</p>
                )}
                <p className="text-sm text-secondary-light mt-1">
                  {format(new Date(sermon.sermon_date), 'MMM d, yyyy')}
                </p>
                {(sermon.notes_url || sermon.audio_url) && (
                  <div className="flex gap-3 mt-3 pt-3 border-t border-primary/10">
                    {sermon.notes_url && (
                      <a
                        href={sermon.notes_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                      >
                        Download Notes
                      </a>
                    )}
                    {sermon.audio_url && (
                      <a
                        href={sermon.audio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
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
        <p className="text-center text-secondary-light py-14">No sermons found.</p>
      )}
    </div>
  )
}
