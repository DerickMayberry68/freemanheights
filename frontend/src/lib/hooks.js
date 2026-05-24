import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const BIBLE_VERSE_ROTATION_DEFAULT_SECONDS = 8
const BIBLE_VERSE_ROTATION_MIN_SECONDS = 3
const BIBLE_VERSE_ROTATION_MAX_SECONDS = 60

export function normalizeBibleVerseRotationSeconds(value) {
  const seconds = Number.parseInt(value, 10)
  if (
    Number.isNaN(seconds) ||
    seconds < BIBLE_VERSE_ROTATION_MIN_SECONDS ||
    seconds > BIBLE_VERSE_ROTATION_MAX_SECONDS
  ) {
    return BIBLE_VERSE_ROTATION_DEFAULT_SECONDS
  }
  return seconds
}

export function useServiceTimes() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase
      .from('service_times')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data: d, error }) => {
        setData(d || [])
        setLoading(false)
      })
  }, [])
  return { data, loading }
}

export function useEvents(limit = 5, options = {}) {
  const { includeCancelled = false, fromStartOfDay = false, daysAhead = null } = options
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const windowStart = new Date()
    if (fromStartOfDay) {
      windowStart.setHours(0, 0, 0, 0)
    }
    const windowEnd = Number.isFinite(daysAhead)
      ? new Date(windowStart.getTime() + daysAhead * 24 * 60 * 60 * 1000)
      : null

    let query = supabase
      .from('events')
      .select('*')
      .gte('event_date', windowStart.toISOString())
      .order('event_date')
      .limit(limit)

    if (windowEnd) {
      query = query.lt('event_date', windowEnd.toISOString())
    }

    if (!includeCancelled) {
      query = query.eq('is_cancelled', false)
    }

    query.then(({ data: d, error }) => {
        setData(d || [])
        setLoading(false)
      })
  }, [daysAhead, fromStartOfDay, includeCancelled, limit])
  return { data, loading }
}

export function useSermons(limit = 4) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
      .limit(limit)
      .then(({ data: d }) => {
        setData(d || [])
        setLoading(false)
      })
  }, [limit])
  return { data, loading }
}

export function useMinistries() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase
      .from('ministries')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data: d }) => {
        setData(d || [])
        setLoading(false)
      })
  }, [])
  return { data, loading }
}

export function useStaff() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data: d }) => {
        setData(d || [])
        setLoading(false)
      })
  }, [])
  return { data, loading }
}

export function useBibleVerses() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase
      .from('bible_verses')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data: d }) => {
        setData(d || [])
        setLoading(false)
      })
  }, [])
  return { data, loading }
}

export function useBibleVerseRotationSeconds() {
  const [seconds, setSeconds] = useState(BIBLE_VERSE_ROTATION_DEFAULT_SECONDS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'bible_verse_rotation_seconds')
      .maybeSingle()
      .then(({ data }) => {
        setSeconds(normalizeBibleVerseRotationSeconds(data?.value))
        setLoading(false)
      })
  }, [])

  return { seconds, loading }
}

export function useBibleTranslations() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase
      .from('bible_translations')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data: d }) => {
        setData(d || [])
        setLoading(false)
      })
  }, [])
  return { data, loading }
}
