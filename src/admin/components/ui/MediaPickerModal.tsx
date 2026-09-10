import { useState, useRef } from 'react';
import AdminButton from './AdminButton';
import { useMedia, uploadFiles } from '../../lib/queries';
import { LoadingState, ErrorState, EmptyState } from './DataState';
import { notifyError, notifySuccess } from '../../lib/notify';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Select an image from Media Library',
}: MediaPickerModalProps) {
  const { data: media, isLoading, isError, refetch } = useMedia();
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const folders = Array.from(new Set((media ?? []).map((m) => m.folder).filter(Boolean))) as string[];

  const filtered = (media ?? []).filter((m) => {
    if (selectedFolder !== 'all' && m.folder !== selectedFolder) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (m.alt?.toLowerCase().includes(q) || m.url.toLowerCase().includes(q));
    }
    return true;
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await uploadFiles(files, selectedFolder !== 'all' ? selectedFolder : 'uploads');
      await refetch();
      notifySuccess(`Uploaded ${urls.length} image(s)`);
      if (urls.length === 1) {
        onSelect(urls[0]);
        onClose();
      }
    } catch (err: unknown) {
      notifyError((err as Error).message || 'Failed to upload image(s)');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-3xl max-h-[85vh] bg-paper rounded-2xl border border-line shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-cream/40">
          <div>
            <h3 className="font-serif text-lg font-medium text-ink">{title}</h3>
            <p className="text-xs text-muted">Click an image to select it or upload a new one directly.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-cream transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-line bg-paper">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search images…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-line bg-cream/30 focus:bg-paper focus:border-forest outline-none transition-all"
            />
            {folders.length > 0 && (
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-line bg-cream/30 text-ink outline-none"
              >
                <option value="all">All folders</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <AdminButton
              size="sm"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload image(s)
            </AdminButton>
          </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {isLoading ? (
            <LoadingState label="Loading images…" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matching images"
              description="Upload an image using the button above to add it to your library."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-paper text-left transition-all hover:border-forest hover:shadow-md focus:ring-2 focus:ring-forest focus:outline-none"
                >
                  <div className="aspect-square w-full overflow-hidden bg-cream/50 relative">
                    <img
                      src={item.url}
                      alt={item.alt || ''}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-forest/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-paper text-forest font-medium text-xs px-2.5 py-1 rounded-full shadow-sm">
                        Select
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-ink truncate">{item.alt || item.url.split('/').pop()}</p>
                    <p className="text-[10px] text-muted truncate">{item.folder || 'general'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-line bg-cream/20">
          <AdminButton variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
