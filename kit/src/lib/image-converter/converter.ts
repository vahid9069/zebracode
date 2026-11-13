import JSZip from 'jszip';
import type {
    ConverterFileItem,
    ConverterTransformOptions,
    ConvertResult,
    TargetImageFormat,
} from './types';

export const DEFAULT_CONVERTER_OPTIONS: ConverterTransformOptions = {
    targetFormat: 'webp',
    quality: 0.85,
    scaleMultiplier: 1,
    maintainAspectRatio: true,
    rotationAngle: 0,
    flipHorizontal: false,
    flipVertical: false,
    grayscale: false,
    backgroundColor: '#ffffff',
    icoSizes: [32, 64],
};

export const SUPPORTED_TARGET_FORMATS: { id: TargetImageFormat; label: string; ext: string; descFa: string; descEn: string }[] = [
    { id: 'webp', label: 'WebP', ext: 'webp', descFa: 'مدرن، سبک و با پشتیبانی از شفافیت', descEn: 'Modern, lightweight with transparency support' },
    { id: 'png', label: 'PNG', ext: 'png', descFa: 'بدون افت کیفیت با حفظ کامل شفافیت', descEn: 'Lossless quality with full alpha transparency' },
    { id: 'jpeg', label: 'JPG / JPEG', ext: 'jpg', descFa: 'سازگار با تمامی دستگاه‌ها و وب', descEn: 'Universal compatibility across all devices' },
    { id: 'avif', label: 'AVIF', ext: 'avif', descFa: 'فوق‌فشرده نسل بعد برای وب مدرن', descEn: 'Next-generation high compression for modern web' },
    { id: 'ico', label: 'ICO (Favicon)', ext: 'ico', descFa: 'فرمت آیکون سایت و ویندوز', descEn: 'Website favicon and Windows icon format' },
    { id: 'bmp', label: 'BMP', ext: 'bmp', descFa: 'بیت‌مپ کلاسیک بدون فشرده‌سازی', descEn: 'Uncompressed classic bitmap format' },
];

export function getFormatMimeType(format: TargetImageFormat): string {
    switch (format) {
        case 'webp':
            return 'image/webp';
        case 'png':
            return 'image/png';
        case 'jpeg':
            return 'image/jpeg';
        case 'avif':
            return 'image/avif';
        case 'ico':
            return 'image/x-icon';
        case 'bmp':
            return 'image/bmp';
        default:
            return 'image/png';
    }
}

export function getFormatExtension(format: TargetImageFormat): string {
    switch (format) {
        case 'webp':
            return 'webp';
        case 'png':
            return 'png';
        case 'jpeg':
            return 'jpg';
        case 'avif':
            return 'avif';
        case 'ico':
            return 'ico';
        case 'bmp':
            return 'bmp';
        default:
            return 'png';
    }
}

export function formatBytes(bytes: number, locale: 'fa' | 'en' = 'en'): string {
    if (bytes === 0) return locale === 'fa' ? '۰ بایت' : '0 B';
    const k = 1024;
    const sizesEn = ['B', 'KB', 'MB', 'GB'];
    const sizesFa = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1));

    if (locale === 'fa') {
        const faNum = value.toLocaleString('fa-IR');
        return `${faNum} ${sizesFa[i]}`;
    }
    return `${value} ${sizesEn[i]}`;
}

export function calculateOutputDimensions(
    origWidth: number,
    origHeight: number,
    scaleMultiplier: number = 1,
    customWidth?: number,
    customHeight?: number,
    maintainAspectRatio: boolean = true,
    rotation: 0 | 90 | 180 | 270 = 0
): { width: number; height: number } {
    let targetW = Math.round(origWidth * scaleMultiplier);
    let targetH = Math.round(origHeight * scaleMultiplier);

    if (customWidth && customWidth > 0 && !customHeight) {
        if (maintainAspectRatio) {
            const r = customWidth / origWidth;
            targetW = customWidth;
            targetH = Math.round(origHeight * r);
        } else {
            targetW = customWidth;
        }
    } else if (customHeight && customHeight > 0 && !customWidth) {
        if (maintainAspectRatio) {
            const r = customHeight / origHeight;
            targetH = customHeight;
            targetW = Math.round(origWidth * r);
        } else {
            targetH = customHeight;
        }
    } else if (customWidth && customHeight && customWidth > 0 && customHeight > 0) {
        targetW = customWidth;
        targetH = customHeight;
    }

    // When rotated 90 or 270 deg, canvas dimensions flip
    if (rotation === 90 || rotation === 270) {
        return {
            width: Math.max(1, targetH),
            height: Math.max(1, targetW),
        };
    }

    return {
        width: Math.max(1, targetW),
        height: Math.max(1, targetH),
    };
}

/**
 * Loads an image or SVG file into an HTMLImageElement
 */
export function loadImageElement(source: Blob | File | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        let objectUrl: string | null = null;

        img.onload = () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for conversion'));
        };

        if (typeof source === 'string') {
            img.src = source;
        } else {
            objectUrl = URL.createObjectURL(source);
            img.src = objectUrl;
        }
    });
}

/**
 * Reads image natural dimensions and handles SVGs gracefully
 */
export async function getConverterImageMetadata(file: File): Promise<{ width: number; height: number; url: string; isSvg: boolean }> {
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    const url = URL.createObjectURL(file);

    try {
        const img = await loadImageElement(url);
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // SVGs might have default fallback dimensions if not explicitly set
        if (isSvg && (!width || !height || width === 0 || height === 0)) {
            width = 800;
            height = 800;
        }

        return { width: width || 800, height: height || 600, url, isSvg };
    } catch {
        return { width: 800, height: 600, url, isSvg };
    }
}

/**
 * Encodes canvas to Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error(`Failed to convert canvas to ${mimeType}`));
                }
            },
            mimeType,
            quality
        );
    });
}

/**
 * Generates a valid Windows/Web .ICO file containing PNG icons for the specified sizes
 */
export async function generateIcoBlob(sourceCanvas: HTMLCanvasElement, sizes: number[] = [16, 32, 48, 64]): Promise<Blob> {
    const validSizes = sizes.filter((s) => s >= 16 && s <= 256);
    if (validSizes.length === 0) validSizes.push(32);

    const imagePngBuffers: { size: number; buffer: Uint8Array }[] = [];

    for (const size of validSizes) {
        const iconCanvas = document.createElement('canvas');
        iconCanvas.width = size;
        iconCanvas.height = size;
        const iconCtx = iconCanvas.getContext('2d');
        if (!iconCtx) continue;

        iconCtx.imageSmoothingEnabled = true;
        iconCtx.imageSmoothingQuality = 'high';
        iconCtx.drawImage(sourceCanvas, 0, 0, size, size);

        const pngBlob = await canvasToBlob(iconCanvas, 'image/png', 1.0);
        const arrayBuf = await pngBlob.arrayBuffer();
        imagePngBuffers.push({ size, buffer: new Uint8Array(arrayBuf) });
    }

    // Windows ICO file format structure:
    // Header (6 bytes) + Directory Entries (16 bytes * N) + Raw PNG data chunks
    const count = imagePngBuffers.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    const totalHeaderAndDirSize = headerSize + count * dirEntrySize;

    let totalDataSize = 0;
    for (const img of imagePngBuffers) {
        totalDataSize += img.buffer.length;
    }

    const totalFileSize = totalHeaderAndDirSize + totalDataSize;
    const icoBuffer = new Uint8Array(totalFileSize);
    const view = new DataView(icoBuffer.buffer);

    // 1. ICONDIR Header
    view.setUint16(0, 0, true); // Reserved (must be 0)
    view.setUint16(2, 1, true); // Type (1 for ICO, 2 for CUR)
    view.setUint16(4, count, true); // Number of images

    // 2. ICONDIRENTRY list
    let currentDataOffset = totalHeaderAndDirSize;

    for (let i = 0; i < count; i++) {
        const img = imagePngBuffers[i];
        const entryOffset = headerSize + i * dirEntrySize;
        const dimensionByte = img.size >= 256 ? 0 : img.size;

        view.setUint8(entryOffset + 0, dimensionByte); // Width (0 for 256)
        view.setUint8(entryOffset + 1, dimensionByte); // Height (0 for 256)
        view.setUint8(entryOffset + 2, 0); // Palette color count
        view.setUint8(entryOffset + 3, 0); // Reserved
        view.setUint16(entryOffset + 4, 1, true); // Color planes
        view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
        view.setUint32(entryOffset + 8, img.buffer.length, true); // Size of image data
        view.setUint32(entryOffset + 12, currentDataOffset, true); // Offset of image data

        // Copy raw image data into file
        icoBuffer.set(img.buffer, currentDataOffset);
        currentDataOffset += img.buffer.length;
    }

    return new Blob([icoBuffer], { type: 'image/x-icon' });
}

/**
 * Converts image file using full transformation options
 */
export async function convertImage(
    source: File | Blob | HTMLImageElement,
    options: ConverterTransformOptions
): Promise<ConvertResult> {
    const startTime = performance.now();

    const img = source instanceof HTMLImageElement ? source : await loadImageElement(source);
    const origWidth = img.naturalWidth || img.width || 800;
    const origHeight = img.naturalHeight || img.height || 600;

    const { width: targetWidth, height: targetHeight } = calculateOutputDimensions(
        origWidth,
        origHeight,
        options.scaleMultiplier,
        options.customWidth,
        options.customHeight,
        options.maintainAspectRatio,
        options.rotationAngle
    );

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas 2D context not available');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If target format does not support transparency (JPEG, BMP), fill background
    const isNonAlphaFormat = options.targetFormat === 'jpeg' || options.targetFormat === 'bmp';
    if (isNonAlphaFormat) {
        ctx.fillStyle = options.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // Apply Grayscale filter if enabled
    if (options.grayscale) {
        ctx.filter = 'grayscale(100%)';
    }

    // Transformation Matrix: Rotation & Flips
    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);

    if (options.rotationAngle !== 0) {
        ctx.rotate((options.rotationAngle * Math.PI) / 180);
    }

    const scaleX = options.flipHorizontal ? -1 : 1;
    const scaleY = options.flipVertical ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
        ctx.scale(scaleX, scaleY);
    }

    // Calculate draw dimensions before rotation
    const isSwapped = options.rotationAngle === 90 || options.rotationAngle === 270;
    const drawW = isSwapped ? targetHeight : targetWidth;
    const drawH = isSwapped ? targetWidth : targetHeight;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    let outputBlob: Blob;

    if (options.targetFormat === 'ico') {
        outputBlob = await generateIcoBlob(canvas, options.icoSizes || [16, 32, 48, 64]);
    } else {
        const mime = getFormatMimeType(options.targetFormat);
        const quality = Math.min(1, Math.max(0.1, options.quality));
        outputBlob = await canvasToBlob(canvas, mime, quality);
    }

    const durationMs = Math.round(performance.now() - startTime);
    const previewUrl = URL.createObjectURL(outputBlob);

    return {
        blob: outputBlob,
        size: outputBlob.size,
        width: targetWidth,
        height: targetHeight,
        format: options.targetFormat,
        previewUrl,
        durationMs,
    };
}

/**
 * Creates a zip archive with all converted files
 */
export async function createConvertedZipBundle(
    items: ConverterFileItem[],
    zipFilename = 'zebracode-converted-images.zip'
): Promise<Blob> {
    const zip = new JSZip();

    for (const item of items) {
        if (item.convertedBlob && item.convertedFormat) {
            const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
            const ext = getFormatExtension(item.convertedFormat);
            const cleanName = `${baseName}.${ext}`;
            zip.file(cleanName, item.convertedBlob);
        }
    }

    return await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });
}

/**
 * Copies a converted image directly to clipboard
 */
export async function copyConvertedImageToClipboard(blob: Blob): Promise<boolean> {
    if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error('Clipboard API not supported');
    }

    try {
        if (blob.type === 'image/png') {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            return true;
        }

        const img = await loadImageElement(blob);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context failed');
        ctx.drawImage(img, 0, 0);

        const pngBlob = await canvasToBlob(canvas, 'image/png', 1.0);
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
        return true;
    } catch (err) {
        console.error('Clipboard copy error:', err);
        throw err;
    }
}

/**
 * Download a Blob as file
 */
export function downloadConvertedBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Generates sample demo files for instant 1-click testing
 */
export function createConverterSample(type: 'svg' | 'photo' | 'icon'): Promise<File> {
    return new Promise((resolve) => {
        if (type === 'svg') {
            // High quality scalable vector logo with clean SVG markup
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="none"/>
  <rect x="75" y="75" width="350" height="350" rx="80" fill="url(#g)" filter="url(#shadow)"/>
  <circle cx="250" cy="250" r="110" fill="#ffffff" opacity="0.95"/>
  <path d="M 220 180 L 310 250 L 220 320 Z" fill="#3b82f6"/>
  <text x="250" y="465" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#64748b">ZebraCode Vector Logo</text>
</svg>`;
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            resolve(new File([blob], 'sample-vector-logo.svg', { type: 'image/svg+xml' }));
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d')!;

        if (type === 'photo') {
            // Vibrant landscape photo gradient
            const g = ctx.createLinearGradient(0, 0, 1200, 800);
            g.addColorStop(0, '#0f172a');
            g.addColorStop(0.3, '#1e293b');
            g.addColorStop(0.7, '#0284c7');
            g.addColorStop(1, '#38bdf8');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 1200, 800);

            // Glowing sun / moon
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(600, 350, 120, 0, Math.PI * 2);
            ctx.fill();

            // Stars
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 70; i++) {
                const x = (i * 137) % 1200;
                const y = (i * 93) % 450;
                ctx.fillRect(x, y, 2, 2);
            }

            // Mountain peaks
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(0, 800);
            ctx.lineTo(300, 480);
            ctx.lineTo(650, 800);
            ctx.lineTo(950, 420);
            ctx.lineTo(1200, 800);
            ctx.closePath();
            ctx.fill();

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], 'sample-night-sky.jpg', { type: 'image/jpeg' }));
                }
            }, 'image/jpeg', 0.95);
        } else {
            // Transparent badge / icon
            ctx.clearRect(0, 0, 1200, 800);
            const rad = ctx.createRadialGradient(600, 400, 50, 600, 400, 300);
            rad.addColorStop(0, '#10b981');
            rad.addColorStop(1, '#059669');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(600, 400, 260, 0, Math.PI * 2);
            ctx.fill();

            // White Star symbol
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 220px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', 600, 400);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], 'sample-badge-transparent.png', { type: 'image/png' }));
                }
            }, 'image/png', 1.0);
        }
    });
}
