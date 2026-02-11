import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { PencilIcon, TrashIcon, XMarkIcon, BookmarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { callClaudeAssistant, saveFavorite, getFavorites, updateFavorite, deleteFavorite } from '../../lib/claudeApi'
import { useBibleTranslations } from '../../lib/hooks'
import { fetchBibleVerse, parseBibleReference } from '../../lib/bibleApi'

const TABS = [
  { id: 'bible_search', label: 'Bible Search', icon: SparklesIcon },
  { id: 'cross_reference', label: 'Cross-References', icon: BookmarkIcon },
  { id: 'verse_context', label: 'Verse Context', icon: BookmarkIcon },
  { id: 'compare_translations', label: 'Compare Translations', icon: BookmarkIcon },
  { id: 'sermon_ideas', label: 'Sermon Ideas', icon: SparklesIcon },
  { id: 'saved', label: 'Saved', icon: BookmarkIcon }
]

const PLACEHOLDERS = {
  bible_search: 'e.g., "Find verses about hope and encouragement" or "Verses about God\'s love"',
  cross_reference: 'e.g., "John 3:16" or "Romans 8:28"',
  verse_context: 'e.g., "Philippians 4:13" or "Psalm 23:1"',
  compare_translations: 'e.g., "John 3:16" or "Psalm 23:1-3"',
  sermon_ideas: 'e.g., "Faith in difficult times" or "Genesis 12:1-3"'
}

export default function AIAssistantEditor() {
  const { data: translations, loading: translationsLoading } = useBibleTranslations()
  const [activeTab, setActiveTab] = useState('bible_search')
  const [query, setQuery] = useState('')
  const [translation, setTranslation] = useState('ESV')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [lastResponse, setLastResponse] = useState(null) // Store last response for context

  // Favorites
  const [favorites, setFavorites] = useState([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)

  // Modals
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [saveForm, setSaveForm] = useState({ title: '', notes: '', primaryVerse: '', relatedVerses: '' })
  const [editingFavorite, setEditingFavorite] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Translation Comparison
  const [selectedTranslations, setSelectedTranslations] = useState(['ESV', 'NIV', 'KJV', 'NLT'])
  const [comparisonResults, setComparisonResults] = useState([])

  // Load favorites when switching to Saved tab
  useEffect(() => {
    if (activeTab === 'saved') {
      loadFavorites()
    }
  }, [activeTab])

  const loadFavorites = async () => {
    setFavoritesLoading(true)
    try {
      const data = await getFavorites()
      setFavorites(data)
    } catch (err) {
      toast.error('Failed to load favorites')
      console.error(err)
    } finally {
      setFavoritesLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    // Handle translation comparison separately
    if (activeTab === 'compare_translations') {
      return handleCompareTranslations()
    }

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const result = await callClaudeAssistant(query, activeTab, translation)

      if (result.success) {
        const responseData = {
          text: result.response,
          queryType: result.queryType,
          query: query
        }
        setResponse(responseData)
        setLastResponse(responseData) // Save for tab switching
      } else {
        setError(result.error || 'Failed to get response')
        toast.error(result.error || 'Failed to get response')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
      toast.error(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCompareTranslations = async () => {
    setLoading(true)
    setError(null)
    setComparisonResults([])

    try {
      // Parse the verse reference
      const parsed = parseBibleReference(query.trim())

      if (!parsed) {
        setError('Invalid verse reference. Please use format like "John 3:16" or "Psalm 23:1-3"')
        toast.error('Invalid verse reference format')
        return
      }

      // Fetch verse in all selected translations
      const results = await Promise.all(
        selectedTranslations.map(async (trans) => {
          try {
            const verseText = await fetchBibleVerse({
              book: parsed.book,
              chapter: parsed.chapter,
              verseStart: parsed.verse_start,
              verseEnd: parsed.verse_end,
              translation: trans
            })
            return { translation: trans, text: verseText, error: null }
          } catch (err) {
            return { translation: trans, text: null, error: err.message }
          }
        })
      )

      setComparisonResults(results)
    } catch (err) {
      setError(err.message || 'An error occurred')
      toast.error(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Extract verse references from response text (format: **Reference**)
  const extractVerseReferences = (text) => {
    if (!text) return []
    const regex = /\*\*([^*]+\d+:\d+(?:-\d+)?)\*\*/g
    const matches = []
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1])
    }
    return matches
  }

  const openSaveModal = () => {
    setSaveForm({
      title: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      notes: '',
      primaryVerse: '',
      relatedVerses: ''
    })
    setSaveModalOpen(true)
  }

  const handleSaveFavorite = async () => {
    try {
      const favoriteData = {
        response: response.text,
        queryType: response.queryType,
        query: response.query,
        title: saveForm.title || query.substring(0, 50),
        notes: saveForm.notes || null,
        primaryVerse: saveForm.primaryVerse || null,
        relatedVerses: saveForm.relatedVerses ? saveForm.relatedVerses.split(',').map(v => v.trim()) : null
      }

      await saveFavorite(favoriteData)
      toast.success('Saved to favorites!')
      setSaveModalOpen(false)
      setSaveForm({ title: '', notes: '', primaryVerse: '', relatedVerses: '' })
    } catch (err) {
      toast.error('Failed to save favorite')
      console.error(err)
    }
  }

  const openEditModal = (favorite) => {
    setEditingFavorite(favorite)
    setSaveForm({
      title: favorite.title || '',
      notes: favorite.notes || '',
      primaryVerse: favorite.primary_verse_reference || '',
      relatedVerses: favorite.related_verses ? favorite.related_verses.join(', ') : ''
    })
    setEditModalOpen(true)
  }

  const handleUpdateFavorite = async () => {
    try {
      await updateFavorite(editingFavorite.id, {
        title: saveForm.title,
        notes: saveForm.notes,
        primary_verse_reference: saveForm.primaryVerse || null,
        related_verses: saveForm.relatedVerses ? saveForm.relatedVerses.split(',').map(v => v.trim()) : null
      })
      toast.success('Favorite updated!')
      setEditModalOpen(false)
      setEditingFavorite(null)
      loadFavorites()
    } catch (err) {
      toast.error('Failed to update favorite')
      console.error(err)
    }
  }

  const handleDeleteFavorite = async (id) => {
    try {
      await deleteFavorite(id)
      toast.success('Favorite deleted')
      setDeleteConfirm(null)
      loadFavorites()
    } catch (err) {
      toast.error('Failed to delete favorite')
      console.error(err)
    }
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setError(null)

    // Don't clear response - keep it visible
    // Auto-populate query based on last response
    if (lastResponse && tabId !== 'saved') {
      const verses = extractVerseReferences(lastResponse.text)

      if (tabId === 'cross_reference' && verses.length > 0) {
        // For cross-references, use the first 3-5 verses
        setQuery(verses.slice(0, 5).join(', '))
      } else if (tabId === 'verse_context' && verses.length > 0) {
        // For verse context, use the first verse
        setQuery(verses[0])
      } else if (tabId === 'sermon_ideas') {
        // For sermon ideas, use the original topic or first few verses
        if (lastResponse.queryType === 'bible_search') {
          setQuery(lastResponse.query) // Use original topic
        } else if (verses.length > 0) {
          setQuery(verses.slice(0, 3).join(', '))
        }
      } else {
        setQuery('')
      }
    } else {
      setQuery('')
      if (tabId !== 'saved') {
        setResponse(null)
      }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-dark">AI Bible Assistant</h2>
        <p className="text-secondary-light mt-1">
          Powered by Claude AI - Find verses, cross-references, context, and sermon ideas
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Query Tabs Content */}
      {activeTab !== 'saved' && (
        <div className="bg-white rounded-xl shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Translation Selection */}
            {activeTab === 'compare_translations' ? (
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-2">
                  Select Translations to Compare
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                  {translations.map(t => (
                    <label key={t.code} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedTranslations.includes(t.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTranslations([...selectedTranslations, t.code])
                          } else {
                            setSelectedTranslations(selectedTranslations.filter(c => c !== t.code))
                          }
                        }}
                        className="rounded border-gray-300"
                        disabled={loading}
                      />
                      <span className="text-sm font-medium text-secondary-dark">{t.code}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-secondary-light mt-2">
                  {selectedTranslations.length} translation{selectedTranslations.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-2">
                  Bible Translation
                </label>
                <select
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  disabled={loading || translationsLoading}
                >
                  {translationsLoading ? (
                    <option>Loading translations...</option>
                  ) : (
                    translations.map(t => (
                      <option key={t.code} value={t.code}>{t.code} - {t.name}</option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Query Input */}
            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                {activeTab === 'compare_translations' ? 'Verse Reference' : 'Your Question'}
              </label>
              {activeTab === 'compare_translations' ? (
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder={PLACEHOLDERS[activeTab]}
                  disabled={loading}
                />
              ) : (
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder={PLACEHOLDERS[activeTab]}
                  disabled={loading}
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim() || (activeTab === 'compare_translations' && selectedTranslations.length === 0)}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  {activeTab === 'compare_translations' ? 'Loading...' : 'Thinking...'}
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  {activeTab === 'compare_translations' ? 'Compare Translations' : 'Ask AI Assistant'}
                </>
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-secondary-dark">Response</h3>
                <button
                  onClick={openSaveModal}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary font-medium rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <BookmarkIcon className="h-5 w-5" />
                  Save to Favorites
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-secondary-dark">
                  {response.text}
                </div>
              </div>
            </div>
          )}

          {/* Translation Comparison Results */}
          {activeTab === 'compare_translations' && comparisonResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-secondary-dark mb-4">Translation Comparison: {query}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {comparisonResults.map((result) => (
                  <div key={result.translation} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-primary text-lg">{result.translation}</h4>
                      {translations.find(t => t.code === result.translation) && (
                        <span className="text-xs text-secondary-light">
                          {translations.find(t => t.code === result.translation).name}
                        </span>
                      )}
                    </div>
                    {result.error ? (
                      <p className="text-sm text-red-600">Error: {result.error}</p>
                    ) : (
                      <p className="text-secondary-dark leading-relaxed">{result.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Tab Content */}
      {activeTab === 'saved' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-secondary-dark mb-4">Your Saved Favorites</h3>

          {favoritesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-secondary-light mt-4">Loading favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <BookmarkIcon className="h-16 w-16 text-gray-300 mx-auto" />
              <p className="text-secondary-light mt-4">No saved favorites yet</p>
              <p className="text-sm text-secondary-light mt-2">Save AI responses from other tabs to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-secondary-dark">{favorite.title || favorite.user_query}</h4>
                      <p className="text-sm text-secondary-light mt-1">
                        {favorite.query_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {new Date(favorite.created_at).toLocaleDateString()}
                      </p>
                      {favorite.primary_verse_reference && (
                        <p className="text-sm text-primary mt-2 font-medium">{favorite.primary_verse_reference}</p>
                      )}
                      <p className="text-sm text-secondary mt-2 line-clamp-2">{favorite.assistant_response}</p>
                      {favorite.notes && (
                        <p className="text-sm text-secondary-light italic mt-2">Note: {favorite.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {deleteConfirm === favorite.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600">Delete?</span>
                          <button
                            onClick={() => handleDeleteFavorite(favorite.id)}
                            className="text-red-600 font-medium hover:underline text-sm"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-secondary-light hover:underline text-sm"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditModal(favorite)}
                            className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(favorite.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setSaveModalOpen(false) }}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-secondary-dark">Save to Favorites</h3>
              <button onClick={() => setSaveModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Title</label>
                <input
                  type="text"
                  value={saveForm.title}
                  onChange={(e) => setSaveForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Give this favorite a title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Notes (optional)</label>
                <textarea
                  value={saveForm.notes}
                  onChange={(e) => setSaveForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Add your own notes or thoughts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Primary Verse (optional)</label>
                <input
                  type="text"
                  value={saveForm.primaryVerse}
                  onChange={(e) => setSaveForm(f => ({ ...f, primaryVerse: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="e.g., John 3:16"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Related Verses (optional)</label>
                <input
                  type="text"
                  value={saveForm.relatedVerses}
                  onChange={(e) => setSaveForm(f => ({ ...f, relatedVerses: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="e.g., Romans 8:28, Philippians 4:13"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSaveModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFavorite}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setEditModalOpen(false) }}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-secondary-dark">Edit Favorite</h3>
              <button onClick={() => setEditModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Title</label>
                <input
                  type="text"
                  value={saveForm.title}
                  onChange={(e) => setSaveForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Notes</label>
                <textarea
                  value={saveForm.notes}
                  onChange={(e) => setSaveForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Primary Verse</label>
                <input
                  type="text"
                  value={saveForm.primaryVerse}
                  onChange={(e) => setSaveForm(f => ({ ...f, primaryVerse: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Related Verses</label>
                <input
                  type="text"
                  value={saveForm.relatedVerses}
                  onChange={(e) => setSaveForm(f => ({ ...f, relatedVerses: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateFavorite}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
