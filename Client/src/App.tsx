import { ToastProvider } from '@/components'
import { ComponentShowcase } from './components/ComponentShowcase'
import { TopBar } from './components/layout/TopBar'
import Sidebar from './layouts/Sidebar'
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
            <ComponentShowcase />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

export default App
