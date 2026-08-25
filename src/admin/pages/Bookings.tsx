import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import AdminIcon from '../components/AdminIcon';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import BookingDrawer from './BookingDrawer';
import NewBookingDrawer from './NewBookingDrawer';
import { fetchAllBookings, useBookings, type BookingFilters } from '../lib/queries';
import { downloadCsv } from '../lib/csv';
import { BOOKING_STATUS_META, PAYMENT_STATUS_META, formatDate, inr } from '../constants';
import { useAdminAuth } from '../auth/AdminAuthContext';
import type { Booking, BookingStatus } from '../types';

const STATUS_OPTIONS: { value: BookingStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CHECKED_IN', label: 'Checked in' },
  { value: 'CHECKED_OUT', label: 'Checked out' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const col = createColumnHelper<Booking>();

export default function Bookings() {
  const { hasRole } = useAdminAuth();
  const [filters, setFilters] = useState<BookingFilters>({ page: 1, pageSize: 10, q: '', status: '' });
  const [searchInput, setSearchInput] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useBookings(filters);

  const columns = useMemo(
    () => [
      col.accessor('code', {
        header: 'Ref',
        cell: (c) => <span className="font-mono text-xs text-ink">{c.getValue()}</span>,
      }),
      col.accessor('customerName', {
        header: 'Guest',
        cell: (c) => (
          <div>
            <p className="font-medium text-ink">{c.getValue()}</p>
            <p className="text-xs text-muted">{c.row.original.customerEmail}</p>
          </div>
        ),
      }),
      col.accessor((r) => r.stay?.name ?? '—', {
        id: 'stay',
        header: 'Stay',
        cell: (c) => <span className="text-ink">{c.getValue() as string}</span>,
      }),
      col.accessor('checkIn', {
        header: 'Dates',
        cell: (c) => (
          <span className="whitespace-nowrap text-xs text-muted">
            {formatDate(c.getValue())} → {formatDate(c.row.original.checkOut)}
          </span>
        ),
      }),
      col.accessor('amount', {
        header: 'Amount',
        cell: (c) => <span className="font-medium text-ink">{inr(c.getValue())}</span>,
      }),
      col.accessor('status', {
        header: 'Status',
        cell: (c) => {
          const m = BOOKING_STATUS_META[c.getValue()];
          return <Badge tone={m.tone}>{m.label}</Badge>;
        },
      }),
      col.accessor('paymentStatus', {
        header: 'Payment',
        cell: (c) => {
          const m = PAYMENT_STATUS_META[c.getValue()];
          return <Badge tone={m.tone}>{m.label}</Badge>;
        },
      }),
      col.display({
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: (c) => (
          <AdminButton size="sm" variant="secondary" onClick={() => setSelected(c.row.original)}>
            View
          </AdminButton>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters((f) => ({ ...f, q: searchInput.trim(), page: 1 }));
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const rows = await fetchAllBookings(filters);
      if (rows.length === 0) {
        setExportError('Nothing to export — no bookings match the current filters.');
        return;
      }
      downloadCsv(
        `bookings-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Ref', 'Guest', 'Email', 'Phone', 'Stay', 'Check-in', 'Check-out', 'Nights', 'Guests', 'Amount', 'Status', 'Payment', 'Source'],
        rows.map((b) => [
          b.code,
          b.customerName,
          b.customerEmail,
          b.customerPhone ?? '',
          b.stay?.name ?? '',
          b.checkIn.slice(0, 10),
          b.checkOut.slice(0, 10),
          b.nights,
          b.guests,
          b.amount,
          b.status,
          b.paymentStatus,
          b.source,
        ]),
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed — please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Manage reservations, check-ins and payments."
        actions={
          <>
            <AdminButton variant="secondary" loading={exporting} onClick={handleExport}>
              <AdminIcon name="download" className="h-4 w-4" />
              Export CSV
            </AdminButton>
            {hasRole('SUPER_ADMIN', 'MANAGER', 'FRONT_DESK') && (
              <AdminButton onClick={() => setCreating(true)}>
                <AdminIcon name="plus" className="h-4 w-4" />
                New booking
              </AdminButton>
            )}
          </>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <form onSubmit={submitSearch} className="relative flex-1 sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <AdminIcon name="search" className="h-4 w-4" />
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search ref, name, email…"
            className="w-full rounded-lg border border-line bg-paper py-2 pl-9 pr-3 text-sm outline-none focus:border-forest"
          />
        </form>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as BookingStatus | '', page: 1 }))}
          className="rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-forest"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          From
          <input
            type="date"
            value={filters.from ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined, page: 1 }))}
            className="rounded-lg border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-forest"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          To
          <input
            type="date"
            value={filters.to ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined, page: 1 }))}
            className="rounded-lg border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-forest"
          />
        </label>
        {(filters.from || filters.to) && (
          <button
            onClick={() => setFilters((f) => ({ ...f, from: undefined, to: undefined, page: 1 }))}
            className="text-xs text-terracotta hover:underline"
          >
            Clear dates
          </button>
        )}
        {isFetching && <span className="text-xs text-muted">Updating…</span>}
        {exportError && <span className="text-xs text-rose-600">{exportError}</span>}
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState label="Loading bookings…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="No bookings found" description="Try clearing the search or filters." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-line bg-cream/60 text-left">
                    {hg.headers.map((h) => {
                      const sortable = h.column.getCanSort();
                      const dir = h.column.getIsSorted();
                      return (
                        <th
                          key={h.id}
                          onClick={sortable ? h.column.getToggleSortingHandler() : undefined}
                          className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted ${
                            sortable ? 'cursor-pointer select-none hover:text-ink' : ''
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : ''}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-line/70 last:border-0 hover:bg-cream/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && (
            <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
              <span className="text-muted">
                {data.total} booking{data.total === 1 ? '' : 's'} · page {data.page} of{' '}
                {Math.max(1, data.pageCount)}
              </span>
              <div className="flex gap-2">
                <AdminButton
                  size="sm"
                  variant="secondary"
                  disabled={data.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                >
                  Previous
                </AdminButton>
                <AdminButton
                  size="sm"
                  variant="secondary"
                  disabled={data.page >= data.pageCount}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                >
                  Next
                </AdminButton>
              </div>
            </div>
          )}
        </div>
      )}

      <BookingDrawer booking={selected} onClose={() => setSelected(null)} onUpdated={(b) => setSelected(b)} />
      {creating && <NewBookingDrawer onClose={() => setCreating(false)} />}
    </div>
  );
}
