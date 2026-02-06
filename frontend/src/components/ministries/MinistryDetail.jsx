import { UserGroupIcon } from '@heroicons/react/24/outline'

export default function MinistryDetail({ ministry }) {
  if (!ministry) return null

  return (
    <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
      <div className="aspect-[21/9] bg-gradient-to-br from-primary-50 to-cream-dark flex items-center justify-center">
        {ministry.image_url ? (
          <img
            src={ministry.image_url}
            alt={ministry.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserGroupIcon className="h-28 w-28 text-primary/30" />
        )}
      </div>
      <div className="p-8 max-w-3xl">
        <span className="text-sm font-medium text-primary">{ministry.target_audience}</span>
        <h1 className="text-3xl font-serif font-bold text-secondary-dark mt-2">{ministry.name}</h1>
        {ministry.meeting_time && (
          <p className="text-lg text-primary font-semibold mt-2">{ministry.meeting_time}</p>
        )}
        <p className="text-secondary-light mt-4 text-lg leading-relaxed">{ministry.description}</p>
        {ministry.leader_name && (
          <div className="mt-8 pt-6 border-t border-primary/10">
            <h3 className="font-serif font-semibold text-secondary-dark">Ministry Leader</h3>
            <p className="text-lg text-secondary mt-1">{ministry.leader_name}</p>
            {ministry.leader_email && (
              <a
                href={`mailto:${ministry.leader_email}`}
                className="text-primary hover:text-primary-dark font-medium mt-2 inline-flex items-center gap-1 transition-colors"
              >
                Contact {ministry.leader_name} <span aria-hidden="true">&rarr;</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
