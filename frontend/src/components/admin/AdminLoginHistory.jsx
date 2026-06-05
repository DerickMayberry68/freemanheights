import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'

function describeUserAgent(userAgent) {
  if (!userAgent) return 'Unknown browser or device'

  let browser = 'Unknown browser'
  if (/Edg\//.test(userAgent)) browser = 'Microsoft Edge'
  else if (/Chrome\//.test(userAgent)) browser = 'Google Chrome'
  else if (/Firefox\//.test(userAgent)) browser = 'Mozilla Firefox'
  else if (/Safari\//.test(userAgent)) browser = 'Safari'

  let device = 'Unknown device'
  if (/iPhone/.test(userAgent)) device = 'iPhone'
  else if (/iPad/.test(userAgent)) device = 'iPad'
  else if (/Android/.test(userAgent)) device = 'Android'
  else if (/Windows/.test(userAgent)) device = 'Windows'
  else if (/Macintosh|Mac OS X/.test(userAgent)) device = 'Mac'
  else if (/Linux/.test(userAgent)) device = 'Linux'

  return `${browser} on ${device}`
}

export default function AdminLoginHistory() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_admin_login_logs', { p_limit: 200 })
      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      toast.error(`Failed to load login history: ${error?.message || 'Unknown error.'}`)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadLogs()
  }, [])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-secondary-dark">Admin Login History</h2>
          <p className="mt-1 text-sm text-secondary-light">
            Successful admin portal logins, newest first.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadLogs()}
          disabled={loading}
          className="rounded-lg border border-primary/30 px-4 py-2 font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-primary/10 bg-white">
        {loading ? (
          <p className="px-6 py-5 text-secondary-light">Loading login history...</p>
        ) : logs.length === 0 ? (
          <p className="px-6 py-5 text-secondary-light">No admin logins have been recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-primary/10 text-sm">
              <thead className="bg-cream-dark text-left text-secondary-dark">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Login Time</th>
                  <th className="px-5 py-3 font-semibold">IP Address</th>
                  <th className="px-5 py-3 font-semibold">Browser / Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-5 py-4 font-medium text-secondary-dark">{log.email}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-secondary-light">
                      {format(new Date(log.logged_in_at), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-secondary-light">
                      {log.ip_address || 'Unavailable'}
                    </td>
                    <td className="px-5 py-4 text-secondary-light" title={log.user_agent || ''}>
                      {describeUserAgent(log.user_agent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
