/**
 * Client-side browser image compression engine.
 * Automatically resizes high-resolution raw camera images (e.g. 10MB+) down to web-optimized WebP
 * while preserving high visual sharpness and fidelity.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.82)
  outputType?: 'image/webp' | 'image/jpeg';
}

export interface CompressResult {
  file: File;
  dataUrl: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1440,
    quality = 0.82,
    outputType = 'image/webp',
  } = options;

  const originalSize = file.size;

  // Don't recompress SVG or tiny icons/images under 80KB
  if (file.type === 'image/svg+xml' || (originalSize < 80 * 1024 && file.type === 'image/webp')) {
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      name: file.name,
      originalSize,
      compressedSize: originalSize,
      savingsPercent: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data.'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down proportionally if either dimension exceeds the threshold
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Canvas 2D context not available.');
          }

          // High quality bicubic-style image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP format
          let dataUrl = canvas.toDataURL(outputType, quality);

          // Fallback to JPEG if browser doesn't export webp data URLs
          if (!dataUrl.startsWith(`data:${outputType}`)) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // If blob creation fails, fallback to original
                resolve({
                  file,
                  dataUrl,
                  name: file.name,
                  originalSize,
                  compressedSize: originalSize,
                  savingsPercent: 0,
                });
                return;
              }

              const ext = outputType === 'image/webp' ? '.webp' : '.jpg';
              const cleanName = file.name.replace(/\.[^/.]+$/, '') + ext;
              const compressedFile = new File([blob], cleanName, { type: blob.type });
              const compressedSize = blob.size;
              const savings = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

              resolve({
                file: compressedFile,
                dataUrl,
                name: cleanName,
                originalSize,
                compressedSize,
                savingsPercent: savings,
              });
            },
            outputType,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
