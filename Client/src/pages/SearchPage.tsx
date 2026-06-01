import { useState } from 'react'
import { Search, RotateCcw, Building2, MapPin, Monitor, Users, FileText, Activity, Server } from 'lucide-react'
import { Button, Input, Select, Checkbox, Table, type TableColumn, Badge } from '@/components'
import { assetsApi, type Asset } from '@/lib/api'

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-2 mb-4 border-b border-neutral-300 pb-2">
    <div className="rounded-full bg-primary/10 p-1.5 text-primary">
      <Icon className="h-4 w-4" />
    </div>
    <h2 className="text-[15px] font-semibold text-neutral-800">{title}</h2>
  </div>
)

export default function SearchPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Asset[] | null>(null)

  const [filters, setFilters] = useState({
    tag: '',
    sn: '',
    user_name: '',
    status: 'all',
  })

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    setIsSearching(true)
    
    // Build actual query params based on populated inputs
    const queryParams: Record<string, string> = {}
    if (filters.tag) queryParams.tag = filters.tag
    if (filters.sn) queryParams.sn = filters.sn
    if (filters.user_name) queryParams.user_name = filters.user_name
    if (filters.status && filters.status !== 'all') {
      const matchStatus = {
        'available': 'Available',
        'assigned': 'Assigned',
        'maintenance': 'InMaintenance',
        'retired': 'Retired'
      }[filters.status] || filters.status
      queryParams.status = matchStatus
    }

    assetsApi.getAll(queryParams).then(data => {
      setResults(data)
      setIsSearching(false)
    }).catch(err => {
      console.error(err)
      setIsSearching(false)
    })
  }

  const handleReset = () => {
    setIsSearching(false)
    setResults(null)
  }
  
  const columns: TableColumn<Asset>[] = [
    { key: 'tag', label: 'Tag', render: (v) => <span className="font-mono text-sm text-neutral-600">{v}</span> },
    { key: 'serial', label: 'S/N', render: (_, r) => r.serial_number || '—' },
    { key: 'modele.nom', label: 'Model', render: (_, r) => r.modele?.nom || '—' },
    { key: 'modele.categorie', label: 'Category', render: (_, r) => r.modele?.categorie || '—' },
    { key: 'employee.full_name', label: 'Assigned To', render: (_, r) => r.employee?.full_name || '—' },
    {
      key: 'status', label: 'Status', render: (_, r) => {
        const variantMap: Record<string, any> = { Available: 'active', Assigned: 'assigned', inMaintenance: 'maintenance', retired: 'inactive' }
        const labelMap: Record<string, string> = { Available: 'Available', Assigned: 'Assigned', inMaintenance: 'In Maintenance', retired: 'Retired' }
        return (
          <Badge variant={variantMap[r.etat] || 'inactive'}>
            {labelMap[r.etat] || r.etat}
          </Badge>
        )
      }
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Advanced Search
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Search for any assets using comprehensive filters and criteria
        </p>
      </div>

      <div className="rounded-xl border border-neutral-300 bg-white shadow-lg p-6 space-y-8">
        
        {/* Team Selection */}
        <section>
          <SectionHeader icon={Users} title="Team Selection" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <label className="text-sm font-medium text-neutral-700">Team</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
                <option value="it">IT Support</option>
                <option value="hr">Human Resources</option>
                <option value="finance">Finance</option>
              </Select>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Checkbox id="include-unapproved" />
              <label htmlFor="include-unapproved" className="text-sm text-neutral-700 cursor-pointer">
                Include unapproved CIs
              </label>
            </div>
          </div>
        </section>

        {/* Basic Information */}
        <section>
          <SectionHeader icon={FileText} title="Basic Information" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-neutral-700">Tag</label>
              <Input placeholder="Enter Tag" value={filters.tag} onChange={e => updateFilter('tag', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Serial Number (SN)</label>
              <Input placeholder="Enter SN" value={filters.sn} onChange={e => updateFilter('sn', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Name</label>
              <Input placeholder="Enter Asset Name" disabled />
            </div>
          </div>
        </section>

        {/* Location Selection */}
        <section>
          <SectionHeader icon={MapPin} title="Location Selection" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-neutral-700">Region</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Site</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Type</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Locality</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Floor</label>
              <Input placeholder="e.g. 3rd Floor" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Room</label>
              <Input placeholder="e.g. 301" />
            </div>
          </div>
        </section>

        {/* Model Selection */}
        <section>
          <SectionHeader icon={Monitor} title="Model Selection" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-neutral-700">Brand</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Category</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Model</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
              </Select>
            </div>
          </div>
        </section>

        {/* User Selection */}
        <section>
          <SectionHeader icon={Users} title="User Selection" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-neutral-700">Sector</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Department</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">User</label>
              <div className="relative mt-1.5">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-600" />
                </div>
                <input
                  type="text"
                  placeholder="Search user..."
                  value={filters.user_name}
                  onChange={e => updateFilter('user_name', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-4 text-base focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Supplier Selection */}
        <section>
          <SectionHeader icon={Building2} title="Supplier Selection" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-neutral-700">Supplier</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">PO (Purchase Order)</label>
              <Input placeholder="Enter PO" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">BR / Receipt Number</label>
              <Input placeholder="Enter BR" />
            </div>
          </div>
        </section>

        {/* Additional Information */}
        <section>
          <SectionHeader icon={Activity} title="Additional Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-neutral-700">Status</label>
              <Select value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
                <option value="all">(All)</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">State / Condition</label>
              <Select defaultValue="all">
                <option value="all">(All)</option>
                <option value="active">Active</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-300">
          <Button variant="ghost" onClick={handleReset} className="min-w-32">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="primary" onClick={handleSearch} disabled={isSearching} className="min-w-40">
            {isSearching ? (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {isSearching ? 'Searching...' : 'Search Assets'}
          </Button>
        </div>

      </div>

      {results && (
        <div className="border border-neutral-300 bg-white shadow-lg overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="border-b border-neutral-300 bg-neutral-50 px-6 py-4 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Server className="h-5 w-5 text-neutral-600" />
               <h2 className="text-lg font-semibold text-neutral-900">Search Results</h2>
             </div>
             <Badge variant="active">{results.length} asset{results.length !== 1 ? 's' : ''} found</Badge>
           </div>
           
           {results.length === 0 ? (
             <div className="p-10 text-center text-sm text-neutral-600">No assets match your complex criteria.</div>
           ) : (
             <Table<Asset> columns={columns} rows={results} rowKey="id" hoverable striped className="border-none rounded-none" />
           )}
        </div>
      )}
    </div>
  )
}
