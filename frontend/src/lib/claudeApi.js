import { supabase } from './supabase'

/**
 * Call the Claude AI assistant via Supabase Edge Function
 * @param {string} query - The user's question or request
 * @param {string} queryType - Type of query: 'bible_search', 'cross_reference', 'verse_context', 'sermon_ideas'
 * @param {string} translation - Bible translation to use (ESV, NIV, KJV, etc.)
 * @returns {Promise<Object>} Response object with success flag and data/error
 */
export async function callClaudeAssistant(query, queryType, translation = 'ESV') {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return { success: false, error: 'Session expired. Please log in again.' }
    }

    console.log('Session token (first 50 chars):', session.access_token?.substring(0, 50))

    // Call function WITHOUT explicit auth header - let Supabase handle it
    const response = await supabase.functions.invoke('claude-assistant', {
      body: {
        query: query.trim(),
        queryType,
        translation,
        maxTokens: 2048
      }
    })

    if (response.error) {
      console.error('Edge function error:', response.error)
      return {
        success: false,
        error: response.error.message || 'Failed to call AI assistant'
      }
    }

    return response.data
  } catch (error) {
    console.error('claudeApi error:', error)
    return {
      success: false,
      error: error.message || 'Network error. Please try again.'
    }
  }
}

/**
 * Save an AI response as a favorite
 * @param {Object} favoriteData - The favorite data to save
 * @returns {Promise<Object>} The saved favorite record
 */
export async function saveFavorite(favoriteData) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const payload = {
    user_id: session.user.id,
    assistant_response: favoriteData.response,
    query_type: favoriteData.queryType,
    user_query: favoriteData.query,
    primary_verse_reference: favoriteData.primaryVerse || null,
    related_verses: favoriteData.relatedVerses || null,
    title: favoriteData.title || null,
    notes: favoriteData.notes || null
  }

  const { data, error } = await supabase
    .from('ai_assistant_favorites')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user's favorites, optionally filtered by query type
 * @param {string|null} queryType - Optional filter by query type
 * @returns {Promise<Array>} Array of favorite records
 */
export async function getFavorites(queryType = null) {
  let query = supabase
    .from('ai_assistant_favorites')
    .select('*')
    .order('created_at', { ascending: false })

  if (queryType) {
    query = query.eq('query_type', queryType)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Update an existing favorite
 * @param {string} id - The favorite ID
 * @param {Object} updates - Fields to update (title, notes, etc.)
 * @returns {Promise<Object>} The updated favorite record
 */
export async function updateFavorite(id, updates) {
  const { data, error } = await supabase
    .from('ai_assistant_favorites')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a favorite
 * @param {string} id - The favorite ID to delete
 * @returns {Promise<void>}
 */
export async function deleteFavorite(id) {
  const { error } = await supabase
    .from('ai_assistant_favorites')
    .delete()
    .eq('id', id)

  if (error) throw error
}
