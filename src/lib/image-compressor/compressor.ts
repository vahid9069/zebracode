import JSZip from 'jszip';
import type {
    CompressionResult,
    CompressionSettings,
    ImageFileItem,
    ImageOutputFormat,
} from './types';

export const DEFAULT_COMPRESSION_SETTINGS: CompressionSettings = {
    preset: 'balanced',
    quality: 0.8,
    outputFormat: 'original',
    scalePercent: 100,
    maintainAspectRatio: true,
    stripMetadata: true,
    jpegBackgroundColor: '#ffffff',
};

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

export function formatSavingsPercent(originalBytes: number, compressedBytes: number): number {
    if (!originalBytes || originalBytes <= 0) return 0;
    const diff = originalBytes - compressedBytes;
    const percent = Math.round((diff / originalBytes) * 100);
    return Math.max(0, percent);
}

export function calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    scalePercent: number = 100,
    maxWidth?: number,
    maxHeight?: number,
    maintainAspectRatio: boolean = true
): { width: number; height: number } {
    let targetWidth = Math.round(originalWidth * (scalePercent / 100));
    let targetHeight = Math.round(originalHeight * (scalePercent / 100));

    if (maxWidth && maxWidth > 0 && targetWidth > maxWidth) {
        if (maintainAspectRatio) {
            const ratio = maxWidth / targetWidth;
            targetWidth = maxWidth;
            targetHeight = Math.round(targetHeight * ratio);
        } else {
            targetWidth = maxWidth;
        }
    }

    if (maxHeight && maxHeight > 0 && targetHeight > maxHeight) {
        if (maintainAspectRatio) {
            const ratio = maxHeight / targetHeight;
            targetHeight = maxHeight;
            targetWidth = Math.round(targetWidth * ratio);
        } else {
            targetHeight = maxHeight;
        }
    }

    return {
        width: Math.max(1, Math.round(targetWidth)),
        height: Math.max(1, Math.round(targetHeight)),
    };
}

export function resolveMimeType(originalType: string, requestedFormat: ImageOutputFormat): string {
    if (requestedFormat !== 'original') {
        return requestedFormat;
    }
    // If original is supported for canvas export, retain it
    const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (supportedFormats.includes(originalType)) {
        return originalType;
    }
    // Default fallback: WebP for best compression & transparency support
    return 'image/webp';
}

export function getFileExtension(mimeType: string): string {
    switch (mimeType) {
        case 'image/jpeg':
            return 'jpg';
        case 'image/png':
            return 'png';
        case 'image/webp':
            return 'webp';
        case 'image/avif':
            return 'avif';
        default:
            return 'jpg';
    }
}

/**
 * Loads an image from Blob/File/URL into an HTMLImageElement
 */
export function loadImageElement(source: Blob | File | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        let objectUrl: string | null = null;

        img.onload = () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = (e) => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image element'));
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
 * Reads image dimensions directly from file
 */
export async function getImageMetadata(file: File): Promise<{ width: number; height: number; url: string }> {
    const url = URL.createObjectURL(file);
    try {
        const img = await loadImageElement(url);
        return {
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            url,
        };
    } catch {
        return { width: 0, height: 0, url };
    }
}

/**
 * Converts canvas to Blob with promise
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas toBlob conversion failed'));
                }
            },
            mimeType,
            quality
        );
    });
}

/**
 * Compresses an image client-side using HTML5 Canvas & high quality scaling
 */
export async function compressImage(
    source: File | Blob | HTMLImageElement,
    settings: CompressionSettings,
    originalType: string = 'image/jpeg'
): Promise<CompressionResult> {
    const startTime = performance.now();

    const img = source instanceof HTMLImageElement ? source : await loadImageElement(source);
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    const { width, height } = calculateDimensions(
        naturalWidth,
        naturalHeight,
        settings.scalePercent,
        settings.maxWidth,
        settings.maxHeight,
        settings.maintainAspectRatio
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas 2D context not available');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const targetMime = resolveMimeType(originalType, settings.outputFormat);

    // If converting to JPEG, paint background color first (JPEG doesn't support transparency)
    if (targetMime === 'image/jpeg') {
        ctx.fillStyle = settings.jpegBackgroundColor || '#ffffff';
        ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    let outputBlob: Blob;

    if (settings.preset === 'target-size' && settings.targetSizeBytes && settings.targetSizeBytes > 0) {
        // Binary search for optimal quality to meet target file size
        const target = settings.targetSizeBytes;
        let low = 0.1;
        let high = 0.98;
        let bestBlob: Blob | null = null;

        for (let iter = 0; iter < 6; iter++) {
            const mid = (low + high) / 2;
            const currentBlob = await canvasToBlob(canvas, targetMime, mid);

            if (currentBlob.size <= target) {
                bestBlob = currentBlob;
                low = mid; // Try for better quality
            } else {
                high = mid; // Must compress more
            }
        }

        outputBlob = bestBlob || (await canvasToBlob(canvas, targetMime, low));
    } else {
        const quality = Math.min(1, Math.max(0.01, settings.quality));
        outputBlob = await canvasToBlob(canvas, targetMime, quality);
    }

    const durationMs = Math.round(performance.now() - startTime);
    const previewUrl = URL.createObjectURL(outputBlob);

    return {
        blob: outputBlob,
        size: outputBlob.size,
        width,
        height,
        mimeType: targetMime,
        previewUrl,
        durationMs,
    };
}

/**
 * Creates a zip file containing all successfully compressed images
 */
export async function createZipBundle(
    items: ImageFileItem[],
    zipFilename = 'zebracode-compressed-images.zip'
): Promise<Blob> {
    const zip = new JSZip();

    for (const item of items) {
        if (item.compressedBlob) {
            const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
            const ext = getFileExtension(item.compressedType || 'image/jpeg');
            const cleanName = `${baseName}-compressed.${ext}`;
            zip.file(cleanName, item.compressedBlob);
        }
    }

    return await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });
}

/**
 * Copies an image blob directly to the user's OS clipboard
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
    if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error('Clipboard API not supported in this browser');
    }

    try {
        // Browsers generally require 'image/png' in ClipboardItem
        if (blob.type === 'image/png') {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            return true;
        }

        // Convert blob to PNG via canvas for clipboard compatibility
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
 * Triggers instant browser download of a Blob
 */
export function downloadBlob(blob: Blob, fileName: string): void {
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
 * Generates sample demo images on-the-fly (zero network, instant)
 */
export function createSampleImage(type: 'landscape' | 'badge'): Promise<File> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d')!;

        if (type === 'landscape') {
            // High-detail landscape gradient with mountains, sun, and birds
            const sky = ctx.createLinearGradient(0, 0, 0, 700);
            sky.addColorStop(0, '#1e3a8a');
            sky.addColorStop(0.4, '#3b82f6');
            sky.addColorStop(0.7, '#f97316');
            sky.addColorStop(1, '#fef08a');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, 1600, 1000);

            // Sun
            ctx.fillStyle = '#ffedd5';
            ctx.beginPath();
            ctx.arc(800, 520, 110, 0, Math.PI * 2);
            ctx.fill();

            // Mountains background
            ctx.fillStyle = '#4338ca';
            ctx.beginPath();
            ctx.moveTo(0, 850);
            ctx.lineTo(350, 450);
            ctx.lineTo(750, 850);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#312e81';
            ctx.beginPath();
            ctx.moveTo(500, 850);
            ctx.lineTo(1000, 400);
            ctx.lineTo(1500, 850);
            ctx.closePath();
            ctx.fill();

            // Foreground hills
            ctx.fillStyle = '#064e3b';
            ctx.beginPath();
            ctx.moveTo(0, 1000);
            ctx.lineTo(0, 800);
            ctx.bezierCurveTo(400, 700, 800, 950, 1600, 750);
            ctx.lineTo(1600, 1000);
            ctx.closePath();
            ctx.fill();

            // Water reflection
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            for (let i = 0; i < 40; i++) {
                ctx.fillRect(700 - i * 10, 820 + i * 4, 200 + i * 20, 2);
            }

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], 'sample-mountain-landscape.jpg', { type: 'image/jpeg' }));
                }
            }, 'image/jpeg', 0.95);
        } else {
            // Graphic icon with transparency
            ctx.clearRect(0, 0, 1600, 1000);

            // Circular tech badge with neon gradient
            const grad = ctx.createLinearGradient(300, 200, 1300, 800);
            grad.addColorStop(0, '#ec4899');
            grad.addColorStop(0.5, '#8b5cf6');
            grad.addColorStop(1, '#06b6d4');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(400, 150, 800, 700, [60]);
            ctx.fill();

            // Inner circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(800, 500, 220, 0, Math.PI * 2);
            ctx.fill();

            // Symbol
            ctx.fillStyle = '#8b5cf6';
            ctx.font = 'bold 160px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', 800, 500);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], 'sample-vector-badge.png', { type: 'image/png' }));
                }
            }, 'image/png', 1.0);
        }
    });
}
