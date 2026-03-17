import React from 'react';
import { cn } from '@lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  maxHeight?: string;
  emptyMessage?: string;
  stickyHeader?: boolean;
  rowClassName?: (row: T, index: number) => string;
  className?: string;
}

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  onSort,
  sortKey,
  sortDirection,
  maxHeight = '400px',
  emptyMessage = 'Veri bulunamadı',
  stickyHeader = true,
  rowClassName,
  className,
}: DataTableProps<T>) {
  const renderSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSort) return null;

    const isActive = sortKey === column.key;

    if (!isActive) {
      return <ArrowUpDown size={14} className="ml-1 inline text-gray-400" />;
    }

    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="ml-1 inline text-blue-600" />
    ) : (
      <ArrowDown size={14} className="ml-1 inline text-blue-600" />
    );
  };

  const handleHeaderClick = (column: DataTableColumn<T>) => {
    if (column.sortable && onSort) {
      onSort(String(column.key));
    }
  };

  return (
    <div className={cn('overflow-x-auto overflow-y-auto', className)} style={{ maxHeight }}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={cn('bg-gray-50', stickyHeader && 'sticky top-0 z-10')}>
          <tr>
            {columns.map(column => (
              <th
                key={String(column.key)}
                onClick={() => handleHeaderClick(column)}
                className={cn(
                  'px-4 py-3 text-left text-sm font-medium text-gray-500',
                  stickyHeader && 'bg-gray-50',
                  column.sortable && onSort && 'cursor-pointer hover:bg-gray-100',
                  column.headerClassName
                )}
              >
                {column.header}
                {renderSortIcon(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'hover:bg-gray-50',
                  onRowClick && 'cursor-pointer',
                  rowClassName?.(row, index)
                )}
              >
                {columns.map(column => {
                  const value = getNestedValue(row, String(column.key));

                  return (
                    <td
                      key={String(column.key)}
                      className={cn(
                        'px-4 py-3 text-sm whitespace-nowrap text-gray-700',
                        column.className
                      )}
                    >
                      {column.render ? column.render(value, row, index) : String(value ?? '-')}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
