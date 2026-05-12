import React from 'react'
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Checkbox } from './Checkbox'

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

export interface TableColumn<T = any> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey?: string | ((row: T, index: number) => string)
  sortConfig?: SortConfig
  onSort?: (config: SortConfig) => void
  loading?: boolean
  selectable?: boolean
  selectedRows?: Set<string>
  onSelectRows?: (rows: Set<string>) => void
  onRowClick?: (row: T) => void
  hoverable?: boolean
  striped?: boolean
  className?: string
}

const TableSkeleton = () => (
  <tr>
    <td colSpan={100} className="px-4 py-3">
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 bg-neutral-200 rounded animate-pulse" />
        ))}
      </div>
    </td>
  </tr>
)

function Table<T = any>({
  columns,
  rows,
  rowKey = 'id',
  sortConfig,
  onSort,
  loading = false,
  selectable = false,
  selectedRows = new Set(),
  onSelectRows,
  onRowClick,
  hoverable = true,
  striped = true,
  className,
}: TableProps<T>) {
  const getRowKey = (row: T, index: number) => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index)
    }
    return String((row as any)[rowKey])
  }

  const handleSelectAll = () => {
    if (selectedRows.size === rows.length) {
      onSelectRows?.(new Set())
    } else {
      onSelectRows?.(new Set(rows.map((r, i) => getRowKey(r, i))))
    }
  }

  const handleSelectRow = (rowId: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId)
    } else {
      newSelected.add(rowId)
    }
    onSelectRows?.(newSelected)
  }

  const isSorted = (columnKey: string) => sortConfig?.key === columnKey

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-neutral-300', className)}>
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-neutral-300 bg-neutral-50">
            {selectable && (
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={selectedRows.size === rows.length && rows.length > 0}
                  indeterminate={selectedRows.size > 0 && selectedRows.size < rows.length}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-sm font-semibold text-neutral-700',
                  column.width
                )}
              >
                {column.sortable ? (
                  <button
                    onClick={() =>
                      onSort?.({
                        key: column.key,
                        direction:
                          isSorted(column.key) && sortConfig?.direction === 'asc'
                            ? 'desc'
                            : 'asc',
                      })
                    }
                    className="inline-flex items-center gap-2 hover:text-neutral-900"
                  >
                    {column.label}
                    {isSorted(column.key) ? (
                      sortConfig?.direction === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    ) : (
                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(5)].map((_, i) => <TableSkeleton key={i} />)
          ) : rows.length > 0 ? (
            rows.map((row, rowIndex) => {
              const rowId = getRowKey(row, rowIndex)
              const isSelected = selectedRows.has(rowId)
              return (
                <tr
                  key={rowId}
                  className={cn(
                    'border-b border-neutral-300 transition-colors',
                    striped && rowIndex % 2 === 1 && 'bg-neutral-50',
                    hoverable && 'hover:bg-neutral-100 cursor-pointer',
                    isSelected && 'bg-primary bg-opacity-5'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(rowId)}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={`${rowId}-${column.key}`}
                      className={cn(
                        'px-4 py-3 text-sm text-neutral-700',
                        column.width
                      )}
                    >
                      {column.render
                        ? column.render((row as any)[column.key], row, rowIndex)
                        : (row as any)[column.key]}
                    </td>
                  ))}
                </tr>
              )
            })
          ) : (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-8 text-center text-neutral-500"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export { Table }
