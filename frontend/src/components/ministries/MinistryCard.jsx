import { Link } from 'react-router-dom'
import { UserGroupIcon } from '@heroicons/react/24/outline'

export default function MinistryCard({ ministry }) {
  return (
    <Link
      to={`/ministries/${ministry.slug}`}
      className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-100 group"
    >
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center">
        {ministry.image_url ? (
          <img
            src={ministry.image_url}
            alt={ministry.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <UserGroupIcon className="h-24 w-24 text-primary/60" />
        )}
      </div>
      <div className="p-6">
        <span className="text-sm font-medium text-primary">{ministry.target_audience}</span>
        <h3 className="text-xl font-bold text-secondary-dark mt-2 group-hover:text-primary transition-colors">
          {ministry.name}
        </h3>
        <p className="text-secondary-light mt-2 line-clamp-2">{ministry.description}</p>
        {ministry.meeting_time && (
          <p className="text-sm text-primary font-medium mt-3">{ministry.meeting_time}</p>
        )}
      </div>
    </Link>
  )
}
