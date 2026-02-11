import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { useBibleTranslations } from '../../lib/hooks'
import { toast } from 'react-toastify'

export default function UserProfileEditor() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    preferred_bible_translation: 'ESV'
  })
  const [error, setError] = useState(null)
  const { data: translations, loading: translationsLoading } = useBibleTranslations()

  useEffect(() => {
    if (!user) return
    loadPreferences()
  }, [user])

  const loadPreferences = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (err && err.code !== 'PGRST116') { // PGRST116 = not found
        throw err
      }

      if (data) {
        setPreferences({
          preferred_bible_translation: data.preferred_bible_translation || 'ESV'
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to load preferences.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Check if preferences exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // Update existing preferences
        const { error: err } = await supabase
          .from('user_preferences')
          .update({
            preferred_bible_translation: preferences.preferred_bible_translation
          })
          .eq('user_id', user.id)

        if (err) throw err
      } else {
        // Create new preferences
        const { error: err } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            preferred_bible_translation: preferences.preferred_bible_translation
          })

        if (err) throw err
      }

      toast.success('Preferences saved successfully!')
    } catch (err) {
      setError(err.message || 'Failed to save preferences.')
      toast.error('Failed to save preferences.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-secondary-light">Loading preferences...</p>

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-dark">Profile Settings</h2>
        <p className="text-secondary-light mt-1">Manage your personal preferences and settings.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-secondary-dark mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-secondary-light mt-1">Your email address cannot be changed here.</p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-secondary-dark mb-4">Bible Preferences</h3>
            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-1">
                Preferred Bible Translation
              </label>
              <select
                value={preferences.preferred_bible_translation}
                onChange={(e) => setPreferences({ ...preferences, preferred_bible_translation: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                disabled={translationsLoading}
              >
                {translationsLoading ? (
                  <option>Loading translations...</option>
                ) : (
                  translations.map(trans => (
                    <option key={trans.code} value={trans.code}>
                      {trans.abbreviation} - {trans.name}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-secondary-light mt-1">
                This will be used as your default when viewing Bible content.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
