import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { useCreateUser, useUpdateUser, useUsers } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { notifyError } from '../lib/notify';
import { ROLE_LABELS, formatDate } from '../constants';
import { useAdminAuth } from '../auth/AdminAuthContext';
import type { Role, UserDetail } from '../types';

const ROLE_TONE: Record<Role, 'red' | 'green' | 'blue' | 'slate'> = {
  SUPER_ADMIN: 'red',
  MANAGER: 'green',
  FRONT_DESK: 'blue',
  CUSTOMER: 'slate',
};
const FILTERS: { value: Role | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'SUPER_ADMIN', label: 'Super Admins' },
  { value: 'MANAGER', label: 'Managers' },
  { value: 'FRONT_DESK', label: 'Front Desk' },
  { value: 'CUSTOMER', label: 'Customers' },
];
const STAFF_ROLES: Role[] = ['SUPER_ADMIN', 'MANAGER', 'FRONT_DESK'];

export default function Users() {
  const { hasRole } = useAdminAuth();
  const isSuper = hasRole('SUPER_ADMIN');
  const [filter, setFilter] = useState<Role | ''>('');
  const { data, isLoading, isError, refetch } = useUsers(filter);
  const createMut = useCreateUser();
  const updateMut = useUpdateUser();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'FRONT_DESK' as Role, phone: '' });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    setError(null);
    if (!f.name || !f.email || f.password.length < 6) {
      setError('Name, email and a 6+ character password are required.');
      return;
    }
    try {
      await createMut.mutateAsync({ ...f, phone: f.phone || undefined });
      setShowForm(false);
      setF({ name: '', email: '', password: '', role: 'FRONT_DESK', phone: '' });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create user'));
    }
  }

  return (
    <div>
      <PageHeader
        title="Users & Staff"
        subtitle="Team members, roles and customers."
        actions={
          isSuper && (
            <AdminButton variant={showForm ? 'ghost' : 'primary'} onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancel' : 'New staff'}
            </AdminButton>
          )
        }
      />

      {showForm && isSuper && (
        <div className="mb-6 grid gap-3 rounded-xl border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name">
            <input value={f.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Email">
            <input value={f.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={f.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Role">
            <select value={f.role} onChange={(e) => set('role', e.target.value as Role)} className={inputCls}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Temp password (6+ chars)">
            <input type="text" value={f.password} onChange={(e) => set('password', e.target.value)} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <AdminButton onClick={submit} loading={createMut.isPending} className="w-full">
              Create staff
            </AdminButton>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 lg:col-span-3">{error}</p>}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((ff) => (
          <button
            key={ff.value || 'all'}
            onClick={() => setFilter(ff.value)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              filter === ff.value ? 'bg-forest text-cream' : 'bg-paper text-ink ring-1 ring-line hover:bg-cream'
            }`}
          >
            {ff.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading users…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-cream/60 text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                  {isSuper && <th className="px-4 py-3">Manage</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((u: UserDetail) => (
                  <tr key={u.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {u.active ? <span className="text-emerald-700">Active</span> : <span className="text-rose-600">Inactive</span>}
                    </td>
                    {isSuper && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              updateMut.mutate(
                                { id: u.id, input: { role: e.target.value as Role } },
                                { onError: (err) => notifyError(apiErrorMessage(err, 'Could not update role')) },
                              )
                            }
                            className="rounded-lg border border-line bg-cream px-2 py-1 text-xs outline-none focus:border-forest"
                          >
                            {(['SUPER_ADMIN', 'MANAGER', 'FRONT_DESK', 'CUSTOMER'] as Role[]).map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() =>
                              updateMut.mutate(
                                { id: u.id, input: { active: !u.active } },
                                { onError: (err) => notifyError(apiErrorMessage(err, 'Could not update user')) },
                              )
                            }
                            className="text-xs text-terracotta hover:underline"
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
