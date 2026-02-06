import EventCalendar from '../components/calendar/EventCalendar'

export default function CalendarPage() {
  return (
    <div>
      <div className="page-banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1>Calendar &amp; Events</h1>
          <p>Stay up to date with what&apos;s happening at Freeman Heights</p>
        </div>
      </div>
      <div className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <EventCalendar />
        </div>
      </div>
    </div>
  )
}
