import { describe, expect, it } from 'vitest';
import {
    calculateDimensions,
    createZipBundle,
    DEFAULT_COMPRESSION_SETTINGS,
    formatBytes,
    formatSavingsPercent,
    getFileExtension,
    resolveMimeType,
} from '@/lib/image-compressor/compressor';
import { AllToolsList } from '@/lib/registry/tools';
import type { ImageFileItem } from '@/lib/image-compressor/types';

describe('Image Compressor utilities', () => {
    describe('formatBytes', () => {
        it('formats zero bytes in English and Persian', () => {
            expect(formatBytes(0, 'en')).toBe('0 B');
            expect(formatBytes(0, 'fa')).toBe('۰ بایت');
        });

        it('formats KB and MB accurately in English', () => {
            expect(formatBytes(1024, 'en')).toBe('1 KB');
            expect(formatBytes(1536, 'en')).toBe('1.5 KB');
            expect(formatBytes(1024 * 1024 * 2.5, 'en')).toBe('2.5 MB');
        });

        it('formats in Persian with localized digits', () => {
            const formatted = formatBytes(1024, 'fa');
            expect(formatted).toContain('کیلوبایت');
        });
    });

    describe('formatSavingsPercent', () => {
        it('calculates savings percentage correctly', () => {
            expect(formatSavingsPercent(1000, 200)).toBe(80);
            expect(formatSavingsPercent(1000, 500)).toBe(50);
            expect(formatSavingsPercent(1000, 1000)).toBe(0);
            expect(formatSavingsPercent(1000, 1200)).toBe(0); // No negative savings
            expect(formatSavingsPercent(0, 500)).toBe(0);
        });
    });

    describe('calculateDimensions', () => {
        it('scales by percentage when no max constraints given', () => {
            const dims = calculateDimensions(1000, 500, 50);
            expect(dims).toEqual({ width: 500, height: 250 });
        });

        it('maintains aspect ratio when constrained by maxWidth', () => {
            const dims = calculateDimensions(2000, 1000, 100, 1000, undefined, true);
            expect(dims).toEqual({ width: 1000, height: 500 });
        });

        it('maintains aspect ratio when constrained by maxHeight', () => {
            const dims = calculateDimensions(2000, 1000, 100, undefined, 400, true);
            expect(dims).toEqual({ width: 800, height: 400 });
        });

        it('ignores aspect ratio when maintainAspectRatio is false', () => {
            const dims = calculateDimensions(2000, 1000, 100, 800, 300, false);
            expect(dims).toEqual({ width: 800, height: 300 });
        });

        it('ensures minimum dimensions of at least 1px', () => {
            const dims = calculateDimensions(10, 10, 1);
            expect(dims.width).toBeGreaterThanOrEqual(1);
            expect(dims.height).toBeGreaterThanOrEqual(1);
        });
    });

    describe('resolveMimeType', () => {
        it('returns requested format when explicit', () => {
            expect(resolveMimeType('image/png', 'image/webp')).toBe('image/webp');
            expect(resolveMimeType('image/jpeg', 'image/png')).toBe('image/png');
            expect(resolveMimeType('image/jpeg', 'image/avif')).toBe('image/avif');
        });

        it('preserves original format if supported by canvas export', () => {
            expect(resolveMimeType('image/jpeg', 'original')).toBe('image/jpeg');
            expect(resolveMimeType('image/png', 'original')).toBe('image/png');
            expect(resolveMimeType('image/webp', 'original')).toBe('image/webp');
        });

        it('falls back to WebP for unsupported original types like svg or bmp', () => {
            expect(resolveMimeType('image/svg+xml', 'original')).toBe('image/webp');
            expect(resolveMimeType('image/bmp', 'original')).toBe('image/webp');
        });
    });

    describe('getFileExtension', () => {
        it('returns correct extension for mime types', () => {
            expect(getFileExtension('image/jpeg')).toBe('jpg');
            expect(getFileExtension('image/png')).toBe('png');
            expect(getFileExtension('image/webp')).toBe('webp');
            expect(getFileExtension('image/avif')).toBe('avif');
            expect(getFileExtension('unknown')).toBe('jpg');
        });
    });

    describe('createZipBundle', () => {
        it('creates a valid zip blob from compressed items', async () => {
            const mockBlob = new Blob(['fake image content'], { type: 'image/jpeg' });
            const mockItems: ImageFileItem[] = [
                {
                    id: '1',
                    file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
                    name: 'photo.jpg',
                    originalSize: 100,
                    originalWidth: 200,
                    originalHeight: 200,
                    originalType: 'image/jpeg',
                    originalPreviewUrl: 'blob:fake1',
                    status: 'done',
                    compressedBlob: mockBlob,
                    compressedSize: 50,
                    compressedType: 'image/jpeg',
                },
            ];

            const zipBlob = await createZipBundle(mockItems, 'test.zip');
            expect(zipBlob).toBeInstanceOf(Blob);
            expect(zipBlob.size).toBeGreaterThan(0);
        });
    });

    describe('Registry registration', () => {
        it('registers image-compressor in AllToolsList with complete metadata', () => {
            const tool = AllToolsList['image-compressor'];
            expect(tool).toBeDefined();
            expect(tool.href).toBe('/image-compressor');
            expect(tool.category).toBe('converters');
            expect(tool.title).toBe('Image Compressor & Converter');
            expect(tool.description).toBeTruthy();
            expect(tool.icon).toBeDefined();
            expect(tool.extraContent?.faq?.length).toBeGreaterThan(0);
        });
    });
});
