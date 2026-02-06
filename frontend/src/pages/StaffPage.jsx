import { useStaff } from '../lib/hooks'
import StaffCard from '../components/staff/StaffCard'
import PrayerRequestForm from '../components/staff/PrayerRequestForm'

export default function StaffPage() {
  const { data: staff, loading } = useStaff()

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary-dark mb-2">Our Staff</h1>
          <p className="text-secondary-light">Meet the team serving Freeman Heights</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {loading && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl h-48 animate-pulse shadow-md" />
              ))}
            </>
          )}
          {!loading && staff.length === 0 && (
            <div className="col-span-full text-center py-12 text-secondary-light">
              <p>Staff information coming soon.</p>
            </div>
          )}
          {!loading && staff.map((member) => (
            <StaffCard key={member.id} staff={member} />
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-secondary-dark mb-6 text-center">Prayer Request</h2>
          <PrayerRequestForm />
        </div>
      </div>
    </div>
  )
}
