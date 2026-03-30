import { useState, useEffect } from 'react'
import { supabase } from './supabase'

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

export function useEvents(limit = 5) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .eq('is_cancelled', false)
      .order('event_date')
      .limit(limit)
      .then(({ data: d, error }) => {
        setData(d || [])
        setLoading(false)
      })
  }, [limit])
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
