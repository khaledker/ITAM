import { useEffect, useState } from 'react'
import { Plus, Trash2, User, CalendarClock, CheckCircle, XCircle } from 'lucide-react'
import { Button, Input, Textarea, Table, type TableColumn } from '@/components'
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
  serialNumber: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AffectationPage() {
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
      assetsApi.getAll({ status: 'Available' }),
    ])
      .then(([emps, locs, assets]) => {
        setEmployees(emps)
        setLocations(locs)
        setAvailableAssets(assets)
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load data.'))
  }, [])

  // ── Form state ────────────────────────────────────────────────────────────
  const [assignedTo, setAssignedTo] = useState('')       // employee id
  const [sourceId, setSourceId] = useState('')           // location id
  const [expectedReturn, setExpectedReturn] = useState('')
  const [observations, setObservations] = useState('')

  // ── Selected asset list ───────────────────────────────────────────────────
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([])
  const [assetPickValue, setAssetPickValue] = useState('')

  const handleAddAsset = () => {
    if (!assetPickValue) return
    const asset = availableAssets.find(a => String(a.id) === assetPickValue)
    if (!asset) return
    if (selectedAssets.some(a => a.id === asset.id)) return // prevent duplicates
    setSelectedAssets(prev => [...prev, {
      id: asset.id,
      tag: asset.tag,
      modelName: asset.modele?.nom ?? '—',
      brand: asset.modele?.marque ?? '—',
      category: asset.modele?.categorie ?? '—',
      serialNumber: '',
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
    if (!assignedTo || !user || selectedAssets.length === 0) {
      setSubmitError('Please select a user and at least one asset.')
      return
    }
    setIsSaving(true)
    setSubmitError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      await Promise.all(selectedAssets.map(asset =>
        movementsApi.createAssignment({
          date: today,
          asset_id: asset.id,
          performed_by: user.id,
          assigned_to: Number(assignedTo),
          source_id: sourceId ? Number(sourceId) : null,
          expected_return: expectedReturn || null,
        })
      ))
      setSubmitSuccess(true)
      setSelectedAssets([])
      setAssignedTo('')
      setSourceId('')
      setExpectedReturn('')
      setObservations('')
      // Refresh available assets
      assetsApi.getAll({ status: 'Available' }).then(setAvailableAssets)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save affectation.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: TableColumn<SelectedAsset>[] = [
    { key: 'tag', label: 'Tag', width: 'w-[14%]',
      render: (v: string) => <span className="font-semibold text-neutral-900">{v}</span> },
    { key: 'modelName', label: 'Model', width: 'w-[22%]' },
    { key: 'brand', label: 'Brand', width: 'w-[16%]' },
    { key: 'category', label: 'Category', width: 'w-[16%]',
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Affectation</h1>
        <p className="mt-1 text-sm text-neutral-500">Assign assets to employees</p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{loadError}</div>
      )}
      {submitSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Affectation saved successfully. The asset status has been updated.
        </div>
      )}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <XCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-neutral-900">Affectation Details</h2>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Assigned To */}
          <div className="space-y-1.5">
            <label htmlFor="aff-employee" className="block text-sm font-medium text-neutral-700">
              Assign To <span className="text-red-500">*</span>
            </label>
            <select
              id="aff-employee"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">— Select employee —</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
          </div>

          {/* Source Location */}
          <div className="space-y-1.5">
            <label htmlFor="aff-source" className="block text-sm font-medium text-neutral-700">
              Source Location
            </label>
            <select
              id="aff-source"
              value={sourceId}
              onChange={e => setSourceId(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">— Select location —</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Expected Return */}
          <div className="space-y-1.5">
            <label htmlFor="aff-return" className="block text-sm font-medium text-neutral-700">
              Expected Return Date
            </label>
            <Input
              id="aff-return"
              type="date"
              value={expectedReturn}
              onChange={e => setExpectedReturn(e.target.value)}
            />
          </div>

          {/* Observations */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <label htmlFor="aff-obs" className="block text-sm font-medium text-neutral-700">Observations</label>
            <Textarea
              id="aff-obs"
              placeholder="Any notes about this assignment…"
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-neutral-100 pt-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <User className="h-4 w-4" />
            <span>Created by: <span className="font-medium text-neutral-700">{user?.full_name ?? '—'}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <CalendarClock className="h-4 w-4" />
            <span>Created at: <span className="font-medium text-neutral-700">{new Date().toLocaleDateString('fr-DZ')}</span></span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <Button id="aff-save-btn" variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Affectation'}
          </Button>
          <Button id="aff-cancel-btn" variant="ghost" onClick={() => {
            setSelectedAssets([]); setAssignedTo(''); setSourceId('');
            setExpectedReturn(''); setObservations(''); setSubmitSuccess(false); setSubmitError(null);
          }}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Asset picker + table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Assets to Assign</h2>

        {/* Picker row */}
        <div className="flex items-center gap-3">
          <select
            value={assetPickValue}
            onChange={e => setAssetPickValue(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">— Pick an available asset —</option>
            {availableAssets
              .filter(a => !selectedAssets.some(s => s.id === a.id))
              .map(a => (
                <option key={a.id} value={a.id}>
                  {a.tag} — {a.modele?.nom ?? ''} ({a.modele?.marque ?? ''})
                </option>
              ))}
          </select>
          <Button variant="ghost" size="sm" onClick={handleAddAsset} disabled={!assetPickValue}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        <Table<SelectedAsset>
          columns={columns}
          rows={selectedAssets}
          rowKey="id"
          hoverable={false}
          striped
        />
        {selectedAssets.length === 0 && (
          <p className="text-center text-sm text-neutral-400 py-4">No assets selected yet.</p>
        )}
      </div>
    </div>
  )
}
