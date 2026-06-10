import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, User, CalendarClock, CheckCircle, XCircle, Upload, X } from 'lucide-react'
import { Button, Input, Textarea, Table, type TableColumn, Select } from '@/components'
import { assetsApi, locationsApi, suppliersApi, movementsApi, assetModelsApi } from '@/lib/api'
import type { Location, Supplier, AssetModel } from '@/lib/api'
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

interface DraftRow {
  tag: string
  serialNumber: string
  modelId: string
  description: string
}

const EMPTY_DRAFT: DraftRow = { tag: '', serialNumber: '', modelId: '', description: '' }



// ── Component ─────────────────────────────────────────────────────────────────

export default function ReceptionPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rowCounterRef = useRef(1)

  // ── Remote data ───────────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  const [models, setModels] = useState<AssetModel[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      suppliersApi.getAll(),
      locationsApi.getAll(),
      assetModelsApi.getAll()
    ])
      .then(([s, l, m]) => {
        setSuppliers(s)
        setLocations(l)
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
  const [observations, setObservations] = useState('')

  // ── Asset rows ────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<ReceptionRow[]>([])

  // ── Draft row (new row being filled) ─────────────────────────────────────
  const [draft, setDraft] = useState<DraftRow | null>(null)
  const [draftErrors, setDraftErrors] = useState<Partial<Record<keyof DraftRow, string>>>({})

  const openDraft = () => {
    setDraft({ ...EMPTY_DRAFT })
    setDraftErrors({})
  }

  const cancelDraft = () => {
    setDraft(null)
    setDraftErrors({})
  }

  const updateDraft = (key: keyof DraftRow, value: string) => {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev)
    // Clear error on change
    setDraftErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const commitDraft = () => {
    if (!draft) return
    const errors: Partial<Record<keyof DraftRow, string>> = {}
    if (!draft.tag.trim()) errors.tag = 'Tag is required'
    if (!draft.serialNumber.trim()) errors.serialNumber = 'Serial number is required'
    if (!draft.modelId) errors.modelId = 'Model is required'
    if (Object.keys(errors).length > 0) { setDraftErrors(errors); return }

    const model = models.find(m => String(m.id) === draft.modelId)
    const newRow: ReceptionRow = {
      id: rowCounterRef.current++,
      tag: draft.tag.trim(),
      serialNumber: draft.serialNumber.trim(),
      modelId: draft.modelId,
      modelName: model ? `${model.name} (${model.brand})` : '',
      description: draft.description.trim(),
    }
    setRows(prev => [newRow, ...prev])
    setDraft(null)
    setDraftErrors({})
  }

  const removeRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id))

  const updateRow = (id: number, key: keyof ReceptionRow, value: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r))

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

      let startIndex = 0
      const firstLineLower = lines[0].toLowerCase()
      if (firstLineLower.includes('tag') || firstLineLower.includes('serial') || firstLineLower.includes('description')) {
        startIndex = 1
      }

      const newRows: ReceptionRow[] = []
      for (let i = startIndex; i < lines.length; i++) {
        const columns = lines[i].split(/[,;]/).map(s => s.trim().replace(/^"|"$/g, ''))
        if (columns.length < 1) continue

        const tag = columns[0] || ''
        let serialNumber = columns[1] || ''
        const modelName = columns[2] || ''
        const description = columns[3] || ''

        if (!tag && !serialNumber) continue

        if (!serialNumber && tag.includes('ISN-')) {
          serialNumber = tag.replace(/^.*ISN-/, 'SN-')
        } else if (!serialNumber) {
          serialNumber = tag
        }

        let extractedModelName = modelName
        if (!extractedModelName && tag) {
          const brands = ['DELL', 'HP', 'LENOVO', 'CISCO', 'APPLE']
          const foundBrand = brands.find(b => tag.toUpperCase().includes(b))
          if (foundBrand) {
            const match = tag.match(new RegExp(`${foundBrand}[- ]?([^\\s,-]+)`, 'i'))
            extractedModelName = match ? `${foundBrand} ${match[1]}` : foundBrand
          }
        }

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
          id: rowCounterRef.current++,
          tag,
          serialNumber,
          modelId,
          modelName: extractedModelName || (modelId ? '' : 'Unknown Model'),
          description: description || (modelId ? '' : extractedModelName)
        })
      }

      setRows(prev => [...prev, ...newRows])
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saveResult, setSaveResult] = useState<{
    movementId: number
    succeeded: { tag: string }[]
    failed: { tag: string; reason: string }[]
  } | null>(null)

  const handleSave = async () => {
    const actorId = user?.id
    if (!actorId || !deliveryDate) {
      setFormError('Delivery date is required.')
      return
    }
    if (rows.length === 0) {
      setFormError('Add at least one asset row before saving.')
      return
    }

    setIsSaving(true)
    setFormError(null)
    setSaveResult(null)

    const succeeded: { tag: string; id: number }[] = []
    const failed: { tag: string; reason: string }[] = []

    for (const row of rows) {
      try {
        let currentModelId = row.modelId

        if (!currentModelId && row.modelName) {
          const parts = row.modelName.split(' ')
          const brand = parts[0] || 'Unknown'
          const name = parts.slice(1).join(' ') || brand
          const code = `AUTO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          const createdModel = await assetModelsApi.create({ name, brand, code, category: 'Laptop' })
          currentModelId = String(createdModel.id)
        }

        if (!currentModelId) {
          failed.push({ tag: row.tag, reason: 'No model assigned.' })
          continue
        }

        const newAsset = await assetsApi.create({
          tag: row.tag,
          serial_number: row.serialNumber || row.tag,
          status: 'Pending',
          date_acq: deliveryDate,
          description: row.description || null,
          model_id: Number(currentModelId),
          location_id: null, // Location is assigned upon reception approval
        } as any)
        succeeded.push({ tag: row.tag, id: newAsset.id })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        // Simplify common server messages for the user
        const friendly = msg.includes('already exists') || msg.includes('duplicate') || msg.includes('unique')
          ? 'Asset tag or serial number already exists in the system.'
          : msg
        failed.push({ tag: row.tag || '(no tag)', reason: friendly })
      }
    }

    if (succeeded.length === 0) {
      setFormError('None of the assets could be saved. See details below.')
      // Still show the per-row failures via saveResult with a dummy movementId=-1
      setSaveResult({ movementId: -1, succeeded: [], failed })
      setIsSaving(false)
      return
    }

    try {
      const createdMv = await movementsApi.createReception({
        date: deliveryDate,
        asset_ids: succeeded.map(s => s.id),
        performed_by: actorId,
        purchase_order_number: poNumber || null,
        receipt_number: brNumber || null,
        supplier_id: supplierId ? Number(supplierId) : null,
        destination_id: destinationId ? Number(destinationId) : null,
      })
      setSaveResult({ movementId: createdMv.id, succeeded: succeeded.map(s => ({ tag: s.tag })), failed })
      // Remove successfully saved rows; keep the failed ones for user review
      const succeededTags = new Set(succeeded.map(s => s.tag))
      setRows(prev => prev.filter(r => !succeededTags.has(r.tag)))
      if (failed.length === 0) {
        setPoNumber(''); setBrNumber(''); setSupplierId('')
        setDeliveryDate(''); setDestinationId(''); setObservations('')
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create the reception movement.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────────
  const inputCls = 'w-full bg-transparent border border-transparent hover:border-neutral-300 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary rounded-sm px-2 py-1 text-xs text-neutral-800 placeholder:text-neutral-600 focus:outline-none transition-colors'

  const columns: TableColumn<ReceptionRow>[] = [
    {
      key: 'tag', label: 'Tag *', width: 'w-[16%]',
      render: (_v: any, row: ReceptionRow) => (
        <input value={row.tag} placeholder="TAG-XXX"
          onChange={e => updateRow(row.id, 'tag', e.target.value)} className={inputCls} />
      ),
    },
    {
      key: 'serialNumber', label: 'Serial Number', width: 'w-[18%]',
      render: (_v: any, row: ReceptionRow) => (
        <input value={row.serialNumber} placeholder="SN-XXXXX"
          onChange={e => updateRow(row.id, 'serialNumber', e.target.value)} className={inputCls} />
      ),
    },
    {
      key: 'modelId', label: 'Model *', width: 'w-[25%]',
      render: (_v: any, row: ReceptionRow) => {
        const model = models.find(m => String(m.id) === row.modelId)
        return (
          <div className="relative group w-full">
            <input
              value={row.modelName || (model ? `${model.name} (${model.brand})` : '')}
              placeholder="Model Name"
              readOnly
              className={`w-full bg-transparent border border-transparent px-2 py-1 text-xs text-neutral-800 placeholder:text-neutral-600 focus:outline-none rounded-sm ${!row.modelId ? 'text-amber-700 bg-amber-50' : ''}`}
            />
            {!row.modelId && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-200">NEW</span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'description', label: 'Description', width: 'w-[32%]',
      render: (_v: any, row: ReceptionRow) => (
        <input value={row.description} placeholder="Optional description"
          onChange={e => updateRow(row.id, 'description', e.target.value)} className={inputCls} />
      ),
    },
    {
      key: 'actions', label: '', width: 'w-[6%]',
      render: (_v: any, row: ReceptionRow) => (
        <button type="button" onClick={() => removeRow(row.id)}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-colors">
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
        <p className="mt-1 text-sm text-neutral-600">Log incoming assets from suppliers</p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{loadError}</div>
      )}
      {formError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <XCircle className="h-4 w-4 shrink-0" />{formError}
        </div>
      )}
      {saveResult && (
        <div className={`rounded-lg border p-4 text-sm space-y-3 ${saveResult.failed.length === 0
            ? 'border-green-200 bg-green-50'
            : saveResult.succeeded.length === 0
              ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50'
          }`}>
          {/* Header */}
          <div className="flex items-center gap-2 font-semibold">
            {saveResult.succeeded.length > 0
              ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              : <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
            <span className={saveResult.succeeded.length > 0 ? 'text-green-800' : 'text-red-800'}>
              {saveResult.succeeded.length > 0
                ? `${saveResult.succeeded.length} asset${saveResult.succeeded.length !== 1 ? 's' : ''} saved in movement #${saveResult.movementId}.`
                : 'No assets were saved.'}
              {saveResult.failed.length > 0 && ` ${saveResult.failed.length} skipped.`}
            </span>
          </div>
          {/* Successes */}
          {saveResult.succeeded.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 mb-1">✓ Saved successfully:</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {saveResult.succeeded.slice(0, 10).map(s => (
                  <span key={s.tag} className="text-xs bg-green-100 text-green-800 border border-green-200 rounded px-2 py-0.5 font-mono">{s.tag}</span>
                ))}
                {saveResult.succeeded.length > 10 && (
                  <span className="text-xs text-green-700 ml-1 font-medium italic">+{saveResult.succeeded.length - 10} more...</span>
                )}
              </div>
            </div>
          )}
          {/* Failures */}
          {saveResult.failed.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-700 mb-1">✗ Skipped (still in list below):</p>
              <div className="space-y-1">
                {saveResult.failed.slice(0, 10).map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                    <span className="font-mono bg-red-100 border border-red-200 rounded px-1.5 py-0.5 shrink-0">{f.tag}</span>
                    <span className="text-red-600">{f.reason}</span>
                  </div>
                ))}
                {saveResult.failed.length > 10 && (
                  <div className="text-xs text-red-700 mt-2 font-medium italic">+{saveResult.failed.length - 10} more failures hidden.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-xl border border-neutral-300 bg-white p-6 shadow-lg">
        <h2 className="mb-5 text-lg font-semibold text-neutral-900">Reception Details</h2>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="space-y-1.5">
            <label htmlFor="rec-supplier" className="block text-sm font-medium text-neutral-700">Supplier</label>
            <Select id="rec-supplier" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">— Select supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rec-po" className="block text-sm font-medium text-neutral-700">PO Number</label>
            <Input id="rec-po" placeholder="PO-2026-XXXX" value={poNumber} onChange={e => setPoNumber(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rec-br" className="block text-sm font-medium text-neutral-700">
              BR / Receipt Number <span className="text-red-500">*</span>
            </label>
            <Input id="rec-br" placeholder="RCPT-2026-XXXX" value={brNumber} onChange={e => setBrNumber(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rec-date" className="block text-sm font-medium text-neutral-700">
              Delivery Date <span className="text-red-500">*</span>
            </label>
            <Input id="rec-date" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rec-dest" className="block text-sm font-medium text-neutral-700">Destination (Warehouse)</label>
            <Select id="rec-dest" value={destinationId} onChange={e => setDestinationId(e.target.value)}>
              <option value="">— Select location —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.label} ({l.type ?? 'General'})</option>)}
            </Select>
          </div>



          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label htmlFor="rec-obs" className="block text-sm font-medium text-neutral-700">Observations</label>
            <Textarea id="rec-obs" placeholder="Additional notes about this delivery…"
              value={observations} onChange={e => setObservations(e.target.value)} rows={2} />
          </div>
        </div>

        {/* Meta */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-neutral-200 pt-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <User className="h-4 w-4" />
            <span>Created by: <span className="font-medium text-neutral-700">{user?.full_name ?? '—'}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
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
            setDraft(null); setDraftErrors({});
            setSaveResult(null); setFormError(null);
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
            <p className="text-sm text-neutral-600">Add assets manually or import from a CSV file (Tag, Serial Number, Model, Description).</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button
              id="reception-add-asset-btn"
              variant="primary"
              size="sm"
              onClick={openDraft}
              disabled={draft !== null}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Asset
            </Button>
          </div>
        </div>

        {/* ── Draft row form ─────────────────────────────────────────────────── */}
        {draft !== null && (
          <div className="border border-primary/30 bg-primary/5 rounded-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-800">New Asset — fill all required fields before adding</p>
              <button type="button" onClick={cancelDraft} className="text-neutral-600 hover:text-neutral-700 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tag */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-700">Tag <span className="text-red-500">*</span></label>
                <input
                  value={draft.tag}
                  onChange={e => updateDraft('tag', e.target.value)}
                  placeholder="e.g. DJZ-2026-050"
                  className={`w-full rounded-sm border px-3 py-1.5 text-sm text-neutral-800 placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-colors ${draftErrors.tag ? 'border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50' : 'border-neutral-300 focus:border-primary focus:ring-primary bg-white'}`}
                />
                {draftErrors.tag && <p className="text-xs text-red-500">{draftErrors.tag}</p>}
              </div>

              {/* Serial Number */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-700">Serial Number <span className="text-red-500">*</span></label>
                <input
                  value={draft.serialNumber}
                  onChange={e => updateDraft('serialNumber', e.target.value)}
                  placeholder="e.g. SN-XXXXX"
                  className={`w-full rounded-sm border px-3 py-1.5 text-sm text-neutral-800 placeholder:text-neutral-600 focus:outline-none focus:ring-1 transition-colors ${draftErrors.serialNumber ? 'border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50' : 'border-neutral-300 focus:border-primary focus:ring-primary bg-white'}`}
                />
                {draftErrors.serialNumber && <p className="text-xs text-red-500">{draftErrors.serialNumber}</p>}
              </div>

              {/* Model */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-700">Model <span className="text-red-500">*</span></label>
                <select
                  value={draft.modelId}
                  onChange={e => updateDraft('modelId', e.target.value)}
                  className={`w-full rounded-sm border px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 transition-colors ${draftErrors.modelId ? 'border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50' : 'border-neutral-300 focus:border-primary focus:ring-primary bg-white'}`}
                >
                  <option value="">— Select a model —</option>
                  {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.brand})</option>)}
                </select>
                {draftErrors.modelId && <p className="text-xs text-red-500">{draftErrors.modelId}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-700">Description</label>
                <input
                  value={draft.description}
                  onChange={e => updateDraft('description', e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-sm border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 placeholder:text-neutral-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button variant="primary" size="sm" onClick={commitDraft}>
                <CheckCircle className="h-4 w-4 mr-1.5" /> Confirm & Add Row
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelDraft}>
                Discard
              </Button>
            </div>
          </div>
        )}

        {/* ── Asset table ────────────────────────────────────────────────────── */}
        <div className="border border-neutral-300 bg-white shadow-lg overflow-hidden">
          <Table<ReceptionRow>
            columns={columns}
            rows={rows}
            rowKey="id"
            hoverable={false}
            striped
            className="border-none rounded-none"
          />
          {rows.length === 0 && draft === null && (
            <div className="text-center py-12 px-4">
              <Upload className="h-8 w-8 mx-auto text-neutral-300 mb-3" />
              <p className="text-base font-medium text-neutral-900">No assets added yet</p>
              <p className="mt-1 text-sm text-neutral-600">
                Click <span className="font-medium text-primary">Add Asset</span> to add one manually, or use <span className="font-medium">Import CSV</span> to upload a batch.
              </p>
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <p className="text-xs text-neutral-600 text-right">{rows.length} asset{rows.length !== 1 ? 's' : ''} in this reception</p>
        )}
      </div>
    </div>
  )
}
