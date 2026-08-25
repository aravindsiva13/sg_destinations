import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../components/PageHeader';
import AdminButton from '../components/ui/AdminButton';
import AdminIcon from '../components/AdminIcon';
import { ErrorState, LoadingState } from '../components/ui/DataState';
import { useReport } from '../lib/queries';
import { downloadCsv } from '../lib/csv';
import { inr } from '../constants';

const plus = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export default function Reports() {
  const [range, setRange] = useState({ from: plus(-90), to: plus(0) });
  const { data, isLoading, isError, refetch } = useReport(range.from, range.to);

  function exportCsv() {
    if (!data) return;
    downloadCsv(
      `report-${range.from}_to_${range.to}.csv`,
      ['Section', 'Label', 'Value'],
      [
        ['Totals', 'Revenue', data.totals.revenue],
        ['Totals', 'Bookings', data.totals.bookings],
        ['Totals', 'Nights', data.totals.nights],
        ['Totals', 'Cancelled', data.totals.cancelled],
        ['Totals', 'Avg booking value', data.totals.avgBookingValue],
        ['Totals', 'Occupancy %', data.totals.occupancy],
        ...data.revenueBySource.map((r) => ['Revenue by source', r.label, r.value] as (string | number)[]),
        ...data.revenueByStay.map((r) => ['Revenue by stay', r.label, r.value] as (string | number)[]),
        ...data.bookingsByStatus.map((r) => ['Bookings by status', r.label, r.value] as (string | number)[]),
      ],
    );
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Revenue, occupancy and source breakdowns."
        actions={
          <AdminButton variant="secondary" onClick={exportCsv} disabled={!data}>
            <AdminIcon name="download" className="h-4 w-4" />
            Export CSV
          </AdminButton>
        }
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          From
          <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-forest" />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          To
          <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-forest" />
        </label>
      </div>

      {isLoading ? (
        <LoadingState label="Crunching numbers…" />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Revenue', value: inr(data.totals.revenue) },
              { label: 'Bookings', value: String(data.totals.bookings) },
              { label: 'Room nights', value: String(data.totals.nights) },
              { label: 'Avg value', value: inr(data.totals.avgBookingValue) },
              { label: 'Occupancy', value: `${data.totals.occupancy}%` },
              { label: 'Cancelled', value: String(data.totals.cancelled) },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-line bg-paper p-4">
                <p className="font-serif text-xl text-ink">{k.value}</p>
                <p className="mt-0.5 text-xs text-muted">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue by stay" data={data.revenueByStay} money />
            <ChartCard title="Revenue by source" data={data.revenueBySource} money />
          </div>

          <div className="rounded-xl border border-line bg-paper p-5">
            <h2 className="mb-3 font-serif text-lg text-ink">Bookings by status</h2>
            <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {data.bookingsByStatus.map((s) => (
                <li key={s.label} className="rounded-lg bg-cream/60 px-3 py-2 text-sm">
                  <span className="block font-serif text-lg text-ink">{s.value}</span>
                  <span className="text-xs text-muted">{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, data, money }: { title: string; data: { label: string; value: number }[]; money?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5">
      <h2 className="mb-4 font-serif text-lg text-ink">{title}</h2>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No data in this range.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3dcce" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => (money ? `₹${(v as number) / 1000}k` : String(v))} fontSize={12} stroke="#7a766c" />
              <YAxis type="category" dataKey="label" width={110} fontSize={12} stroke="#7a766c" />
              <Tooltip formatter={(v) => [money ? inr(v as number) : v, '']} contentStyle={{ borderRadius: 12, border: '1px solid #e3dcce', fontSize: 13 }} />
              <Bar dataKey="value" fill="#33502f" radius={[0, 6, 6, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
