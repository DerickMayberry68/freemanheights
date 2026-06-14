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
  return (
    <div>
      <h2 className="text-2xl font-bold text-secondary-dark mb-4">Admin Dashboard</h2>
      <p className="text-secondary-light mb-6">
        Welcome to the Freeman Heights admin area. Use the sidebar to manage events, sermons, and ministries.
      </p>
        <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Approvals</h3>
          <p className="text-sm text-secondary-light mt-1">Approve new admin registrations</p>
          <Link to="/admin/approvals" className="text-primary font-medium mt-2 inline-block hover:underline">Manage Approvals →</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Events</h3>
          <p className="text-sm text-secondary-light mt-1">Manage calendar events</p>
          <Link to="/admin/events" className="text-primary font-medium mt-2 inline-block hover:underline">Edit Events →</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Registrations</h3>
          <p className="text-sm text-secondary-light mt-1">Review event rosters and parent submissions</p>
          <Link to="/admin/registrations" className="text-primary font-medium mt-2 inline-block hover:underline">Manage Registrations &rarr;</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Sermons</h3>
          <p className="text-sm text-secondary-light mt-1">Manage sermon archive</p>
          <Link to="/admin/sermons" className="text-primary font-medium mt-2 inline-block hover:underline">Edit Sermons →</Link>
        </div>
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-100 p-6 opacity-75 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-secondary-dark">Record Livestream</h3>
            <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Coming soon
            </span>
          </div>
          <p className="mt-1 text-sm text-secondary-light">Recording management is disabled until this feature is ready.</p>
          <button
            type="button"
            disabled
            className="mt-3 inline-block cursor-not-allowed rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-500"
          >
            Unavailable
          </button>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Ministries</h3>
          <p className="text-sm text-secondary-light mt-1">Manage ministry info</p>
          <Link to="/admin/ministries" className="text-primary font-medium mt-2 inline-block hover:underline">Edit Ministries →</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Staff</h3>
          <p className="text-sm text-secondary-light mt-1">Manage staff members</p>
          <Link to="/admin/staff" className="text-primary font-medium mt-2 inline-block hover:underline">Edit Staff →</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Bible Verses</h3>
          <p className="text-sm text-secondary-light mt-1">Manage rotating Bible verses</p>
          <Link to="/admin/bible-verses" className="text-primary font-medium mt-2 inline-block hover:underline">Edit Bible Verses →</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">AI Bible Assistant</h3>
          <p className="text-sm text-secondary-light mt-1">AI-powered Bible study and sermon prep</p>
          <Link to="/admin/ai-assistant" className="text-primary font-medium mt-2 inline-block hover:underline">Open Assistant →</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Profile Settings</h3>
          <p className="text-sm text-secondary-light mt-1">Manage your personal preferences</p>
          <Link to="/admin/profile" className="text-primary font-medium mt-2 inline-block hover:underline">Edit Profile →</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Opportunities</h3>
          <p className="text-sm text-secondary-light mt-1">Publish paid and volunteer openings</p>
          <Link to="/admin/opportunities" className="text-primary font-medium mt-2 inline-block hover:underline">Manage Opportunities &rarr;</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Applications</h3>
          <p className="text-sm text-secondary-light mt-1">Review applicants and update statuses</p>
          <Link to="/admin/applications" className="text-primary font-medium mt-2 inline-block hover:underline">Review Applications &rarr;</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Connections</h3>
          <p className="text-sm text-secondary-light mt-1">Follow up with guests and members</p>
          <Link to="/admin/connections" className="text-primary font-medium mt-2 inline-block hover:underline">View Connections &rarr;</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Prayer Requests</h3>
          <p className="text-sm text-secondary-light mt-1">View and respond to prayer requests</p>
          <Link to="/admin/prayer-requests" className="text-primary font-medium mt-2 inline-block hover:underline">Manage Requests →</Link>
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
