import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'

const pageSizeOptions = [10, 15, 25, 50, 100]

const sortableColumns = [
  { field: 'email', label: 'User' },
  { field: 'logged_in_at', label: 'Login Time' },
  { field: 'ip_address', label: 'IP Address' },
  { field: 'user_agent', label: 'Browser / Device' },
]

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

function SortableHeader({ field, label, sort, onSort }) {
  const active = sort.field === field
  const Icon = active
    ? sort.direction === 'asc'
      ? ChevronUpIcon
      : ChevronDownIcon
    : ChevronUpDownIcon

  return (
    <th
      className="px-5 py-3 font-semibold"
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="flex items-center gap-1.5 text-left transition-colors hover:text-primary"
      >
        <span>{label}</span>
        <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-secondary-light'}`} />
      </button>
    </th>
  )
}

export default function AdminLoginHistory() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [sort, setSort] = useState({ field: 'logged_in_at', direction: 'desc' })
  const [totalCount, setTotalCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const pageCount = Math.max(Math.ceil(totalCount / pageSize), 1)
  const startItem = totalCount === 0 ? 0 : ((page - 1) * pageSize) + 1
  const endItem = Math.min(page * pageSize, totalCount)

  const handleSort = (field) => {
    setPage(1)
    setSort((current) => {
      if (current.field === field) {
        return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { field, direction: field === 'logged_in_at' ? 'desc' : 'asc' }
    })
  }

  const handlePageSizeChange = (event) => {
    setPage(1)
    setPageSize(Number(event.target.value))
  }

  useEffect(() => {
    let ignore = false

    const loadLogs = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_admin_login_logs', {
          p_limit: pageSize,
          p_offset: (page - 1) * pageSize,
          p_sort_by: sort.field,
          p_sort_direction: sort.direction,
        })
        if (error) throw error

        if (ignore) return
        const rows = data || []
        const nextTotalCount = Number(rows[0]?.total_count || 0)
        setLogs(rows)
        setTotalCount(nextTotalCount)

        if (rows.length === 0 && page > 1) {
          setPage(1)
        }
      } catch (error) {
        if (!ignore) {
          toast.error(`Failed to load login history: ${error?.message || 'Unknown error.'}`)
          setLogs([])
          setTotalCount(0)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void loadLogs()
    return () => {
      ignore = true
    }
  }, [page, pageSize, refreshKey, sort.direction, sort.field])

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount)
    }
  }, [page, pageCount])

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
          onClick={() => setRefreshKey((current) => current + 1)}
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
                  {sortableColumns.map((column) => (
                    <SortableHeader
                      key={column.field}
                      field={column.field}
                      label={column.label}
                      sort={sort}
                      onSort={handleSort}
                    />
                  ))}
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
        <div className="flex flex-col gap-3 border-t border-primary/10 px-5 py-4 text-sm text-secondary-light sm:flex-row sm:items-center sm:justify-between">
          <p>
            {totalCount === 0
              ? 'Showing 0 login records'
              : `Showing ${startItem}-${endItem} of ${totalCount} login records`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="rounded-lg border border-primary/20 bg-white px-2.5 py-1.5 text-secondary-dark"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={loading || page <= 1}
                title="First page"
                aria-label="First page"
                className="rounded-lg border border-primary/20 bg-white p-2 text-secondary-dark transition-colors hover:bg-primary/5 disabled:opacity-40"
              >
                <ChevronDoubleLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={loading || page <= 1}
                title="Previous page"
                aria-label="Previous page"
                className="rounded-lg border border-primary/20 bg-white p-2 text-secondary-dark transition-colors hover:bg-primary/5 disabled:opacity-40"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="px-2 text-secondary-dark">
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, pageCount))}
                disabled={loading || page >= pageCount}
                title="Next page"
                aria-label="Next page"
                className="rounded-lg border border-primary/20 bg-white p-2 text-secondary-dark transition-colors hover:bg-primary/5 disabled:opacity-40"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(pageCount)}
                disabled={loading || page >= pageCount}
                title="Last page"
                aria-label="Last page"
                className="rounded-lg border border-primary/20 bg-white p-2 text-secondary-dark transition-colors hover:bg-primary/5 disabled:opacity-40"
              >
                <ChevronDoubleRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
