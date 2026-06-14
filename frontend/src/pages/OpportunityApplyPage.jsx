import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowUpTrayIcon, CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const churchId = '00000000-0000-0000-0000-000000000001'
const emptyProfile = {
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  address_line1: '',
  city: '',
  state: '',
  postal_code: '',
  experience: '',
}

export default function OpportunityApplyPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const [opportunity, setOpportunity] = useState(null)
  const [profile, setProfile] = useState(emptyProfile)
  const [answers, setAnswers] = useState({})
  const [coverMessage, setCoverMessage] = useState('')
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    supabase.from('opportunities').select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
      .then(({ data, error: loadError }) => {
        const isClosed = data?.closing_date && data.closing_date < new Date().toISOString().slice(0, 10)
        if (loadError || !data || isClosed) setError('This opportunity is not accepting applications.')
        setOpportunity(isClosed ? null : data || null)
        setLoading(false)
      })
  }, [slug])

  useEffect(() => {
    if (!session?.user?.id) return
    Promise.all([
      supabase.from('applicant_profiles').select('*').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('member_profiles').select('first_name, last_name, phone').eq('id', session.user.id).maybeSingle(),
    ]).then(([applicantResult, memberResult]) => {
      const existing = applicantResult.data || memberResult.data
      if (existing) setProfile((current) => ({ ...current, ...existing }))
      else setProfile((current) => ({ ...current, email: session.user.email || '' }))
    })
  }, [session?.user?.id])

  const setProfileField = (name, value) => setProfile((current) => ({ ...current, [name]: value }))

  const handleResume = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowed.includes(file.type)) {
      setError('Résumé must be a PDF, DOC, or DOCX file.')
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Résumé must be smaller than 5MB.')
      event.target.value = ''
      return
    }
    setError('')
    setResume(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!session?.user?.id || !opportunity) return
    setSaving(true)
    setError('')
    let uploadedPath = null

    try {
      const { error: profileError } = await supabase.from('applicant_profiles').upsert({
        user_id: session.user.id,
        church_id: churchId,
        email: session.user.email || profile.email || null,
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        phone: profile.phone.trim() || null,
        address_line1: profile.address_line1.trim() || null,
        city: profile.city.trim() || null,
        state: profile.state.trim() || null,
        postal_code: profile.postal_code.trim() || null,
        experience: profile.experience.trim() || null,
      })
      if (profileError) throw profileError

      if (resume) {
        const extension = resume.name.split('.').pop().toLowerCase()
        uploadedPath = `${session.user.id}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage.from('application-resumes')
          .upload(uploadedPath, resume, { upsert: false, contentType: resume.type })
        if (uploadError) throw uploadError
      }

      const { error: submitError } = await supabase.rpc('submit_opportunity_application', {
        p_opportunity_id: opportunity.id,
        p_cover_message: coverMessage.trim() || null,
        p_answers: answers,
        p_resume_path: uploadedPath,
        p_resume_name: resume?.name || null,
      })
      if (submitError) throw submitError
      setSubmitted(true)
    } catch (submitError) {
      if (uploadedPath) await supabase.storage.from('application-resumes').remove([uploadedPath])
      setError(submitError.message || 'Unable to submit your application.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) return <div className="py-20 text-center text-secondary-light">Loading application...</div>
  if (!opportunity) return <div className="py-20 text-center text-red-700">{error}</div>

  if (!session) {
    const redirect = `/opportunities/${slug}/apply`
    return (
      <div className="min-h-[65vh] bg-cream-dark/30 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-lg border border-primary/10 bg-white p-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-secondary-dark">Apply for {opportunity.title}</h1>
          <p className="mt-3 leading-7 text-secondary">Sign in with an existing church account or create an applicant account to continue.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={`/opportunities/login?redirect=${encodeURIComponent(redirect)}`}
              className="rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-dark">Sign in</Link>
            <Link to={`/opportunities/register?redirect=${encodeURIComponent(redirect)}`}
              className="rounded-lg border border-primary/30 px-5 py-3 font-semibold text-primary hover:bg-primary-50">Create account</Link>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-[65vh] bg-cream-dark/30 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-lg border border-green-200 bg-white p-8 text-center">
          <CheckCircleIcon className="mx-auto h-14 w-14 text-green-600" />
          <h1 className="mt-4 font-serif text-3xl font-bold text-secondary-dark">Application received</h1>
          <p className="mt-3 text-secondary">Thank you for applying for {opportunity.title}. You can follow its progress from My Applications.</p>
          <button type="button" onClick={() => navigate('/my-applications')}
            className="mt-6 rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-dark">View my applications</button>
        </div>
      </div>
    )
  }

  const inputClass = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

  return (
    <div className="bg-cream-dark/20 px-4 py-10">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        <header>
          <Link to={`/opportunities/${slug}`} className="font-medium text-primary hover:underline">&larr; Back to opportunity</Link>
          <h1 className="mt-4 font-serif text-4xl font-bold text-secondary-dark">Apply for {opportunity.title}</h1>
          <p className="mt-2 text-secondary-light">Your account lets you save one profile for future applications.</p>
        </header>
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <section className="rounded-lg border border-gray-200 bg-white p-5 sm:p-7">
          <h2 className="text-xl font-bold text-secondary-dark">Applicant profile</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-secondary-dark sm:col-span-2">Email
              <input readOnly value={session.user.email || profile.email || ''} className={`${inputClass} bg-gray-50 text-secondary`} />
            </label>
            <label className="text-sm font-semibold text-secondary-dark">First name *
              <input required value={profile.first_name} onChange={(event) => setProfileField('first_name', event.target.value)} className={inputClass} />
            </label>
            <label className="text-sm font-semibold text-secondary-dark">Last name *
              <input required value={profile.last_name} onChange={(event) => setProfileField('last_name', event.target.value)} className={inputClass} />
            </label>
            <label className="text-sm font-semibold text-secondary-dark">Phone
              <input type="tel" value={profile.phone || ''} onChange={(event) => setProfileField('phone', event.target.value)} className={inputClass} />
            </label>
            <label className="text-sm font-semibold text-secondary-dark">Street address
              <input value={profile.address_line1 || ''} onChange={(event) => setProfileField('address_line1', event.target.value)} className={inputClass} />
            </label>
            <label className="text-sm font-semibold text-secondary-dark">City
              <input value={profile.city || ''} onChange={(event) => setProfileField('city', event.target.value)} className={inputClass} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-secondary-dark">State
                <input value={profile.state || ''} onChange={(event) => setProfileField('state', event.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-secondary-dark">ZIP
                <input value={profile.postal_code || ''} onChange={(event) => setProfileField('postal_code', event.target.value)} className={inputClass} />
              </label>
            </div>
          </div>
          <label className="mt-4 block text-sm font-semibold text-secondary-dark">Experience and background
            <textarea rows={5} maxLength={5000} value={profile.experience || ''}
              onChange={(event) => setProfileField('experience', event.target.value)} className={inputClass}
              placeholder="Tell us about relevant work, ministry, volunteer, or life experience." />
          </label>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 sm:p-7">
          <h2 className="text-xl font-bold text-secondary-dark">Your application</h2>
          <label className="mt-4 block text-sm font-semibold text-secondary-dark">Why are you interested?
            <textarea rows={5} maxLength={5000} value={coverMessage}
              onChange={(event) => setCoverMessage(event.target.value)} className={inputClass} />
          </label>
          {(opportunity.application_questions || []).map((question) => (
            <label key={question.id} className="mt-4 block text-sm font-semibold text-secondary-dark">
              {question.label}{question.required && ' *'}
              {question.type === 'textarea' ? (
                <textarea required={question.required} rows={4} value={answers[question.id] || ''}
                  onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} className={inputClass} />
              ) : question.type === 'select' ? (
                <select required={question.required} value={answers[question.id] || ''}
                  onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} className={inputClass}>
                  <option value="">Choose one</option>
                  {(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input required={question.required} value={answers[question.id] || ''}
                  onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} className={inputClass} />
              )}
            </label>
          ))}

          {opportunity.opportunity_type === 'paid' && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-secondary-dark">Résumé <span className="font-normal text-secondary-light">(optional)</span></p>
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 p-5 text-secondary hover:border-primary">
                <ArrowUpTrayIcon className="h-6 w-6" />
                <span>{resume ? resume.name : 'Choose PDF, DOC, or DOCX up to 5MB'}</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResume} className="sr-only" />
              </label>
              {resume && <p className="mt-2 flex items-center gap-2 text-sm text-secondary-light"><DocumentTextIcon className="h-4 w-4" />Stored privately with your application</p>}
            </div>
          )}
        </section>

        <button type="submit" disabled={saving}
          className="w-full rounded-lg bg-primary px-5 py-3.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
          {saving ? 'Submitting application...' : 'Submit application'}
        </button>
      </form>
    </div>
  )
}
