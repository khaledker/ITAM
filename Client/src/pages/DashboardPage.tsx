import { useEffect, useState } from 'react'
import { Server, CheckCircle, Wrench, Clock, Activity } from 'lucide-react'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Table, type TableColumn } from '../components/ui/Table'
import { dashboardApi, telemetryApi, type RecentMovement, type DashboardSummary, type TelemetrySummary, type DeviceHealthLabel } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Link } from 'react-router-dom'

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
    render: (_value: string, row: RecentMovement) => {
      const firstTag = (row.asset_tag || '').split(',')[0]?.trim()
      const count = row.asset_count ?? 1
      if (count <= 1) return <span className="font-semibold text-neutral-800">{firstTag || '—'}</span>
      return (
        <span className="font-semibold text-neutral-800">
          {firstTag} <span className="font-normal text-neutral-600">&amp; {count - 1} more</span>
        </span>
      )
    },
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
    <div className="animate-pulse rounded-xl border border-neutral-300 bg-white p-5 space-y-3">
      <div className="h-3 w-24 rounded bg-neutral-200" />
      <div className="h-8 w-16 rounded bg-neutral-200" />
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [telemetry, setTelemetry] = useState<{ summary: TelemetrySummary | null, labels: DeviceHealthLabel[] }>({ summary: null, labels: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      dashboardApi.getSummary(),
      telemetryApi.getSummary(),
      telemetryApi.getLabels()
    ])
      .then(([dashboardRes, tSummary, tLabels]) => {
        setData(dashboardRes)
        setTelemetry({ summary: tSummary, labels: tLabels || [] })
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setIsLoading(false))
  }, [])

  const stats = data?.stats
  const movements = data?.recentMovements ?? []
  
  // Filter for top critical issues to display on dashboard
  const criticalAssets = (telemetry.labels || [])
    .filter(l => l.risk_level === 'Critical' || l.risk_level === 'At Risk')
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 4)

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600">
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
              icon={<Server />}
            />
            <StatCard
              label="Available"
              value={stats?.available ?? 0}
              icon={<CheckCircle />}
            />
            <StatCard
              label="Assigned"
              value={stats?.assigned ?? 0}
              icon={<Clock />}
            />
            <StatCard
              label="In Maintenance"
              value={stats?.in_maintenance ?? 0}
              icon={<Wrench />}
            />
          </>
        )}
      </div>

      <div className="space-y-8">
        
        {/* Operations */}
        <div className="bg-white border border-neutral-300 rounded-xl p-6 shadow-lg space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Recent Operations</h2>

          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-neutral-100" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <p className="text-sm text-neutral-600 py-6 text-center">No operations recorded yet.</p>
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

        {/* AI Telemetry Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white border border-neutral-300 rounded-xl p-6 shadow-lg space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">AI Device Health</h2>
                <p className="text-sm text-neutral-600">Live telemetry agent overview</p>
              </div>
              <Activity className="h-5 w-5 text-indigo-500" />
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-neutral-100 rounded" />
                <div className="h-10 bg-neutral-100 rounded" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <span className="text-sm font-medium text-neutral-600">Total Monitored</span>
                  <span className="font-bold text-neutral-900">{telemetry.summary?.total_monitored || 0}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{telemetry.summary?.healthy || 0}</div>
                    <div className="text-xs font-medium text-emerald-800 mt-1">Healthy</div>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">{telemetry.summary?.critical || 0}</div>
                    <div className="text-xs font-medium text-red-800 mt-1">Critical</div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/monitoring">
                    <Button variant="secondary" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                      Open Full Monitoring
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-neutral-300 rounded-xl p-6 shadow-lg space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Priority Alerts</h2>
              <p className="text-sm text-neutral-600">Top risks requiring attention</p>
            </div>

            {isLoading ? (
               <div className="animate-pulse h-24 rounded-lg bg-neutral-100" />
            ) : criticalAssets.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-neutral-300 rounded-lg">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">No critical assets found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {criticalAssets.map(asset => (
                  <div key={asset.id} className="border border-red-100 bg-red-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-neutral-900">{asset.asset_tag}</span>
                      <Badge variant={asset.risk_level === 'Critical' ? 'critical' : 'warning'}>
                        {asset.risk_level}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600 line-clamp-1 mb-2">
                      {(asset.triggered_rules || []).map(r => r.label).join(', ') || 'Unknown Issue'}
                    </p>
                    {asset.asset_id && (
                      <Link to={`/assets/${asset.asset_id}`}>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-red-600 px-0">
                          Inspect Asset &rarr;
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
