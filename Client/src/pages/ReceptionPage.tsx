import { useEffect, useState } from 'react'
import { Plus, Trash2, User, CalendarClock, CheckCircle, XCircle } from 'lucide-react'
import { Button, Input, Textarea, Table, type TableColumn } from '@/components'
import { assetsApi, employeesApi, locationsApi, suppliersApi, movementsApi } from '@/lib/api'
import type { Employee, Location, Supplier } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReceptionRow {
  id: number       // local key only
  tag: string
  serialNumber: string
  modelId: string  // user types or we could add a picker
  description: string
}

let rowCounter = 1

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReceptionPage() {
  const { user } = useAuth()

  // ── Remote data ───────────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([suppliersApi.getAll(), locationsApi.getAll(), employeesApi.getAll()])
      .then(([s, l, e]) => { setSuppliers(s); setLocations(l); setEmployees(e) })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load data.'))
  }, [])

  // ── Form state ────────────────────────────────────────────────────────────
  const [supplierId, setSupplierId] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [brNumber, setBrNumber] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [observations, setObservations] = useState('')

  // ── Asset rows ────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<ReceptionRow[]>([])

  const addRow = () => setRows(prev => [...prev, {
    id: rowCounter++, tag: '', serialNumber: '', modelId: '', description: '',
  }])

  const removeRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id))

  const updateRow = (id: number, key: keyof ReceptionRow, value: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r))

  // ── Submit ────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSave = async () => {
    const actorId = performedBy ? Number(performedBy) : user?.id
    if (!actorId || !deliveryDate) {
      setSubmitError('Delivery date and performed-by employee are required.')
      return
    }
    if (rows.length === 0) {
      setSubmitError('Add at least one asset row before saving.')
      return
    }
    const missingTags = rows.some(r => !r.tag.trim())
    if (missingTags) {
      setSubmitError('Every asset row must have a Tag value.')
      return
    }

    setIsSaving(true)
    setSubmitError(null)
    try {
      // Note: the reception API expects asset_id — for new assets being received,
      // they need to be created first. For now we create them inline using assetsApi.
      // Each row: create asset → then create reception movement for it.
      for (const row of rows) {
        const newAsset = await assetsApi.create({
          tag: row.tag,
          serial_number: row.serialNumber || row.tag,
          status: 'Available',
          date_acq: deliveryDate,
          description: row.description || null,
          model_id: row.modelId ? Number(row.modelId) : 1, // fallback to model 1
          location_id: destinationId ? Number(destinationId) : null,
        } as any)

        await movementsApi.createReception({
          date: deliveryDate,
          asset_id: newAsset.id,
          performed_by: actorId,
          purchase_order_number: poNumber || null,
          receipt_number: brNumber || null,
          supplier_id: supplierId ? Number(supplierId) : null,
          destination_id: destinationId ? Number(destinationId) : null,
        })
      }

      setSubmitSuccess(true)
      setRows([])
      setPoNumber(''); setBrNumber(''); setSupplierId('')
      setDeliveryDate(''); setDestinationId(''); setObservations('')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save reception.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────────
  const warehouseLocations = locations.filter(l => !l.type || l.type === 'Warehouse')

  const columns: TableColumn<ReceptionRow>[] = [
    {
      key: 'tag', label: 'Tag *', width: 'w-[16%]',
      render: (_v: any, row: ReceptionRow) => (
        <Input value={row.tag} placeholder="TAG-XXX"
          onChange={e => updateRow(row.id, 'tag', e.target.value)} className="h-8 text-sm" />
      ),
    },
    {
      key: 'serialNumber', label: 'Serial Number', width: 'w-[22%]',
      render: (_v: any, row: ReceptionRow) => (
        <Input value={row.serialNumber} placeholder="SN-XXXXX"
          onChange={e => updateRow(row.id, 'serialNumber', e.target.value)} className="h-8 text-sm" />
      ),
    },
    {
      key: 'description', label: 'Description', width: 'w-[32%]',
      render: (_v: any, row: ReceptionRow) => (
        <Input value={row.description} placeholder="Optional description"
          onChange={e => updateRow(row.id, 'description', e.target.value)} className="h-8 text-sm" />
      ),
    },
    {
      key: 'actions', label: '', width: 'w-[6%]',
      render: (_v: any, row: ReceptionRow) => (
        <button type="button" onClick={() => removeRow(row.id)}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Reception</h1>
        <p className="mt-1 text-sm text-neutral-500">Log incoming assets from suppliers</p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{loadError}</div>
      )}
      {submitSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Reception saved. Assets are now in the system with status <strong>Available</strong>.
        </div>
      )}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <XCircle className="h-4 w-4 shrink-0" />{submitError}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-neutral-900">Reception Details</h2>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Supplier */}
          <div className="space-y-1.5">
            <label htmlFor="rec-supplier" className="block text-sm font-medium text-neutral-700">Supplier</label>
            <select id="rec-supplier" value={supplierId} onChange={e => setSupplierId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">— Select supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>

          {/* PO Number */}
          <div className="space-y-1.5">
            <label htmlFor="rec-po" className="block text-sm font-medium text-neutral-700">PO Number</label>
            <Input id="rec-po" placeholder="PO-2026-XXXX" value={poNumber} onChange={e => setPoNumber(e.target.value)} />
          </div>

          {/* BR Number */}
          <div className="space-y-1.5">
            <label htmlFor="rec-br" className="block text-sm font-medium text-neutral-700">
              BR / Receipt Number <span className="text-red-500">*</span>
            </label>
            <Input id="rec-br" placeholder="RCPT-2026-XXXX" value={brNumber} onChange={e => setBrNumber(e.target.value)} required />
          </div>

          {/* Delivery Date */}
          <div className="space-y-1.5">
            <label htmlFor="rec-date" className="block text-sm font-medium text-neutral-700">
              Delivery Date <span className="text-red-500">*</span>
            </label>
            <Input id="rec-date" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required />
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <label htmlFor="rec-dest" className="block text-sm font-medium text-neutral-700">Destination (Warehouse)</label>
            <select id="rec-dest" value={destinationId} onChange={e => setDestinationId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">— Select location —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.label} ({l.type ?? 'General'})</option>)}
            </select>
          </div>

          {/* Performed By */}
          <div className="space-y-1.5">
            <label htmlFor="rec-by" className="block text-sm font-medium text-neutral-700">Performed By</label>
            <select id="rec-by" value={performedBy} onChange={e => setPerformedBy(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">— Defaults to you —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>

          {/* Observations */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label htmlFor="rec-obs" className="block text-sm font-medium text-neutral-700">Observations</label>
            <Textarea id="rec-obs" placeholder="Additional notes about this delivery…"
              value={observations} onChange={e => setObservations(e.target.value)} rows={2} />
          </div>
        </div>

        {/* Meta */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-neutral-100 pt-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <User className="h-4 w-4" />
            <span>Logged in as: <span className="font-medium text-neutral-700">{user?.full_name ?? '—'}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <CalendarClock className="h-4 w-4" />
            <span>Date: <span className="font-medium text-neutral-700">{new Date().toLocaleDateString('fr-DZ')}</span></span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <Button id="reception-save-btn" variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Reception'}
          </Button>
          <Button id="reception-cancel-btn" variant="ghost" onClick={() => {
            setRows([]); setPoNumber(''); setBrNumber(''); setSupplierId('');
            setDeliveryDate(''); setDestinationId(''); setObservations('');
            setSubmitSuccess(false); setSubmitError(null);
          }}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Asset rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Assets in this Reception</h2>
          <Button id="reception-add-asset-btn" variant="ghost" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" /> Add Asset Row
          </Button>
        </div>

        <Table<ReceptionRow>
          columns={columns}
          rows={rows}
          rowKey="id"
          hoverable={false}
          striped
        />
        {rows.length === 0 && (
          <p className="text-center text-sm text-neutral-400 py-6">
            Click "Add Asset Row" to add assets being received.
          </p>
        )}
      </div>
    </div>
  )
}
