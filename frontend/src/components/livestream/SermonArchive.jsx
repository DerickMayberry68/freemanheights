import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { supabase } from '../../lib/supabase'
import { format, parseISO } from 'date-fns'
import { PlayIcon } from '@heroicons/react/24/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { getSubsplashEmbedUrl, getYouTubeThumbnail } from '../../lib/constants'

export default function SermonArchive() {
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedSermon, setSelectedSermon] = useState(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
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
      .limit(100)

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
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          placeholder="Search sermons by title, speaker, or Scripture..."
          value={search}
          onChange={handleSearchChange}
          className="w-full max-w-md rounded-lg border border-primary/20 bg-white px-4 py-2.5 shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={() => setArchiveOpen(true)}
          className="text-sm font-semibold text-primary hover:text-primary-dark"
        >
          View complete archive
        </button>
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
          const sermonDate = parseISO(sermon.sermon_date)
          return (
            <div
              key={sermon.id}
              className="overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <button
                type="button"
                onClick={() => setSelectedSermon(sermon)}
                className="block w-full text-left group"
              >
                <div className="aspect-video bg-cream-dark relative">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={sermon.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary-dark">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-md transition-transform group-hover:scale-105">
                        <PlayIcon className="h-8 w-8 ml-0.5" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-secondary-dark/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <PlayIcon className="h-7 w-7 text-primary ml-0.5" />
                    </div>
                  </div>
                </div>
              </button>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-primary">{sermon.speaker || 'Freeman Heights'}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-secondary-light">
                    {format(sermonDate, 'MMM d')}
                  </p>
                </div>
                <h3 className="mt-2 font-semibold leading-snug text-secondary-dark">{sermon.title}</h3>
                {sermon.scripture_reference && (
                  <p className="text-sm text-secondary-light mt-1">{sermon.scripture_reference}</p>
                )}
                <p className="mt-3 text-sm text-secondary-light">
                  {format(sermonDate, 'MMMM d, yyyy')}
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
        <div className="rounded-lg border border-primary/10 bg-white px-6 py-12 text-center shadow-sm">
          <p className="font-serif text-2xl font-semibold text-secondary-dark">No local sermons found</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-secondary-light">
            Recent services will appear here after the sermon sync job imports archive entries.
          </p>
        </div>
      )}
      <SermonPlayerModal sermon={selectedSermon} onClose={() => setSelectedSermon(null)} />
      <ArchiveModal
        open={archiveOpen}
        sermons={sermons}
        onClose={() => setArchiveOpen(false)}
        onSelect={(sermon) => {
          setArchiveOpen(false)
          setSelectedSermon(sermon)
        }}
      />
    </div>
  )
}

function SermonPlayerModal({ sermon, onClose }) {
  const playerUrl = sermon ? getSubsplashEmbedUrl(sermon.video_url) || sermon.video_url : null

  return (
    <Dialog open={Boolean(sermon)} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-secondary-dark/70" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="mx-auto flex min-h-full max-w-5xl items-center">
          <DialogPanel className="w-full overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-primary/10 p-4">
              <div>
                <DialogTitle className="font-serif text-xl font-semibold text-secondary-dark">
                  {sermon?.title}
                </DialogTitle>
                {sermon?.sermon_date && (
                  <p className="mt-1 text-sm text-secondary-light">
                    {format(parseISO(sermon.sermon_date), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-secondary-light hover:bg-primary-50 hover:text-secondary-dark">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-secondary-dark">
              {playerUrl ? (
                <iframe
                  src={playerUrl}
                  title={sermon?.title || 'Sermon player'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center px-6 text-center text-white/75">
                  This sermon does not have a video attached yet.
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

function ArchiveModal({ open, sermons, onClose, onSelect }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-secondary-dark/50" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="mx-auto flex min-h-full max-w-3xl items-center">
          <DialogPanel className="w-full rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-primary/10 p-5">
              <div>
                <DialogTitle className="font-serif text-2xl font-semibold text-secondary-dark">Complete Archive</DialogTitle>
                <p className="mt-1 text-sm text-secondary-light">Recent Freeman Heights livestreams imported into this site.</p>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-secondary-light hover:bg-primary-50 hover:text-secondary-dark">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] divide-y divide-primary/10 overflow-y-auto">
              {sermons.map((sermon) => (
                <button
                  key={sermon.id}
                  type="button"
                  onClick={() => onSelect(sermon)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-cream"
                >
                  <div>
                    <p className="font-semibold text-secondary-dark">{sermon.title}</p>
                    <p className="mt-1 text-sm text-secondary-light">{sermon.speaker || 'Freeman Heights'}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-primary">
                    {format(parseISO(sermon.sermon_date), 'MMM d, yyyy')}
                  </span>
                </button>
              ))}
              {sermons.length === 0 && (
                <p className="p-8 text-center text-secondary-light">No sermons available yet.</p>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
