import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, AlertCircle, Mail, Briefcase, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { departmentsApi, registrationApi, type Department } from '@/lib/api'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    // Fetch departments for the dropdown
    departmentsApi.getAll()
      .then(setDepartments)
      .catch(err => {
        console.error('Failed to load departments:', err)
      })
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await registrationApi.submit({
        full_name: fullName.trim(),
        user_name: userName.trim(),
        email: email.trim(),
        password,
        department_id: departmentId ? Number(departmentId) : undefined,
      })
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        {/* Background accent circles */}
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-10rem', right: '-10rem', height: '24rem', width: '24rem', borderRadius: '9999px', backgroundColor: 'rgba(227,0,27,0.12)' }} />
          <div style={{ position: 'absolute', bottom: '-10rem', left: '-10rem', height: '24rem', width: '24rem', borderRadius: '9999px', backgroundColor: 'rgba(227,0,27,0.12)' }} />
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '28rem' }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden">
            <div style={{ height: '6px', backgroundColor: '#10B981', width: '100%' }} />

            <div className="p-8 text-center">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '4rem', width: '4rem', borderRadius: '9999px', backgroundColor: 'rgba(16,185,129,0.1)', marginBottom: '1.5rem' }}>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>

              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Request Submitted!
              </h1>
              
              <div className="mt-4 text-sm text-neutral-600 space-y-3">
                <p>
                  Thank you, <strong>{fullName}</strong>. Your registration request was sent successfully.
                </p>
                <p className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-neutral-600 leading-relaxed text-xs">
                  An administrator needs to approve your registration before you can log in. You will be able to access the ITAM platform once your request has been reviewed.
                </p>
              </div>

              <Button
                onClick={() => navigate('/login')}
                className="w-full mt-6"
                variant="secondary"
              >
                Return to Sign In
              </Button>
            </div>
          </div>
          
          <p className="mt-6 text-center text-xs text-neutral-600">
            Djezzy IT Asset Management — Internal use only
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      
      {/* Background accent circles */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10rem', right: '-10rem', height: '24rem', width: '24rem', borderRadius: '9999px', backgroundColor: 'rgba(227,0,27,0.12)' }} />
        <div style={{ position: 'absolute', bottom: '-10rem', left: '-10rem', height: '24rem', width: '24rem', borderRadius: '9999px', backgroundColor: 'rgba(227,0,27,0.12)' }} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '30rem' }}>
        
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden">
          
          {/* Red top stripe */}
          <div style={{ height: '6px', backgroundColor: '#E3001B', width: '100%' }} />

          <div className="p-8">
            
            {/* Logo + Title */}
            <div className="mb-6 text-center">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '3.5rem', width: '3.5rem', borderRadius: '1rem', backgroundColor: 'rgba(227,0,27,0.1)', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E3001B', letterSpacing: '-0.05em' }}>IT</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Request Access
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Register a new account on Djezzy ITAM Portal
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
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-neutral-700">
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none z-10" />
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="e.g. Mahdi Benhamada"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="pl-10 mt-0"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="user_name" className="block text-sm font-medium text-neutral-700">
                  Username
                </label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none z-10" />
                  <Input
                    id="user_name"
                    type="text"
                    placeholder="e.g. mahdi.ben"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="pl-10 mt-0"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none z-10" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. user@djezzy.dz"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 mt-0"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-neutral-700">
                  Department
                </label>
                <div className="relative mt-1.5">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none z-10" />
                  <select
                    id="department"
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="pl-10 block w-full rounded-md border border-neutral-300 bg-white py-2 px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    required
                    disabled={isLoading}
                    style={{ height: '2.5rem' }}
                  >
                    <option value="">Select your department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.libelle} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                    Password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none z-10" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 chars"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 mt-0"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-neutral-700">
                    Confirm Password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none z-10" />
                    <Input
                      id="confirm_password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-type password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 mt-0"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-xs text-neutral-600 hover:text-neutral-700 bg-transparent border-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide passwords' : 'Show passwords'}
                </button>
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
                    Submitting…
                  </span>
                ) : 'Submit Registration'}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-neutral-600 hover:text-neutral-700 transition-colors bg-transparent border-none cursor-pointer"
                >
                  Already have an account? Sign in
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-neutral-600">
          Djezzy IT Asset Management — Internal use only
        </p>
      </div>
    </div>
  )
}
