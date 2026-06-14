import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const statusLabels = {
  new: 'Received',
  reviewing: 'In review',
  interview: 'Interview',
  accepted: 'Accepted',
  declined: 'Not selected',
  withdrawn: 'Withdrawn',
}

const statusClasses = {
  new: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-amber-100 text-amber-800',
  interview: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-gray-100 text-gray-700',
  withdrawn: 'bg-gray-100 text-gray-700',
}

export default function MyApplicationsPage() {
  const { session, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadApplications = async () => {
    if (!session?.user?.id) return
    const { data, error: loadError } = await supabase.from('opportunity_applications')
      .select('*, opportunities(title, slug, opportunity_type)')
      .order('submitted_at', { ascending: false })
    if (loadError) setError(loadError.message)
    setApplications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (session?.user?.id) loadApplications()
    else if (!authLoading) setLoading(false)
  }, [session?.user?.id, authLoading])

  const withdraw = async (id) => {
    const { error: withdrawError } = await supabase.rpc('withdraw_opportunity_application', { p_application_id: id })
    if (withdrawError) setError(withdrawError.message)
    else loadApplications()
  }

  if (authLoading || loading) return <div className="py-20 text-center text-secondary-light">Loading applications...</div>
  if (!session) {
    return (
      <div className="min-h-[60vh] py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-secondary-dark">My applications</h1>
        <p className="mt-3 text-secondary">Sign in to review your applications.</p>
        <Link to="/opportunities/login?redirect=%2Fmy-applications" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-white">Sign in</Link>
      </div>
    )
  }

  return (
    <div className="min-h-[65vh] bg-cream-dark/20 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-secondary-dark">My applications</h1>
            <p className="mt-2 text-secondary-light">Track applications submitted to Freeman Heights.</p>
          </div>
          <Link to="/opportunities" className="font-semibold text-primary hover:underline">Browse opportunities</Link>
        </div>
        {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        <div className="mt-8 space-y-4">
          {applications.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-secondary-light">You have not submitted an application yet.</div>
          ) : applications.map((application) => (
            <article key={application.id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">{application.opportunities?.opportunity_type}</p>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-secondary-dark">{application.opportunities?.title}</h2>
                  <p className="mt-2 text-sm text-secondary-light">Submitted {new Date(application.submitted_at).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses[application.status]}`}>
                  {statusLabels[application.status]}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to={`/opportunities/${application.opportunities?.slug}`} className="font-semibold text-primary hover:underline">View opportunity</Link>
                {!['accepted', 'declined', 'withdrawn'].includes(application.status) && (
                  <button type="button" onClick={() => withdraw(application.id)} className="font-semibold text-red-600 hover:underline">Withdraw application</button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
