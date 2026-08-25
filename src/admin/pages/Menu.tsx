import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import AdminIcon from '../components/AdminIcon';
import Drawer from '../components/ui/Drawer';
import { Field, inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import {
  useMenu,
  useCreateMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
} from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { useAdminAuth } from '../auth/AdminAuthContext';
import type { MenuCategory, MenuItem } from '../types';

const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function vegDot(veg?: boolean | null) {
  if (veg == null) return null;
  const cls = veg ? 'border-green-600' : 'border-rose-600';
  const dot = veg ? 'bg-green-600' : 'bg-rose-600';
  return (
    <span className={`grid h-3.5 w-3.5 place-items-center rounded-[3px] border ${cls}`} title={veg ? 'Veg' : 'Non-veg'}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
    </span>
  );
}

/* ------------------------------ Category form ------------------------------ */
function CategoryForm({ item, onClose }: { item: MenuCategory | null; onClose: () => void }) {
  const isEdit = Boolean(item);
  const createMut = useCreateMenuCategory();
  const updateMut = useUpdateMenuCategory();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    name: item?.name ?? '',
    note: item?.note ?? '',
    sortOrder: item?.sortOrder ?? 0,
    published: item?.published ?? true,
  });

  async function submit() {
    setError(null);
    if (!f.name.trim()) return setError('Category name is required.');
    const input = { name: f.name.trim(), note: f.note.trim() || null, sortOrder: Number(f.sortOrder) || 0, published: f.published };
    try {
      if (isEdit && item) await updateMut.mutateAsync({ id: item.id, input });
      else await createMut.mutateAsync(input);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save'));
    }
  }

  return (
    <Drawer open onClose={onClose} title={isEdit ? 'Edit category' : 'New category'}>
      <div className="space-y-5">
        <Field label="Name">
          <input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Dosai Varieties" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Note (optional)">
            <input value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} className={inputCls} placeholder="Per Kg" />
          </Field>
          <Field label="Sort order">
            <input type="number" value={f.sortOrder} onChange={(e) => setF((p) => ({ ...p, sortOrder: Number(e.target.value) }))} className={inputCls} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={f.published} onChange={(e) => setF((p) => ({ ...p, published: e.target.checked }))} className="h-4 w-4 accent-forest" />
          Published (visible on the website)
        </label>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={submit} loading={createMut.isPending || updateMut.isPending}>
            {isEdit ? 'Save changes' : 'Create category'}
          </AdminButton>
        </div>
      </div>
    </Drawer>
  );
}

/* -------------------------------- Item form -------------------------------- */
function ItemForm({
  categories,
  categoryId,
  item,
  onClose,
}: {
  categories: MenuCategory[];
  categoryId: string;
  item: MenuItem | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(item);
  const createMut = useCreateMenuItem();
  const updateMut = useUpdateMenuItem();
  const [error, setError] = useState<string | null>(null);
  const vegToStr = (v?: boolean | null) => (v == null ? '' : v ? 'veg' : 'nonveg');
  const [f, setF] = useState({
    categoryId: item?.categoryId ?? categoryId,
    name: item?.name ?? '',
    price: item?.price ?? 0,
    veg: vegToStr(item?.veg),
    available: item?.available ?? true,
  });

  async function submit() {
    setError(null);
    if (!f.name.trim()) return setError('Dish name is required.');
    const input = {
      categoryId: f.categoryId,
      name: f.name.trim(),
      price: Number(f.price) || 0,
      veg: f.veg === '' ? null : f.veg === 'veg',
      available: f.available,
    };
    try {
      if (isEdit && item) await updateMut.mutateAsync({ id: item.id, input });
      else await createMut.mutateAsync(input);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save'));
    }
  }

  return (
    <Drawer open onClose={onClose} title={isEdit ? 'Edit dish' : 'New dish'}>
      <div className="space-y-5">
        <Field label="Category">
          <select value={f.categoryId} onChange={(e) => setF((p) => ({ ...p, categoryId: e.target.value }))} className={inputCls}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Dish name">
          <input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Masala Dosa" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (₹)">
            <input type="number" value={f.price} onChange={(e) => setF((p) => ({ ...p, price: Number(e.target.value) }))} className={inputCls} />
          </Field>
          <Field label="Type">
            <select value={f.veg} onChange={(e) => setF((p) => ({ ...p, veg: e.target.value }))} className={inputCls}>
              <option value="">Unspecified</option>
              <option value="veg">Veg</option>
              <option value="nonveg">Non-veg</option>
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={f.available} onChange={(e) => setF((p) => ({ ...p, available: e.target.checked }))} className="h-4 w-4 accent-forest" />
          Available (shown on the website)
        </label>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton>
          <AdminButton onClick={submit} loading={createMut.isPending || updateMut.isPending}>
            {isEdit ? 'Save changes' : 'Add dish'}
          </AdminButton>
        </div>
      </div>
    </Drawer>
  );
}

/* --------------------------------- Page ---------------------------------- */
export default function Menu() {
  const { hasRole } = useAdminAuth();
  const { data, isLoading, isError, refetch } = useMenu();
  const deleteCategory = useDeleteMenuCategory();
  const deleteItem = useDeleteMenuItem();
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [itemDrawer, setItemDrawer] = useState<{ categoryId: string; item: MenuItem | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canWrite = hasRole('SUPER_ADMIN', 'MANAGER');
  const totalDishes = (data ?? []).reduce((n, c) => n + c.items.length, 0);

  async function removeCategory(c: MenuCategory) {
    if (!window.confirm(`Delete category “${c.name}” and its ${c.items.length} dishes?`)) return;
    setError(null);
    try {
      await deleteCategory.mutateAsync(c.id);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete category'));
    }
  }
  async function removeItem(it: MenuItem) {
    if (!window.confirm(`Delete “${it.name}”?`)) return;
    setError(null);
    try {
      await deleteItem.mutateAsync(it.id);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete dish'));
    }
  }

  return (
    <div>
      <PageHeader
        title="Menu"
        subtitle={data ? `${data.length} categories · ${totalDishes} dishes` : 'Food served on premise.'}
        actions={
          canWrite && (
            <AdminButton onClick={() => setCreatingCategory(true)}>
              <AdminIcon name="plus" className="h-4 w-4" />
              New category
            </AdminButton>
          )
        }
      />

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {isLoading ? (
        <LoadingState label="Loading menu…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No menu yet"
          description="Create your first category, then add dishes to it."
          action={canWrite && <AdminButton onClick={() => setCreatingCategory(true)}>New category</AdminButton>}
        />
      ) : (
        <div className="space-y-6">
          {data.map((cat) => (
            <section key={cat.id} className="overflow-hidden rounded-xl border border-line bg-paper">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cream/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg text-ink">{cat.name}</h3>
                  {cat.note && <Badge tone="slate">{cat.note}</Badge>}
                  {!cat.published && <Badge tone="amber">Hidden</Badge>}
                  <span className="text-xs text-muted">{cat.items.length} dishes</span>
                </div>
                {canWrite && (
                  <div className="flex gap-2">
                    <AdminButton size="sm" variant="secondary" onClick={() => setItemDrawer({ categoryId: cat.id, item: null })}>
                      <AdminIcon name="plus" className="h-3.5 w-3.5" /> Add dish
                    </AdminButton>
                    <AdminButton size="sm" variant="ghost" onClick={() => setEditingCategory(cat)}>Edit</AdminButton>
                    <AdminButton size="sm" variant="ghost" className="text-rose-600" onClick={() => removeCategory(cat)}>Delete</AdminButton>
                  </div>
                )}
              </header>

              {cat.items.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted">No dishes yet.</p>
              ) : (
                <ul className="divide-y divide-line/70">
                  {cat.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 px-4 py-2.5">
                      {vegDot(it.veg)}
                      <span className={`flex-1 text-sm ${it.available ? 'text-ink' : 'text-muted line-through'}`}>{it.name}</span>
                      {!it.available && <Badge tone="slate">Hidden</Badge>}
                      <span className="w-20 text-right text-sm font-medium text-ink">{rupee(it.price)}</span>
                      {canWrite && (
                        <div className="flex gap-1">
                          <AdminButton size="sm" variant="ghost" onClick={() => setItemDrawer({ categoryId: cat.id, item: it })}>Edit</AdminButton>
                          <AdminButton size="sm" variant="ghost" className="text-rose-600" onClick={() => removeItem(it)}>Delete</AdminButton>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {(creatingCategory || editingCategory) && (
        <CategoryForm
          item={editingCategory}
          onClose={() => {
            setCreatingCategory(false);
            setEditingCategory(null);
          }}
        />
      )}
      {itemDrawer && data && (
        <ItemForm
          categories={data}
          categoryId={itemDrawer.categoryId}
          item={itemDrawer.item}
          onClose={() => setItemDrawer(null)}
        />
      )}
    </div>
  );
}
