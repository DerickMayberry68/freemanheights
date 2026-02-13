import HeroSection from '../components/home/HeroSection'
import ServiceTimes from '../components/home/ServiceTimes'
import PrayerRequestSection from '../components/prayer/PrayerRequestSection'
import UpcomingEvents from '../components/home/UpcomingEvents'
import RecentSermons from '../components/home/RecentSermons'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServiceTimes />
      <PrayerRequestSection backgroundColor="bg-cream" />
      <UpcomingEvents />
      <RecentSermons />
    </>
  )
}
