import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function MinistryEditor() {
  const [ministries, setMinistries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('ministries')
      .select('*')
      .order('display_order')
      .then(({ data }) => {
        setMinistries(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading ministries...</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-secondary-dark mb-4">Ministries</h2>
      <p className="text-secondary-light mb-6">
        View ministries. Full admin auth and editing will be added when Supabase auth is configured.
      </p>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Audience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Meeting Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ministries.map((ministry) => (
              <tr key={ministry.id}>
                <td className="px-6 py-4 text-sm font-medium text-secondary-dark">{ministry.name}</td>
                <td className="px-6 py-4 text-sm text-secondary-light">{ministry.target_audience || '—'}</td>
                <td className="px-6 py-4 text-sm text-secondary-light">{ministry.meeting_time || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ministries.length === 0 && (
          <p className="p-8 text-center text-secondary-light">No ministries yet.</p>
        )}
      </div>
    </div>
  )
}
