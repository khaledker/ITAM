import { useEffect, useState } from 'react'
import { Plus, Trash2, User, CalendarClock, CheckCircle, XCircle } from 'lucide-react'
import { Button, Textarea, Table, type TableColumn, Radio } from '@/components'
import { assetsApi, employeesApi, locationsApi, movementsApi } from '@/lib/api'
import type { Asset, Employee, Location } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SelectedAsset {
  id: number
  tag: string
  modelName: string
  brand: string
  category: string
}

type TransferType = 'stock' | 'pannes' | 'reformes'

// ── Component ─────────────────────────────────────────────────────────────────

export default function TransferPage() {
  const { user } = useAuth()

  // ── Remote data ───────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      employeesApi.getAll(),
      locationsApi.getAll(),
      assetsApi.getAll(),
    ])
      .then(([emps, locs, assets]) => {
        setEmployees(emps)
        setLocations(locs)
        setAvailableAssets(assets)
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load data.'))
  }, [])

  // ── Form state ────────────────────────────────────────────────────────────
  const [transferType, setTransferType] = useState<TransferType>('stock')
  const [sourceId, setSourceId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [reference, setReference] = useState('')
  const [transportName, setTransportName] = useState('')
  const [transportContact, setTransportContact] = useState('')
  const [observations, setObservations] = useState('')

  // ── Asset picker ──────────────────────────────────────────────────────────
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([])
  const [assetPickValue, setAssetPickValue] = useState('')

  const addAsset = () => {
    if (!assetPickValue) return
    const asset = availableAssets.find(a => String(a.id) === assetPickValue)
    if (!asset || selectedAssets.some(a => a.id === asset.id)) return
    setSelectedAssets(prev => [...prev, {
      id: asset.id,
      tag: asset.tag,
      modelName: asset.modele?.nom ?? '—',
      brand: asset.modele?.marque ?? '—',
      category: asset.modele?.categorie ?? '—',
    }])
    setAssetPickValue('')
  }

  const removeAsset = (id: number) =>
    setSelectedAssets(prev => prev.filter(a => a.id !== id))

  // ── Submit ────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSave = async () => {
    if (!destinationId || !user) {
      setSubmitError('A destination location is required.')
      return
    }
    if (selectedAssets.length === 0) {
      setSubmitError('Select at least one asset to transfer.')
      return
    }
    const today = transferDate || new Date().toISOString().split('T')[0]
    setIsSaving(true)
    setSubmitError(null)
    try {
      await Promise.all(selectedAssets.map(asset =>
        movementsApi.createTransfer({
          date: today,
          asset_id: asset.id,
          performed_by: user.id,
          reference: reference || null,
          source_id: sourceId ? Number(sourceId) : null,
          destination_id: Number(destinationId),
        })
      ))
      setSubmitSuccess(true)
      setSelectedAssets([])
      setSourceId(''); setDestinationId(''); setReference('')
      setTransportName(''); setTransportContact(''); setObservations('')
      // Refresh assets
      assetsApi.getAll().then(setAvailableAssets)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save transfer.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: TableColumn<SelectedAsset>[] = [
    { key: 'tag', label: 'Tag', width: 'w-[14%]',
      render: (v: string) => <span className="font-semibold text-neutral-900">{v}</span> },
    { key: 'modelName', label: 'Model', width: 'w-[22%]' },
    { key: 'brand', label: 'Brand', width: 'w-[18%]' },
    { key: 'category', label: 'Category', width: 'w-[18%]',
      render: (v: string) => (
        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">{v}</span>
      ) },
    { key: 'actions', label: '', width: 'w-[8%]',
      render: (_v: any, row: SelectedAsset) => (
        <button type="button" onClick={() => removeAsset(row.id)}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      ) },
  ]

  // ── Shared select style ───────────────────────────────────────────────────
  const selectCls = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Transfer</h1>
        <p className="mt-1 text-sm text-neutral-500">Move assets between locations or warehouses</p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{loadError}</div>
      )}
      {submitSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Transfer saved successfully as Draft.
        </div>
      )}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <XCircle className="h-4 w-4 shrink-0" />{submitError}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-neutral-900">Transfer Details</h2>

        {/* Transfer Type */}
        <div className="mb-6 space-y-2">
          <span className="block text-sm font-medium text-neutral-700">Transfer Type</span>
          <div className="flex gap-6">
            {(['stock', 'pannes', 'reformes'] as TransferType[]).map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <Radio name="transferType" value={t}
                  checked={transferType === t} onChange={() => setTransferType(t)} />
                <span className="text-sm text-neutral-900 capitalize">
                  {t === 'pannes' ? 'Pannes (Faults)' : t === 'reformes' ? 'Réformes (Decommissioned)' : 'Stock'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
          {/* Source */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">Source</h3>
            <div className="space-y-1.5">
              <label htmlFor="tr-source" className="block text-sm font-medium text-neutral-700">Location</label>
              <select id="tr-source" value={sourceId} onChange={e => setSourceId(e.target.value)} className={selectCls}>
                <option value="">— Select source location —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">Destination</h3>
            <div className="space-y-1.5">
              <label htmlFor="tr-dest" className="block text-sm font-medium text-neutral-700">
                Location <span className="text-red-500">*</span>
              </label>
              <select id="tr-dest" value={destinationId} onChange={e => setDestinationId(e.target.value)} className={selectCls} required>
                <option value="">— Select destination —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tr-date" className="block text-sm font-medium text-neutral-700">Transfer Date</label>
              <input id="tr-date" type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)}
                className={selectCls} />
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">Transport / Reference</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="tr-ref" className="block text-sm font-medium text-neutral-700">Reference</label>
              <input id="tr-ref" type="text" placeholder="TR-2026-XXXX" value={reference}
                onChange={e => setReference(e.target.value)} className={selectCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tr-transport" className="block text-sm font-medium text-neutral-700">Transport Name</label>
              <input id="tr-transport" type="text" placeholder="e.g. Relocation"
                value={transportName} onChange={e => setTransportName(e.target.value)} className={selectCls} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="tr-contact" className="block text-sm font-medium text-neutral-700">Contact</label>
              <input id="tr-contact" type="text" placeholder="Logistics team"
                value={transportContact} onChange={e => setTransportContact(e.target.value)} className={selectCls} />
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="mt-6 space-y-1.5">
          <label htmlFor="tr-obs" className="block text-sm font-medium text-neutral-700">Observations</label>
          <Textarea id="tr-obs" placeholder="Additional notes…" value={observations}
            onChange={e => setObservations(e.target.value)} rows={2} />
        </div>

        {/* Meta */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-neutral-100 pt-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <User className="h-4 w-4" />
            <span>Created by: <span className="font-medium text-neutral-700">{user?.full_name ?? '—'}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <CalendarClock className="h-4 w-4" />
            <span>Date: <span className="font-medium text-neutral-700">{new Date().toLocaleDateString('fr-DZ')}</span></span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <Button id="transfer-save-btn" variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Transfer'}
          </Button>
          <Button id="transfer-cancel-btn" variant="ghost" onClick={() => {
            setSelectedAssets([]); setSourceId(''); setDestinationId('');
            setReference(''); setTransportName(''); setTransportContact('');
            setObservations(''); setSubmitSuccess(false); setSubmitError(null);
          }}>Cancel</Button>
        </div>
      </div>

      {/* Asset picker */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Assets to Transfer</h2>
        <div className="flex items-center gap-3">
          <select value={assetPickValue} onChange={e => setAssetPickValue(e.target.value)} className={`flex-1 ${selectCls}`}>
            <option value="">— Pick an asset —</option>
            {availableAssets
              .filter(a => !selectedAssets.some(s => s.id === a.id))
              .map(a => (
                <option key={a.id} value={a.id}>
                  {a.tag} — {a.modele?.nom ?? ''} [{a.etat}]
                </option>
              ))}
          </select>
          <Button variant="ghost" size="sm" onClick={addAsset} disabled={!assetPickValue}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <Table<SelectedAsset> columns={columns} rows={selectedAssets} rowKey="id" hoverable={false} striped />
        {selectedAssets.length === 0 && (
          <p className="text-center text-sm text-neutral-400 py-4">No assets selected yet.</p>
        )}
      </div>
    </div>
  )
}
