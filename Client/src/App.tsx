import { ToastProvider } from '@/components'
import { ComponentShowcase } from './components/ComponentShowcase'
import './App.css'

function App() {
  return (
    <ToastProvider>
      <ComponentShowcase />
    </ToastProvider>
  )
}

export default App
