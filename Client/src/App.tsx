import { ToastProvider } from '@/components'
import { Routes, Route, Navigate } from 'react-router-dom'
import { TopBar } from './layouts/TopBar'
import Sidebar from './layouts/Sidebar'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

// Import all pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AssetsPage from './pages/AssetsPage'
import SearchPage from './pages/SearchPage'
import AffectationPage from './pages/AffectationPage'
import ReceptionPage from './pages/ReceptionPage'
import TransferPage from './pages/TransferPage'
import RetourPage from './pages/RetourPage'
import MaintenancePage from './pages/MaintenancePage'
import MonitoringPage from './pages/MonitoringPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'

function AppLayout() {
  const { isAuthenticated, isLoading, user, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-4 border-neutral-300 border-t-[#E3001B] animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex flex-col overflow-hidden">
      <TopBar
        userName={user?.full_name || "IT Operations"}
        userInitials={user?.full_name ? user.full_name.charAt(0) : "IT"}
        notificationCount={0}
        onLogout={logout}
      >
        <p className="text-xl font-bold tracking-tight text-[#E3001B]">ITAM</p>
      </TopBar>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/affectation" element={<AffectationPage />} />
            <Route path="/reception" element={<ReceptionPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/retour" element={<RetourPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
