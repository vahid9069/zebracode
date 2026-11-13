import { describe, expect, it } from 'vitest';
import {
    computeAllHashes,
    computeCrc32,
    computeHmac,
    computeMd5,
    computeSubtleHash,
    verifyChecksum,
} from '@/lib/hash-generator/crypto';
import type { HashResultItem } from '@/lib/hash-generator/types';

describe('Hash Generator & Checksum utilities', () => {
    describe('computeMd5', () => {
        it('calculates accurate MD5 for empty string', () => {
            const emptyBytes = new Uint8Array(0);
            expect(computeMd5(emptyBytes)).toBe('d41d8cd98f00b204e9800998ecf8427e');
        });

        it('calculates accurate MD5 for standard test string', () => {
            const bytes = new TextEncoder().encode('The quick brown fox jumps over the lazy dog');
            expect(computeMd5(bytes)).toBe('9e107d9d372bb6826bd81d3542a419d6');
        });
    });

    describe('computeCrc32', () => {
        it('calculates accurate CRC32 checksum', () => {
            const bytes = new TextEncoder().encode('123456789');
            const res = computeCrc32(bytes);
            expect(res.hex).toBe('cbf43926');
            expect(res.uint32).toBe(3421780262);
        });
    });

    describe('computeSubtleHash', () => {
        it('calculates accurate SHA-256 hash', async () => {
            const bytes = new TextEncoder().encode('Hello, ZebraCode!');
            const hash = await computeSubtleHash('SHA-256', bytes);
            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[0-9a-f]{64}$/);
        });

        it('calculates accurate SHA-512 hash', async () => {
            const bytes = new TextEncoder().encode('Hello, ZebraCode!');
            const hash = await computeSubtleHash('SHA-512', bytes);
            expect(hash).toHaveLength(128);
            expect(hash).toMatch(/^[0-9a-f]{128}$/);
        });
    });

    describe('computeHmac', () => {
        it('generates HMAC signatures in hex and base64', async () => {
            const key = 'secret-test-key';
            const data = new TextEncoder().encode('message payload');
            const res = await computeHmac('SHA-256', key, data);
            expect(res.hex).toHaveLength(64);
            expect(res.base64).toBeTruthy();
        });
    });

    describe('computeAllHashes', () => {
        it('computes all standard algorithms in parallel', async () => {
            const data = new TextEncoder().encode('Test Data');
            const list = await computeAllHashes(data);

            const algos = list.map((item) => item.algorithm);
            expect(algos).toContain('SHA-256');
            expect(algos).toContain('SHA-512');
            expect(algos).toContain('MD5');
            expect(algos).toContain('SHA-1');
            expect(algos).toContain('SHA-384');
            expect(algos).toContain('CRC32');
        });
    });

    describe('verifyChecksum', () => {
        const mockHashes: HashResultItem[] = [
            {
                algorithm: 'SHA-256',
                bitLength: 256,
                hex: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                isSecure: true,
                description: 'test',
            },
            {
                algorithm: 'MD5',
                bitLength: 128,
                hex: 'd41d8cd98f00b204e9800998ecf8427e',
                isSecure: false,
                description: 'test',
            },
        ];

        it('finds exact matching hash case-insensitively', () => {
            const res = verifyChecksum('D41D8CD98F00B204E9800998ECF8427E', mockHashes);
            expect(res.matched).toBe(true);
            expect(res.matchedAlgorithm).toBe('MD5');
        });

        it('detects mismatched hashes', () => {
            const res = verifyChecksum('wrong_hash_string', mockHashes);
            expect(res.matched).toBe(false);
            expect(res.matchedAlgorithm).toBeUndefined();
        });

        it('handles empty input gracefully', () => {
            const res = verifyChecksum('   ', mockHashes);
            expect(res.matched).toBe(false);
        });
    });
});
