import { getYouTubeEmbedUrl } from '../../lib/constants'
import { CHURCH } from '../../lib/constants'

export default function LivePlayer({ videoUrl }) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl)
  const isDirectVideo = videoUrl && !embedUrl && (videoUrl.startsWith('http') && /\.(webm|mp4|m3u8)/i.test(videoUrl) || videoUrl.includes('/storage/'))

  if (embedUrl) {
    return (
      <div className="aspect-video w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-xl bg-black">
        <iframe
          src={embedUrl}
          title="Livestream"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  if (isDirectVideo) {
    return (
      <div className="aspect-video w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-xl bg-black">
        <video src={videoUrl} controls autoPlay playsInline className="w-full h-full" />
      </div>
    )
  }

  return (
    <div className="aspect-video w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-xl bg-secondary-dark/90 flex items-center justify-center text-white">
      <div className="text-center px-6">
        <p className="text-xl font-medium mb-2">Livestream not currently active</p>
        <p className="text-white/80">Join us in person at {CHURCH.fullAddress} — or check back during service times for the live stream.</p>
      </div>
    </div>
  )
}
