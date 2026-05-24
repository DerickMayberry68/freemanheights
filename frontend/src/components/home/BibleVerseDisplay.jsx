import { useState, useEffect } from 'react'
import { useBibleVerseRotationSeconds, useBibleVerses } from '../../lib/hooks'

/** Shown when Supabase has no rows or env is not configured (mock client returns []). */
const FALLBACK_VERSES = [
  {
    verse_text:
      'I can do all this through him who gives me strength.',
    reference: 'Philippians 4:13',
  },
]

export default function BibleVerseDisplay() {
  const { data: verses, loading } = useBibleVerses()
  const { seconds: rotationSeconds } = useBibleVerseRotationSeconds()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [fadeIn, setFadeIn] = useState(true)

  const displayVerses = verses.length > 0 ? verses : FALLBACK_VERSES

  // Auto-rotate verses
  useEffect(() => {
    if (displayVerses.length === 0 || isPaused) return

    const intervalId = setInterval(() => {
      setFadeIn(false)

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % displayVerses.length)
        setFadeIn(true)
      }, 1000)
    }, rotationSeconds * 1000)

    return () => clearInterval(intervalId)
  }, [displayVerses.length, isPaused, rotationSeconds])

  useEffect(() => {
    setCurrentIndex(0)
  }, [verses])

  if (loading) {
    return (
      <section className="bg-cream border-y border-primary/10 py-14" aria-label="Scripture">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-xl border border-primary/10 bg-white/90 px-6 py-8 shadow-sm md:px-10 md:py-10 animate-pulse">
            <div className="mx-auto h-24 max-w-2xl rounded bg-secondary-dark/10" />
            <div className="mx-auto mt-4 h-5 w-40 rounded bg-primary/20" />
          </div>
        </div>
      </section>
    )
  }

  const currentVerse = displayVerses[currentIndex]

  return (
    <section
      className="bg-cream border-y border-primary/10 py-14"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Scripture"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div
          className={`rounded-xl border border-primary/10 bg-white/90 px-6 py-8 shadow-sm transition-opacity duration-1000 md:px-10 md:py-10 ${
            fadeIn ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-center font-serif text-lg italic leading-relaxed text-secondary-dark md:text-xl">
            &quot;{currentVerse.verse_text}&quot;
          </p>
          <p className="mt-4 text-center text-sm font-semibold text-primary md:text-base">
            — {currentVerse.reference}
          </p>
        </div>
      </div>
    </section>
  )
}
