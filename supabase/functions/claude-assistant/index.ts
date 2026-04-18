import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const getSystemPrompts = (translation: string) => ({
  bible_search: `You are a knowledgeable Bible study assistant. When asked to find verses about a topic:
1. Provide 5-10 relevant Bible verses with their references
2. Include the full text of each verse
3. Briefly explain why each verse relates to the topic
4. Use ${translation} translation
5. Format responses clearly with verse references in bold (use **Reference** format)
6. Organize by relevance to the topic`,

  cross_reference: `You are a Bible cross-reference specialist. When given a verse:
1. Identify 5-8 related verses that connect thematically or contextually
2. Include the full text of each related verse using ${translation} translation
3. Explain the connection between verses
4. Organize by relationship type (parallel passages, thematic connections, prophetic fulfillment, etc.)
5. Format with clear headings and verse references in bold`,

  verse_context: `You are a Bible context expert. When given a verse:
1. Explain the historical and cultural context
2. Describe the author's intent and original audience
3. Explain the meaning in its immediate context (surrounding verses)
4. Provide theological significance
5. Suggest practical application for today
6. Use ${translation} translation for any verse quotes
7. Be thorough but concise, organized with clear headings`,

  sermon_ideas: `You are a pastoral assistant for sermon preparation. When given a topic or verse:
1. Suggest 3-5 sermon outlines with clear structure (intro, main points, conclusion)
2. Include key verses to reference for each point using ${translation} translation
3. Suggest illustrations or real-life applications
4. Provide discussion questions for small groups
5. Note potential theological pitfalls to avoid
6. Keep tone pastoral, practical, and encouraging`
})

const ALLOWED_MODELS: Record<string, string> = {
  'claude-sonnet-4-6':          'Claude Sonnet 4.6',
  'claude-opus-4-6':            'Claude Opus 4.6',
  'claude-haiku-4-5-20251001':  'Claude Haiku 4.5',
  'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
}

const DEFAULT_MODEL = 'claude-sonnet-4-6'

interface RequestBody {
  query: string
  queryType: 'bible_search' | 'cross_reference' | 'verse_context' | 'sermon_ideas'
  translation?: string
  model?: string
  maxTokens?: number
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth handled at application level (admin page requires login)
    console.log('Request received for AI assistant')

    // Parse request body
    const { query, queryType, translation = 'ESV', model, maxTokens = 2048 } = await req.json() as RequestBody
    const resolvedModel = (model && ALLOWED_MODELS[model]) ? model : DEFAULT_MODEL

    if (!query || !queryType) {
      throw new Error('Missing required fields: query and queryType')
    }

    const SYSTEM_PROMPTS = getSystemPrompts(translation)

    if (!Object.keys(SYSTEM_PROMPTS).includes(queryType)) {
      throw new Error('Invalid queryType')
    }

    if (!ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured')
    }

    // Call Anthropic Claude API
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: maxTokens,
        system: SYSTEM_PROMPTS[queryType],
        messages: [{ role: 'user', content: query }]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = data.content?.[0]?.text || ''

    return new Response(
      JSON.stringify({
        success: true,
        response: assistantMessage,
        queryType,
        model: data.model,
        usage: data.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in claude-assistant function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 500
      }
    )
  }
})
