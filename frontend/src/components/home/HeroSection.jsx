import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import WordMontage from './WordMontage'

const connectionUrl = 'https://www.freemanheights.com/connect?source=website-hero'

export default function HeroSection() {
  return (
    <section className="relative h-[70vh] min-h-[400px] flex items-center justify-center bg-primary-dark overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/7441736.jpg')" }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        />
      </div>

      {/* Word Montage */}
      <WordMontage />

      {/* Logo — centered in hero */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center -translate-y-[50px]">
        <img
          src="/images/newlogo.png"
          alt="Freeman Heights Baptist Church"
          className="h-[30rem] md:h-[38rem] w-auto object-contain drop-shadow-2xl"
        />
      </div>

      {/* Buttons — anchored 5px from bottom of hero */}
      <div className="absolute bottom-[5px] left-0 right-0 z-10 flex flex-wrap justify-center gap-4 px-4">
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
        <Link
          to="/connect?source=website-hero"
          className="px-8 py-4 bg-accent hover:bg-accent-warm text-secondary-dark font-semibold rounded-lg shadow-lg transition-colors xl:hidden"
        >
          Connect With Us
        </Link>
      </div>

      <Link
        to="/connect?source=website-hero"
        aria-label="Open the Freeman Heights connection card"
        className="absolute bottom-20 right-5 z-20 hidden items-center gap-3 rounded-lg bg-white p-3 text-secondary-dark shadow-xl transition-transform hover:-translate-y-1 xl:flex"
      >
        <QRCodeSVG
          value={connectionUrl}
          size={88}
          level="M"
          bgColor="#ffffff"
          fgColor="#0f2057"
          title="Freeman Heights connection card QR code"
        />
        <span className="max-w-28 text-left">
          <span className="block text-xs font-semibold uppercase text-primary">New here?</span>
          <span className="mt-1 block text-sm font-bold leading-5">Scan to connect with us</span>
        </span>
      </Link>
    </section>
  )
}
