/**
 * Bible API utility for fetching verse text in different translations
 * Uses Claude AI via Supabase Edge Function
 */

import { fetchBibleVerseWithClaude } from './claudeApi'

/**
 * Fetch Bible verse text for a given reference and translation
 * Uses Claude AI to fetch verses in any translation
 * @param {Object} params - Verse parameters
 * @param {string} params.book - Book name (e.g., "John")
 * @param {number} params.chapter - Chapter number
 * @param {number} params.verseStart - Starting verse number
 * @param {number} params.verseEnd - Ending verse number (optional)
 * @param {string} params.translation - Translation code (e.g., "ESV", "KJV", "NIV", etc.)
 * @returns {Promise<string>} - Verse text
 */
export async function fetchBibleVerse({ book, chapter, verseStart, verseEnd, translation }) {
  // Validate inputs
  if (!book || !chapter || !verseStart || !translation) {
    throw new Error('Missing required parameters: book, chapter, verseStart, and translation are required')
  }

  // Use Claude AI to fetch the verse
  return await fetchBibleVerseWithClaude({
    book,
    chapter,
    verseStart,
    verseEnd,
    translation
  })
}

/**
 * Check if a translation is supported
 * @param {string} translation - Translation code
 * @returns {boolean}
 */
export function isTranslationSupported(translation) {
  // Claude AI supports all Bible translations
  // Just validate that a translation code is provided
  return translation && translation.trim().length > 0
}

/**
 * Parse a Bible reference string into its components
 * @param {string} reference - Reference string (e.g., "John 3:16", "1 Corinthians 13:4-7")
 * @returns {Object|null} - Parsed reference object or null if invalid
 */
export function parseBibleReference(reference) {
  if (!reference || typeof reference !== 'string') {
    return null
  }

  const trimmed = reference.trim()

  // Regex pattern to match Bible references
  // Matches: "Book Chapter:Verse" or "Book Chapter:Verse-Verse"
  // Examples: "John 3:16", "1 Corinthians 13:4-7", "Psalm 23:1"
  const pattern = /^((?:\d\s)?[A-Za-z\s]+)\s+(\d+):(\d+)(?:-(\d+))?$/

  const match = trimmed.match(pattern)

  if (!match) {
    return null
  }

  const [, book, chapter, verseStart, verseEnd] = match

  return {
    book: book.trim(),
    chapter: parseInt(chapter, 10),
    verse_start: parseInt(verseStart, 10),
    verse_end: verseEnd ? parseInt(verseEnd, 10) : null,
    reference: trimmed
  }
}

/**
 * Build a reference string from components
 * @param {Object} params - Reference components
 * @returns {string} - Formatted reference string
 */
export function buildBibleReference({ book, chapter, verse_start, verse_end }) {
  if (!book || !chapter || !verse_start) {
    return ''
  }

  const base = `${book} ${chapter}:${verse_start}`
  return verse_end && verse_end !== verse_start ? `${base}-${verse_end}` : base
}
