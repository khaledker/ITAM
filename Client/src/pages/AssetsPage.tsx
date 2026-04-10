import { useState, useMemo } from 'react'
import { Eye, Plus, Search, RotateCcw } from 'lucide-react'
import { Button, Input, Select, Badge, Table, type TableColumn, type SortConfig } from '@/components'

// ── Types ────────────────────────────────────────────────────────────────────

type AssetStatus = 'active' | 'maintenance' | 'warning' | 'critical' | 'inactive'

interface Asset {
  id: number
  tag: string
  partNum: string
  etat: AssetStatus
  createdAt: string
  modele: {
    nom: string
    marque: string
    categorie: string
  }
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ASSETS: Asset[] = [
  {
    id: 1,
    tag: 'AST-001',
    partNum: 'CR-7750-SR',
    etat: 'active',
    createdAt: '2024-11-15',
    modele: { nom: 'Core Router', marque: 'Cisco', categorie: 'Network' },
  },
  {
    id: 2,
    tag: 'AST-002',
    partNum: 'FS-4820-GX',
    etat: 'active',
    createdAt: '2024-09-03',
    modele: { nom: 'Fiber Switch', marque: 'Juniper', categorie: 'Network' },
  },
  {
    id: 3,
    tag: 'AST-003',
    partNum: 'UPS-3000-RM',
    etat: 'warning',
    createdAt: '2023-06-20',
    modele: { nom: 'UPS Unit', marque: 'APC', categorie: 'UPS' },
  },
  {
    id: 4,
    tag: 'AST-004',
    partNum: 'AP-930-AX',
    etat: 'maintenance',
    createdAt: '2025-01-10',
    modele: { nom: 'Access Point', marque: 'Aruba', categorie: 'Network' },
  },
  {
    id: 5,
    tag: 'AST-005',
    partNum: 'RS-DL380-G10',
    etat: 'active',
    createdAt: '2024-03-28',
    modele: { nom: 'Rack Server', marque: 'HPE', categorie: 'Server' },
  },
  {
    id: 6,
    tag: 'AST-006',
    partNum: 'FW-PA-850',
    etat: 'critical',
    createdAt: '2023-12-05',
    modele: { nom: 'Firewall', marque: 'Palo Alto', categorie: 'Network' },
  },
  {
    id: 7,
    tag: 'AST-007',
    partNum: 'PP-48P-CAT6',
    etat: 'inactive',
    createdAt: '2022-08-14',
    modele: { nom: 'Patch Panel', marque: 'Panduit', categorie: 'Network' },
  },
  {
    id: 8,
    tag: 'AST-008',
    partNum: 'NS-2960X-48',
    etat: 'maintenance',
    createdAt: '2024-07-22',
    modele: { nom: 'Network Switch', marque: 'Cisco', categorie: 'Network' },
  },
  {
    id: 9,
    tag: 'AST-009',
    partNum: 'SRV-R740-XD',
    etat: 'active',
    createdAt: '2025-02-17',
    modele: { nom: 'Rack Server', marque: 'Dell', categorie: 'Server' },
  },
  {
    id: 10,
    tag: 'AST-010',
    partNum: 'PRN-M455-DN',
    etat: 'warning',
    createdAt: '2024-05-09',
    modele: { nom: 'LaserJet Printer', marque: 'HP', categorie: 'Printer' },
  },
]

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
    render: (_value: any, row: Asset) => row.modele.nom,
  },
  {
    key: 'modele.marque',
    label: 'Brand',
    width: 'w-[12%]',
    render: (_value: any, row: Asset) => row.modele.marque,
  },
  {
    key: 'modele.categorie',
    label: 'Category',
    width: 'w-[12%]',
    render: (_value: any, row: Asset) => (
      <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
        {row.modele.categorie}
      </span>
    ),
  },
  {
    key: 'partNum',
    label: 'Part Number',
    width: 'w-[14%]',
    render: (value: string) => (
      <span className="font-mono text-xs text-neutral-600">{value}</span>
    ),
  },
  {
    key: 'etat',
    label: 'Status',
    width: 'w-[12%]',
    render: (value: AssetStatus) => (
      <Badge variant={value}>{statusLabel[value]}</Badge>
    ),
  },
  {
    key: 'createdAt',
    label: 'Created At',
    width: 'w-[12%]',
    render: (value: string) => formatDate(value),
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(undefined)

  const hasActiveFilters = search !== '' || statusFilter !== 'All' || categoryFilter !== 'All'

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setCategoryFilter('All')
  }

  const filteredAndSorted = useMemo(() => {
    let result = MOCK_ASSETS

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
  }, [search, statusFilter, categoryFilter, sortConfig])

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
      <Table<Asset>
        columns={columns}
        rows={filteredAndSorted}
        rowKey="id"
        sortConfig={sortConfig}
        onSort={setSortConfig}
        hoverable
        striped
      />
    </div>
  )
}
