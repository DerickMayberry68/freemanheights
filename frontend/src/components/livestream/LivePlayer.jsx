const DEFAULT_LIVESTREAM_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

function getYouTubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\s]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null
}

export default function LivePlayer({ videoUrl = DEFAULT_LIVESTREAM_URL }) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl) || getYouTubeEmbedUrl(DEFAULT_LIVESTREAM_URL)

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
