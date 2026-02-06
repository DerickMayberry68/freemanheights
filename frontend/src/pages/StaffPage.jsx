import { useStaff } from '../lib/hooks'
import StaffCard from '../components/staff/StaffCard'
import PrayerRequestForm from '../components/staff/PrayerRequestForm'

export default function StaffPage() {
  const { data: staff, loading } = useStaff()

  return (
    <div>
      <div className="page-banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1>Our Staff</h1>
          <p>Meet the team serving Freeman Heights</p>
        </div>
      </div>

      <div className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {loading && (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl h-48 animate-pulse border border-primary/10" />
                ))}
              </>
            )}
            {!loading && staff.length === 0 && (
              <div className="col-span-full text-center py-14 text-secondary-light">
                <p>Staff information coming soon.</p>
              </div>
            )}
            {!loading && staff.map((member) => (
              <StaffCard key={member.id} staff={member} />
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif font-bold text-secondary-dark mb-3">Prayer Request</h2>
              <div className="section-divider" />
            </div>
            <PrayerRequestForm />
          </div>
        </div>
      </div>
    </div>
  )
}
