import { Routes, Route, Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import EventEditor from '../../components/admin/EventEditor'
import SermonEditor from '../../components/admin/SermonEditor'
import MinistryEditor from '../../components/admin/MinistryEditor'
import StaffEditor from '../../components/admin/StaffEditor'
import BibleVerseEditor from '../../components/admin/BibleVerseEditor'
import AIAssistantEditor from '../../components/admin/AIAssistantEditor'
import ApprovalsEditor from '../../components/admin/ApprovalsEditor'
import UserProfileEditor from '../../components/admin/UserProfileEditor'
import PrayerRequestEditor from '../../components/admin/PrayerRequestEditor'
import EventRegistrationEditor from '../../components/admin/EventRegistrationEditor'
import AdminLoginHistory from '../../components/admin/AdminLoginHistory'
import ConnectionEditor from '../../components/admin/ConnectionEditor'
import OpportunityEditor from '../../components/admin/OpportunityEditor'
import ApplicationEditor from '../../components/admin/ApplicationEditor'

function AdminHome() {
  const primaryActions = [
    {
      title: 'Review Access',
      description: 'Approve new admin registrations, deactivate old accounts, and check login history.',
      links: [
        { to: '/admin/approvals', label: 'Manage users' },
        { to: '/admin/login-history', label: 'View login history' },
      ],
    },
    {
      title: 'Follow Up',
      description: 'Review guest connection cards, member requests, and ministry follow-up items.',
      links: [
        { to: '/admin/connections', label: 'Connections' },
        { to: '/admin/prayer-requests', label: 'Prayer requests' },
      ],
    },
    {
      title: 'Opportunities & Applications',
      description: 'Publish paid or volunteer openings and review submitted applications.',
      links: [
        { to: '/admin/opportunities', label: 'Opportunities' },
        { to: '/admin/applications', label: 'Applications' },
      ],
    },
    {
      title: 'Manage This Week',
      description: 'Keep calendar events and event registration rosters current.',
      links: [
        { to: '/admin/events', label: 'Edit events' },
        { to: '/admin/registrations', label: 'Review registrations' },
      ],
    },
    {
      title: 'Update Church Content',
      description: 'Maintain ministry, staff, sermon, and Bible verse content for the public site.',
      links: [
        { to: '/admin/sermons', label: 'Sermons' },
        { to: '/admin/ministries', label: 'Ministries' },
        { to: '/admin/staff', label: 'Staff' },
        { to: '/admin/bible-verses', label: 'Bible verses' },
      ],
    },
  ]

  const statusCards = [
    { label: 'Admin access', value: 'Protected', note: 'Inactive users are blocked by database checks.' },
    { label: 'Login auditing', value: 'Enabled', note: 'Successful admin logins are recorded.' },
    { label: 'Public workflows', value: 'Connected', note: 'Connection cards, opportunities, and applications are wired into admin.' },
  ]

  return (
    <div>
      <div className="mb-8 rounded-2xl bg-white border border-primary/10 shadow-sm p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Admin Dashboard</p>
        <h2 className="mt-2 text-3xl font-serif font-bold text-secondary-dark">Freeman Heights Admin</h2>
        <p className="mt-3 max-w-3xl text-secondary-light">
          Use the grouped menu for full navigation. This dashboard keeps the common operational work and current admin controls in one place.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/admin/events" className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-dark transition-colors">
            Manage Events
          </Link>
          <Link to="/admin/connections" className="rounded-lg border border-primary/30 px-4 py-2 font-semibold text-primary hover:bg-primary/5 transition-colors">
            Connections
          </Link>
          <Link to="/admin/applications" className="rounded-lg border border-primary/30 px-4 py-2 font-semibold text-primary hover:bg-primary/5 transition-colors">
            Applications
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {statusCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-secondary-light">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-secondary-dark">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-secondary-light">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {primaryActions.map((section) => (
          <div key={section.title} className="rounded-xl border border-primary/10 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-secondary-dark">{section.title}</h3>
            <p className="mt-2 text-sm leading-6 text-secondary-light">{section.description}</p>
            <div className="mt-5 flex flex-col gap-2">
              {section.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-lg border border-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  {link.label} <span aria-hidden="true">&rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-primary/10 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-secondary-dark">Personal settings</h3>
          <p className="mt-2 text-sm leading-6 text-secondary-light">
            Update your own profile preferences separately from site content and access management.
          </p>
          <Link to="/admin/profile" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Open profile settings <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="rounded-xl border border-primary/10 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-secondary-dark">Study and prep tools</h3>
          <p className="mt-2 text-sm leading-6 text-secondary-light">
            Use the AI Bible Assistant for Bible search, cross references, context, and sermon preparation.
          </p>
          <Link to="/admin/ai-assistant" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Open AI Bible Assistant <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function FeatureUnavailable() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Coming soon</p>
      <h2 className="mt-2 text-2xl font-bold text-secondary-dark">Record Livestream is disabled</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-secondary-light">
        This management area is not available until the recording workflow is finished.
      </p>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="approvals" element={<ApprovalsEditor />} />
        <Route path="login-history" element={<AdminLoginHistory />} />
        <Route path="events" element={<EventEditor />} />
        <Route path="registrations" element={<EventRegistrationEditor />} />
        <Route path="sermons" element={<SermonEditor />} />
        <Route path="ministries" element={<MinistryEditor />} />
        <Route path="staff" element={<StaffEditor />} />
        <Route path="bible-verses" element={<BibleVerseEditor />} />
        <Route path="ai-assistant" element={<AIAssistantEditor />} />
        <Route path="record" element={<FeatureUnavailable />} />
        <Route path="profile" element={<UserProfileEditor />} />
        <Route path="prayer-requests" element={<PrayerRequestEditor />} />
        <Route path="connections" element={<ConnectionEditor />} />
        <Route path="opportunities" element={<OpportunityEditor />} />
        <Route path="applications" element={<ApplicationEditor />} />
      </Routes>
    </AdminLayout>
  )
}
