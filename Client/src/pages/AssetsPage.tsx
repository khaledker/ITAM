import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Plus, Search, RotateCcw, X, CheckCircle, XCircle, User, CalendarClock } from 'lucide-react'
import { Button, Input, Select, Badge, EmptyState, Table, type TableColumn, type SortConfig } from '@/components'
import { assetsApi, assetModelsApi, locationsApi, type Asset, type AssetModel, type Location, type AssetMovement } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── Types ────────────────────────────────────────────────────────────────────

type AssetStatus = 'active' | 'maintenance' | 'warning' | 'critical' | 'inactive'

interface AssetCreateBody {
  tag: string
  serial_number: string
  model_id: number
  status: string
  date_acq: string
  description: string
  location_id: number | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['All', 'Active', 'Maintenance', 'Warning', 'Critical', 'Inactive'] as const
const CATEGORY_OPTIONS = ['All', 'Network', 'Server', 'UPS', 'Workstation', 'Printer', 'Laptop', 'Desktop', 'Printer'] as const

const statusLabel: Record<AssetStatus, string> = {
  active: 'Active',
  maintenance: 'Maintenance',
  warning: 'Warning',
  critical: 'Critical',
  inactive: 'Inactive',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

// ── Add Asset Modal ───────────────────────────────────────────────────────────

interface AddAssetModalProps {
  models: AssetModel[]
  locations: Location[]
  onClose: () => void
  onSaved: () => void
}

function AddAssetModal({ models, locations, onClose, onSaved }: AddAssetModalProps) {
  const [form, setForm] = useState<AssetCreateBody>({
    tag: '',
    serial_number: '',
    model_id: 0,
    status: 'Available',
    date_acq: new Date().toISOString().split('T')[0],
    description: '',
    location_id: null,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = <K extends keyof AssetCreateBody>(key: K, value: AssetCreateBody[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.tag.trim() || !form.serial_number.trim() || !form.model_id) {
      setError('Tag, Serial Number, and Model are required.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await assetsApi.create({
        tag: form.tag,
        serial_number: form.serial_number,
        model_id: form.model_id,
        status: form.status,
        date_acq: form.date_acq || null,
        description: form.description || null,
        location_id: form.location_id,
      } as any)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectCls = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-[95vw] sm:w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Add New Asset</h2>
          <button onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <XCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Tag */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">
                Tag <span className="text-red-500">*</span>
              </label>
              <Input placeholder="TAG-0001" value={form.tag}
                onChange={e => update('tag', e.target.value)} required />
            </div>

            {/* Serial Number */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">
                Serial Number <span className="text-red-500">*</span>
              </label>
              <Input placeholder="SN-XXXXX" value={form.serial_number}
                onChange={e => update('serial_number', e.target.value)} required />
            </div>

            {/* Model */}
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium text-neutral-700">
                Model <span className="text-red-500">*</span>
              </label>
              <select value={form.model_id || ''} onChange={e => update('model_id', Number(e.target.value))} className={selectCls} required>
                <option value="">— Select a model —</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.brand ?? '?'} ({m.category ?? '?'})
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Status</label>
              <select value={form.status} onChange={e => update('status', e.target.value)} className={selectCls}>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="inMaintenance">In Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            {/* Date Acquired */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Date Acquired</label>
              <Input type="date" value={form.date_acq}
                onChange={e => update('date_acq', e.target.value)} />
            </div>

            {/* Location */}
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Location</label>
              <select value={form.location_id ?? ''} onChange={e => update('location_id', e.target.value ? Number(e.target.value) : null)} className={selectCls}>
                <option value="">— No location —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Description</label>
              <Input placeholder="Optional description" value={form.description}
                onChange={e => update('description', e.target.value)} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Creating…' : 'Create Asset'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── View Asset Modal (Details + History) ───────────────────────────────────────

interface ViewAssetModalProps {
  asset: Asset
  onClose: () => void
}

function ViewAssetModal({ asset, onClose }: ViewAssetModalProps) {
  const [history, setHistory] = useState<AssetMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    assetsApi.getHistory(asset.id)
      .then(setHistory)
      .finally(() => setIsLoading(false))
  }, [asset.id])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-[95vw] sm:w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Asset Details: {asset.tag}</h2>
            <p className="text-xs text-neutral-500">{asset.modele.marque} {asset.modele.nom}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Status</p>
              <Badge variant={asset.etat}>{asset.etat}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Assigned To</p>
              <p className="text-sm font-medium text-neutral-900">{asset.employee?.full_name ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Category</p>
              <p className="text-sm font-medium text-neutral-900">{asset.modele.categorie}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Acquired On</p>
              <p className="text-sm font-medium text-neutral-900">{asset.createdAt ? formatDate(asset.createdAt) : '—'}</p>
            </div>
          </div>

          {/* History Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Movement History</h3>
            
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map(i => <div key={i} className="h-16 bg-neutral-50 rounded-lg" />)}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-neutral-500 italic py-4 text-center border-2 border-dashed border-neutral-100 rounded-xl">No history records found for this asset.</p>
            ) : (
              <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-neutral-100">
                {history.map((mov) => (
                  <div key={mov.id} className="relative flex items-center gap-4 pl-10">
                    <span className={`absolute left-0 mt-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200`}>
                      {mov.type === 'Reception' && <Plus className="h-4 w-4" />}
                      {mov.type === 'Assignment' && <User className="h-4 w-4 text-blue-500" />}
                      {mov.type === 'Transfer' && <RotateCcw className="h-4 w-4 text-orange-500" />}
                      {mov.type === 'Return' && <CalendarClock className="h-4 w-4 text-green-500" />}
                    </span>
                    <div className="flex-1 rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-neutral-900">{mov.type}</p>
                        <Badge variant={mov.status === 'Approved' ? 'active' : 'warning'}>{mov.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {formatDate(mov.date)} • Performed by {mov.performed_by_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end border-t border-neutral-100 p-4">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const { user } = useAuth()
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager'

  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(undefined)

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  const [models, setModels] = useState<AssetModel[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)

  const columns = useMemo<TableColumn<Asset>[]>(() => [
    {
      key: 'tag',
      label: 'Tag',
      sortable: true,
      width: 'w-[10%]',
      render: (value: string) => <span className="font-semibold text-neutral-900">{value}</span>,
    },
    {
      key: 'modele.nom',
      label: 'Model Name',
      sortable: true,
      width: 'w-[14%]',
      render: (_value: any, row: Asset) => row.modele?.nom ?? '—',
    },
    {
      key: 'modele.marque',
      label: 'Brand',
      width: 'w-[10%]',
      render: (_value: any, row: Asset) => row.modele?.marque ?? '—',
    },
    {
      key: 'modele.categorie',
      label: 'Category',
      width: 'w-[10%]',
      render: (_value: any, row: Asset) => (
        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
          {row.modele?.categorie ?? '—'}
        </span>
      ),
    },
    {
      key: 'employee.full_name',
      label: 'Assigned To',
      width: 'w-[14%]',
      render: (_value: any, row: Asset) => (
        <div className="flex items-center gap-2">
          {row.employee ? (
            <>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {row.employee.full_name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="text-sm font-medium text-neutral-700">{row.employee.full_name}</span>
            </>
          ) : (
            <span className="text-xs italic text-neutral-400">Available</span>
          )}
        </div>
      ),
    },
    {
      key: 'etat',
      label: 'Status',
      width: 'w-[10%]',
      render: (value: AssetStatus) => <Badge variant={value}>{statusLabel[value] ?? value}</Badge>,
    },
    {
      key: 'createdAt',
      label: 'Created At',
      width: 'w-[10%]',
      render: (value: string) => value ? formatDate(value) : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 'w-[6%]',
      render: (_value: any, row: Asset) => (
        <button
          type="button"
          onClick={() => { setSelectedAsset(row); setShowViewModal(true); }}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="View asset history"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ], [])

  const loadAssets = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const data = await assetsApi.getAll()
      setAssets(Array.isArray(data) ? data : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load assets.'
      setLoadError(message)
      setAssets([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  // Pre-load models + locations when admin opens modal
  const openAddModal = async () => {
    if (models.length === 0) {
      const [m, l] = await Promise.all([assetModelsApi.getAll(), locationsApi.getAll()])
      setModels(m)
      setLocations(l)
    }
    setSaveSuccess(false)
    setShowAddModal(true)
  }

  const handleAssetSaved = () => {
    setShowAddModal(false)
    setSaveSuccess(true)
    loadAssets()
    setTimeout(() => setSaveSuccess(false), 4000)
  }

  const hasActiveFilters = search !== '' || statusFilter !== 'All' || categoryFilter !== 'All'

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setCategoryFilter('All')
  }

  const filteredAndSorted = useMemo(() => {
    let result = assets

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.modele?.nom?.toLowerCase().includes(q) ||
          a.tag.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'All') {
      result = result.filter((a) => a.etat === statusFilter.toLowerCase())
    }

    if (categoryFilter !== 'All') {
      result = result.filter((a) => a.modele?.categorie === categoryFilter)
    }

    if (sortConfig) {
      const { key, direction } = sortConfig
      result = [...result].sort((a, b) => {
        const aVal = String(getNestedValue(a, key) ?? '')
        const bVal = String(getNestedValue(b, key) ?? '')
        const cmp = aVal.localeCompare(bVal)
        return direction === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [assets, search, statusFilter, categoryFilter, sortConfig])

  return (
    <div className="space-y-6">
      {/* Add Asset Modal */}
      {showAddModal && (
        <AddAssetModal
          models={models}
          locations={locations}
          onClose={() => setShowAddModal(false)}
          onSaved={handleAssetSaved}
        />
      )}

      {showViewModal && selectedAsset && (
        <ViewAssetModal
          asset={selectedAsset}
          onClose={() => { setShowViewModal(false); setSelectedAsset(null); }}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Assets</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage and monitor all IT assets</p>
      </div>

      {/* Success banner */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Asset created successfully and added to the database.
        </div>
      )}

      {/* Search + Add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            id="asset-search"
            placeholder="Search by model or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdminOrManager && (
          <Button id="add-asset-btn" variant="primary" onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select id="filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'Filter by Status' : s}</option>
            ))}
          </Select>
        </div>
        <div className="w-48">
          <Select id="filter-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'Filter by Category' : c}</option>
            ))}
          </Select>
        </div>
        {hasActiveFilters && (
          <Button id="reset-filters-btn" variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* Table */}
      {loadError && (
        <EmptyState
          title="Unable to load assets"
          description={loadError}
          action={{ label: 'Retry', onClick: loadAssets }}
        />
      )}

      <Table<Asset>
        columns={columns}
        rows={filteredAndSorted}
        rowKey="id"
        sortConfig={sortConfig}
        onSort={setSortConfig}
        loading={isLoading}
        hoverable
        striped
      />
    </div>
  )
}
