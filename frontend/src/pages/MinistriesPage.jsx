import { useParams } from 'react-router-dom'
import { useMinistries } from '../lib/hooks'
import MinistryCard from '../components/ministries/MinistryCard'
import MinistryDetail from '../components/ministries/MinistryDetail'
import { Link } from 'react-router-dom'

export default function MinistriesPage() {
  const { slug } = useParams()
  const { data: ministries, loading } = useMinistries()
  const ministry = slug ? ministries.find((m) => m.slug === slug) : null

  if (slug && ministry) {
    return (
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link to="/ministries" className="text-primary hover:underline mb-6 inline-block">
            ← Back to Ministries
          </Link>
          <MinistryDetail ministry={ministry} />
        </div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary-dark mb-2">Our Ministries</h1>
          <p className="text-secondary-light max-w-2xl mx-auto">
            Discover opportunities to grow in faith and serve at Freeman Heights
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {loading && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl h-80 animate-pulse shadow-md" />
              ))}
            </>
          )}
          {!loading && ministries.length === 0 && (
            <div className="col-span-full text-center py-12 text-secondary-light">
              <p>Ministry information coming soon. Check back later!</p>
            </div>
          )}
          {!loading && ministries.map((ministry) => (
            <MinistryCard key={ministry.id} ministry={ministry} />
          ))}
        </div>
      </div>
    </div>
  )
}
