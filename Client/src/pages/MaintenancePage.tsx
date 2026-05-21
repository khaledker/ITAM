import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CheckCircle, XCircle, RefreshCw, Clock, Eye, Printer,
  ArrowLeft, ArrowRightLeft, Search, SortAsc, SortDesc, Filter,
} from 'lucide-react'
import { Badge, Button, Table, type TableColumn, Input, Select } from '@/components'
import { movementsApi, type AssetMovement } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function formatList(value?: string | null): string[] {
  return value ? value.split(/\|\||,/).map(s => s.trim()).filter(Boolean) : []
}



function movementActionText(m: AssetMovement): string {
  if (m.status === 'Rejected') return 'This movement was rejected and will not change asset status, location, or assignment data.'
  if (m.status === 'Draft') return 'This movement is waiting for approval. Approving it applies the database changes described below. Rejecting it keeps the assets unchanged.'
  if (m.type === 'Reception') return 'Approving this reception marks the listed assets as available and places them in the selected destination location.'
  if (m.type === 'Assignment') return 'Approving this assignment links the listed assets to the selected employee and updates their status to assigned.'
  if (m.type === 'Transfer') return 'Approving this transfer moves the listed assets to the selected destination location without changing ownership.'
  return 'Approving this return marks the listed assets as available again, clears the employee assignment, and updates the return location.'
}

function movementDetailRows(m: AssetMovement): Array<{ label: string; value: string }> {
  const rows = [
    { label: 'Movement ID', value: `#${m.id}` },
    { label: 'Type', value: m.type },
    { label: 'Status', value: m.status },
    { label: 'Date', value: formatDate(m.date) },
    { label: 'Performed By', value: m.performed_by_name ?? '—' },
  ]
  if (m.type === 'Reception') rows.push(
    { label: 'Supplier', value: m.supplier_name ?? String(m.supplier_id ?? '—') },
    { label: 'Destination', value: m.reception_dest_name ?? String(m.destination_id ?? '—') },
    { label: 'Purchase Order', value: m.purchase_order_number ?? '—' },
    { label: 'Receipt Number', value: m.receipt_number ?? '—' },
  )
  if (m.type === 'Assignment') rows.push(
    { label: 'Assigned To', value: m.assigned_to_name ?? String(m.assigned_to ?? '—') },
    { label: 'Source Location', value: m.assignment_source_name ?? String(m.assignment_source_id ?? '—') },
    { label: 'Expected Return', value: m.expected_return ? formatDate(m.expected_return) : '—' },
  )
  if (m.type === 'Transfer') rows.push(
    { label: 'Source Location', value: m.transfer_source_name ?? String(m.transfer_source_id ?? '—') },
    { label: 'Destination', value: m.transfer_dest_name ?? String(m.transfer_dest_id ?? '—') },
    { label: 'Reference', value: m.reference ?? '—' },
  )
  if (m.type === 'Return') rows.push(
    { label: 'Returned To', value: m.returned_to_name ?? String(m.returned_to ?? '—') },
    { label: 'Reason', value: m.reason ?? '—' },
  )
  return rows
}

const TYPE_VARIANT: Record<string, 'active' | 'inactive' | 'warning' | 'critical' | 'maintenance'> = {
  Reception: 'active', Assignment: 'warning', Transfer: 'inactive', Return: 'maintenance',
}
const STATUS_VARIANT: Record<string, 'active' | 'inactive' | 'warning' | 'critical' | 'maintenance'> = {
  Draft: 'warning', Approved: 'active', Rejected: 'critical', Returned: 'maintenance',
}

const STATUS_TABS = ['All', 'Draft', 'Approved', 'Rejected'] as const
const TYPE_OPTIONS = ['All', 'Reception', 'Assignment', 'Transfer', 'Return'] as const

// ── Component ─────────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const { user } = useAuth()
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager'

  // ── Filter state ──────────────────────────────────────────
  const [statusTab, setStatusTab] = useState<typeof STATUS_TABS[number]>('All')
  const [typeFilter, setTypeFilter] = useState<typeof TYPE_OPTIONS[number]>('All')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Data state ────────────────────────────────────────────
  const [movements, setMovements] = useState<AssetMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [detailMovement, setDetailMovement] = useState<AssetMovement | null>(null)
  const [, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // ── Load with server-side filters ─────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const params: Record<string, string> = { sort }
      if (statusTab !== 'All') params.status = statusTab
      if (typeFilter !== 'All') params.type = typeFilter
      if (search.trim()) params.search = search.trim()
      const data = await movementsApi.getAll(params)
      setMovements(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load movements.')
    } finally {
      setIsLoading(false)
    }
  }, [statusTab, typeFilter, sort, search])

  useEffect(() => { void load() }, [load])

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setSearch(val), 400)
  }

  // ── Detail view ───────────────────────────────────────────
  const openDetails = async (movement: AssetMovement) => {
    setDetailMovement(movement)
    setDetailLoading(true)
    setDetailError(null)
    try {
      const data = await movementsApi.getOne(movement.id)
      setDetailMovement(data)
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load movement details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetails = () => { setDetailMovement(null); setDetailLoading(false); setDetailError(null) }

  const handleApprove = async (id: number) => {
    setProcessingId(id); setActionError(null)
    try {
      const updated = await movementsApi.approve(id)
      setDetailMovement(prev => (prev?.id === id ? updated : prev))
      setActionSuccess(`Movement #${id} approved — asset status updated.`)
      void load()
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to approve.')
    } finally {
      setProcessingId(null)
      setTimeout(() => setActionSuccess(null), 5000)
    }
  }

  const handleReject = async (id: number) => {
    setProcessingId(id); setActionError(null)
    try {
      const updated = await movementsApi.reject(id)
      setDetailMovement(prev => (prev?.id === id ? updated : prev))
      setActionSuccess(`Movement #${id} rejected.`)
      void load()
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to reject.')
    } finally {
      setProcessingId(null)
      setTimeout(() => setActionSuccess(null), 5000)
    }
  }

  const draftCount = movements.filter(m => m.status === 'Draft').length

  // ── Table columns ─────────────────────────────────────────
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
      key: 'asset_id', label: 'Asset', width: 'w-[18%]',
      render: (_v: unknown, row: AssetMovement) => {
        const first = formatList(row.tag)[0]
        const count = row.asset_count ?? formatList(row.tag).length
        return (
          <span className="font-semibold text-neutral-800">
            {first || '—'}
            {count > 1 && <span className="font-normal text-neutral-400"> &amp; {count - 1} more</span>}
          </span>
        )
      },
    },
    {
      key: 'performed_by_name', label: 'Performed By', width: 'w-[18%]',
      render: (_v: unknown, row: AssetMovement) => row.performed_by_name ?? '—',
    },
    {
      key: 'date', label: 'Date', width: 'w-[13%]',
      render: (v: string) => formatDate(v),
    },
    {
      key: 'status', label: 'Status', width: 'w-[12%]',
      render: (v: string) => <Badge variant={STATUS_VARIANT[v] ?? 'inactive'}>{v}</Badge>,
    },
    {
      key: 'actions', label: 'Actions', width: 'w-[17%]',
      render: (_v: unknown, row: AssetMovement) => (
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); void openDetails(row) }}
            className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> Review
          </button>
          {row.status === 'Approved' && (
            <button
              onClick={e => { e.stopPropagation(); void movementsApi.openTicket(row.id) }}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print PDF
            </button>
          )}
        </div>
      ),
    },
  ]

  // ── Detail view ───────────────────────────────────────────
  if (detailMovement) {
    const tags = formatList(detailMovement.tag)
    const serials = formatList(detailMovement.serial_numbers)
    const assetCount = Math.max(tags.length, serials.length)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={closeDetails} className="pl-2">
              <ArrowLeft className="h-4 w-4" /> Back to List
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Movement #{detailMovement.id}</h1>
              <p className="mt-1 text-sm text-neutral-500">Review execution details and assets before approving</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {detailMovement.status === 'Approved' && (
              <button
                onClick={() => void movementsApi.openTicket(detailMovement.id)}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Printer className="h-4 w-4" /> Print Ticket
              </button>
            )}
            {isAdminOrManager && detailMovement.status === 'Draft' && (
              <>
                <button
                  disabled={processingId === detailMovement.id}
                  onClick={() => void handleReject(detailMovement.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
                <button
                  disabled={processingId === detailMovement.id}
                  onClick={() => void handleApprove(detailMovement.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </button>
              </>
            )}
          </div>
        </div>

        {actionSuccess && <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"><CheckCircle className="h-4 w-4 shrink-0" />{actionSuccess}</div>}
        {actionError && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"><XCircle className="h-4 w-4 shrink-0" />{actionError}</div>}
        {detailError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{detailError}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-100 pb-3 mb-4">Database Impact</h2>
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-full bg-blue-50 p-2 text-blue-600"><ArrowRightLeft className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">What this action does</p>
                  <p className="mt-1 text-sm text-neutral-600 leading-relaxed">{movementActionText(detailMovement)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Concerned Assets</h2>
                <Badge variant="inactive">{assetCount} asset{assetCount !== 1 ? 's' : ''}</Badge>
              </div>
              {assetCount === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-500">No assets listed.</div>
              ) : (
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-neutral-100 rounded-lg">
                  <table className="w-full text-left text-sm relative">
                    <thead className="bg-neutral-50/90 backdrop-blur-sm text-neutral-500 border-b border-neutral-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 font-semibold w-16">#</th>
                        <th className="px-6 py-3 font-semibold">Asset Tag</th>
                        <th className="px-6 py-3 font-semibold">Serial Number</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {Array.from({ length: assetCount }).map((_, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-6 py-3 font-mono text-neutral-400">{idx + 1}</td>
                          <td className="px-6 py-3 font-medium text-neutral-900">{tags[idx] || '—'}</td>
                          <td className="px-6 py-3 text-neutral-600 max-w-xs truncate">{serials[idx] || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Movement Meta</h3>
              <div className="space-y-4">
                <div><p className="text-xs text-neutral-500 mb-1">Status</p><Badge variant={STATUS_VARIANT[detailMovement.status] ?? 'inactive'}>{detailMovement.status}</Badge></div>
                <div><p className="text-xs text-neutral-500 mb-1">Type</p><Badge variant={TYPE_VARIANT[detailMovement.type] ?? 'inactive'}>{detailMovement.type}</Badge></div>
                <div><p className="text-xs text-neutral-500 mb-1">Process Date</p><p className="text-sm font-medium text-neutral-900">{formatDate(detailMovement.date)}</p></div>
                <div><p className="text-xs text-neutral-500 mb-1">Performed By</p><p className="text-sm font-medium text-neutral-900">{detailMovement.performed_by_name ?? '—'}</p></div>
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Reference Details</h3>
              <div className="space-y-3">
                {movementDetailRows(detailMovement)
                  .filter(r => !['Status', 'Type', 'Date', 'Performed By', 'Movement ID'].includes(r.label))
                  .map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-neutral-500 mb-0.5">{item.label}</p>
                      <p className="text-sm font-medium text-neutral-900">{item.value}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Movements</h1>
          <p className="mt-1 text-sm text-neutral-500">Review and approve pending asset movements to update asset status in the database</p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Draft alert */}
      {draftCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{draftCount} movement{draftCount > 1 ? 's' : ''}</span> pending approval.
            {isAdminOrManager ? ' Approve them below to update asset statuses.' : ' An Admin or Manager must approve them.'}
          </p>
        </div>
      )}

      {/* Feedback */}
      {actionSuccess && <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"><CheckCircle className="h-4 w-4 shrink-0" />{actionSuccess}</div>}
      {actionError && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"><XCircle className="h-4 w-4 shrink-0" />{actionError}</div>}
      {loadError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{loadError}</div>}

      {/* ── Filter Bar ──────────────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        {/* Status tabs */}
        <div className="flex items-center gap-0 border-b border-neutral-200 px-4">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${statusTab === tab ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
            >
              {tab}
              {tab === 'Draft' && draftCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{draftCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap items-center gap-3 p-4">
          {/* Asset tag search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search asset tag…"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400 shrink-0" />
            <Select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
            >
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </Select>
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSort(s => s === 'newest' ? 'oldest' : 'newest')}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            {sort === 'newest'
              ? <><SortDesc className="h-4 w-4 text-primary" /> Newest first</>
              : <><SortAsc className="h-4 w-4 text-neutral-500" /> Oldest first</>
            }
          </button>

          {/* Reset */}
          {(statusTab !== 'All' || typeFilter !== 'All' || sort !== 'newest' || search) && (
            <button
              onClick={() => { setStatusTab('All'); setTypeFilter('All'); setSort('newest'); setSearch(''); setSearchInput('') }}
              className="text-sm text-neutral-400 hover:text-neutral-600 transition underline underline-offset-2"
            >
              Reset filters
            </button>
          )}

          <span className="ml-auto text-xs text-neutral-400">{movements.length} result{movements.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-neutral-300 bg-white shadow-md overflow-hidden">
        <Table<AssetMovement>
          columns={columns}
          rows={movements}
          rowKey="id"
          loading={isLoading}
          hoverable
          striped
          onRowClick={row => void openDetails(row)}
          className="border-none rounded-none"
        />
        {!isLoading && movements.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">
            No movements match the current filters.
          </p>
        )}
      </div>
    </div>
  )
}
