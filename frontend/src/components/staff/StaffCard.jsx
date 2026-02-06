import { UserCircleIcon } from '@heroicons/react/24/outline'

export default function StaffCard({ staff }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          {staff.image_url ? (
            <img
              src={staff.image_url}
              alt={staff.name}
              className="w-28 h-28 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-primary-50 flex items-center justify-center ring-2 ring-primary/20">
              <UserCircleIcon className="h-20 w-20 text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-primary">{staff.role}</span>
          <h3 className="text-xl font-serif font-bold text-secondary-dark mt-1">{staff.name}</h3>
          {staff.bio && (
            <p className="text-secondary-light mt-2 leading-relaxed">{staff.bio}</p>
          )}
          {(staff.email || staff.phone) && (
            <div className="mt-3 flex flex-wrap gap-4">
              {staff.email && (
                <a
                  href={`mailto:${staff.email}`}
                  className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
                >
                  Email
                </a>
              )}
              {staff.phone && (
                <a
                  href={`tel:${staff.phone}`}
                  className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
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
