import EventCalendar from '../components/calendar/EventCalendar'

export default function CalendarPage() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary-dark mb-2">Calendar & Events</h1>
          <p className="text-secondary-light">Stay up to date with what&apos;s happening at Freeman Heights</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <EventCalendar />
        </div>
      </div>
    </div>
  )
}
