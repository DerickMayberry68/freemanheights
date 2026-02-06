import { UserGroupIcon } from '@heroicons/react/24/outline'

export default function MinistryDetail({ ministry }) {
  if (!ministry) return null

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="aspect-[21/9] bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center">
        {ministry.image_url ? (
          <img
            src={ministry.image_url}
            alt={ministry.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserGroupIcon className="h-32 w-32 text-primary/60" />
        )}
      </div>
      <div className="p-8 max-w-3xl">
        <span className="text-sm font-medium text-primary">{ministry.target_audience}</span>
        <h1 className="text-3xl font-bold text-secondary-dark mt-2">{ministry.name}</h1>
        {ministry.meeting_time && (
          <p className="text-lg text-primary font-semibold mt-2">{ministry.meeting_time}</p>
        )}
        <p className="text-secondary-light mt-4 text-lg leading-relaxed">{ministry.description}</p>
        {ministry.leader_name && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-secondary-dark">Ministry Leader</h3>
            <p className="text-lg text-secondary mt-1">{ministry.leader_name}</p>
            {ministry.leader_email && (
              <a
                href={`mailto:${ministry.leader_email}`}
                className="text-primary hover:underline mt-2 inline-block"
              >
                Contact {ministry.leader_name}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
