import { Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './lib/AuthContext'
import { ModalProvider } from './lib/ModalContext'
import ErrorBoundary from './components/ErrorBoundary'
import ScrollToTop from './components/ScrollToTop'
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
      <ModalProvider>
      <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <ScrollToTop />
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
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Analytics />
      </ModalProvider>
    </AuthProvider>
  )
}

export default App
