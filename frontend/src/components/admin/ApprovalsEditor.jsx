import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features' },
  { value: 'editor', label: 'Editor', description: 'Can manage content (events, sermons, etc.)' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
]

const USER_FILTERS = ['all', 'active', 'inactive']
const RPC_TIMEOUT_MS = 12000
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export default function ApprovalsEditor() {
  const [approvalRows, setApprovalRows] = useState([])
  const [approvedUsers, setApprovedUsers] = useState([])
  const [loadingApprovals, setLoadingApprovals] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [pendingSelectedRole, setPendingSelectedRole] = useState({})
  const [approvedSelectedRole, setApprovedSelectedRole] = useState({})
  const [resendLoadingId, setResendLoadingId] = useState(null)
  const [roleUpdateLoadingId, setRoleUpdateLoadingId] = useState(null)
  const [profileUpdateLoadingId, setProfileUpdateLoadingId] = useState(null)
  const [statusUpdateLoadingId, setStatusUpdateLoadingId] = useState(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState(null)
  const [userFilter, setUserFilter] = useState('all')
  const { user } = useAuth()

  const formatDateSafe = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return format(date, 'MMM d, yyyy')
  }

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  const buildRpcErrorMessage = (err, fnName) => {
    const message = err?.message || 'An error occurred.'
    if (message.toLowerCase().includes('verify their email')) {
      return 'This user has not verified their email yet. Ask them to click the verification link, then approve again.'
    }
    if (err?.code === 'PGRST202' || message.includes('Could not find the function')) {
      return `Missing database function "${fnName}". Deploy latest Supabase migrations and retry.`
    }
    return message
  }

  const callRpcViaRest = async (fnName, requestPayload) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return { error: { message: 'Supabase is not configured. Missing environment variables.' } }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return { error: { message: 'Your session has expired. Please sign in again.' } }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS)

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload || {}),
        signal: controller.signal,
      })

      if (response.ok) return { error: null }

      let errorPayload = null
      try {
        errorPayload = await response.json()
      } catch {
        errorPayload = null
      }

      return {
        error: {
          code: errorPayload?.code,
          message: errorPayload?.message || `Request failed with status ${response.status}.`,
        },
      }
    } catch (err) {
      if (err?.name === 'AbortError') {
        return { error: { message: `Request timed out after ${Math.floor(RPC_TIMEOUT_MS / 1000)} seconds.` } }
      }
      return { error: { message: err?.message || 'Network request failed.' } }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const loadApprovals = async () => {
    setLoadingApprovals(true)
    try {
      const { data, error } = await supabase.rpc('get_admin_approvals')
      if (error) {
        toast.error(`Failed to load approvals: ${buildRpcErrorMessage(error, 'get_admin_approvals')}`)
        setApprovalRows([])
      } else {
        setApprovalRows(data || [])
      }
    } catch (err) {
      toast.error(`Failed to load approvals: ${buildRpcErrorMessage(err, 'get_admin_approvals')}`)
      setApprovalRows([])
    } finally {
      setLoadingApprovals(false)
    }
  }

  const loadApprovedUsers = async (status = userFilter) => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase.rpc('get_admin_users', { p_status: status })
      if (error) {
        toast.error(`Failed to load users: ${buildRpcErrorMessage(error, 'get_admin_users')}`)
        setApprovedUsers([])
      } else {
        setApprovedUsers(data || [])
      }
    } catch (err) {
      toast.error(`Failed to load users: ${buildRpcErrorMessage(err, 'get_admin_users')}`)
      setApprovedUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    void loadApprovals()
  }, [])

  useEffect(() => {
    void loadApprovedUsers(userFilter)
  }, [userFilter])

  const handleApprove = async (row) => {
    const role = pendingSelectedRole[row.id] || 'editor'
    const roleLabel = ROLES.find((r) => r.value === role)?.label || role

    const result = await Swal.fire({
      title: 'Approve user?',
      text: `Allow ${row.email} to access the admin area as ${roleLabel}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      reverseButtons: true,
      preConfirm: async () => {
        const { error } = await callRpcViaRest('approve_admin_user', {
          p_approval_id: row.id,
          p_role: role,
        })
        if (error) {
          Swal.showValidationMessage(buildRpcErrorMessage(error, 'approve_admin_user'))
          return false
        }
        return true
      },
    })

    if (!result.isConfirmed) return
    toast.success('User approved.')
    void Promise.all([loadApprovals(), loadApprovedUsers(userFilter)])
  }

  const handleResendVerification = async (row) => {
    if (!row?.email) {
      toast.error('No email found for this user.')
      return
    }

    setResendLoadingId(row.id)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: row.email,
        options: {
          emailRedirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent('/admin')}&email_verified=1`,
        },
      })
      if (error) throw error
      toast.success(`Verification email resent to ${row.email}.`)
    } catch (err) {
      toast.error(`Failed to resend verification: ${err?.message || 'Unknown error.'}`)
    } finally {
      setResendLoadingId(null)
    }
  }

  const handleSaveRole = async (row) => {
    const currentRole = row.role || 'editor'
    const nextRole = approvedSelectedRole[row.approval_id] || currentRole
    if (nextRole === currentRole) return

    const nextRoleLabel = ROLES.find((r) => r.value === nextRole)?.label || nextRole
    const result = await Swal.fire({
      title: 'Change role?',
      text: `Change ${row.email} from ${currentRole} to ${nextRoleLabel}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Save role',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      reverseButtons: true,
      preConfirm: async () => {
        const { error } = await callRpcViaRest('set_admin_user_role', {
          p_approval_id: row.approval_id,
          p_role: nextRole,
        })
        if (error) {
          Swal.showValidationMessage(buildRpcErrorMessage(error, 'set_admin_user_role'))
          return false
        }
        return true
      },
    })

    if (!result.isConfirmed) return
    setRoleUpdateLoadingId(row.approval_id)
    toast.success(`Role updated to ${nextRoleLabel}.`)
    setRoleUpdateLoadingId(null)
    void loadApprovedUsers(userFilter)
  }

  const handleEditProfile = async (row) => {
    const fullName = escapeHtml(row.full_name || '')
    const phone = escapeHtml(row.phone || '')
    const title = escapeHtml(row.title || '')
    const notes = escapeHtml(row.notes || '')

    const result = await Swal.fire({
      title: 'Edit user profile',
      html: `
        <input id="swal-profile-name" class="swal2-input" placeholder="Full name" value="${fullName}" />
        <input id="swal-profile-phone" class="swal2-input" placeholder="Phone" value="${phone}" />
        <input id="swal-profile-title" class="swal2-input" placeholder="Title / Position" value="${title}" />
        <textarea id="swal-profile-notes" class="swal2-textarea" placeholder="Notes">${notes}</textarea>
        <label style="display:flex;align-items:center;gap:8px;justify-content:center;margin-top:8px;">
          <input id="swal-profile-active" type="checkbox" ${row.is_active ? 'checked' : ''} />
          <span>User is active</span>
        </label>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save profile',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        const payload = {
          p_user_id: row.user_id,
          p_full_name: document.getElementById('swal-profile-name')?.value || null,
          p_phone: document.getElementById('swal-profile-phone')?.value || null,
          p_title: document.getElementById('swal-profile-title')?.value || null,
          p_notes: document.getElementById('swal-profile-notes')?.value || null,
          p_is_active: Boolean(document.getElementById('swal-profile-active')?.checked),
        }

        const { error } = await callRpcViaRest('upsert_admin_user_profile', payload)
        if (error) {
          Swal.showValidationMessage(buildRpcErrorMessage(error, 'upsert_admin_user_profile'))
          return false
        }
        return true
      },
    })

    if (!result.isConfirmed) return
    setProfileUpdateLoadingId(row.approval_id)
    toast.success('User profile updated.')
    setProfileUpdateLoadingId(null)
    void loadApprovedUsers(userFilter)
  }

  const handleSetActive = async (row) => {
    const nextActive = !row.is_active
    const actionLabel = nextActive ? 'reactivate' : 'deactivate'
    const result = await Swal.fire({
      title: `${nextActive ? 'Reactivate' : 'Deactivate'} user?`,
      text: nextActive
        ? `Restore admin access for ${row.email}?`
        : `${row.email} will immediately lose admin access.`,
      icon: nextActive ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: nextActive ? 'Reactivate' : 'Deactivate',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    })

    if (!result.isConfirmed) return

    setStatusUpdateLoadingId(row.approval_id)
    try {
      const { error } = await callRpcViaRest('set_admin_user_active', {
        p_user_id: row.user_id,
        p_is_active: nextActive,
      })
      if (error) throw error
      toast.success(`User ${actionLabel}d.`)
      void loadApprovedUsers(userFilter)
    } catch (error) {
      toast.error(`Failed to ${actionLabel} user: ${error?.message || 'Unknown error.'}`)
    } finally {
      setStatusUpdateLoadingId(null)
    }
  }

  const handleDeleteUser = async (row) => {
    const result = await Swal.fire({
      title: 'Permanently delete user?',
      html: `Delete <strong>${escapeHtml(row.email)}</strong>? This removes the Auth account and cannot be undone.`,
      icon: 'warning',
      input: 'text',
      inputPlaceholder: 'Type DELETE to confirm',
      showCancelButton: true,
      confirmButtonText: 'Delete user',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      preConfirm: (value) => {
        if (value !== 'DELETE') {
          Swal.showValidationMessage('Type DELETE to confirm.')
          return false
        }
        return true
      },
    })

    if (!result.isConfirmed) return

    setDeleteLoadingId(row.approval_id || row.id)
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-access', {
        body: { action: 'delete-user', userId: row.user_id },
      })
      if (error) {
        let message = error.message
        try {
          const errorBody = await error.context?.json()
          message = errorBody?.error || message
        } catch {
          // Keep the function client error when the response body is unavailable.
        }
        throw new Error(message)
      }
      if (data?.error) throw new Error(data.error)
      toast.success(data?.warning || 'User deleted.')
      void Promise.all([loadApprovals(), loadApprovedUsers(userFilter)])
    } catch (error) {
      toast.error(`Failed to delete user: ${error?.message || 'Unknown error.'}`)
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const pendingList = approvalRows.filter((r) => !r.approved)
  const approvedList = approvedUsers

  if (loadingApprovals || loadingUsers) {
    return <p className="text-secondary-light">Loading...</p>
  }

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-secondary-dark mb-4">User approvals</h2>
      <p className="text-secondary-light mb-6">
        Approve or leave pending new admin registrations. Only approved users can access the admin area.
      </p>
      <p className="text-secondary-light text-sm mb-6">
        Note: approval is separate from email verification. Users must confirm their email before they can sign in.
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
                      Registered {formatDateSafe(row.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                      value={pendingSelectedRole[row.id] || 'editor'}
                      onChange={(e) => setPendingSelectedRole({ ...pendingSelectedRole, [row.id]: e.target.value })}
                      className="px-3 py-2 border border-primary/20 rounded-lg bg-cream text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
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
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResendVerification(row)}
                      disabled={resendLoadingId === row.id}
                      className="px-4 py-2 border border-primary/30 text-primary hover:bg-primary/5 font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {resendLoadingId === row.id ? 'Sending...' : 'Resend Verification'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(row)}
                      disabled={deleteLoadingId === row.id || row.user_id === user?.id}
                      className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {deleteLoadingId === row.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-secondary-light mt-2">
                  {ROLES.find((r) => r.value === (pendingSelectedRole[row.id] || 'editor'))?.description}
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
        <div className="px-6 py-3 bg-cream-dark border-b border-primary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-semibold text-secondary-dark">
            Users ({approvedList.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {USER_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setUserFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  userFilter === filter
                    ? 'bg-primary text-white'
                    : 'bg-white text-secondary-dark border border-primary/20 hover:bg-primary/5'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {approvedList.length === 0 ? (
          <div className="px-6 py-4 text-secondary-light text-sm">No users found for this filter.</div>
        ) : (
          <ul className="divide-y divide-primary/10">
            {approvedList.map((row) => (
              <li key={row.approval_id} className="px-6 py-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-secondary-dark">{row.full_name || row.email}</p>
                  <p className="text-sm text-secondary-light">{row.email}</p>
                  <p className="text-sm text-secondary-light">
                    {row.title || 'No title set'} • {row.phone || 'No phone set'}
                  </p>
                  <p className="text-xs text-secondary-light mt-1">
                    Registered {formatDateSafe(row.created_at)} • Approved {formatDateSafe(row.approved_at)} • Last sign-in {formatDateSafe(row.last_sign_in_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.email_confirmed_at ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {row.email_confirmed_at ? 'Email verified' : 'Email unverified'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <select
                    value={approvedSelectedRole[row.approval_id] || row.role || 'editor'}
                    onChange={(e) => setApprovedSelectedRole({ ...approvedSelectedRole, [row.approval_id]: e.target.value })}
                    className="px-3 py-2 border border-primary/20 rounded-lg bg-cream text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    disabled={roleUpdateLoadingId === row.approval_id}
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSaveRole(row)}
                    disabled={
                      roleUpdateLoadingId === row.approval_id ||
                      (approvedSelectedRole[row.approval_id] || row.role || 'editor') === (row.role || 'editor')
                    }
                    className="px-4 py-2 border border-primary/30 text-primary hover:bg-primary/5 font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {roleUpdateLoadingId === row.approval_id ? 'Saving...' : 'Save Role'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditProfile(row)}
                    disabled={profileUpdateLoadingId === row.approval_id}
                    className="px-4 py-2 border border-secondary-dark/30 text-secondary-dark hover:bg-secondary-dark/5 font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {profileUpdateLoadingId === row.approval_id ? 'Saving...' : 'Edit Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetActive(row)}
                    disabled={statusUpdateLoadingId === row.approval_id || row.user_id === user?.id}
                    className={`px-4 py-2 border font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap ${
                      row.is_active
                        ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {statusUpdateLoadingId === row.approval_id
                      ? 'Saving...'
                      : row.is_active
                        ? 'Deactivate'
                        : 'Reactivate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(row)}
                    disabled={deleteLoadingId === row.approval_id || row.user_id === user?.id}
                    className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {deleteLoadingId === row.approval_id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
