import { useEffect, useState } from 'react'
import { FileText, Download, BarChart2 } from 'lucide-react'
import { Button } from '@/components'
import { assetsApi, dashboardApi } from '@/lib/api'

// ── Component ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    dashboardApi.getSummary().then(setStats).catch(console.error)
  }, [])

  const handleExportCSV = async () => {
    setIsGenerating(true)
    try {
      const assets = await assetsApi.getAll()
      
      // Basic CSV generation
      const headers = ['ID', 'Tag', 'Serial Number', 'Status', 'Model', 'Brand', 'Category', 'Location']
      const rows = assets.map(a => [
        a.id,
        a.tag,
        a.partNum || '', // We don't have SN directly on this schema without expanding it, but partNum is there
        a.etat,
        a.modele?.nom || '',
        a.modele?.marque || '',
        a.modele?.categorie || '',
        (a as any).location_label || '' // We don't strictly type location_label on Asset yet, but it's there
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `itam-assets-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert('Failed to export data: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Reports</h1>
          <p className="mt-1 text-sm text-neutral-500">Generate and export system data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Full Export Card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col items-start gap-4">
          <div className="rounded-lg bg-red-50 p-3 text-red-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Full Asset Export</h3>
            <p className="mt-1 text-sm text-neutral-500">Download a complete CSV of all assets currently in the system, including their statuses and locations.</p>
          </div>
          <Button onClick={handleExportCSV} disabled={isGenerating} className="mt-auto w-full flex justify-center gap-2">
            <Download className="h-4 w-4" />
            {isGenerating ? 'Generating…' : 'Export CSV'}
          </Button>
        </div>

        {/* Quick Stats Summary */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col items-start gap-4 col-span-1 md:col-span-2">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Database Snapshot</h3>
            <p className="mt-1 text-sm text-neutral-500">Quick overview of current system health.</p>
          </div>
          
          {stats ? (
            <div className="mt-2 w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-100">
                <div className="text-sm text-neutral-500">Total Assets</div>
                <div className="mt-1 text-2xl font-semibold text-neutral-900">{stats.stats?.total || 0}</div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-100">
                <div className="text-sm text-neutral-500">Available</div>
                <div className="mt-1 text-2xl font-semibold text-neutral-900">{stats.stats?.available || 0}</div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-100">
                <div className="text-sm text-neutral-500">Assigned</div>
                <div className="mt-1 text-2xl font-semibold text-neutral-900">{stats.stats?.assigned || 0}</div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-100">
                <div className="text-sm text-neutral-500">In Maintenance</div>
                <div className="mt-1 text-2xl font-semibold text-red-600">{stats.stats?.in_maintenance || 0}</div>
              </div>
            </div>
          ) : (
             <div className="text-sm text-neutral-400">Loading snapshot data…</div>
          )}
        </div>
      </div>
    </div>
  )
}
