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
      className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 max-w-3xl px-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={`bg-black/30 backdrop-blur-sm rounded-lg px-6 py-4 shadow-2xl transition-opacity duration-1000 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-white font-serif italic text-lg md:text-xl text-center leading-relaxed mb-2">
          &quot;{currentVerse.verse_text}&quot;
        </p>
        <p className="text-white/80 text-sm md:text-base text-center font-semibold">
          — {currentVerse.reference}
        </p>
      </div>
    </div>
  )
}
