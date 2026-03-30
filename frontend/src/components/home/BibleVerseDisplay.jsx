import { useState, useEffect } from 'react'
import { useBibleVerses } from '../../lib/hooks'

export default function BibleVerseDisplay() {
  const { data: verses, loading } = useBibleVerses()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [fadeIn, setFadeIn] = useState(true)

  // Auto-rotate verses
  useEffect(() => {
    if (verses.length === 0 || isPaused) return

    const intervalId = setInterval(() => {
      setFadeIn(false)

      // After fade out, change verse and fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % verses.length)
        setFadeIn(true)
      }, 1000) // 1 second fade transition
    }, 8000) // 8 seconds total (7s display + 1s transition)

    return () => clearInterval(intervalId)
  }, [verses, isPaused])

  if (loading || verses.length === 0) return null

  const currentVerse = verses[currentIndex]

  return (
    <div
      className="bg-primary-dark py-6 px-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={`max-w-3xl mx-auto text-center transition-opacity duration-1000 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-white/90 font-serif italic text-lg md:text-xl leading-relaxed mb-2">
          &quot;{currentVerse.verse_text}&quot;
        </p>
        <p className="text-white/60 text-sm md:text-base font-semibold">
          — {currentVerse.reference}
        </p>
      </div>
    </div>
  )
}
