import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, User, CalendarClock, CheckCircle, XCircle, Search } from 'lucide-react'
import { Button, Textarea, Table, type TableColumn, Radio, Input } from '@/components'
import { assetsApi, employeesApi, locationsApi, movementsApi } from '@/lib/api'
import type { Asset, Location } from '@/lib/api'
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
  // const [employees, setEmployees] = useState<Employee[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      employeesApi.getAll(),
      locationsApi.getAll(),
      assetsApi.getAll(),
    ])
      .then(([_, locs, assets]) => {
        // setEmployees(emps)
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
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return availableAssets;
    const lowerTerm = searchTerm.toLowerCase();
    return availableAssets.filter((asset) => {
      const tagMatch = asset.tag?.toLowerCase().includes(lowerTerm);
      const snMatch = asset.serial_number?.toLowerCase().includes(lowerTerm) || asset.partNum?.toLowerCase().includes(lowerTerm);
      const categoryMatch = asset.modele?.categorie?.toLowerCase().includes(lowerTerm);
      const brandMatch = asset.modele?.marque?.toLowerCase().includes(lowerTerm);
      const modelMatch = asset.modele?.nom?.toLowerCase().includes(lowerTerm);
      return tagMatch || snMatch || categoryMatch || brandMatch || modelMatch;
    });
  }, [availableAssets, searchTerm]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleSave = async () => {
    if (!destinationId || !user) {
      setSubmitError('A destination location is required.')
      return
    }
    if (selectedAssetIds.size === 0) {
      setSubmitError('Select at least one asset to transfer.')
      return
    }
    const today = transferDate || new Date().toISOString().split('T')[0]
    setIsSaving(true)
    setSubmitError(null)
    try {
      const assetIds = Array.from(selectedAssetIds).map(Number)
      await Promise.all(assetIds.map(assetId =>
        movementsApi.createTransfer({
          date: today,
          asset_id: assetId,
          performed_by: user.id,
          reference: reference || null,
          source_id: sourceId ? Number(sourceId) : null,
          destination_id: Number(destinationId),
        })
      ))
      setSubmitSuccess(true)
      setSelectedAssetIds(new Set())
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
  const columns: TableColumn<Asset>[] = [
    { key: 'tag', label: 'Tag', width: 'w-[15%]',
      render: (v: string) => <span className="font-semibold text-neutral-900">{v || '-'}</span> },
    { key: 'serial_number', label: 'S/N', width: 'w-[15%]',
      render: (_v: any, row: Asset) => <span className="text-neutral-500">{row.serial_number || row.partNum || '-'}</span> },
    { key: 'category', label: 'Category', width: 'w-[20%]',
      render: (_v: any, row: Asset) => (
        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
          {row.modele?.categorie || '-'}
        </span>
      ) },
    { key: 'brand', label: 'Brand', width: 'w-[20%]',
      render: (_v: any, row: Asset) => row.modele?.marque || '-' },
    { key: 'modelName', label: 'Model', width: 'w-[30%]',
      render: (_v: any, row: Asset) => row.modele?.nom || '-' },
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
            setSelectedAssetIds(new Set()); setSourceId(''); setDestinationId('');
            setReference(''); setTransportName(''); setTransportContact('');
            setObservations(''); setSubmitSuccess(false); setSubmitError(null);
          }}>Cancel</Button>
        </div>
      </div>

      {/* Asset picker */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Assets to Transfer</h2>
            <p className="text-sm text-neutral-500">{selectedAssetIds.size} asset(s) selected.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search Tag, S/N, Brand, Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>

        <Table<Asset>
          columns={columns}
          rows={filteredAssets}
          rowKey={(row) => String(row.id)}
          hoverable={true}
          striped
          selectable={true}
          selectedRows={selectedAssetIds}
          onSelectRows={setSelectedAssetIds}
        />
      </div>
    </div>
  )
}
