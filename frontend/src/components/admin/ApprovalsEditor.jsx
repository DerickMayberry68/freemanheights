import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../../lib/AuthContext'
import { useModal } from '../../lib/ModalContext'

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features' },
  { value: 'editor', label: 'Editor', description: 'Can manage content (events, sermons, etc.)' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
]

export default function ApprovalsEditor() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedRole, setSelectedRole] = useState({}) // Track role selection per user
  const { refreshApproval } = useAuth()
  const { showError, showConfirm } = useModal()

  const loadApprovals = async () => {
    setLoading(true)
    try {
      const { data, error: e } = await supabase.rpc('get_admin_approvals')
      if (e) {
        console.error('Failed to load approvals:', e.message)
        showError('Failed to load approvals', e.message)
        setPending([])
      } else {
        setPending(data || [])
      }
    } catch (err) {
      console.error('Failed to load approvals:', err)
      showError('Failed to load approvals', err.message || 'An error occurred')
      setPending([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApprovals()
  }, [])

  const runApprove = async (id, role) => {
    setActionLoading(id)
    const { error: err } = await supabase.rpc('approve_admin_user', { 
      p_approval_id: id,
      p_role: role || 'editor'
    })
    setActionLoading(null)
    if (err) {
      showError('Failed to approve', err.message || 'Could not approve user.')
      return
    }
    toast.success('User approved.')
    loadApprovals()
    refreshApproval?.()
  }

  const handleApprove = (row) => {
    const role = selectedRole[row.id] || 'editor'
    const roleLabel = ROLES.find(r => r.value === role)?.label || role
    
    showConfirm({
      title: 'Approve user',
      message: `Allow ${row.email} to access the admin area as ${roleLabel}?`,
      confirmLabel: 'Approve',
      cancelLabel: 'Cancel',
      onConfirm: () => runApprove(row.id, role),
    })
  }

  const pendingList = pending.filter((r) => !r.approved)
  const approvedList = pending.filter((r) => r.approved)

  if (loading) return <p className="text-secondary-light">Loading...</p>

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-secondary-dark mb-4">User approvals</h2>
      <p className="text-secondary-light mb-6">
        Approve or leave pending new admin registrations. Only approved users can access the admin area.
      </p>

      {pendingList.length > 0 && (
        <div className="bg-white rounded-xl border border-primary/10 overflow-hidden mb-8">
          <h3 className="px-6 py-3 bg-cream-dark font-semibold text-secondary-dark border-b border-primary/10">
            Pending ({pendingList.length})
          </h3>
          <ul className="divide-y divide-primary/10">
            {pendingList.map((row) => (
              <li key={row.id} className="px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-secondary-dark">{row.email}</p>
                    <p className="text-sm text-secondary-light">
                      Registered {format(new Date(row.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                      value={selectedRole[row.id] || 'editor'}
                      onChange={(e) => setSelectedRole({ ...selectedRole, [row.id]: e.target.value })}
                      className="px-3 py-2 border border-primary/20 rounded-lg bg-cream text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      disabled={actionLoading === row.id}
                    >
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleApprove(row)}
                      disabled={actionLoading === row.id}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {actionLoading === row.id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-secondary-light mt-2">
                  {ROLES.find(r => r.value === (selectedRole[row.id] || 'editor'))?.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingList.length === 0 && (
        <p className="text-secondary-light mb-8">No pending approvals.</p>
      )}

      <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
        <h3 className="px-6 py-3 bg-cream-dark font-semibold text-secondary-dark border-b border-primary/10">
          Approved users ({approvedList.length})
        </h3>
        <ul className="divide-y divide-primary/10">
          {approvedList.length === 0 ? (
            <li className="px-6 py-4 text-secondary-light text-sm">None yet.</li>
          ) : (
            approvedList.map((row) => (
              <li key={row.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-dark">{row.email}</p>
                  {row.approved_at && (
                    <p className="text-xs text-secondary-light">
                      Approved {format(new Date(row.approved_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 bg-primary-50 text-primary text-xs font-medium rounded-full border border-primary/20">
                  {row.role ? row.role.charAt(0).toUpperCase() + row.role.slice(1) : 'Editor'}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
