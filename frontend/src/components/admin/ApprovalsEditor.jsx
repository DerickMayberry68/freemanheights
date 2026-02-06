import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../../lib/AuthContext'
import { useModal } from '../../lib/ModalContext'

export default function ApprovalsEditor() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const { refreshApproval } = useAuth()
  const { showError, showConfirm } = useModal()

  const loadApprovals = () => {
    setLoading(true)
    supabase
      .rpc('get_admin_approvals')
      .then(({ data, error: e }) => {
        if (e) {
          console.error('Failed to load approvals:', e.message)
          showError('Failed to load approvals', e.message)
          setPending([])
        } else {
          setPending(data || [])
        }
        setLoading(false)
      })
  }

  useEffect(() => {
    loadApprovals()
  }, [])

  const runApprove = async (id) => {
    setActionLoading(id)
    const { error: err } = await supabase.rpc('approve_admin_user', { p_approval_id: id })
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
    showConfirm({
      title: 'Approve user',
      message: `Allow ${row.email} to access the admin area?`,
      confirmLabel: 'Approve',
      cancelLabel: 'Cancel',
      onConfirm: () => runApprove(row.id),
    })
  }

  const pendingList = pending.filter((r) => !r.approved)
  const approvedList = pending.filter((r) => r.approved)

  if (loading) return <p className="text-secondary-light">Loading...</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-secondary-dark mb-4">User approvals</h2>
      <p className="text-secondary-light mb-6">
        Approve or leave pending new admin registrations. Only approved users can access the admin area.
      </p>

      {pendingList.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
          <h3 className="px-6 py-3 bg-gray-50 font-semibold text-secondary-dark border-b border-gray-100">
            Pending ({pendingList.length})
          </h3>
          <ul className="divide-y divide-gray-100">
            {pendingList.map((row) => (
              <li key={row.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-secondary-dark">{row.email}</p>
                  <p className="text-sm text-secondary-light">
                    Registered {format(new Date(row.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleApprove(row)}
                  disabled={actionLoading === row.id}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-secondary-dark font-medium rounded-lg disabled:opacity-50"
                >
                  {actionLoading === row.id ? 'Approving...' : 'Approve'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingList.length === 0 && (
        <p className="text-secondary-light mb-8">No pending approvals.</p>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <h3 className="px-6 py-3 bg-gray-50 font-semibold text-secondary-dark border-b border-gray-100">
          Approved users ({approvedList.length})
        </h3>
        <ul className="divide-y divide-gray-100">
          {approvedList.length === 0 ? (
            <li className="px-6 py-4 text-secondary-light text-sm">None yet.</li>
          ) : (
            approvedList.map((row) => (
              <li key={row.id} className="px-6 py-3">
                <p className="font-medium text-secondary-dark">{row.email}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
