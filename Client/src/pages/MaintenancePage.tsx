import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, XCircle, RefreshCw, Clock, Eye, FileText, Printer, Info, ArrowLeft, ArrowRightLeft } from 'lucide-react'
import { Badge, Button, Table, type TableColumn } from '@/components'
import { movementsApi, type AssetMovement } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function formatList(value?: string | null): string[] {
  return value ? value.split(',').map(item => item.trim()).filter(Boolean) : []
}

function summarizeAssets(movement: AssetMovement): string {
  const tags = formatList(movement.tag)
  const serials = formatList(movement.serial_numbers)
  if (tags.length === 0 && serials.length === 0) return `Movement #${movement.id}`
  const count = tags.length || serials.length
  const sample = tags.length > 0 ? tags[0] : serials[0]
  if (count === 1) return sample
  return `${sample} & ${count - 1} more`
}

function movementActionText(movement: AssetMovement): string {
  if (movement.status === 'Rejected') {
    return 'This movement was rejected and will not change asset status, location, or assignment data.'
  }

  if (movement.status === 'Draft') {
    return 'This movement is waiting for approval. Approving it applies the database changes described below. Rejecting it keeps the assets unchanged.'
  }

  if (movement.type === 'Reception') {
    return 'Approving this reception marks the listed assets as available and places them in the selected destination location.'
  }

  if (movement.type === 'Assignment') {
    return 'Approving this assignment links the listed assets to the selected employee and updates their status to assigned.'
  }

  if (movement.type === 'Transfer') {
    return 'Approving this transfer moves the listed assets to the selected destination location without changing ownership.'
  }

  return 'Approving this return marks the listed assets as available again, clears the employee assignment, and updates the return location.'
}

function movementDetailRows(movement: AssetMovement): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Movement ID', value: `#${movement.id}` },
    { label: 'Type', value: movement.type },
    { label: 'Status', value: movement.status },
    { label: 'Date', value: formatDate(movement.date) },
    { label: 'Performed By', value: movement.performed_by_name ?? '—' },
  ]

  if (movement.type === 'Reception') {
    rows.push(
      { label: 'Supplier', value: movement.supplier_name ?? String(movement.supplier_id ?? '—') },
      { label: 'Destination', value: movement.reception_dest_name ?? String(movement.destination_id ?? '—') },
      { label: 'Purchase Order', value: movement.purchase_order_number ?? '—' },
      { label: 'Receipt Number', value: movement.receipt_number ?? '—' },
    )
  }

  if (movement.type === 'Assignment') {
    rows.push(
      { label: 'Assigned To', value: movement.assigned_to_name ?? String(movement.assigned_to ?? '—') },
      { label: 'Source Location', value: movement.assignment_source_name ?? String(movement.assignment_source_id ?? '—') },
      { label: 'Expected Return', value: movement.expected_return ? formatDate(movement.expected_return) : '—' },
    )
  }

  if (movement.type === 'Transfer') {
    rows.push(
      { label: 'Source Location', value: movement.transfer_source_name ?? String(movement.transfer_source_id ?? '—') },
      { label: 'Destination Location', value: movement.transfer_dest_name ?? String(movement.transfer_dest_id ?? '—') },
      { label: 'Reference', value: movement.reference ?? '—' },
    )
  }

  if (movement.type === 'Return') {
    rows.push(
      { label: 'Returned To', value: movement.returned_to_name ?? String(movement.returned_to ?? '—') },
      { label: 'Reason', value: movement.reason ?? '—' },
    )
  }

  return rows
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
  const [detailMovement, setDetailMovement] = useState<AssetMovement | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
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

  const closeDetails = () => {
    setDetailMovement(null)
    setDetailLoading(false)
    setDetailError(null)
  }

  const handleApprove = async (id: number) => {
    setProcessingId(id)
    setActionError(null)
    try {
      const updated = await movementsApi.approve(id)
      setDetailMovement(prev => (prev?.id === id ? updated : prev))
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
      const updated = await movementsApi.reject(id)
      setDetailMovement(prev => (prev?.id === id ? updated : prev))
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
          {summarizeAssets(row)}
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
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                void openDetails(row)
              }}
              className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors shadow-sm"
            >
              <Eye className="h-3.5 w-3.5" />
              Review
            </button>
            {row.status === 'Approved' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  void movementsApi.openTicket(row.id)
                }}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                Print PDF
              </button>
            )}
          </div>
        )
      },
    },
  ]

  if (detailMovement) {
    // If the movement is loaded, we can render the document view
    const tags = formatList(detailMovement.tag)
    const serials = formatList(detailMovement.serial_numbers)
    const assetCount = Math.max(tags.length, serials.length)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={closeDetails} className="pl-2">
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Movement #{detailMovement.id}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Review execution details and assets before approving
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {detailMovement.status === 'Approved' && (
              <button
                disabled={processingId === detailMovement.id}
                onClick={() => void movementsApi.openTicket(detailMovement.id)}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Print Ticket
              </button>
            )}
            {isAdminOrManager && detailMovement.status === 'Draft' && (
              <>
                <button
                  disabled={processingId === detailMovement.id}
                  onClick={() => void handleReject(detailMovement.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
                <button
                  disabled={processingId === detailMovement.id}
                  onClick={() => void handleApprove(detailMovement.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
              </>
            )}
          </div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Impact Banner */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-centergap-3 justify-between">
                 <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-100 pb-3 block w-full">Database Impact</h2>
              </div>
              <div className="flex items-start gap-4">
                 <div className="mt-1 rounded-full bg-blue-50 p-2 text-blue-600">
                   <ArrowRightLeft className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-neutral-900">What this action does</p>
                   <p className="mt-1 text-sm text-neutral-600 leading-relaxed">{movementActionText(detailMovement)}</p>
                 </div>
              </div>
            </div>

            {/* Asset List Document Grid */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
               <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 flex items-center justify-between">
                 <h2 className="text-lg font-semibold text-neutral-900">Concerned Assets</h2>
                 <Badge variant="inactive">{assetCount} asset{assetCount !== 1 ? 's' : ''}</Badge>
               </div>
               
               {assetCount === 0 ? (
                 <div className="p-8 text-center text-sm text-neutral-500">No assets listed.</div>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-neutral-50/80 text-neutral-500 border-b border-neutral-200">
                       <tr>
                         <th className="px-6 py-3 font-semibold w-16">#</th>
                         <th className="px-6 py-3 font-semibold">Asset Tag</th>
                         <th className="px-6 py-3 font-semibold">Serial Number / Part</th>
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

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Movement Meta</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Status</p>
                  <Badge variant={STATUS_VARIANT[detailMovement.status] ?? 'inactive'}>{detailMovement.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Type</p>
                  <Badge variant={TYPE_VARIANT[detailMovement.type] ?? 'inactive'}>{detailMovement.type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Process Date</p>
                  <p className="text-sm font-medium text-neutral-900">{formatDate(detailMovement.date)}</p>
                </div>
                <div>
                   <p className="text-xs text-neutral-500 mb-1">Performed By</p>
                   <p className="text-sm font-medium text-neutral-900">{detailMovement.performed_by_name ?? '—'}</p>
                </div>
              </div>
            </div>

            {/* Specifics Card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Reference Details</h3>
              <div className="space-y-3">
                {movementDetailRows(detailMovement)
                  .filter(r => !['Status', 'Type', 'Date', 'Performed By', 'Movement ID', 'Assets'].includes(r.label))
                  .map((item) => (
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
          onRowClick={(row) => void openDetails(row)}
        />
        {!isLoading && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">
            {filter === 'Draft' ? 'No pending movements. All caught up! ' : `No ${filter.toLowerCase()} movements.`}
          </p>
        )}
      </div>
    </div>
  )
}
