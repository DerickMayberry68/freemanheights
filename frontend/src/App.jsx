import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import LivestreamPage from './pages/LivestreamPage'
import MinistriesPage from './pages/MinistriesPage'
import CalendarPage from './pages/CalendarPage'
import StaffPage from './pages/StaffPage'
import GivePage from './pages/GivePage'
import ExplorePage from './pages/ExplorePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProtectedRoute from './components/admin/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App
