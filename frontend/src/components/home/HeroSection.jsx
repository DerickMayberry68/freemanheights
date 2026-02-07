import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const HERO_IMAGES = [
  '/images/background.png',
  '/images/FHChurch2.jpg',
  '/images/FHChurch3.jpg',
]

export default function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length)
        setIsTransitioning(false)
      }, 500) // Half second for fade transition
    }, 10000) // Change image every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative h-[70vh] min-h-[400px] flex items-center justify-center bg-secondary-dark overflow-hidden">
      {/* Carousel images */}
      {HERO_IMAGES.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            index === currentImageIndex && !isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${image}')` }}
        />
      ))}
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        <img
          src="/images/logo_update2.png"
          alt="Freeman Heights Baptist Church"
          className="h-80 md:h-[32rem] w-auto object-contain mb-2 drop-shadow-lg"
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
