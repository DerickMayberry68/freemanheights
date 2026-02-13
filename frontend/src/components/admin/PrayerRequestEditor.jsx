import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-toastify'
import {
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/AuthContext'

export default function PrayerRequestEditor() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, responded
  const [generationFilter, setGenerationFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [responseModalOpen, setResponseModalOpen] = useState(false)
  const [responseForm, setResponseForm] = useState({
    method: 'phone',
    notes: ''
  })
  const { user } = useAuth()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('prayer_requests_admin_view')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading prayer requests:', error)
      toast.error('Failed to load prayer requests')
    } else {
      setRequests(data || [])
    }
    setLoading(false)
  }

  const getFilteredRequests = () => {
    let filtered = requests

    // Filter by response status
    if (filter === 'pending') {
      filtered = filtered.filter(r => !r.has_response)
    } else if (filter === 'responded') {
      filtered = filtered.filter(r => r.has_response)
    }

    // Filter by generation
    if (generationFilter !== 'all') {
      filtered = filtered.filter(r => r.generation === generationFilter)
    }

    return filtered
  }

  const openResponseModal = (request) => {
    setSelectedRequest(request)
    setResponseForm({
      method: request.generation === 'boomer' || request.generation === 'silent' ? 'phone' : 'email',
      notes: ''
    })
    setResponseModalOpen(true)
  }

  const handleMarkAsResponded = async () => {
    if (!selectedRequest || !user) return

    const { error } = await supabase
      .from('prayer_requests')
      .update({
        responded_at: new Date().toISOString(),
        responded_by: user.id,
        response_method: responseForm.method,
        response_notes: responseForm.notes,
        is_answered: true
      })
      .eq('id', selectedRequest.id)

    if (error) {
      console.error('Error updating prayer request:', error)
      toast.error('Failed to mark as responded')
    } else {
      toast.success('Prayer request marked as responded')
      setResponseModalOpen(false)
      setSelectedRequest(null)
      setResponseForm({ method: 'phone', notes: '' })
      loadRequests()
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prayer request? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('prayer_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting prayer request:', error)
      toast.error('Failed to delete prayer request')
    } else {
      toast.success('Prayer request deleted')
      loadRequests()
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getGenerationBadge = (generation) => {
    const colors = {
      youth: 'bg-purple-100 text-purple-800',
      gen_z: 'bg-blue-100 text-blue-800',
      millennial: 'bg-green-100 text-green-800',
      gen_x: 'bg-yellow-100 text-yellow-800',
      boomer: 'bg-orange-100 text-orange-800',
      silent: 'bg-gray-100 text-gray-800',
      unknown: 'bg-gray-50 text-gray-600'
    }

    const labels = {
      youth: 'Youth',
      gen_z: 'Gen Z',
      millennial: 'Millennial',
      gen_x: 'Gen X',
      boomer: 'Boomer',
      silent: 'Silent Gen',
      unknown: 'Unknown'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[generation] || colors.unknown}`}>
        {labels[generation] || labels.unknown}
      </span>
    )
  }

  const getResponseMethodIcon = (method) => {
    switch (method) {
      case 'phone':
        return <PhoneIcon className="h-4 w-4" />
      case 'email':
        return <EnvelopeIcon className="h-4 w-4" />
      case 'text':
        return <ChatBubbleLeftIcon className="h-4 w-4" />
      case 'in_person':
        return <UserIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const filteredRequests = getFilteredRequests()

  return (
    <div className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-secondary-dark mb-2">Prayer Requests</h2>
        <p className="text-secondary-light">Manage and respond to prayer requests from the congregation</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-dark mb-2">Status</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-secondary hover:bg-gray-200'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'pending'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-secondary hover:bg-gray-200'
              }`}
            >
              Pending ({requests.filter(r => !r.has_response).length})
            </button>
            <button
              onClick={() => setFilter('responded')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'responded'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-secondary hover:bg-gray-200'
              }`}
            >
              Responded ({requests.filter(r => r.has_response).length})
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-dark mb-2">Generation</label>
          <select
            value={generationFilter}
            onChange={(e) => setGenerationFilter(e.target.value)}
            className="px-4 py-2 border border-primary/20 rounded-lg bg-white focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Generations</option>
            <option value="youth">Youth (&lt;18)</option>
            <option value="gen_z">Gen Z (18-24)</option>
            <option value="millennial">Millennial (25-39)</option>
            <option value="gen_x">Gen X (40-54)</option>
            <option value="boomer">Boomer (55-74)</option>
            <option value="silent">Silent Gen (75+)</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Prayer Requests List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-primary/10 p-8 text-center">
          <p className="text-secondary-light">Loading prayer requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-primary/10 p-8 text-center">
          <p className="text-secondary-light">No prayer requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl border border-primary/10 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-secondary-dark">{request.name}</h3>
                    {getGenerationBadge(request.generation)}
                    {request.has_response && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckIcon className="h-3 w-3" />
                        Responded
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-secondary-light mb-3">
                    {request.email && (
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="h-4 w-4" />
                        {request.email}
                      </span>
                    )}
                    {request.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="h-4 w-4" />
                        {request.phone}
                      </span>
                    )}
                    {request.birthday && (
                      <span>Age: {request.age}</span>
                    )}
                    <span>Received: {formatDate(request.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-secondary-dark whitespace-pre-wrap">{request.request}</p>
              </div>

              {request.has_response && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                    {getResponseMethodIcon(request.response_method)}
                    <span className="font-medium">
                      Responded via {request.response_method} on {formatDate(request.responded_at)}
                    </span>
                  </div>
                  {request.response_notes && (
                    <p className="text-sm text-green-700">{request.response_notes}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {!request.has_response && (
                  <button
                    onClick={() => openResponseModal(request)}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Mark as Responded
                  </button>
                )}
                <button
                  onClick={() => handleDelete(request.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {responseModalOpen && selectedRequest && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setResponseModalOpen(false)
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-primary/10">
              <h3 className="text-lg font-semibold text-secondary-dark">Record Response</h3>
              <button
                type="button"
                onClick={() => setResponseModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-secondary-light mb-1">Prayer request from:</p>
                <p className="font-semibold text-secondary-dark">{selectedRequest.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-2">
                  Response Method *
                </label>
                <select
                  value={responseForm.method}
                  onChange={(e) => setResponseForm({ ...responseForm, method: e.target.value })}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30"
                >
                  <option value="phone">Phone Call</option>
                  <option value="email">Email</option>
                  <option value="text">Text Message</option>
                  <option value="in_person">In Person</option>
                  <option value="push_notification">Push Notification</option>
                  <option value="other">Other</option>
                </select>
                {(selectedRequest.generation === 'boomer' || selectedRequest.generation === 'silent') && (
                  <p className="text-xs text-orange-600 mt-1">
                    💡 Suggested: Phone call (older generation may prefer personal contact)
                  </p>
                )}
                {(selectedRequest.generation === 'millennial' || selectedRequest.generation === 'gen_z') && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Suggested: Email or text (younger generation may prefer digital)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-2">
                  Response Notes
                </label>
                <textarea
                  value={responseForm.notes}
                  onChange={(e) => setResponseForm({ ...responseForm, notes: e.target.value })}
                  rows={4}
                  placeholder="Add any notes about your response or follow-up needed..."
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-cream focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleMarkAsResponded}
                  className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
                >
                  Mark as Responded
                </button>
                <button
                  onClick={() => setResponseModalOpen(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-secondary-dark font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
