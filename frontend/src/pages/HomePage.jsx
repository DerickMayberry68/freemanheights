import HeroSection from '../components/home/HeroSection'
import ServiceTimes from '../components/home/ServiceTimes'
import UpcomingEvents from '../components/home/UpcomingEvents'
import RecentSermons from '../components/home/RecentSermons'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServiceTimes />
      <UpcomingEvents />
      <RecentSermons />
    </>
  )
}
