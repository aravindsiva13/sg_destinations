import { useState, useRef } from 'react';
import MediaPickerModal from './MediaPickerModal';
import { uploadFiles } from '../../lib/queries';
import { notifyError, notifySuccess } from '../../lib/notify';

interface GalleryPickerProps {
  value?: string[] | string;
  onChange: (value: string[] | string) => void;
  label?: string;
  folder?: string;
  isStringFormat?: boolean;
}

export default function GalleryPicker({
  value,
  onChange,
  label = 'Gallery images',
  folder = 'stays',
  isStringFormat,
}: GalleryPickerProps) {
  const isString = isStringFormat !== undefined ? isStringFormat : typeof value === 'string';
  const images: string[] = Array.isArray(value)
    ? value
    : (value ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateImages(next: string[]) {
    if (isString) {
      onChange(next.join('\n'));
    } else {
      onChange(next);
    }
  }

  function handleRemove(index: number) {
    const next = [...images];
    next.splice(index, 1);
    updateImages(next);
  }

  function handleMove(index: number, direction: 'left' | 'right') {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const next = [...images];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    updateImages(next);
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      notifyError('Please select valid image files.');
      return;
    }
    setUploading(true);
    try {
      const uploadedUrls = await uploadFiles(files, folder);
      updateImages([...images, ...uploadedUrls]);
      notifySuccess(`Added ${uploadedUrls.length} image(s) to gallery`);
    } catch (err: unknown) {
      notifyError((err as Error).message || 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-ink/80">
          {label} {images.length > 0 && <span className="text-muted">({images.length})</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-[11px] text-terracotta hover:underline cursor-pointer"
          >
            + Add from library
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Gallery Grid */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`p-3 rounded-xl border border-line bg-paper/60 transition-colors ${
          isDragOver ? 'border-forest bg-forest/5' : ''
        }`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-2xs"
            >
              <div className="aspect-square w-full overflow-hidden bg-cream/40 relative">
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/brand/logo-dark.png';
                  }}
                />
                <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2">
                  <div className="flex gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'left')}
                        className="p-1 rounded bg-paper/90 text-ink hover:bg-paper"
                        title="Move left"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'right')}
                        className="p-1 rounded bg-paper/90 text-ink hover:bg-paper"
                        title="Move right"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-1 rounded bg-rose-600 text-cream hover:bg-rose-700"
                    title="Remove"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-1.5 bg-paper">
                <p className="text-[10px] text-muted truncate font-mono">{src.split('/').pop()}</p>
              </div>
            </div>
          ))}

          {/* Add more button tile */}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-square flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-line hover:border-forest/60 hover:bg-cream/40 transition-all text-muted hover:text-forest cursor-pointer ${
              uploading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-medium text-forest">Compressing…</span>
              </div>
            ) : (
              <>
                <svg className="w-6 h-6 mb-1 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-medium text-ink">Add photos</span>
                <span className="text-[10px] text-muted mt-0.5">Auto-compresses WebP</span>
              </>
            )}
          </button>
        </div>
      </div>

      <MediaPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(url) => updateImages([...images, url])}
        title="Add to Gallery"
      />
    </div>
  );
}
