import { PlayCircleIcon } from '@heroicons/react/24/solid'
import { CHURCH, getSubsplashEmbedUrl, getYouTubeEmbedUrl } from '../../lib/constants'

export default function LivePlayer({ videoUrl }) {
  const embedUrl = getSubsplashEmbedUrl(videoUrl) || getYouTubeEmbedUrl(videoUrl)
  const isDirectVideo = videoUrl && !embedUrl && (videoUrl.startsWith('http') && /\.(webm|mp4|m3u8)/i.test(videoUrl) || videoUrl.includes('/storage/'))

  if (embedUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-primary/15 bg-secondary-dark shadow-xl shadow-secondary-dark/10">
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
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-primary/15 bg-secondary-dark shadow-xl shadow-secondary-dark/10">
        <video src={videoUrl} controls autoPlay playsInline className="w-full h-full" />
      </div>
    )
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-primary/15 bg-cream-dark flex items-center justify-center">
      <div className="max-w-md px-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary shadow-sm">
          <PlayCircleIcon className="h-10 w-10" />
        </div>
        <p className="mb-2 font-serif text-2xl font-semibold text-secondary-dark">Livestream not currently active</p>
        <p className="text-sm leading-6 text-secondary-light">
          Join us in person at {CHURCH.fullAddress}, or check back during Sunday service times for the live stream.
        </p>
      </div>
    </div>
  )
}
