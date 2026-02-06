import { UserCircleIcon } from '@heroicons/react/24/outline'

export default function StaffCard({ staff }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          {staff.image_url ? (
            <img
              src={staff.image_url}
              alt={staff.name}
              className="w-32 h-32 rounded-full object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
              <UserCircleIcon className="h-24 w-24 text-primary/60" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-primary">{staff.role}</span>
          <h3 className="text-xl font-bold text-secondary-dark mt-1">{staff.name}</h3>
          {staff.bio && (
            <p className="text-secondary-light mt-2">{staff.bio}</p>
          )}
          {(staff.email || staff.phone) && (
            <div className="mt-3 flex flex-wrap gap-4">
              {staff.email && (
                <a
                  href={`mailto:${staff.email}`}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Email
                </a>
              )}
              {staff.phone && (
                <a
                  href={`tel:${staff.phone}`}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Call
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
