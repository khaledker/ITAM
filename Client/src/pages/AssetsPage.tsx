import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Plus, Search, RotateCcw } from 'lucide-react'
import { Button, Input, Select, Badge, EmptyState, Table, type TableColumn, type SortConfig } from '@/components'
import { assetsApi, type Asset } from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────────────────

type AssetStatus = 'active' | 'maintenance' | 'warning' | 'critical' | 'inactive'

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['All', 'Active', 'Maintenance', 'Warning', 'Critical', 'Inactive'] as const
const CATEGORY_OPTIONS = ['All', 'Network', 'Server', 'UPS', 'Workstation', 'Printer'] as const

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

// ── Columns ──────────────────────────────────────────────────────────────────

const columns: TableColumn<Asset>[] = [
  {
    key: 'tag',
    label: 'Tag',
    sortable: true,
    width: 'w-[10%]',
    render: (value: string) => (
      <span className="font-semibold text-neutral-900">{value}</span>
    ),
  },
  {
    key: 'modele.nom',
    label: 'Model Name',
    sortable: true,
    width: 'w-[16%]',
    render: (_value: any, row: Asset) => row.modele?.nom ?? '—',
  },
  {
    key: 'modele.marque',
    label: 'Brand',
    width: 'w-[12%]',
    render: (_value: any, row: Asset) => row.modele?.marque ?? '—',
  },
  {
    key: 'modele.categorie',
    label: 'Category',
    width: 'w-[12%]',
    render: (_value: any, row: Asset) => (
      <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
        {row.modele?.categorie ?? '—'}
      </span>
    ),
  },
  {
    key: 'partNum',
    label: 'Part Number',
    width: 'w-[14%]',
    render: (value: string) => (
      <span className="font-mono text-xs text-neutral-600">{value ?? '—'}</span>
    ),
  },
  {
    key: 'etat',
    label: 'Status',
    width: 'w-[12%]',
    render: (value: AssetStatus) => (
      <Badge variant={value}>{statusLabel[value] ?? value}</Badge>
    ),
  },
  {
    key: 'createdAt',
    label: 'Created At',
    width: 'w-[12%]',
    render: (value: string) => value ? formatDate(value) : '—',
  },
  {
    key: 'actions',
    label: 'Actions',
    width: 'w-[8%]',
    render: () => (
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        aria-label="View asset"
      >
        <Eye className="h-4 w-4" />
      </button>
    ),
  },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(undefined)

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

  const hasActiveFilters = search !== '' || statusFilter !== 'All' || categoryFilter !== 'All'

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setCategoryFilter('All')
  }

  const filteredAndSorted = useMemo(() => {
    let result = assets

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.modele.nom.toLowerCase().includes(q) ||
          a.tag.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(
        (a) => a.etat === statusFilter.toLowerCase()
      )
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter(
        (a) => a.modele.categorie === categoryFilter
      )
    }

    // Sort
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Assets</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage and monitor all IT assets</p>
      </div>

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
        <Button id="add-asset-btn" variant="primary">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'Filter by Status' : s}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-48">
          <Select
            id="filter-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'Filter by Category' : c}
              </option>
            ))}
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            id="reset-filters-btn"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
          >
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
