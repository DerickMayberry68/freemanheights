import { Link } from 'react-router-dom'
import WordMontage from './WordMontage'
import BibleVerseDisplay from './BibleVerseDisplay'

export default function HeroSection() {
  return (
    <section className="relative h-[70vh] min-h-[400px] flex items-center justify-center bg-primary-dark overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/parchmentBG.jpg')" }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        />
      </div>

      {/* Word Montage */}
      <WordMontage />

      {/* Bible Verse Display */}
      <BibleVerseDisplay />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        <img
          src="/images/redLogo2.png"
          alt="Freeman Heights Baptist Church"
          className="h-64 md:h-80 w-auto object-contain mb-6 drop-shadow-2xl"
        />
        <p className="text-xl text-white/90 mb-2 font-serif italic">
          Growing in faith. Serving our community. Sharing Christ&apos;s love.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/livestream"
            className="px-8 py-4 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            Watch Livestream
          </Link>
          <Link
            to="/give"
            className="px-8 py-4 bg-white/90 hover:bg-white text-primary hover:text-primary-dark font-semibold rounded-lg shadow-lg transition-colors"
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
