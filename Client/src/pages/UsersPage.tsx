import { useEffect, useState } from 'react'
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react'
import { Badge, Table, type TableColumn } from '@/components'
import { employeesApi, type Employee } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── Components ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load data
  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      setEmployees(await employeesApi.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Show a temp message
  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 4000)
  }

  // Toggle role between Employee / Manager / Admin
  const handleRoleChange = async (id: number, newRole: 'Admin' | 'Manager' | 'Employee') => {
    try {
      await employeesApi.updateRole(id, newRole)
      showSuccess(`Role updated to ${newRole}.`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role.')
    }
  }

  const columns: TableColumn<Employee>[] = [
    { key: 'full_name', label: 'Full Name', width: 'w-[25%]',
      render: (v: string) => <span className="font-semibold text-neutral-900">{v}</span> },
    { key: 'user_name', label: 'Username', width: 'w-[15%]' },
    { key: 'email', label: 'Email', width: 'w-[25%]' },
    { key: 'department_name', label: 'Department', width: 'w-[15%]',
      render: (_v: any, row: any) => row.department_name || '—' },
    { key: 'role', label: 'System Role', width: 'w-[20%]',
      render: (v: string, row: Employee) => {
        // Only Admin can change roles, and you can't downgrade yourself
        const canEdit = isAdmin && row.id !== user?.id
        if (!canEdit) {
          return <Badge variant={v === 'Admin' ? 'critical' : v === 'Manager' ? 'warning' : 'inactive'}>{v || 'Employee'}</Badge>
        }
        return (
          <select
            value={v || 'Employee'}
            onChange={e => handleRoleChange(row.id, e.target.value as any)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-primary focus:outline-none"
          >
            <option value="Employee">Employee</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>
        )
      }
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Users</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage employee access and system roles.</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />{success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <XCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {!isAdmin && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            You do not have administrative privileges. You can view users but cannot change their roles.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <Table<Employee>
          columns={columns}
          rows={employees}
          rowKey="id"
          loading={isLoading}
          hoverable
          striped
        />
      </div>
    </div>
  )
}
