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
      <div className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link to="/ministries" className="inline-flex items-center gap-1 text-primary hover:text-primary-dark font-medium mb-6 transition-colors">
            <span aria-hidden="true">&larr;</span> Back to Ministries
          </Link>
          <MinistryDetail ministry={ministry} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1>Our Ministries</h1>
          <p>Discover opportunities to grow in faith and serve at Freeman Heights</p>
        </div>
      </div>
      <div className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {loading && (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl h-80 animate-pulse border border-primary/10" />
                ))}
              </>
            )}
            {!loading && ministries.length === 0 && (
              <div className="col-span-full text-center py-14 text-secondary-light">
                <p>Ministry information coming soon. Check back later!</p>
              </div>
            )}
            {!loading && ministries.map((ministry) => (
              <MinistryCard key={ministry.id} ministry={ministry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
