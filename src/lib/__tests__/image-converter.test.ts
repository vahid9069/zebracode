import { describe, expect, it } from 'vitest';
import {
    calculateOutputDimensions,
    createConvertedZipBundle,
    DEFAULT_CONVERTER_OPTIONS,
    formatBytes,
    getFormatExtension,
    getFormatMimeType,
    SUPPORTED_TARGET_FORMATS,
} from '@/lib/image-converter/converter';
import { AllToolsList } from '@/lib/registry/tools';
import type { ConverterFileItem } from '@/lib/image-converter/types';

describe('Image Converter utilities', () => {
    describe('getFormatMimeType and getFormatExtension', () => {
        it('maps target formats to valid MIME types', () => {
            expect(getFormatMimeType('webp')).toBe('image/webp');
            expect(getFormatMimeType('png')).toBe('image/png');
            expect(getFormatMimeType('jpeg')).toBe('image/jpeg');
            expect(getFormatMimeType('avif')).toBe('image/avif');
            expect(getFormatMimeType('ico')).toBe('image/x-icon');
            expect(getFormatMimeType('bmp')).toBe('image/bmp');
        });

        it('maps target formats to correct file extensions', () => {
            expect(getFormatExtension('webp')).toBe('webp');
            expect(getFormatExtension('png')).toBe('png');
            expect(getFormatExtension('jpeg')).toBe('jpg');
            expect(getFormatExtension('avif')).toBe('avif');
            expect(getFormatExtension('ico')).toBe('ico');
            expect(getFormatExtension('bmp')).toBe('bmp');
        });

        it('has all supported formats defined with descriptions', () => {
            expect(SUPPORTED_TARGET_FORMATS.length).toBeGreaterThanOrEqual(6);
            SUPPORTED_TARGET_FORMATS.forEach((fmt) => {
                expect(fmt.id).toBeTruthy();
                expect(fmt.label).toBeTruthy();
                expect(fmt.descFa).toBeTruthy();
                expect(fmt.descEn).toBeTruthy();
            });
        });
    });

    describe('calculateOutputDimensions', () => {
        it('applies scale multiplier accurately', () => {
            const dims = calculateOutputDimensions(400, 300, 2);
            expect(dims).toEqual({ width: 800, height: 600 });
        });

        it('swaps width and height on 90 and 270 degree rotation', () => {
            const dims90 = calculateOutputDimensions(400, 300, 1, undefined, undefined, true, 90);
            expect(dims90).toEqual({ width: 300, height: 400 });

            const dims270 = calculateOutputDimensions(400, 300, 1, undefined, undefined, true, 270);
            expect(dims270).toEqual({ width: 300, height: 400 });

            const dims180 = calculateOutputDimensions(400, 300, 1, undefined, undefined, true, 180);
            expect(dims180).toEqual({ width: 400, height: 300 });
        });

        it('calculates proportional height when custom width given', () => {
            const dims = calculateOutputDimensions(1000, 500, 1, 500, undefined, true);
            expect(dims).toEqual({ width: 500, height: 250 });
        });
    });

    describe('formatBytes', () => {
        it('formats localized byte units', () => {
            expect(formatBytes(0, 'en')).toBe('0 B');
            expect(formatBytes(2048, 'en')).toBe('2 KB');
            expect(formatBytes(2048, 'fa')).toContain('کیلوبایت');
        });
    });

    describe('createConvertedZipBundle', () => {
        it('bundles converted files into a zip blob', async () => {
            const mockBlob = new Blob(['mock content'], { type: 'image/webp' });
            const mockItems: ConverterFileItem[] = [
                {
                    id: '1',
                    file: new File([''], 'logo.png', { type: 'image/png' }),
                    name: 'logo.png',
                    originalSize: 500,
                    originalWidth: 100,
                    originalHeight: 100,
                    originalType: 'image/png',
                    originalPreviewUrl: 'blob:test1',
                    isSvg: false,
                    status: 'done',
                    convertedBlob: mockBlob,
                    convertedSize: 200,
                    convertedFormat: 'webp',
                },
            ];

            const zipBlob = await createConvertedZipBundle(mockItems);
            expect(zipBlob).toBeInstanceOf(Blob);
            expect(zipBlob.size).toBeGreaterThan(0);
        });
    });

    describe('Registry verification for image-converter', () => {
        it('registers image-converter with complete metadata in AllToolsList', () => {
            const tool = AllToolsList['image-converter'];
            expect(tool).toBeDefined();
            expect(tool.href).toBe('/image-converter');
            expect(tool.category).toBe('converters');
            expect(tool.title).toBe('Image Format Converter');
            expect(tool.description).toBeTruthy();
            expect(tool.icon).toBeDefined();
            expect(tool.extraContent?.faq?.length).toBeGreaterThan(0);
        });
    });
});
