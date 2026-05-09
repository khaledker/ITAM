import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(userName.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>

      {/* Background accent circles */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10rem', right: '-10rem', height: '24rem', width: '24rem', borderRadius: '9999px', backgroundColor: 'rgba(227,0,27,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-10rem', left: '-10rem', height: '24rem', width: '24rem', borderRadius: '9999px', backgroundColor: 'rgba(227,0,27,0.05)' }} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '28rem' }}>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">

          {/* Red top stripe */}
          <div style={{ height: '6px', backgroundColor: '#E3001B', width: '100%' }} />

          <div className="p-8">

            {/* Logo + Title */}
            <div className="mb-8 text-center">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '3.5rem', width: '3.5rem', borderRadius: '1rem', backgroundColor: 'rgba(227,0,27,0.1)', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E3001B', letterSpacing: '-0.05em' }}>IT</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Sign in to Djezzy ITAM Portal
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username */}
              <div>
                <label htmlFor="user_name" className="block text-sm font-medium text-neutral-700">
                  Username
                </label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none z-10" />
                  <Input
                    id="user_name"
                    type="text"
                    placeholder="e.g. admin.itam"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="pl-10 mt-0"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none z-10" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-11 mt-0"
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors bg-transparent border-none cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </Button>

            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-neutral-400">
          Djezzy IT Asset Management — Internal use only
        </p>
      </div>
    </div>
  )
}
