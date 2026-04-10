import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components'
import { TopBar } from './components/layout/TopBar'
import Sidebar from './layouts/Sidebar'
import DashboardPage from './pages/DashboardPage'
import AssetsPage from './pages/AssetsPage'
import MaintenancePage from './pages/MaintenancePage'
import PredictionsPage from './pages/PredictionsPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import './App.css'

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopBar userName="IT Operations" userInitials="IT" notificationCount={4}>
          <p className="text-xl font-bold tracking-tight text-[#E3001B]">ITAM</p>
        </TopBar>

        <div className="flex h-[calc(100vh-73px)]">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/assets" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

export default App
