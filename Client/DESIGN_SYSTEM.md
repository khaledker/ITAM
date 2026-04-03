# ITAM Design System

A comprehensive design system for the IT Asset Management (ITAM) platform built with React, TypeScript, Tailwind CSS, and design tokens for a telecom industry solution (Djezzy).

## Overview

This design system provides a foundation for building consistent, accessible, and maintainable UI components for a table-heavy, form-heavy, and dashboard-oriented application.

### Key Features

- **Design Tokens**: Primary color (#E3001B Djezzy red), neutral grays, status colors (success, warning, error, critical, maintenance)
- **Responsive Design**: Mobile-first approach with support for all screen sizes
- **Accessibility**: WCAG 2.1 compliant components with proper ARIA labels
- **TypeScript Support**: Fully typed components with generics support
- **Tailwind CSS**: Utility-first styling with custom theme extension
- **Composition**: Component variants using class-variance-authority (CVA)

## Installation & Setup

### Prerequisites

- React 19+
- TypeScript 5.9+
- Tailwind CSS (configured with @tailwindcss/postcss)
- Vite

### Dependencies

```bash
npm install react react-dom
npm install -D @tailwindcss/postcss postcss
npm install clsx tailwind-merge lucide-react class-variance-authority
```

## Project Structure

```
src/
├── components/
│   ├── ui/                    # Core UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Radio.tsx
│   │   ├── Toggle.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Table.tsx
│   │   ├── StatCard.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Alert.tsx
│   │   ├── Toast.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Skeleton.tsx
│   │   └── index.ts           # Barrel export
│   ├── layout/                # Layout components
│   │   ├── AppShell.tsx
│   │   ├── TopBar.tsx
│   │   └── index.ts           # Barrel export
│   └── index.ts               # Root barrel export
├── utils/
│   ├── cn.ts                  # className merge utility
│   ├── variants.ts            # CVA export
│   └── index.ts               # Barrel export
├── index.css                  # Tailwind directives + base styles
├── App.tsx
└── main.tsx
```

## Design Tokens

### Colors

**Primary Brand:**
- Primary: `#E3001B` (Djezzy Red)

**Neutral Grays** (0-900):
- 0: `#FFFFFF`
- 50: `#F9FAFB`
- 100: `#F3F4F6`
- 200: `#E5E7EB`
- 300: `#D1D5DB`
- 400: `#9CA3AF`
- 500: `#6B7280`
- 600: `#4B5563`
- 700: `#374151`
- 800: `#1F2937`
- 900: `#111827`

**Status Colors:**
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Info: `#3B82F6`
- Maintenance: `#8B5CF6`

### Typography

- Font Family: Inter
- Base Size: `1rem` (16px)
- Sizes: xs (0.75rem), sm (0.875rem), base (1rem), lg (1.125rem), xl (1.25rem), 2xl (1.5rem), 3xl (1.875rem)

### Spacing

Standard scale: xs (0.25rem), sm (0.5rem), md (1rem), lg (1.5rem), xl (2rem), 2xl (3rem), 3xl (4rem)

### Border Radius

- xs: 0.25rem
- sm: 0.375rem
- base: 0.5rem
- md: 0.625rem
- lg: 0.875rem (default for components)
- xl: 1rem
- 2xl: 1.25rem

## Component Documentation

### Form Components

#### Button

```tsx
import { Button } from '@/components'

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button disabled>Disabled</Button>
```

#### Input

```tsx
import { Input } from '@/components'

<Input 
  type="text"
  placeholder="Enter your name..."
  disabled={false}
/>
```

#### Textarea

```tsx
import { Textarea } from '@/components'

<Textarea 
  placeholder="Enter description..."
  rows={4}
/>
```

#### Select

```tsx
import { Select } from '@/components'

<Select>
  <option value="">Select...</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</Select>
```

#### Checkbox

```tsx
import { Checkbox } from '@/components'

<Checkbox />
<Checkbox checked={true} onChange={...} />
<Checkbox indeterminate={true} /> {/* For select all in tables */}
```

#### Radio

```tsx
import { Radio } from '@/components'

<Radio name="group1" value="option1" />
<Radio name="group1" value="option2" />
```

#### Toggle

```tsx
import { Toggle } from '@/components'

<Toggle onChange={(e) => setEnabled(e.target.checked)} />
```

### Data Display

#### Table

```tsx
import { Table, type TableColumn, type SortConfig } from '@/components'

const columns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: 'w-20' },
  { key: 'name', label: 'Asset Name', sortable: true },
  { 
    key: 'status', 
    label: 'Status',
    render: (value) => <Badge variant={value}>{value}</Badge>
  },
]

const rows = [
  { id: 1, name: 'Server A', status: 'active' },
  { id: 2, name: 'Server B', status: 'maintenance' },
]

const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' })
const [selectedRows, setSelectedRows] = useState(new Set<string>())

<Table
  columns={columns}
  rows={rows}
  rowKey="id"
  sortConfig={sortConfig}
  onSort={setSortConfig}
  selectable={true}
  selectedRows={selectedRows}
  onSelectRows={setSelectedRows}
  onRowClick={(row) => console.log(row)}
  striped
  hoverable
/>
```

#### Stat Card

```tsx
import { StatCard } from '@/components'
import { Server } from 'lucide-react'

<StatCard
  label="Total Assets"
  value="1,234"
  icon={<Server className="h-6 w-6 text-primary" />}
  trend={{ value: 12, direction: 'up' }}
/>
```

#### Badge

```tsx
import { Badge } from '@/components'

<Badge variant="active">Active</Badge>
<Badge variant="inactive">Inactive</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="critical">Critical</Badge>
<Badge variant="maintenance">Maintenance</Badge>
```

#### Empty State

```tsx
import { EmptyState } from '@/components'
import { Plus } from 'lucide-react'

<EmptyState
  icon={<Plus className="h-8 w-8" />}
  title="No assets found"
  description="Get started by adding your first asset"
  action={{
    label: 'Add Asset',
    onClick: () => console.log('add'),
  }}
/>
```

### Modals & Dialogs

#### Basic Modal

```tsx
import { Modal } from '@/components'
import { useState } from 'react'

const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Asset Details"
  description="View and edit asset information"
  size="md"
>
  {/* Content */}
</Modal>
```

#### Confirm Modal

```tsx
import { ConfirmModal } from '@/components'

<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Delete Asset"
  description="This action cannot be undone"
  onConfirm={() => deleteAsset()}
  isDangerous={true}
  confirmText="Delete"
  cancelText="Cancel"
/>
```

#### Form Modal

```tsx
import { FormModal } from '@/components'

<FormModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create Asset"
  onSubmit={(formData) => createAsset(Object.fromEntries(formData))}
>
  <div className="space-y-4">
    <Input name="name" placeholder="Asset name" />
    <Select name="type">
      <option>Select type...</option>
      <option>Server</option>
      <option>Network</option>
    </Select>
  </div>
</FormModal>
```

### Feedback Components

#### Toast Notifications

```tsx
import { ToastProvider, useToast } from '@/components'

// Wrap your app with ToastProvider
function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  )
}

// Use in components
function MyComponent() {
  const { addToast } = useToast()

  return (
    <button onClick={() => addToast({
      variant: 'success',
      title: 'Success',
      message: 'Asset created successfully',
      duration: 4000,
      action: {
        label: 'Undo',
        onClick: () => console.log('undo')
      }
    })}>
      Show Toast
    </button>
  )
}
```

#### Alert Banner

```tsx
import { Alert } from '@/components'

<Alert
  variant="info"
  title="Information"
  message="This is an informational message"
  closeable={true}
/>

<Alert
  variant="success"
  title="Success"
  message="Operation completed successfully"
/>

<Alert
  variant="warning"
  title="Warning"
  message="Please review this important notice"
/>

<Alert
  variant="error"
  title="Error"
  message="Something went wrong"
/>
```

#### Loading Spinner

```tsx
import { LoadingSpinner } from '@/components'

<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />
```

#### Skeleton Loaders

```tsx
import { Skeleton } from '@/components'

<Skeleton /> {/* Single skeleton */}
<Skeleton count={3} /> {/* Multiple skeletons */}
<Skeleton circle /> {/* Circular skeleton (for avatars) */}
```

### Interactive Components

#### Tooltip

```tsx
import { Tooltip } from '@/components'

<Tooltip content="This is a tooltip" side="top" delayMs={200}>
  <button>Hover me</button>
</Tooltip>
```

### Layout Components

#### App Shell

```tsx
import { AppShell, Breadcrumbs } from '@/components'

<AppShell
  sidebar={<SidebarContent />}
  header={
    <Breadcrumbs
      items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Assets', href: '/assets' },
        { label: 'Server A', active: true }
      ]}
    />
  }
  contentClassName="p-6"
>
  {/* Page content */}
</AppShell>
```

#### Top Bar

```tsx
import { TopBar, UserAvatar, NotificationBell } from '@/components'

<TopBar
  userName="John Doe"
  userInitials="JD"
  notificationCount={3}
  onUserClick={() => console.log('clicked')}
  onNotificationClick={() => console.log('notifications')}
  onSettingsClick={() => console.log('settings')}
  onLogout={() => console.log('logout')}
>
  <h1>Dashboard</h1>
</TopBar>
```

## Utilities

### cn() - Class Name Merge

```tsx
import { cn } from '@/utils'

// Merge and deduplicate Tailwind classes
cn('px-4 py-2', 'px-2') // Result: 'py-2 px-2'
cn('text-base', condition && 'text-lg') // Conditional classes
```

### CVA - Class Variance Authority

```tsx
import { CVA, type VariantProps } from '@/utils'

const buttonVariants = CVA('base-classes', {
  variants: {
    variant: {
      primary: 'primary-classes',
      secondary: 'secondary-classes',
    },
  },
})

type ButtonProps = VariantProps<typeof buttonVariants>
```

## Configuration Files

### tailwind.config.ts

Extends the default Tailwind configuration with:
- Custom color palette with Djezzy red as primary
- Inter font family
- Custom spacing scale
- Custom border radius scale
- Custom box shadows
- Custom transition durations

### tsconfig.app.json

- Path alias: `@/*` → `src/*` for clean imports
- Strict mode enabled
- ES2023 target

### postcss.config.js

Configured with `@tailwindcss/postcss` for Tailwind v4 support.

## Best Practices

1. **Import Organization**: Use barrel exports for clean imports
   ```tsx
   import { Button, Input, Table } from '@/components'
   import { cn } from '@/utils'
   ```

2. **Type Safety**: Always use TypeScript props for components
   ```tsx
   import { ButtonProps } from '@/components'
   ```

3. **Accessibility**: Leverage built-in ARIA labels and semantic HTML
   ```tsx
   <Table selectable={true} />  // Adds proper roles and labels
   ```

4. **Responsive Design**: Use Tailwind's responsive prefixes
   ```tsx
   className="px-4 sm:px-6 lg:px-8"
   ```

5. **Color Usage**: Always use design token colors, not arbitrary values
   ```tsx
   // ✓ Good
   className="bg-primary text-white"
   
   // ✗ Avoid
   className="bg-red-500 text-white"
   ```

## Development Workflow

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Next Steps

- Create page templates using these components
- Build form validation layer
- Create icon system with Lucide React
- Develop data fetching hooks
- Build authentication flow
- Create example dashboards
- Implement theme customization (dark mode)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

When adding new components:

1. Create the component in `/src/components/ui` or `/src/components/layout`
2. Add TypeScript interfaces for all props
3. Use `cn()` for class merging
4. Add component to barrel export
5. Document in this README
6. Ensure accessibility compliance
7. Test with TypeScript strict mode

## License

Proprietary - ITAM System for Djezzy
