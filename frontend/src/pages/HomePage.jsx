import HeroSection from '../components/home/HeroSection'
import EventTicker from '../components/home/EventTicker'
import BibleVerseDisplay from '../components/home/BibleVerseDisplay'
import ServiceTimes from '../components/home/ServiceTimes'
import PrayerRequestSection from '../components/prayer/PrayerRequestSection'
import UpcomingEvents from '../components/home/UpcomingEvents'
import RecentSermons from '../components/home/RecentSermons'
import OpenPositionsSection from '../components/home/OpenPositionsSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <EventTicker />
      <BibleVerseDisplay />
      <ServiceTimes />
      <PrayerRequestSection backgroundColor="bg-cream" />
      <OpenPositionsSection />
      <UpcomingEvents />
      <RecentSermons />
    </>
  )
}
