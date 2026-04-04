import { ToastProvider } from '@/components'
import { ComponentShowcase } from './components/ComponentShowcase'
import Sidebar  from './layouts/Sidebar'
import './App.css'

function App() {
  return (
     <ToastProvider>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-slate-50 p-6">
        <ComponentShowcase />
      </main>
    </ToastProvider>
  )
}

export default App
