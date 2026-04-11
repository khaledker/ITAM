import { useState } from 'react'
import { Plus, Trash2, User, CalendarClock } from 'lucide-react'
import { Button, Input, Textarea, Table, type TableColumn } from '@/components'

// ── Types ────────────────────────────────────────────────────────────────────

interface ReceptionAsset {
  id: number
  tag: string
  modelName: string
  brand: string
  category: string
  serialNumber: string
}

interface ReceptionForm {
  supplier: string
  poNumber: string
  brNumber: string
  deliveryDate: string
  warehouse: string
  floor: string
  room: string
  observations: string
}

// ── Initial mock data ────────────────────────────────────────────────────────

let nextId = 3

const INITIAL_ASSETS: ReceptionAsset[] = [
  {
    id: 1,
    tag: 'AST-011',
    modelName: 'Core Router',
    brand: 'Cisco',
    category: 'Network',
    serialNumber: 'SN-CR-20250411-001',
  },
  {
    id: 2,
    tag: 'AST-012',
    modelName: 'Rack Server',
    brand: 'Dell',
    category: 'Server',
    serialNumber: 'SN-RS-20250411-002',
  },
]

const EMPTY_FORM: ReceptionForm = {
  supplier: '',
  poNumber: '',
  brNumber: '',
  deliveryDate: '',
  warehouse: '',
  floor: '',
  room: '',
  observations: '',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ReceptionPage() {
  const [form, setForm] = useState<ReceptionForm>(EMPTY_FORM)
  const [assets, setAssets] = useState<ReceptionAsset[]>(INITIAL_ASSETS)

  // ── Form helpers ─────────────────────────────────────────────────────────

  const updateField = <K extends keyof ReceptionForm>(
    key: K,
    value: ReceptionForm[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  // ── Asset table helpers ──────────────────────────────────────────────────

  const addAssetRow = () => {
    setAssets((prev) => [
      ...prev,
      {
        id: nextId++,
        tag: '',
        modelName: '',
        brand: '',
        category: '',
        serialNumber: '',
      },
    ])
  }

  const removeAssetRow = (id: number) => {
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }

  const updateAsset = (
    id: number,
    key: keyof ReceptionAsset,
    value: string,
  ) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [key]: value } : a)),
    )
  }

  // ── Table columns ────────────────────────────────────────────────────────

  const columns: TableColumn<ReceptionAsset>[] = [
    {
      key: 'tag',
      label: 'Tag',
      width: 'w-[14%]',
      render: (_v: any, row: ReceptionAsset) => (
        <Input
          value={row.tag}
          placeholder="AST-XXX"
          onChange={(e) => updateAsset(row.id, 'tag', e.target.value)}
          className="h-8 text-sm"
        />
      ),
    },
    {
      key: 'modelName',
      label: 'Model Name',
      width: 'w-[20%]',
      render: (_v: any, row: ReceptionAsset) => (
        <Input
          value={row.modelName}
          placeholder="Model name"
          onChange={(e) => updateAsset(row.id, 'modelName', e.target.value)}
          className="h-8 text-sm"
        />
      ),
    },
    {
      key: 'brand',
      label: 'Brand',
      width: 'w-[16%]',
      render: (_v: any, row: ReceptionAsset) => (
        <Input
          value={row.brand}
          placeholder="Brand"
          onChange={(e) => updateAsset(row.id, 'brand', e.target.value)}
          className="h-8 text-sm"
        />
      ),
    },
    {
      key: 'category',
      label: 'Category',
      width: 'w-[16%]',
      render: (_v: any, row: ReceptionAsset) => (
        <Input
          value={row.category}
          placeholder="Category"
          onChange={(e) => updateAsset(row.id, 'category', e.target.value)}
          className="h-8 text-sm"
        />
      ),
    },
    {
      key: 'serialNumber',
      label: 'Serial Number',
      width: 'w-[22%]',
      render: (_v: any, row: ReceptionAsset) => (
        <Input
          value={row.serialNumber}
          placeholder="Serial number"
          onChange={(e) => updateAsset(row.id, 'serialNumber', e.target.value)}
          className="h-8 text-sm"
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 'w-[8%]',
      render: (_v: any, row: ReceptionAsset) => (
        <button
          type="button"
          onClick={() => removeAssetRow(row.id)}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Remove asset"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ]

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Reception
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Log incoming assets from suppliers
        </p>
      </div>

      {/* ── Form card ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-neutral-900">
          Reception Details
        </h2>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Supplier */}
          <div className="space-y-1.5">
            <label htmlFor="reception-supplier" className="block text-sm font-medium text-neutral-700">
              Supplier <span className="text-red-500">*</span>
            </label>
            <Input
              id="reception-supplier"
              placeholder="e.g. Huawei Technologies"
              value={form.supplier}
              onChange={(e) => updateField('supplier', e.target.value)}
              required
            />
          </div>

          {/* PO Number */}
          <div className="space-y-1.5">
            <label htmlFor="reception-po" className="block text-sm font-medium text-neutral-700">
              PO Number
            </label>
            <Input
              id="reception-po"
              placeholder="PO-2025-XXXX"
              value={form.poNumber}
              onChange={(e) => updateField('poNumber', e.target.value)}
            />
          </div>

          {/* BR Number */}
          <div className="space-y-1.5">
            <label htmlFor="reception-br" className="block text-sm font-medium text-neutral-700">
              BR Number <span className="text-red-500">*</span>
            </label>
            <Input
              id="reception-br"
              placeholder="BR-2025-XXXX"
              value={form.brNumber}
              onChange={(e) => updateField('brNumber', e.target.value)}
              required
            />
          </div>

          {/* Delivery Date */}
          <div className="space-y-1.5">
            <label htmlFor="reception-date" className="block text-sm font-medium text-neutral-700">
              Delivery Date <span className="text-red-500">*</span>
            </label>
            <Input
              id="reception-date"
              type="date"
              value={form.deliveryDate}
              onChange={(e) => updateField('deliveryDate', e.target.value)}
              required
            />
          </div>

          {/* Warehouse / Entrepôt */}
          <div className="space-y-1.5">
            <label htmlFor="reception-warehouse" className="block text-sm font-medium text-neutral-700">
              Warehouse / Entrepôt <span className="text-red-500">*</span>
            </label>
            <Input
              id="reception-warehouse"
              placeholder="e.g. Entrepôt Central"
              value={form.warehouse}
              onChange={(e) => updateField('warehouse', e.target.value)}
              required
            />
          </div>

          {/* Floor / Etage */}
          <div className="space-y-1.5">
            <label htmlFor="reception-floor" className="block text-sm font-medium text-neutral-700">
              Floor / Etage
            </label>
            <Input
              id="reception-floor"
              placeholder="e.g. RDC"
              value={form.floor}
              onChange={(e) => updateField('floor', e.target.value)}
            />
          </div>

          {/* Room / Salle */}
          <div className="space-y-1.5">
            <label htmlFor="reception-room" className="block text-sm font-medium text-neutral-700">
              Room / Salle
            </label>
            <Input
              id="reception-room"
              placeholder="e.g. Salle A"
              value={form.room}
              onChange={(e) => updateField('room', e.target.value)}
            />
          </div>

          {/* Observations */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="reception-observations" className="block text-sm font-medium text-neutral-700">
              Observations
            </label>
            <Textarea
              id="reception-observations"
              placeholder="Additional notes about this delivery…"
              value={form.observations}
              onChange={(e) => updateField('observations', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Meta row — created by / created at */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-neutral-100 pt-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <User className="h-4 w-4" />
            <span>
              Created by: <span className="font-medium text-neutral-700">Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <CalendarClock className="h-4 w-4" />
            <span>
              Created at: <span className="font-medium text-neutral-700">11/04/2025 20:30</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <Button id="reception-save-btn" variant="primary">
            Save
          </Button>
          <Button id="reception-cancel-btn" variant="ghost">
            Cancel
          </Button>
        </div>
      </div>

      {/* ── Assets table ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Assets in this Reception
          </h2>
          <Button
            id="reception-add-asset-btn"
            variant="ghost"
            size="sm"
            onClick={addAssetRow}
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>

        <Table<ReceptionAsset>
          columns={columns}
          rows={assets}
          rowKey="id"
          hoverable={false}
          striped
        />
      </div>
    </div>
  )
}
