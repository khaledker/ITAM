import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, User, CalendarClock, CheckCircle, XCircle, Upload } from 'lucide-react'
import { Button, Input, Textarea, Table, type TableColumn, Select } from '@/components'
import { assetsApi, employeesApi, locationsApi, suppliersApi, movementsApi, assetModelsApi } from '@/lib/api'
import type { Employee, Location, Supplier, AssetModel } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReceptionRow {
  id: number
  tag: string
  serialNumber: string
  modelId: string
  modelName: string
  description: string
}

let rowCounter = 1

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReceptionPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Remote data ───────────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [models, setModels] = useState<AssetModel[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      suppliersApi.getAll(),
      locationsApi.getAll(),
      employeesApi.getAll(),
      assetModelsApi.getAll()
    ])
      .then(([s, l, e, m]) => {
        setSuppliers(s)
        setLocations(l)
        setEmployees(e)
        setModels(m)
      })
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
  const [bulkModelId, setBulkModelId] = useState('')

  const addRow = () => setRows(prev => [...prev, {
    id: rowCounter++, tag: '', serialNumber: '', modelId: '', modelName: '', description: '',
  }])

  const removeRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id))

  const updateRow = (id: number, key: keyof ReceptionRow, value: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r))

  const handleApplyBulkModel = () => {
    if (!bulkModelId) return
    setRows(prev => prev.map(r => ({ ...r, modelId: bulkModelId })))
    setBulkModelId('')
  }

  // ── CSV Import ────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result as string
      if (!csv) return

      const lines = csv.split(/\r?\n/).filter(l => l.trim())
      if (lines.length === 0) return

      // Attempt to auto-detect header row
      let startIndex = 0
      const firstLineLower = lines[0].toLowerCase()
      if (firstLineLower.includes('tag') || firstLineLower.includes('serial') || firstLineLower.includes('description')) {
        startIndex = 1
      }

      const newRows: ReceptionRow[] = []
      for (let i = startIndex; i < lines.length; i++) {
        // Handle both comma and semicolon separators; handles simple quotes
        const columns = lines[i].split(/[,;]/).map(s => s.trim().replace(/^"|"$/g, ''))
        
        if (columns.length < 1) continue

        const tag = columns[0] || ''
        let serialNumber = columns[1] || ''
        const modelName = columns[2] || ''
        const description = columns[3] || ''

        if (!tag && !serialNumber) continue

        // If SN is empty, try to extract it from the Tag (handles format: DJZ-2026-ISN-XXXX)
        if (!serialNumber && tag.includes('ISN-')) {
          serialNumber = tag.replace(/^.*ISN-/, 'SN-')
        } else if (!serialNumber) {
          serialNumber = tag
        }

        // Extract model name from column or Tag
        let extractedModelName = modelName
        if (!extractedModelName && tag) {
          // Look for brand keywords in the tag
          const brands = ['DELL', 'HP', 'LENOVO', 'CISCO', 'APPLE']
          const foundBrand = brands.find(b => tag.toUpperCase().includes(b))
          if (foundBrand) {
            // Try to get something after the brand as the model name
            const match = tag.match(new RegExp(`${foundBrand}[- ]?([^\\s,-]+)`, 'i'))
            extractedModelName = match ? `${foundBrand} ${match[1]}` : foundBrand
          }
        }

        // Auto-match model name if provided
        let modelId = ''
        if (extractedModelName) {
          const mNameLower = extractedModelName.toLowerCase()
          const matched = models.find(m => 
            m.name.toLowerCase() === mNameLower ||
            (m.brand && `${m.brand} ${m.name}`.toLowerCase() === mNameLower) ||
            m.code.toLowerCase() === mNameLower ||
            mNameLower.includes(m.name.toLowerCase())
          )
          if (matched) modelId = String(matched.id)
        }

        newRows.push({
          id: rowCounter++,
          tag: tag, 
          serialNumber,
          modelId,
          modelName: extractedModelName || (modelId ? '' : 'Unknown Model'),
          description: description || (modelId ? '' : extractedModelName)
        })
      }

      setRows(prev => [...prev, ...newRows])
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccessId, setSubmitSuccessId] = useState<number | null>(null)

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
    
    setIsSaving(true)
    setSubmitError(null)
    setSubmitSuccessId(null)
    try {
      const createdAssetIds: number[] = []
      for (const row of rows) {
        let currentModelId = row.modelId;

        // If model doesn't exist, create it automatically
        if (!currentModelId && row.modelName) {
          try {
            // Basic extraction for Brand (first word) and Name (rest)
            const parts = row.modelName.split(' ');
            const brand = parts[0] || 'Unknown';
            const name = parts.slice(1).join(' ') || brand;
            const code = `AUTO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            const createdModel = await assetModelsApi.create({
              name,
              brand,
              code,
              category: 'Laptop' // Default category, user can change later
            });
            currentModelId = String(createdModel.id);
          } catch (err) {
            console.error('Failed to auto-create model:', row.modelName, err);
            throw new Error(`Failed to create missing model: ${row.modelName}`);
          }
        }

        if (!currentModelId) {
          throw new Error(`Row with tag ${row.tag} has no model assigned.`);
        }

        const newAsset = await assetsApi.create({
          tag: row.tag,
          serial_number: row.serialNumber || row.tag,
          status: 'Available',
          date_acq: deliveryDate,
          description: row.description || null,
          model_id: Number(currentModelId),
          location_id: destinationId ? Number(destinationId) : null,
        } as any)
        createdAssetIds.push(newAsset.id);
      }

      const createdMv = await movementsApi.createReception({
        date: deliveryDate,
        asset_ids: createdAssetIds,
        performed_by: actorId,
        purchase_order_number: poNumber || null,
        receipt_number: brNumber || null,
        supplier_id: supplierId ? Number(supplierId) : null,
        destination_id: destinationId ? Number(destinationId) : null,
      })

      setSubmitSuccessId(createdMv.id)
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
  const columns: TableColumn<ReceptionRow>[] = [
    {
      key: 'tag', label: 'Tag *', width: 'w-[16%]',
      render: (_v: any, row: ReceptionRow) => (
        <Input value={row.tag} placeholder="TAG-XXX"
          onChange={e => updateRow(row.id, 'tag', e.target.value)} className="h-8 text-sm" />
      ),
    },
    {
      key: 'serialNumber', label: 'Serial Number', width: 'w-[18%]',
      render: (_v: any, row: ReceptionRow) => (
        <Input value={row.serialNumber} placeholder="SN-XXXXX"
          onChange={e => updateRow(row.id, 'serialNumber', e.target.value)} className="h-8 text-sm" />
      ),
    },
    {
      key: 'modelId', label: 'Model *', width: 'w-[25%]',
      render: (_v: any, row: ReceptionRow) => {
        const model = models.find(m => String(m.id) === row.modelId)
        return (
          <div className="relative group">
            <Input 
              value={row.modelName || (model ? `${model.name} (${model.brand})` : '')} 
              placeholder="Model Name"
              readOnly
              className={`h-8 text-sm bg-neutral-50 ${!row.modelId ? 'border-amber-500 focus:ring-amber-500' : ''}`}
            />
            {!row.modelId && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-200">
                  NEW
                </span>
              </div>
            )}
          </div>
        )
      },
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
      {submitSuccessId !== null && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Reception saved as Draft. An Admin/Manager must approve it.</span>
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
            <Select id="rec-supplier" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">— Select supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </Select>
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
            <Select id="rec-dest" value={destinationId} onChange={e => setDestinationId(e.target.value)}>
              <option value="">— Select location —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.label} ({l.type ?? 'General'})</option>)}
            </Select>
          </div>

          {/* Performed By */}
          <div className="space-y-1.5">
            <label htmlFor="rec-by" className="block text-sm font-medium text-neutral-700">Performed By</label>
            <Select id="rec-by" value={performedBy} onChange={e => setPerformedBy(e.target.value)}>
              <option value="">— Defaults to you —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </Select>
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
            setSubmitSuccessId(null); setSubmitError(null);
          }}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Asset rows */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Assets in this Reception</h2>
            <p className="text-sm text-neutral-500">Manually add rows or upload a CSV file (Format: Tag, Serial Number, Description).</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button id="reception-add-asset-btn" variant="ghost" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" /> Add Row
            </Button>
          </div>
        </div>

        {/* Bulk Model Assignment (shown only when rows exist) */}
        {rows.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <span className="text-sm font-medium text-amber-800 whitespace-nowrap">Bulk Apply Model:</span>
            <div className="max-w-md w-full">
              <Select
                value={bulkModelId}
                onChange={e => setBulkModelId(e.target.value)}
              >
                <option value="">— Select a model to apply to all rows below —</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.brand})</option>
                ))}
              </Select>
            </div>
            <Button variant="primary" size="sm" onClick={handleApplyBulkModel} disabled={!bulkModelId}>
              Apply
            </Button>
          </div>
        )}

        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <Table<ReceptionRow>
            columns={columns}
            rows={rows}
            rowKey="id"
            hoverable={false}
            striped
          />
          {rows.length === 0 && (
            <div className="text-center py-12 px-4">
              <Upload className="h-8 w-8 mx-auto text-neutral-300 mb-3" />
              <p className="text-base font-medium text-neutral-900">No assets added yet</p>
              <p className="mt-1 text-sm text-neutral-500">
                Click "Import CSV" to upload a batch of assets, or add them manually one by one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
