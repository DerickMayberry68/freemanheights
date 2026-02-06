import { Link } from 'react-router-dom'
import { UserGroupIcon } from '@heroicons/react/24/outline'

export default function MinistryCard({ ministry }) {
  return (
    <Link
      to={`/ministries/${ministry.slug}`}
      className="block bg-white rounded-xl overflow-hidden border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all group"
    >
      <div className="aspect-video bg-gradient-to-br from-primary-50 to-cream-dark flex items-center justify-center">
        {ministry.image_url ? (
          <img
            src={ministry.image_url}
            alt={ministry.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <UserGroupIcon className="h-20 w-20 text-primary/30" />
        )}
      </div>
      <div className="p-6">
        <span className="text-sm font-medium text-primary">{ministry.target_audience}</span>
        <h3 className="text-xl font-serif font-bold text-secondary-dark mt-2 group-hover:text-primary transition-colors">
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
