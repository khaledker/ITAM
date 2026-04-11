import { useState } from 'react'
import { Plus, Trash2, User, CalendarClock } from 'lucide-react'
import { Button, Input, Textarea, Table, type TableColumn, Radio } from '@/components'

// ── Types ────────────────────────────────────────────────────────────────────

interface TransferAsset {
  id: number
  tag: string
  modelName: string
  brand: string
  category: string
  serialNumber: string
}

interface TransferForm {
  transferType: 'stock' | 'pannes' | 'reformes'
  sourceDept: string
  sourceWarehouse: string
  sourceUser: string
  destDept: string
  destWarehouse: string
  destUser: string
  receptionDate: string
  destFloor: string
  destRoom: string
  transportName: string
  transportContact: string
  transportVehicle: string
  observations: string
}

// ── Initial mock data ────────────────────────────────────────────────────────

let nextId = 3

const INITIAL_ASSETS: TransferAsset[] = [
  {
    id: 1,
    tag: 'AST-005',
    modelName: 'Rack Server',
    brand: 'HPE',
    category: 'Server',
    serialNumber: 'SN-RS-20250411-005',
  },
  {
    id: 2,
    tag: 'AST-008',
    modelName: 'Network Switch',
    brand: 'Cisco',
    category: 'Network',
    serialNumber: 'SN-NS-20250411-008',
  },
]

const EMPTY_FORM: TransferForm = {
  transferType: 'stock',
  sourceDept: '',
  sourceWarehouse: '',
  sourceUser: '',
  destDept: '',
  destWarehouse: '',
  destUser: '',
  receptionDate: '',
  destFloor: '',
  destRoom: '',
  transportName: '',
  transportContact: '',
  transportVehicle: '',
  observations: '',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TransferPage() {
  const [form, setForm] = useState<TransferForm>(EMPTY_FORM)
  const [assets, setAssets] = useState<TransferAsset[]>(INITIAL_ASSETS)

  // ── Form helpers ─────────────────────────────────────────────────────────

  const updateField = <K extends keyof TransferForm>(
    key: K,
    value: TransferForm[K],
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
    key: keyof TransferAsset,
    value: string,
  ) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [key]: value } : a)),
    )
  }

  // ── Table columns ────────────────────────────────────────────────────────

  const columns: TableColumn<TransferAsset>[] = [
    {
      key: 'tag',
      label: 'Tag',
      width: 'w-[14%]',
      render: (_v: any, row: TransferAsset) => (
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
      render: (_v: any, row: TransferAsset) => (
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
      render: (_v: any, row: TransferAsset) => (
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
      render: (_v: any, row: TransferAsset) => (
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
      render: (_v: any, row: TransferAsset) => (
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
      render: (_v: any, row: TransferAsset) => (
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
          Transfer
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Move assets between locations or warehouses
        </p>
      </div>

      {/* ── Form card ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-neutral-900">
          Transfer Details
        </h2>

        {/* Transfer Type */}
        <div className="mb-6 space-y-2">
          <span className="block text-sm font-medium text-neutral-700">Transfer Type</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Radio
                name="transferType"
                value="stock"
                checked={form.transferType === 'stock'}
                onChange={() => updateField('transferType', 'stock')}
              />
              <span className="text-sm text-neutral-900">Stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Radio
                name="transferType"
                value="pannes"
                checked={form.transferType === 'pannes'}
                onChange={() => updateField('transferType', 'pannes')}
              />
              <span className="text-sm text-neutral-900">Pannes (Faults)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Radio
                name="transferType"
                value="reformes"
                checked={form.transferType === 'reformes'}
                onChange={() => updateField('transferType', 'reformes')}
              />
              <span className="text-sm text-neutral-900">Réformes (Decommissioned)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
          {/* Source Section */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-neutral-800 border-b border-neutral-100 pb-2">Source</h3>
            <div className="space-y-1.5">
              <label htmlFor="source-dept" className="block text-sm font-medium text-neutral-700">
                Department
              </label>
              <Input
                id="source-dept"
                placeholder="Source department"
                value={form.sourceDept}
                onChange={(e) => updateField('sourceDept', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="source-warehouse" className="block text-sm font-medium text-neutral-700">
                Warehouse / Entrepôt <span className="text-red-500">*</span>
              </label>
              <Input
                id="source-warehouse"
                placeholder="Source warehouse"
                value={form.sourceWarehouse}
                onChange={(e) => updateField('sourceWarehouse', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="source-user" className="block text-sm font-medium text-neutral-700">
                User
              </label>
              <Input
                id="source-user"
                placeholder="Source user"
                value={form.sourceUser}
                onChange={(e) => updateField('sourceUser', e.target.value)}
              />
            </div>
          </div>

          {/* Destination Section */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-neutral-800 border-b border-neutral-100 pb-2">Destination</h3>
            <div className="space-y-1.5">
              <label htmlFor="dest-dept" className="block text-sm font-medium text-neutral-700">
                Department <span className="text-red-500">*</span>
              </label>
              <Input
                id="dest-dept"
                placeholder="Destination department"
                value={form.destDept}
                onChange={(e) => updateField('destDept', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dest-warehouse" className="block text-sm font-medium text-neutral-700">
                Warehouse / Entrepôt <span className="text-red-500">*</span>
              </label>
              <Input
                id="dest-warehouse"
                placeholder="Destination warehouse"
                value={form.destWarehouse}
                onChange={(e) => updateField('destWarehouse', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dest-user" className="block text-sm font-medium text-neutral-700">
                User <span className="text-red-500">*</span>
              </label>
              <Input
                id="dest-user"
                placeholder="Destination user"
                value={form.destUser}
                onChange={(e) => updateField('destUser', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="reception-date" className="block text-sm font-medium text-neutral-700">
                Reception Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="reception-date"
                type="date"
                value={form.receptionDate}
                onChange={(e) => updateField('receptionDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dest-floor" className="block text-sm font-medium text-neutral-700">
                Floor / Etage
              </label>
              <Input
                id="dest-floor"
                placeholder="Destination floor"
                value={form.destFloor}
                onChange={(e) => updateField('destFloor', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dest-room" className="block text-sm font-medium text-neutral-700">
                Room / Salle
              </label>
              <Input
                id="dest-room"
                placeholder="Destination room"
                value={form.destRoom}
                onChange={(e) => updateField('destRoom', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Transport Section */}
        <div className="mt-8 space-y-4">
          <h3 className="text-md font-semibold text-neutral-800 border-b border-neutral-100 pb-2">Transport</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="transport-name" className="block text-sm font-medium text-neutral-700">
                Name / Reason
              </label>
              <Input
                id="transport-name"
                placeholder="e.g. Relocation"
                value={form.transportName}
                onChange={(e) => updateField('transportName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="transport-contact" className="block text-sm font-medium text-neutral-700">
                Contact
              </label>
              <Input
                id="transport-contact"
                placeholder="Logistics team"
                value={form.transportContact}
                onChange={(e) => updateField('transportContact', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="transport-vehicle" className="block text-sm font-medium text-neutral-700">
                Vehicle
              </label>
              <Input
                id="transport-vehicle"
                placeholder="Vehicle details"
                value={form.transportVehicle}
                onChange={(e) => updateField('transportVehicle', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="mt-6 space-y-1.5">
          <label htmlFor="transfer-observations" className="block text-sm font-medium text-neutral-700">
            Observations
          </label>
          <Textarea
            id="transfer-observations"
            placeholder="Additional notes about this transfer…"
            value={form.observations}
            onChange={(e) => updateField('observations', e.target.value)}
            rows={3}
          />
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
              Created at: <span className="font-medium text-neutral-700">11/04/2025 21:05</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <Button id="transfer-save-btn" variant="primary">
            Save
          </Button>
          <Button id="transfer-approve-btn" variant="secondary">
            Approve
          </Button>
          <Button id="transfer-cancel-btn" variant="ghost">
            Cancel
          </Button>
        </div>
      </div>

      {/* ── Assets table ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Assets to Transfer
          </h2>
          <Button
            id="transfer-add-asset-btn"
            variant="ghost"
            size="sm"
            onClick={addAssetRow}
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>

        <Table<TransferAsset>
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
