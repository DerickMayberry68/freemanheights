import { Routes, Route, Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import EventEditor from '../../components/admin/EventEditor'
import SermonEditor from '../../components/admin/SermonEditor'
import MinistryEditor from '../../components/admin/MinistryEditor'
import StaffEditor from '../../components/admin/StaffEditor'
import BibleVerseEditor from '../../components/admin/BibleVerseEditor'
import ApprovalsEditor from '../../components/admin/ApprovalsEditor'
import RecordLivestream from '../../components/admin/RecordLivestream'

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
          <h3 className="font-semibold text-secondary-dark">Sermons</h3>
          <p className="text-sm text-secondary-light mt-1">Manage sermon archive</p>
          <Link to="/admin/sermons" className="text-primary font-medium mt-2 inline-block hover:underline">Edit Sermons →</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-secondary-dark">Record Livestream</h3>
          <p className="text-sm text-secondary-light mt-1">Record with camera and save to the database</p>
          <Link to="/admin/record" className="text-primary font-medium mt-2 inline-block hover:underline">Record →</Link>
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
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="approvals" element={<ApprovalsEditor />} />
        <Route path="events" element={<EventEditor />} />
        <Route path="sermons" element={<SermonEditor />} />
        <Route path="ministries" element={<MinistryEditor />} />
        <Route path="staff" element={<StaffEditor />} />
        <Route path="bible-verses" element={<BibleVerseEditor />} />
        <Route path="record" element={<RecordLivestream />} />
      </Routes>
    </AdminLayout>
  )
}
