import { Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import LivestreamPage from './pages/LivestreamPage'
import MinistriesPage from './pages/MinistriesPage'
import CalendarPage from './pages/CalendarPage'
import StaffPage from './pages/StaffPage'
import GivePage from './pages/GivePage'
import ExplorePage from './pages/ExplorePage'
import AdminDashboard from './pages/admin/AdminDashboard'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/livestream" element={<LivestreamPage />} />
          <Route path="/ministries" element={<MinistriesPage />} />
          <Route path="/ministries/:slug" element={<MinistriesPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/give" element={<GivePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
