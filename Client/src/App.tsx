import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components'
import { TopBar } from './layouts/TopBar'
import { Sidebar } from './layouts'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AssetsPage from './pages/AssetsPage'
import MaintenancePage from './pages/MaintenancePage'
import MonitoringPage from './pages/MonitoringPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import ReceptionPage from './pages/ReceptionPage'
import TransferPage from './pages/TransferPage'
import AffectationPage from './pages/AffectationPage'
import RetourPage from './pages/RetourPage'
import './App.css'

// ── Protected shell — redirects to /login if not authenticated ──
function AppShell() {
  const { isAuthenticated, isLoading, user, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <span className="h-8 w-8 rounded-full border-4 border-neutral-200 border-t-primary animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900">
      <TopBar
        userName={user?.full_name}
        userInitials={initials}
        onLogout={logout}
      >
        <p className="text-xl font-bold tracking-tight text-[#E3001B]">ITAM</p>
      </TopBar>

      <div className="flex h-[calc(100vh-73px)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/assets" replace />} />
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/assets"      element={<AssetsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/reports"     element={<ReportsPage />} />
            <Route path="/users"       element={<UsersPage />} />
            <Route path="/reception"   element={<ReceptionPage />} />
            <Route path="/transfer"    element={<TransferPage />} />
            <Route path="/affectation" element={<AffectationPage />} />
            <Route path="/retour"      element={<RetourPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// ── Root — login is outside the shell ─────────────────────
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*"     element={<AppShell />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App

