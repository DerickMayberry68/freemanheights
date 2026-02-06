import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'

export default function SermonEditor() {
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setSermons(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading sermons...</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-secondary-dark mb-4">Sermons</h2>
      <p className="text-secondary-light mb-6">
        View sermon archive. Full admin auth and editing will be added when Supabase auth is configured.
      </p>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Speaker</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-light uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sermons.map((sermon) => (
              <tr key={sermon.id}>
                <td className="px-6 py-4 text-sm font-medium text-secondary-dark">{sermon.title}</td>
                <td className="px-6 py-4 text-sm text-secondary-light">{sermon.speaker}</td>
                <td className="px-6 py-4 text-sm text-secondary-light">
                  {format(new Date(sermon.sermon_date), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sermons.length === 0 && (
          <p className="p-8 text-center text-secondary-light">No sermons yet.</p>
        )}
      </div>
    </div>
  )
}
