import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section className="relative h-[70vh] min-h-[400px] flex items-center justify-center bg-gradient-to-br from-secondary-dark via-accent-purple/30 to-primary-dark">
      <div className="absolute inset-0 bg-[url('/church-building.jpg')] bg-cover bg-center opacity-40" />
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-4">
          Freeman Heights Baptist Church
        </h1>
        <p className="text-xl text-white/90 mb-8 font-serif italic">
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
