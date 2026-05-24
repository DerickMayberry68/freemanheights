import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ARCHIVE_URL = 'https://www.freemanheights.com/previous-livestreams'
const SUBSPLASH_APP = '-GQTDCX'
const DEFAULT_DESCRIPTION = 'Previous livestream from Freeman Heights Baptist Church.'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const months: Record<string, string> = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
}

function decodeHtml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractArchiveEntries(html: string) {
  const entries = []
  const linkPattern = /<a\b[^>]*href=["']([^"']*\/media\/([^/"'#?]+)\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  const seen = new Set<string>()

  for (const match of html.matchAll(linkPattern)) {
    const mediaId = match[2]
    if (!mediaId || mediaId === 'speaker' || mediaId === 'scripture' || seen.has(mediaId)) continue

    const text = decodeHtml(match[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    const dateMatch = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})$/)
    if (!dateMatch) continue

    const title = text.slice(0, dateMatch.index).trim()
    if (!title) continue

    seen.add(mediaId)
    entries.push({
      title,
      speaker: 'Freeman Heights',
      sermon_date: `${dateMatch[3]}-${months[dateMatch[1]]}-${dateMatch[2].padStart(2, '0')}`,
      scripture_reference: null,
      description: DEFAULT_DESCRIPTION,
      video_url: `https://subsplash.com/u/${SUBSPLASH_APP}/media/embed/d/${mediaId}?&info=0`,
      series: null,
      is_featured: entries.length === 0,
    })
  }

  return entries
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase service configuration')
    }

    const archiveResponse = await fetch(ARCHIVE_URL)
    if (!archiveResponse.ok) {
      throw new Error(`Archive fetch failed: ${archiveResponse.status}`)
    }

    const html = await archiveResponse.text()
    const entries = extractArchiveEntries(html)

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: existing, error: existingError } = await supabase
      .from('sermons')
      .select('video_url')
      .not('video_url', 'is', null)

    if (existingError) throw existingError

    const existingUrls = new Set((existing || []).map((row) => row.video_url))
    const newEntries = entries.filter((entry) => !existingUrls.has(entry.video_url))

    if (newEntries.length > 0) {
      const { error: insertError } = await supabase.from('sermons').insert(newEntries)
      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        found: entries.length,
        inserted: newEntries.length,
        skipped: entries.length - newEntries.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('sync-sermons failed:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Sync failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
