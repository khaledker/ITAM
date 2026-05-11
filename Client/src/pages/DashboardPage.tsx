import { useEffect, useState } from 'react'
import { Server, CheckCircle, Wrench, Clock } from 'lucide-react'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Table, type TableColumn } from '../components/ui/Table'
import { dashboardApi, type RecentMovement, type FlaggedAsset, type DashboardSummary } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const dd   = String(d.getDate()).padStart(2, '0')
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh   = String(d.getHours()).padStart(2, '0')
  const min  = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

const TYPE_VARIANT: Record<string, 'active' | 'inactive' | 'warning' | 'critical' | 'maintenance'> = {
  Reception:  'active',
  Assignment: 'warning',
  Transfer:   'inactive',
  Return:     'maintenance',
}

const STATUS_VARIANT: Record<string, 'active' | 'inactive' | 'warning' | 'critical' | 'maintenance'> = {
  Approved: 'active',
  Draft:    'warning',
  Rejected: 'critical',
  Returned: 'maintenance',
}

const RISK_VARIANT: Record<string, 'active' | 'inactive' | 'warning' | 'critical' | 'maintenance'> = {
  critical: 'critical',
  high:     'warning',
  medium:   'warning',
  low:      'active',
}

// ── Table column definitions ──────────────────────────────────────────────────

const movementColumns: TableColumn<RecentMovement>[] = [
  {
    key: 'id',
    label: 'Operation ID',
    width: '12%',
    render: (value: number) => <span className="font-mono text-sm">OP-{String(value).padStart(3, '0')}</span>,
  },
  {
    key: 'type',
    label: 'Type',
    width: '14%',
    render: (value: string) => (
      <Badge variant={TYPE_VARIANT[value] ?? 'inactive'}>{value ?? '—'}</Badge>
    ),
  },
  {
    key: 'asset_tag',
    label: 'Asset Tag',
    width: '14%',
    render: (value: string) => <span className="font-semibold text-neutral-800">{value}</span>,
  },
  {
    key: 'performed_by',
    label: 'Performed By',
    width: '22%',
  },
  {
    key: 'date',
    label: 'Date',
    width: '20%',
    render: (value: string) => formatDateTime(value),
  },
  {
    key: 'status',
    label: 'Status',
    width: '16%',
    render: (value: string) => (
      <Badge variant={STATUS_VARIANT[value] ?? 'inactive'}>
        {value}
      </Badge>
    ),
  },
]


// ── Skeleton loaders ──────────────────────────────────────────────────────────


function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
      <div className="h-3 w-24 rounded bg-neutral-200" />
      <div className="h-8 w-16 rounded bg-neutral-200" />
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dashboardApi.getSummary()
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setIsLoading(false))
  }, [])

  const stats = data?.stats
  const movements = data?.recentMovements ?? []
  const flagged   = data?.flaggedAssets   ?? []

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500">
          Welcome back, <span className="font-medium text-neutral-700">{user?.full_name ?? 'IT Operations'}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : error ? (
          <div className="col-span-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <>
            <StatCard
              label="Total Assets"
              value={stats?.total ?? 0}
              icon={<Server className="h-6 w-6 text-blue-500" />}
            />
            <StatCard
              label="Available"
              value={stats?.available ?? 0}
              icon={<CheckCircle className="h-6 w-6 text-green-500" />}
            />
            <StatCard
              label="Assigned"
              value={stats?.assigned ?? 0}
              icon={<Clock className="h-6 w-6 text-orange-500" />}
            />
            <StatCard
              label="In Maintenance"
              value={stats?.in_maintenance ?? 0}
              icon={<Wrench className="h-6 w-6 text-red-500" />}
            />
          </>
        )}
      </div>

      {/* Recent Operations */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Recent Operations</h2>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-neutral-100" />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <p className="text-sm text-neutral-500 py-6 text-center">No operations recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table<RecentMovement>
              columns={movementColumns}
              rows={movements}
              rowKey="id"
              hoverable
            />
          </div>
        )}
      </div>

      {/* Maintenance Predictions */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Maintenance Predictions</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Assets flagged by the rule engine</p>
        </div>

        {isLoading ? (
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-neutral-100" />
            ))}
          </div>
        ) : flagged.length === 0 ? (
          <p className="text-sm text-neutral-500 py-6 text-center">
            🎉 No assets currently flagged for maintenance.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flagged.map(asset => (
              <div
                key={asset.id}
                className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-semibold text-neutral-900">{asset.assetTag}</p>
                    <p className="text-sm text-neutral-500">{asset.assetName}</p>
                  </div>
                  <Badge variant={RISK_VARIANT[asset.riskLevel] ?? 'inactive'}>
                    {asset.riskLevel.charAt(0).toUpperCase() + asset.riskLevel.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-600 mb-3">{asset.rule}</p>
                <Button variant="ghost" size="sm" className="text-primary">
                  View Asset
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
