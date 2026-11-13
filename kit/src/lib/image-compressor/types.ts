export type ImageOutputFormat = 'original' | 'image/webp' | 'image/jpeg' | 'image/png' | 'image/avif';

export type CompressionPreset = 'balanced' | 'high' | 'max' | 'custom' | 'target-size';

export interface CompressionSettings {
    preset: CompressionPreset;
    quality: number; // 0.01 - 1.0 (e.g. 0.8 for 80%)
    outputFormat: ImageOutputFormat;
    maxWidth?: number;
    maxHeight?: number;
    scalePercent: number; // 1 - 100
    maintainAspectRatio: boolean;
    stripMetadata: boolean;
    targetSizeBytes?: number; // Target size e.g. 200 * 1024
    jpegBackgroundColor?: string; // e.g. '#ffffff' for transparent png to jpeg
}

export interface ImageFileItem {
    id: string;
    file: File;
    name: string;
    originalSize: number;
    originalWidth: number;
    originalHeight: number;
    originalType: string;
    originalPreviewUrl: string;

    // Compression state & output
    status: 'idle' | 'compressing' | 'done' | 'error';
    errorMessage?: string;
    compressedBlob?: Blob;
    compressedSize?: number;
    compressedWidth?: number;
    compressedHeight?: number;
    compressedType?: string;
    compressedPreviewUrl?: string;
    processingTimeMs?: number;

    // Per-item specific settings override (if modified)
    customSettings?: Partial<CompressionSettings>;
}

export interface CompressionResult {
    blob: Blob;
    size: number;
    width: number;
    height: number;
    mimeType: string;
    previewUrl: string;
    durationMs: number;
}
