import { useState, useRef } from 'react';
import AdminButton from './AdminButton';
import MediaPickerModal from './MediaPickerModal';
import { uploadFile } from '../../lib/queries';
import { notifyError, notifySuccess } from '../../lib/notify';

interface ImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  error?: string;
  folder?: string;
  placeholder?: string;
}

export default function ImagePicker({
  value,
  onChange,
  label = 'Image',
  error,
  folder = 'stays',
}: ImagePickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      notifyError('Please select an image file (JPG, PNG, WebP, etc.).');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file, folder);
      onChange(url);
      notifySuccess('Image uploaded successfully');
    } catch (err: unknown) {
      notifyError((err as Error).message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-ink/80">{label}</label>
          {!value && (
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-terracotta hover:underline cursor-pointer"
            >
              {showUrlInput ? 'Use file picker' : 'Or paste URL'}
            </button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Case 1: Image is selected / has value */}
      {value ? (
        <div className="relative flex items-center gap-3 p-2.5 rounded-xl border border-line bg-paper shadow-2xs group">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-cream/50 border border-line/60">
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/brand/logo-dark.png';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <p className="text-xs font-medium text-ink truncate">{value.split('/').pop() || 'Selected image'}</p>
            <p className="text-[11px] text-muted truncate mt-0.5">{value}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-2.5 py-1 text-xs font-medium text-forest bg-forest/10 hover:bg-forest/20 rounded-lg transition-colors"
            >
              {uploading ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-2 py-1 text-xs font-medium text-muted hover:text-ink hover:bg-cream rounded-lg transition-colors"
              title="Pick from Library"
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              title="Remove image"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ) : showUrlInput ? (
        /* Case 2: Manual URL input mode */
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://… or /images/…"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-line bg-paper text-ink outline-none focus:border-forest"
          />
          <AdminButton
            type="button"
            size="sm"
            onClick={() => {
              if (manualUrl.trim()) {
                onChange(manualUrl.trim());
                setManualUrl('');
                setShowUrlInput(false);
              }
            }}
          >
            Apply
          </AdminButton>
        </div>
      ) : (
        /* Case 3: Empty State — Dropzone & Picker */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer bg-paper ${
            isDragOver
              ? 'border-forest bg-forest/5 scale-[0.99]'
              : 'border-line hover:border-forest/50 hover:bg-cream/20'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-forest">Compressing &amp; uploading…</span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-forest/10 text-forest rounded-full mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-xs font-medium text-ink">
                Click to browse or drag &amp; drop your image
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                Auto-compressed to web format (preserves quality)
              </p>

              <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium text-cream bg-forest hover:bg-forest-deep rounded-lg transition-colors shadow-2xs"
                >
                  Choose file
                </button>
                <span className="text-[11px] text-muted">or</span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-ink bg-cream/70 hover:bg-cream rounded-lg transition-colors border border-line"
                >
                  From library
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}

      {/* Media Library Modal */}
      <MediaPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(url) => onChange(url)}
        title="Select Image"
      />
    </div>
  );
}
