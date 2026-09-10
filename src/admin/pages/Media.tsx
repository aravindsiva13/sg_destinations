import { useState, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { useAddMedia, useDeleteMedia, useMedia, uploadFiles } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { notifyError, notifySuccess } from '../lib/notify';

export default function Media() {
  const { data, isLoading, isError, refetch } = useMedia();
  const addMut = useAddMedia();
  const deleteMut = useDeleteMedia();
  const [f, setF] = useState({ url: '', alt: '', folder: 'general' });
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function addUrl() {
    setError(null);
    if (!f.url.trim()) {
      setError('Paste an image URL.');
      return;
    }
    try {
      await addMut.mutateAsync({ url: f.url.trim(), alt: f.alt || undefined, folder: f.folder || undefined });
      setF({ url: '', alt: '', folder: 'general' });
      setShowUrlForm(false);
      notifySuccess('Media added to library');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add media'));
    }
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      notifyError('Please select valid image files.');
      return;
    }
    setUploading(true);
    try {
      const urls = await uploadFiles(files, f.folder || 'general');
      await refetch();
      notifySuccess(`Successfully uploaded ${urls.length} image(s)`);
    } catch (err: unknown) {
      notifyError((err as Error).message || 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const folders = Array.from(new Set((data ?? []).map((m) => m.folder).filter(Boolean))) as string[];

  const filteredMedia = (data ?? []).filter((m) => {
    if (selectedFolder !== 'all' && m.folder !== selectedFolder) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Media Library"
        subtitle="Upload and manage images used across Stays, Events, Dining and Banners."
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Upload Zone Card */}
      <div className="mb-8 rounded-2xl border border-line bg-paper p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-line">
          <div>
            <h3 className="font-serif text-base font-medium text-ink">Upload New Images</h3>
            <p className="text-xs text-muted">Select single or multiple photos directly from your device.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span>Target folder:</span>
              <input
                type="text"
                value={f.folder}
                onChange={(e) => setF({ ...f, folder: e.target.value })}
                placeholder="folder name (e.g. stays)"
                className="px-2.5 py-1 text-xs rounded-lg border border-line bg-cream/40 text-ink outline-none focus:border-forest"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowUrlForm(!showUrlForm)}
              className="text-xs text-terracotta hover:underline ml-auto"
            >
              {showUrlForm ? 'Hide URL input' : 'Add by URL'}
            </button>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
            isDragOver
              ? 'border-forest bg-forest/5 scale-[0.99]'
              : 'border-line hover:border-forest/50 hover:bg-cream/20'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-forest border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-forest">Uploading and processing images…</span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-forest/10 text-forest rounded-full mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-ink">
                Click to browse files or drag &amp; drop photos here
              </p>
              <p className="text-xs text-muted mt-1">
                Supports multiple JPG, PNG, WebP or SVG files (up to 25MB each)
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 text-xs font-medium text-cream bg-forest hover:bg-forest-deep rounded-full transition-colors shadow-2xs"
              >
                Choose files from computer
              </button>
            </>
          )}
        </div>

        {/* Manual URL Form (Collapsible) */}
        {showUrlForm && (
          <div className="mt-4 pt-4 border-t border-line grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Image URL">
              <input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} className={inputCls} placeholder="https://…" />
            </Field>
            <Field label="Alt text">
              <input value={f.alt} onChange={(e) => setF({ ...f, alt: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Folder">
              <input value={f.folder} onChange={(e) => setF({ ...f, folder: e.target.value })} className={inputCls} placeholder="stays" />
            </Field>
            <div className="flex items-end">
              <AdminButton onClick={addUrl} loading={addMut.isPending} className="w-full">
                Add to library
              </AdminButton>
            </div>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 lg:col-span-4">{error}</p>}
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Filter by folder:</span>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-line bg-paper text-ink outline-none"
          >
            <option value="all">All ({data?.length ?? 0})</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f} ({(data ?? []).filter((m) => m.folder === f).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Media Gallery Grid */}
      {isLoading ? (
        <LoadingState label="Loading media…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No media yet" description="Upload image files above to build your library." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredMedia.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-xl border border-line bg-paper shadow-2xs">
              <div className="aspect-square w-full overflow-hidden bg-cream/40">
                <img
                  src={m.url}
                  alt={m.alt ?? ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/brand/logo-dark.png';
                  }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-[11px] text-muted">{m.folder ?? '—'}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(m.url);
                      notifySuccess('Copied image path!');
                    }}
                    className="text-xs text-terracotta hover:underline cursor-pointer"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() =>
                      deleteMut.mutate(m.id, {
                        onSuccess: () => notifySuccess('Image removed from library'),
                        onError: (err) => notifyError(apiErrorMessage(err, 'Could not delete media')),
                      })
                    }
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
