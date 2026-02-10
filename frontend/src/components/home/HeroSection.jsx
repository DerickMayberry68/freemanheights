import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const HERO_SLIDES = [
  {
    type: 'image',
    image: '/images/linen1BG.jpeg',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
  {
    type: 'image',
    image: '/images/linen2BG.jpeg',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
  {
    type: 'image',
    image: '/images/parchmentBG.jpg',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },
]

export default function HeroSection() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length)
        setIsTransitioning(false)
      }, 500)
    }, 20000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative h-[70vh] min-h-[400px] flex items-center justify-center bg-primary-dark overflow-hidden">
      {/* Carousel backgrounds */}
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlideIndex && !isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
          {slide.overlay && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: slide.overlay }}
            />
          )}
        </div>
      ))}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        <img
          src="/images/redLogo.png"
          alt="Freeman Heights Baptist Church"
          className="h-64 md:h-80 w-auto object-contain mb-6 drop-shadow-2xl"
        />
        <p className="text-xl text-white/90 mb-2 font-serif italic">
          Growing in faith. Serving our community. Sharing Christ&apos;s love.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/livestream"
            className="px-8 py-4 bg-primary hover:bg-primary-light text-secondary-dark font-semibold rounded-lg shadow-lg transition-colors"
          >
            Watch Livestream
          </Link>
          <Link
            to="/give"
            className="px-8 py-4 bg-white/90 hover:bg-white text-secondary-dark font-semibold rounded-lg shadow-lg transition-colors"
          >
            Give Online
          </Link>
          <Link
            to="/calendar"
            className="px-8 py-4 border-2 border-white text-white hover:bg-white/10 font-semibold rounded-lg transition-colors"
          >
            View Calendar
          </Link>
        </div>
      </div>
    </section>
  )
}
