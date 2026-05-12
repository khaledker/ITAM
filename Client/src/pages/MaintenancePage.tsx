import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react'
import { Badge, Button, Table, type TableColumn } from '@/components'
import { movementsApi, type AssetMovement } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const TYPE_VARIANT: Record<string, 'active' | 'inactive' | 'warning' | 'critical' | 'maintenance'> = {
  Reception: 'active',
  Assignment: 'warning',
  Transfer: 'inactive',
  Return: 'maintenance',
}

const STATUS_VARIANT: Record<string, 'active' | 'inactive' | 'warning' | 'critical' | 'maintenance'> = {
  Draft: 'warning',
  Approved: 'active',
  Rejected: 'critical',
  Returned: 'maintenance',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const { user } = useAuth()
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager'

  const [movements, setMovements] = useState<AssetMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'Draft' | 'Approved' | 'Rejected'>('Draft')

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await movementsApi.getAll()
      setMovements(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load movements.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: number) => {
    setProcessingId(id)
    setActionError(null)
    try {
      await movementsApi.approve(id)
      setActionSuccess(`Movement #${id} approved — asset status updated in the database.`)
      load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve.')
    } finally {
      setProcessingId(null)
      setTimeout(() => setActionSuccess(null), 5000)
    }
  }

  const handleReject = async (id: number) => {
    setProcessingId(id)
    setActionError(null)
    try {
      await movementsApi.reject(id)
      setActionSuccess(`Movement #${id} rejected.`)
      load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject.')
    } finally {
      setProcessingId(null)
      setTimeout(() => setActionSuccess(null), 5000)
    }
  }

  const filtered = movements.filter(m => filter === 'all' || m.status === filter)
  const draftCount = movements.filter(m => m.status === 'Draft').length

  const columns: TableColumn<AssetMovement>[] = [
    {
      key: 'id', label: 'ID', width: 'w-[8%]',
      render: (v: number) => <span className="font-mono text-sm text-neutral-600">#{v}</span>,
    },
    {
      key: 'type', label: 'Type', width: 'w-[14%]',
      render: (v: string) => <Badge variant={TYPE_VARIANT[v] ?? 'inactive'}>{v ?? '—'}</Badge>,
    },
    {
      key: 'asset_id', label: 'Asset', width: 'w-[12%]',
      render: (_v: any, row: AssetMovement) => (
        <span className="font-semibold text-neutral-800">
          {(row as any).tag ?? `ID:${row.asset_id}`}
        </span>
      ),
    },
    {
      key: 'performed_by_name', label: 'Performed By', width: 'w-[18%]',
      render: (_v: any, row: AssetMovement) => row.performed_by_name ?? '—',
    },
    {
      key: 'date', label: 'Date', width: 'w-[14%]',
      render: (v: string) => formatDate(v),
    },
    {
      key: 'status', label: 'Status', width: 'w-[12%]',
      render: (v: string) => <Badge variant={STATUS_VARIANT[v] ?? 'inactive'}>{v}</Badge>,
    },
    {
      key: 'actions', label: 'Actions', width: 'w-[20%]',
      render: (_v: any, row: AssetMovement) => {
        if (!isAdminOrManager || row.status !== 'Draft') {
          return <span className="text-xs text-neutral-400">—</span>
        }
        const busy = processingId === row.id
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApprove(row.id)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {busy ? '…' : 'Approve'}
            </button>
            <button
              onClick={() => handleReject(row.id)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              {busy ? '…' : 'Reject'}
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Movements</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Review and approve pending asset movements to update asset status in the database
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Pending alert */}
      {draftCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{draftCount} movement{draftCount > 1 ? 's' : ''}</span> pending approval.
            {isAdminOrManager
              ? ' Approve them below to update asset statuses in the database.'
              : ' An Admin or Manager must approve them.'}
          </p>
        </div>
      )}

      {/* Feedback banners */}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />{actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <XCircle className="h-4 w-4 shrink-0" />{actionError}
        </div>
      )}
      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{loadError}</div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-neutral-200 pb-0">
        {(['Draft', 'Approved', 'Rejected', 'all'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === tab
              ? 'border-primary text-primary'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
          >
            {tab === 'all' ? 'All' : tab}
            {tab === 'Draft' && draftCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {draftCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-300 bg-white shadow-md overflow-hidden">
        <Table<AssetMovement>
          columns={columns}
          rows={filtered}
          rowKey="id"
          loading={isLoading}
          hoverable
          striped
        />
        {!isLoading && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">
            {filter === 'Draft' ? 'No pending movements. All caught up! ' : `No ${filter.toLowerCase()} movements.`}
          </p>
        )}
      </div>

      {/* Explanation card */}
      <div className="rounded-xl border border-neutral-300 bg-neutral-50 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-800">How movements affect the database</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-neutral-600">
          <div className="flex gap-2">
            <Badge variant="active" >Reception</Badge>
            <span>→ Asset marked <strong>Available</strong> at destination</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="warning">Assignment</Badge>
            <span>→ Asset marked <strong>Assigned</strong></span>
          </div>
          <div className="flex gap-2">
            <Badge variant="inactive">Transfer</Badge>
            <span>→ Asset <strong>location updated</strong></span>
          </div>
          <div className="flex gap-2">
            <Badge variant="maintenance">Return</Badge>
            <span>→ Asset marked <strong>Available</strong> at return location</span>
          </div>
        </div>
      </div>
    </div>
  )
}
