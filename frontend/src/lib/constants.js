export const CHURCH = {
  name: 'Freeman Heights Baptist Church',
  shortName: 'Freeman Heights',
  address: '522 Freeman Street',
  city: 'Berryville',
  state: 'AR',
  zip: '72616',
  get fullAddress() {
    return `${this.address}, ${this.city}, ${this.state} ${this.zip}`
  },
  mapsUrl: 'https://maps.google.com/?q=522+Freeman+Street+Berryville+AR+72616',
  mapsEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3185.8824454338984!2d-93.5679677!3d36.3648644!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87cf9bc00d6e5b29%3A0x0!2s522%20Freeman%20St%2C%20Berryville%2C%20AR%2072616!5e0!3m2!1sen!2sus!4v1234567890',
}

export const LIVESTREAM = {
  defaultLiveUrl: 'https://subsplash.com/u/-GQTDCX/media/embed/d/*next-live',
  publicArchiveUrl: 'https://www.freemanheights.com/previous-livestreams',
}

/**
 * Extract a YouTube video ID from a share or watch URL.
 * Returns null if the URL doesn't match.
 */
export function getYouTubeVideoId(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\s]+)/)
  return match ? match[1] : null
}

/**
 * Build a YouTube embed URL from a share/watch URL.
 * Returns null if the URL doesn't match.
 */
export function getYouTubeEmbedUrl(url) {
  const id = getYouTubeVideoId(url)
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null
}

export function getSubsplashEmbedUrl(url) {
  if (!url || !url.includes('subsplash.com')) return null
  if (url.includes('/media/embed/')) return url

  const mediaMatch = url.match(/subsplash\.com\/[^/]+\/media\/mi\/([^/?#]+)/)
  if (mediaMatch) {
    return `https://subsplash.com/u/-GQTDCX/media/embed/d/${mediaMatch[1]}?&info=0`
  }

  return url
}

/**
 * Build a YouTube thumbnail URL from a share/watch URL.
 */
export function getYouTubeThumbnail(url) {
  const id = getYouTubeVideoId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}
