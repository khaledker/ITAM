import { useEffect, useState } from 'react'
import { Plus, Trash2, User, CalendarClock, CheckCircle, XCircle } from 'lucide-react'
import { Button, Textarea, Table, type TableColumn } from '@/components'
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function RetourPage() {
  const { user } = useAuth()

  // ── Remote data ───────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [assignedAssets, setAssignedAssets] = useState<Asset[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      employeesApi.getAll(),
      locationsApi.getAll(),
      assetsApi.getAll({ status: 'Assigned' }),
    ])
      .then(([emps, locs, assets]) => {
        setEmployees(emps)
        setLocations(locs)
        setAssignedAssets(assets)
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load data.'))
  }, [])

  // ── Form state ────────────────────────────────────────────────────────────
  const [returnedToId, setReturnedToId] = useState('')   // location id
  const [performedBy, setPerformedBy] = useState('')     // employee override
  const [reason, setReason] = useState('')

  // ── Asset picker ──────────────────────────────────────────────────────────
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([])
  const [assetPickValue, setAssetPickValue] = useState('')

  const addAsset = () => {
    if (!assetPickValue) return
    const asset = assignedAssets.find(a => String(a.id) === assetPickValue)
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
    const actorId = performedBy ? Number(performedBy) : user?.id
    if (!actorId) { setSubmitError('Could not determine who is performing this return.'); return }
    if (selectedAssets.length === 0) { setSubmitError('Select at least one asset to return.'); return }

    const today = new Date().toISOString().split('T')[0]
    setIsSaving(true)
    setSubmitError(null)
    try {
      await Promise.all(selectedAssets.map(asset =>
        movementsApi.createReturn({
          date: today,
          asset_id: asset.id,
          performed_by: actorId,
          reason: reason || null,
          returned_to: returnedToId ? Number(returnedToId) : null,
        })
      ))
      setSubmitSuccess(true)
      setSelectedAssets([])
      setReturnedToId(''); setPerformedBy(''); setReason('')
      // Refresh assigned assets
      assetsApi.getAll({ status: 'Assigned' }).then(setAssignedAssets)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save return.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────────
  const selectCls = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"

  const columns: TableColumn<SelectedAsset>[] = [
    { key: 'tag', label: 'Tag', width: 'w-[14%]',
      render: (v: string) => <span className="font-semibold text-neutral-900">{v}</span> },
    { key: 'modelName', label: 'Model', width: 'w-[24%]' },
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Retour</h1>
        <p className="mt-1 text-sm text-neutral-500">Return assigned assets back to a warehouse</p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{loadError}</div>
      )}
      {submitSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Return saved as Draft. Approve it to mark assets as Available again.
        </div>
      )}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <XCircle className="h-4 w-4 shrink-0" />{submitError}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-neutral-900">Return Details</h2>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Returned To (location) */}
          <div className="space-y-1.5">
            <label htmlFor="ret-location" className="block text-sm font-medium text-neutral-700">Return to (Warehouse)</label>
            <select id="ret-location" value={returnedToId} onChange={e => setReturnedToId(e.target.value)} className={selectCls}>
              <option value="">— Select location —</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>

          {/* Performed By */}
          <div className="space-y-1.5">
            <label htmlFor="ret-by" className="block text-sm font-medium text-neutral-700">Performed By</label>
            <select id="ret-by" value={performedBy} onChange={e => setPerformedBy(e.target.value)} className={selectCls}>
              <option value="">— Defaults to you —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>

          {/* Reason */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label htmlFor="ret-reason" className="block text-sm font-medium text-neutral-700">Reason / Observations</label>
            <Textarea id="ret-reason" placeholder="Why are these assets being returned?…"
              value={reason} onChange={e => setReason(e.target.value)} rows={2} />
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
          <Button id="retour-save-btn" variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Return'}
          </Button>
          <Button id="retour-cancel-btn" variant="ghost" onClick={() => {
            setSelectedAssets([]); setReturnedToId(''); setPerformedBy('');
            setReason(''); setSubmitSuccess(false); setSubmitError(null);
          }}>Cancel</Button>
        </div>
      </div>

      {/* Asset picker */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Assets to Return</h2>
        <p className="text-sm text-neutral-500">Only currently <strong>Assigned</strong> assets are listed.</p>

        <div className="flex items-center gap-3">
          <select value={assetPickValue} onChange={e => setAssetPickValue(e.target.value)} className={`flex-1 ${selectCls}`}>
            <option value="">— Pick an assigned asset —</option>
            {assignedAssets
              .filter(a => !selectedAssets.some(s => s.id === a.id))
              .map(a => (
                <option key={a.id} value={a.id}>
                  {a.tag} — {a.modele?.nom ?? ''} ({a.modele?.marque ?? ''})
                </option>
              ))}
          </select>
          <Button variant="ghost" size="sm" onClick={addAsset} disabled={!assetPickValue}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        <Table<SelectedAsset> columns={columns} rows={selectedAssets} rowKey="id" hoverable={false} striped />
        {selectedAssets.length === 0 && (
          <p className="text-center text-sm text-neutral-400 py-4">No assets selected. Pick from the dropdown above.</p>
        )}
      </div>
    </div>
  )
}
