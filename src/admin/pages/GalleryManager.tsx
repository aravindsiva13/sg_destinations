import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import AdminButton from '../components/ui/AdminButton';
import AdminIcon from '../components/AdminIcon';
import Badge from '../components/ui/Badge';
import { Field, inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import GalleryPicker from '../components/ui/GalleryPicker';
import {
  useAdminGallery,
  useCreateGalleryCategory,
  useUpdateGalleryCategory,
  useDeleteGalleryCategory,
  useSyncGalleryImages,
} from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { notifySuccess, notifyError } from '../lib/notify';
import { useAdminAuth } from '../auth/AdminAuthContext';
import type { GalleryCategory } from '../types';

export default function GalleryManager() {
  const { hasRole } = useAdminAuth();
  const canWrite = hasRole('SUPER_ADMIN', 'MANAGER');

  const { data: categories, isLoading, isError, refetch } = useAdminGallery();
  const createCategoryMut = useCreateGalleryCategory();
  const updateCategoryMut = useUpdateGalleryCategory();
  const deleteCategoryMut = useDeleteGalleryCategory();
  const syncImagesMut = useSyncGalleryImages();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Category modal states
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    published: true,
  });

  // Auto-select first category when data loads
  useEffect(() => {
    if (categories && categories.length > 0) {
      if (!selectedId || !categories.some((c) => c.id === selectedId)) {
        setSelectedId(categories[0].id);
      }
    }
  }, [categories, selectedId]);

  // Sync image picker state when active category changes
  const activeCategory = categories?.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    if (activeCategory) {
      const urls = activeCategory.images.map((img) => img.url);
      setCurrentImages(urls);
      setHasUnsavedChanges(false);
    } else {
      setCurrentImages([]);
      setHasUnsavedChanges(false);
    }
  }, [activeCategory]);

  function handleImagesChange(next: string[] | string) {
    const list = Array.isArray(next)
      ? next
      : next
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
    setCurrentImages(list);
    setHasUnsavedChanges(true);
  }

  async function handleSaveImages() {
    if (!activeCategory) return;
    try {
      await syncImagesMut.mutateAsync({
        categoryId: activeCategory.id,
        images: currentImages,
      });
      setHasUnsavedChanges(false);
      notifySuccess(`Saved ${currentImages.length} images for "${activeCategory.name}"`);
    } catch (err) {
      notifyError(apiErrorMessage(err, 'Failed to save images'));
    }
  }

  function openCreateModal() {
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      published: true,
    });
    setModalMode('create');
  }

  function openEditModal(cat: GalleryCategory) {
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      published: cat.published,
    });
    setModalMode('edit');
  }

  async function handleSaveCategory() {
    if (!categoryForm.name.trim()) {
      notifyError('Category name is required.');
      return;
    }

    try {
      if (modalMode === 'create') {
        const nextOrder = (categories?.length ?? 0) > 0 ? Math.max(...categories!.map((c) => c.sortOrder)) + 1 : 0;
        const created = await createCategoryMut.mutateAsync({
          name: categoryForm.name.trim(),
          slug: categoryForm.slug.trim() || undefined,
          description: categoryForm.description.trim() || undefined,
          published: categoryForm.published,
          sortOrder: nextOrder,
        });
        notifySuccess(`Category "${created.name}" created`);
        setSelectedId(created.id);
      } else if (modalMode === 'edit' && activeCategory) {
        await updateCategoryMut.mutateAsync({
          id: activeCategory.id,
          name: categoryForm.name.trim(),
          slug: categoryForm.slug.trim() || undefined,
          description: categoryForm.description.trim() || undefined,
          published: categoryForm.published,
        });
        notifySuccess(`Category "${categoryForm.name}" updated`);
      }
      setModalMode(null);
    } catch (err) {
      notifyError(apiErrorMessage(err, 'Could not save category'));
    }
  }

  async function handleDeleteCategory(cat: GalleryCategory) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${cat.name}" and all its ${cat.images.length} photos? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteCategoryMut.mutateAsync(cat.id);
      notifySuccess(`Category "${cat.name}" deleted`);
      const remaining = categories?.filter((c) => c.id !== cat.id);
      if (remaining && remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      notifyError(apiErrorMessage(err, 'Failed to delete category'));
    }
  }

  if (isLoading) return <LoadingState label="Loading gallery..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gallery Management"
        subtitle="Manage public gallery categories, upload photos with auto-compression, and drag cards to reorder."
        actions={
          canWrite && (
            <AdminButton onClick={openCreateModal}>
              <AdminIcon name="plus" className="h-4 w-4" />
              New Category
            </AdminButton>
          )
        }
      />

      {/* Category Tabs */}
      {!categories || categories.length === 0 ? (
        <EmptyState
          title="No gallery categories yet"
          description="Create your first gallery category to start adding photos."
          action={
            canWrite && (
              <AdminButton onClick={openCreateModal}>
                <AdminIcon name="plus" className="h-4 w-4" />
                New Category
              </AdminButton>
            )
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar: Categories List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Categories</span>
              <span className="text-xs text-muted">{categories.length} total</span>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-line bg-paper p-2">
              {categories.map((cat) => {
                const isSelected = cat.id === selectedId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (!window.confirm('You have unsaved image changes. Switch category anyway?')) return;
                      }
                      setSelectedId(cat.id);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all ${
                      isSelected
                        ? 'bg-forest text-cream font-medium shadow-2xs'
                        : 'text-ink hover:bg-cream-2/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-sm">{cat.name}</p>
                      <p className={`text-2xs truncate ${isSelected ? 'text-cream/75' : 'text-muted'}`}>
                        /{cat.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!cat.published && (
                        <span className={`text-2xs rounded px-1.5 py-0.5 ${isSelected ? 'bg-cream/20 text-cream' : 'bg-line text-muted'}`}>
                          Draft
                        </span>
                      )}
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 ${
                          isSelected ? 'bg-cream/20 text-cream' : 'bg-line text-ink'
                        }`}
                      >
                        {cat.images.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Area: Active Category Detail & Images */}
          {activeCategory ? (
            <div className="space-y-6">
              {/* Category Info Header Banner */}
              <div className="rounded-2xl border border-line bg-paper p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="font-serif text-2xl font-normal text-ink">{activeCategory.name}</h2>
                      {activeCategory.published ? (
                        <Badge tone="green">Live on website</Badge>
                      ) : (
                        <Badge tone="slate">Hidden / Draft</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Filter slug: <span className="font-mono text-ink">#{activeCategory.slug}</span>
                    </p>
                    {activeCategory.description && (
                      <p className="mt-2 text-sm text-ink/80 italic">{activeCategory.description}</p>
                    )}
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-2 shrink-0">
                      <AdminButton
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditModal(activeCategory)}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Edit Info
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDeleteCategory(activeCategory)}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </AdminButton>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Photo Organizer with Drag & Drop */}
              <div className="rounded-2xl border border-line bg-paper p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-line">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-ink">Photos in this Category</h3>
                    <p className="text-xs text-muted mt-0.5">
                      Drag photos to reorder, use arrows, or upload new DSLR photos (auto-compressed to WebP).
                    </p>
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-3">
                      {hasUnsavedChanges && (
                        <span className="text-xs font-medium text-amber-600 animate-pulse">
                          ● Unsaved image order
                        </span>
                      )}
                      <AdminButton
                        size="sm"
                        onClick={handleSaveImages}
                        loading={syncImagesMut.isPending}
                        disabled={!hasUnsavedChanges && !syncImagesMut.isPending}
                      >
                        Save Photo Order
                      </AdminButton>
                    </div>
                  )}
                </div>

                <GalleryPicker
                  label=""
                  folder={`gallery/${activeCategory.slug}`}
                  value={currentImages}
                  onChange={handleImagesChange}
                />

                {canWrite && hasUnsavedChanges && (
                  <div className="mt-6 flex justify-end">
                    <AdminButton
                      onClick={handleSaveImages}
                      loading={syncImagesMut.isPending}
                    >
                      Save Photo Order ({currentImages.length} photos)
                    </AdminButton>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line">
              <p className="text-sm text-muted">Select a category on the left to manage its photos.</p>
            </div>
          )}
        </div>
      )}

      {/* Category Modal: Create or Edit */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-paper p-6 shadow-2xl">
            <h3 className="font-serif text-xl text-ink">
              {modalMode === 'create' ? 'Create Gallery Category' : 'Edit Category Info'}
            </h3>
            <p className="mt-1 text-xs text-muted">
              Categories appear as filter buttons on the public Gallery page.
            </p>

            <div className="mt-5 space-y-4">
              <Field label="Category Name *" hint="e.g. A Taste of Italy, Pool & Garden, Sunset Views">
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Lawn Weddings"
                  className={inputCls}
                  autoFocus
                />
              </Field>

              <Field label="URL / Filter Slug" hint="Leave empty to auto-generate from name">
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="e.g. lawn-weddings"
                  className={inputCls}
                />
              </Field>

              <Field label="Subtitle / Description" hint="Displayed below category filters on public page">
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Unforgettable moments celebrated in our versatile lawn venues."
                  className={inputCls}
                />
              </Field>

              <label className="flex items-center gap-2.5 pt-1 text-sm text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={categoryForm.published}
                  onChange={(e) => setCategoryForm({ ...categoryForm, published: e.target.checked })}
                  className="rounded border-line text-forest focus:ring-forest"
                />
                <span>Published (visible to visitors on the website)</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
              <AdminButton
                variant="ghost"
                onClick={() => setModalMode(null)}
                disabled={createCategoryMut.isPending || updateCategoryMut.isPending}
              >
                Cancel
              </AdminButton>
              <AdminButton
                onClick={handleSaveCategory}
                loading={createCategoryMut.isPending || updateCategoryMut.isPending}
              >
                {modalMode === 'create' ? 'Create Category' : 'Save Changes'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
