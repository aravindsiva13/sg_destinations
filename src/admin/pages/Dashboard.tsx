import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import { ErrorState, LoadingState } from '../components/ui/DataState';
import { useDashboardStats } from '../lib/queries';
import { BOOKING_STATUS_META, inr } from '../constants';
import AdminIcon, { type AdminIconName } from '../components/AdminIcon';
import type { BookingStatus } from '../types';

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: '#d8a657',
  RESERVED: '#3b82a0',
  CONFIRMED: '#33502f',
  CHECKED_IN: '#3b82a0',
  CHECKED_OUT: '#9a958a',
  CANCELLED: '#b4544a',
};

interface Kpi {
  label: string;
  value: string;
  icon: AdminIconName;
  hint?: string;
}

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useDashboardStats();

  if (isLoading) return <LoadingState label="Loading dashboard…" />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const { kpis, revenueByMonth, bookingsByStatus } = data;

  const cards: Kpi[] = [
    { label: 'Revenue (paid)', value: inr(kpis.revenue), icon: 'dashboard' },
    { label: 'Occupancy', value: `${kpis.occupancy}%`, icon: 'stays', hint: 'Rooms occupied today' },
    { label: 'Bookings today', value: String(kpis.bookingsToday), icon: 'bookings' },
    { label: 'Check-ins today', value: String(kpis.checkInsToday), icon: 'guests' },
    { label: 'Check-outs today', value: String(kpis.checkOutsToday), icon: 'calendar' },
    { label: 'New enquiries', value: String(kpis.newEnquiries), icon: 'enquiries' },
  ];

  const pieData = bookingsByStatus.map((b) => ({
    name: BOOKING_STATUS_META[b.status]?.label ?? b.status,
    value: b.count,
    status: b.status,
  }));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Today at Shraddha Garden Resort." />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-line bg-paper p-4">
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-forest/10 text-forest">
              <AdminIcon name={c.icon} className="h-5 w-5" />
            </div>
            <p className="font-serif text-2xl text-ink">{c.value}</p>
            <p className="mt-0.5 text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-paper p-5 lg:col-span-2">
          <h2 className="mb-4 font-serif text-lg text-ink">Revenue — last 6 months</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3dcce" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#7a766c" />
                <YAxis
                  tickFormatter={(v) => `₹${(v as number) / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#7a766c"
                  width={48}
                />
                <Tooltip
                  formatter={(v) => [inr(v as number), 'Revenue']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e3dcce',
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="revenue" fill="#33502f" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-4 font-serif text-lg text-ink">Bookings by status</h2>
          {pieData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No bookings yet.</p>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                      {pieData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status as BookingStatus]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e3dcce', fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5">
                {pieData.map((entry) => (
                  <li key={entry.status} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: STATUS_COLORS[entry.status as BookingStatus] }}
                      />
                      {entry.name}
                    </span>
                    <span className="font-medium text-ink">{entry.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
