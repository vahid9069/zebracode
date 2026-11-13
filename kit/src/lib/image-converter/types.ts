export type TargetImageFormat = 'webp' | 'png' | 'jpeg' | 'avif' | 'ico' | 'bmp';

export interface ConverterTransformOptions {
    targetFormat: TargetImageFormat;
    quality: number; // 0.1 - 1.0 (for lossy formats like webp, jpeg, avif)
    scaleMultiplier: number; // 1, 1.5, 2, 3, 4 (especially great for SVG rasterization)
    customWidth?: number;
    customHeight?: number;
    maintainAspectRatio: boolean;
    rotationAngle: 0 | 90 | 180 | 270;
    flipHorizontal: boolean;
    flipVertical: boolean;
    grayscale: boolean;
    backgroundColor?: string; // Fill color for transparent backgrounds when converting to JPG/BMP (e.g. '#ffffff')
    icoSizes?: number[]; // [16, 32, 48, 64]
}

export interface ConverterFileItem {
    id: string;
    file: File;
    name: string;
    originalSize: number;
    originalWidth: number;
    originalHeight: number;
    originalType: string;
    originalPreviewUrl: string;
    isSvg: boolean;

    // Output state
    status: 'idle' | 'converting' | 'done' | 'error';
    errorMessage?: string;
    convertedBlob?: Blob;
    convertedSize?: number;
    convertedWidth?: number;
    convertedHeight?: number;
    convertedFormat?: TargetImageFormat;
    convertedPreviewUrl?: string;
    processingTimeMs?: number;

    // Per-item specific settings override
    customOptions?: Partial<ConverterTransformOptions>;
}

export interface ConvertResult {
    blob: Blob;
    size: number;
    width: number;
    height: number;
    format: TargetImageFormat;
    previewUrl: string;
    durationMs: number;
}
