import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Input,
  Modal,
  StatCard,
  Table,
  useToast,
} from '@/components'
import { Bell, Server } from 'lucide-react'
import type { TableColumn } from '@/components'

const rows = [
  { id: 'A-1021', asset: 'Core Router', status: 'active' },
  { id: 'A-2033', asset: 'Fiber Switch', status: 'maintenance' },
  { id: 'A-3099', asset: 'UPS Unit', status: 'warning' },
]

const columns: TableColumn<(typeof rows)[number]>[] = [
  { key: 'id', label: 'Asset ID', sortable: true, width: 'w-36' },
  { key: 'asset', label: 'Asset Name', sortable: true },
  {
    key: 'status',
    label: 'Status',
    width: 'w-40',
    render: (value: string) => (
      <Badge
        variant={
          value === 'active'
            ? 'active'
            : value === 'maintenance'
              ? 'maintenance'
              : 'warning'
        }
      >
        {value}
      </Badge>
    ),
  },
]

export function ComponentShowcase() {
  const { addToast } = useToast()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-neutral-50">
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <Alert
          variant="info"
          title="Minimal demo"
          message="This is a lightweight preview of the design system foundation."
          closeable={false}
        />

        <StatCard
          label="Assets Monitored"
          value="2,547"
          icon={<Server className="h-6 w-6 text-primary" />}
          trend={{ value: 4, direction: 'up' }}
        />

        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search asset by name or tag"
            />
            <Button onClick={() => setOpen(true)}>Create Maintenance Ticket</Button>
            <Button
              variant="ghost"
              onClick={() =>
                addToast({
                  variant: 'success',
                  message: 'Bell works correctly and notifications are active.',
                })
              }
            >
              <Bell className="h-4 w-4" />
              Test Bell
            </Button>
          </div>
        </section>

        <Table columns={columns} rows={rows} rowKey="id" />
      </main>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Ticket"
        description="Quick modal example with form-like content"
      >
        <div className="space-y-3">
          <Input placeholder="Ticket title" />
          <Button onClick={() => setOpen(false)}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
