import { describe, expect, it } from 'vitest';
import {
    exportIdentifiersToFormat,
    formatIdentifier,
    generateCuid2,
    generateIdentifierBatch,
    generateNanoId,
    generateNilUuid,
    generateUlid,
    generateUuidV1,
    generateUuidV4,
    generateUuidV7,
    inspectUuid,
    uuidToBase64,
} from '@/lib/uuid-generator/generator';

describe('UUID and Identifier Generator', () => {
    describe('Algorithms & Standards', () => {
        it('generates valid RFC 4122 UUID v4', () => {
            const id = generateUuidV4();
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        it('generates valid RFC 9562 UUID v7 with time-ordering', () => {
            const before = Date.now();
            const id = generateUuidV7();
            const after = Date.now();

            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

            // Verify timestamp extraction from first 48 bits
            const msHex = id.replace(/-/g, '').slice(0, 12);
            const extractedMs = parseInt(msHex, 16);
            expect(extractedMs).toBeGreaterThanOrEqual(before - 50);
            expect(extractedMs).toBeLessThanOrEqual(after + 50);
        });

        it('generates valid UUID v1', () => {
            const id = generateUuidV1();
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        it('generates valid NanoID with requested length and alphabet', () => {
            const id = generateNanoId(16, 'ABC123');
            expect(id).toHaveLength(16);
            expect(id).toMatch(/^[ABC123]+$/);
        });

        it('generates valid ULID with 26 Crockford Base32 characters', () => {
            const id = generateUlid();
            expect(id).toHaveLength(26);
            expect(id).toMatch(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/);
        });

        it('generates valid CUID2', () => {
            const id = generateCuid2(20);
            expect(id).toHaveLength(20);
            expect(id).toMatch(/^[a-z][a-z0-9]+$/);
        });

        it('generates Nil UUID', () => {
            expect(generateNilUuid()).toBe('00000000-0000-0000-0000-000000000000');
        });
    });

    describe('Formatting & Encoding', () => {
        const raw = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

        it('supports disabling hyphens', () => {
            const res = formatIdentifier(raw, { type: 'v4', hyphens: false });
            expect(res).toBe('f47ac10b58cc4372a5670e02b2c3d479');
        });

        it('supports uppercase formatting', () => {
            const res = formatIdentifier(raw, { type: 'v4', uppercase: true });
            expect(res).toBe('F47AC10B-58CC-4372-A567-0E02B2C3D479');
        });

        it('supports braces wrapping', () => {
            const res = formatIdentifier(raw, { type: 'v4', braces: true });
            expect(res).toBe('{f47ac10b-58cc-4372-a567-0e02b2c3d479}');
        });

        it('supports URN prefix', () => {
            const res = formatIdentifier(raw, { type: 'v4', urnPrefix: true });
            expect(res).toBe('urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479');
        });

        it('supports quotes', () => {
            expect(formatIdentifier(raw, { quotes: 'single' })).toBe(`'${raw}'`);
            expect(formatIdentifier(raw, { quotes: 'double' })).toBe(`"${raw}"`);
        });

        it('encodes UUID to Base64 correctly', () => {
            const b64 = uuidToBase64(raw);
            expect(b64.length).toBeGreaterThanOrEqual(22);
        });
    });

    describe('Batch Generation & Export Formats', () => {
        it('generates exact count in batch', () => {
            const batch = generateIdentifierBatch({
                type: 'v4',
                count: 10,
                hyphens: true,
                uppercase: false,
                braces: false,
                quotes: 'none',
                urnPrefix: false,
                encodeBase64: false,
            });
            expect(batch).toHaveLength(10);
            expect(new Set(batch).size).toBe(10); // All unique
        });

        it('exports to JSON format', () => {
            const ids = ['id-1', 'id-2'];
            const json = exportIdentifiersToFormat(ids, 'json');
            expect(JSON.parse(json)).toEqual(ids);
        });

        it('exports to SQL INSERT format', () => {
            const ids = ['uuid-1', 'uuid-2'];
            const sql = exportIdentifiersToFormat(ids, 'sql', { sqlTableName: 'users', sqlColumnName: 'uuid' });
            expect(sql).toContain("INSERT INTO users (uuid) VALUES ('uuid-1');");
            expect(sql).toContain("INSERT INTO users (uuid) VALUES ('uuid-2');");
        });

        it('exports to programming language arrays (JS, Python, Go)', () => {
            const ids = ['uuid-1', 'uuid-2'];
            expect(exportIdentifiersToFormat(ids, 'js')).toContain('const ids = [');
            expect(exportIdentifiersToFormat(ids, 'python')).toContain('ids = [');
            expect(exportIdentifiersToFormat(ids, 'go')).toContain('ids := []string{');
        });
    });

    describe('UUID Inspector & Decoder', () => {
        it('accurately parses UUID v4 and identifies its version & variant', () => {
            const id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
            const res = inspectUuid(id);
            expect(res.isValid).toBe(true);
            expect(res.versionNumber).toBe(4);
            expect(res.variant).toContain('RFC 4122');
        });

        it('accurately parses UUID v7 and extracts creation timestamp', () => {
            const now = new Date('2025-05-10T12:30:00.000Z');
            const nowMs = now.getTime();
            const timeHex = nowMs.toString(16).padStart(12, '0');
            const fakeV7 = `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7abc-8123-0123456789ab`;

            const res = inspectUuid(fakeV7);
            expect(res.isValid).toBe(true);
            expect(res.versionNumber).toBe(7);
            expect(res.timestamp?.toISOString()).toBe(now.toISOString());
            expect(res.formattedTimestampShamsi).toBeTruthy();
        });

        it('handles nil UUID', () => {
            const res = inspectUuid('00000000-0000-0000-0000-000000000000');
            expect(res.isValid).toBe(true);
            expect(res.version).toBe('Nil UUID');
        });

        it('rejects invalid UUID formats gracefully', () => {
            const res = inspectUuid('not-a-valid-uuid');
            expect(res.isValid).toBe(false);
            expect(res.errorReason).toBe('invalid_format');
        });
    });
});
