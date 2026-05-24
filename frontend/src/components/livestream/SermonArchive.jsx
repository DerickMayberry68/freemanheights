import { useMemo, useState, useEffect, useRef } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { supabase } from '../../lib/supabase'
import { format, parseISO } from 'date-fns'
import { PlayIcon } from '@heroicons/react/24/solid'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
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
  const [archiveSearch, setArchiveSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'sermon_date', direction: 'desc' })

  const sortOptions = [
    { key: 'sermon_date', label: 'Date', className: 'w-36' },
    { key: 'title', label: 'Title', className: 'min-w-64' },
    { key: 'speaker', label: 'Speaker', className: 'w-48' },
    { key: 'scripture_reference', label: 'Scripture', className: 'w-44' },
  ]

  const filteredSermons = useMemo(() => {
    const normalizedSearch = archiveSearch.trim().toLowerCase()

    return sermons
      .filter((sermon) => {
        if (!normalizedSearch) return true

        const sermonDate = sermon.sermon_date ? format(parseISO(sermon.sermon_date), 'MMMM d, yyyy') : ''
        return [
          sermon.title,
          sermon.speaker || 'Freeman Heights',
          sermon.scripture_reference,
          sermonDate,
        ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
      })
      .sort((a, b) => {
        const direction = sortConfig.direction === 'asc' ? 1 : -1
        const first = getSortValue(a, sortConfig.key)
        const second = getSortValue(b, sortConfig.key)

        if (first < second) return -1 * direction
        if (first > second) return 1 * direction
        return 0
      })
  }, [archiveSearch, sermons, sortConfig])

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return '+'
    return sortConfig.direction === 'asc' ? 'ASC' : 'DESC'
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-secondary-dark/60" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="mx-auto flex min-h-full max-w-6xl items-center">
          <DialogPanel className="w-full overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-primary/10 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <DialogTitle className="font-serif text-2xl font-semibold text-secondary-dark">Complete Archive</DialogTitle>
                <p className="mt-1 text-sm text-secondary-light">
                  {filteredSermons.length} of {sermons.length} livestreams
                </p>
              </div>
              <button type="button" onClick={onClose} className="self-end rounded-lg p-2 text-secondary-light hover:bg-primary-50 hover:text-secondary-dark md:self-auto">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-primary/10 bg-cream/40 p-5">
              <label htmlFor="archive-search" className="sr-only">Search archive</label>
              <div className="relative max-w-xl">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-light" />
                <input
                  id="archive-search"
                  type="search"
                  value={archiveSearch}
                  onChange={(event) => setArchiveSearch(event.target.value)}
                  placeholder="Search by title, speaker, Scripture, or date..."
                  className="w-full rounded-lg border border-primary/20 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="max-h-[68vh] overflow-y-auto">
              <div className="hidden min-w-full md:block">
                <table className="min-w-full divide-y divide-primary/10">
                  <thead className="sticky top-0 z-10 bg-white shadow-sm">
                    <tr>
                      {sortOptions.map((option) => (
                        <th key={option.key} scope="col" className={`${option.className} px-5 py-3 text-left`}>
                          <button
                            type="button"
                            onClick={() => handleSort(option.key)}
                            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-secondary-light hover:text-primary"
                          >
                            {option.label}
                            <span className="text-sm leading-none text-primary">{sortIndicator(option.key)}</span>
                          </button>
                        </th>
                      ))}
                      <th scope="col" className="w-24 px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-secondary-light">
                        Watch
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10 bg-white">
                    {filteredSermons.map((sermon) => (
                      <tr key={sermon.id} className="group hover:bg-cream/70">
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-primary">
                          {format(parseISO(sermon.sermon_date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => onSelect(sermon)}
                            className="text-left font-semibold leading-snug text-secondary-dark hover:text-primary"
                          >
                            {sermon.title}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-sm text-secondary-light">{sermon.speaker || 'Freeman Heights'}</td>
                        <td className="px-5 py-4 text-sm text-secondary-light">{sermon.scripture_reference || '—'}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => onSelect(sermon)}
                            className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
                          >
                            Play
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-primary/10 md:hidden">
                {filteredSermons.map((sermon) => (
                  <button
                    key={sermon.id}
                    type="button"
                    onClick={() => onSelect(sermon)}
                    className="block w-full px-5 py-4 text-left hover:bg-cream"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-secondary-dark">{sermon.title}</p>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        Play
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-secondary-light">
                      <span>{format(parseISO(sermon.sermon_date), 'MMM d, yyyy')}</span>
                      <span>{sermon.speaker || 'Freeman Heights'}</span>
                      {sermon.scripture_reference && <span>{sermon.scripture_reference}</span>}
                    </div>
                  </button>
                ))}
              </div>

              {filteredSermons.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <p className="font-serif text-2xl font-semibold text-secondary-dark">No sermons found</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary-light">
                    Try a different title, speaker, Scripture, or date.
                  </p>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

function getSortValue(sermon, key) {
  if (key === 'sermon_date') return sermon.sermon_date || ''
  return String(sermon[key] || '').toLowerCase()
}
