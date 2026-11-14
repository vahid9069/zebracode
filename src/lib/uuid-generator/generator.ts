import jalaali from 'jalaali-js';
import type {
    ExportFormat,
    IdentifierFormatOptions,
    IdentifierType,
    UuidInspectionResult,
} from './types';

export const DEFAULT_FORMAT_OPTIONS: IdentifierFormatOptions = {
    type: 'v4',
    count: 5,
    hyphens: true,
    uppercase: false,
    braces: false,
    quotes: 'none',
    urnPrefix: false,
    encodeBase64: false,
    nanoIdLength: 21,
    nanoIdAlphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-',
    sqlTableName: 'users',
    sqlColumnName: 'id',
};

const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function getRandomBytes(count: number): Uint8Array {
    const bytes = new Uint8Array(count);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < count; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate standard UUID v4 (RFC 4122)
 */
export function generateUuidV4(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    const bytes = getRandomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC 4122
    const hex = bytesToHex(bytes);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Generate UUID v7 (RFC 9562 - Time-ordered epoch millisecond)
 */
export function generateUuidV7(): string {
    const bytes = getRandomBytes(16);
    const now = Date.now();

    // 48-bit timestamp in milliseconds
    bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
    bytes[1] = Math.floor(now / 0x100000000) & 0xff;
    bytes[2] = Math.floor(now / 0x1000000) & 0xff;
    bytes[3] = Math.floor(now / 0x10000) & 0xff;
    bytes[4] = Math.floor(now / 0x100) & 0xff;
    bytes[5] = now & 0xff;

    // Version 7 in high nibble of byte 6
    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    // Variant RFC 4122 (10xx) in byte 8
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = bytesToHex(bytes);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Generate UUID v1 (Time-based + simulated node)
 */
export function generateUuidV1(): string {
    // 100-nanosecond intervals since Oct 15, 1582
    const now = Date.now();
    const gregorianOffset = 12219292800000; // milliseconds between 1582 and 1970
    const timeIn100Ns = BigInt(now + gregorianOffset) * 10000n;

    const timeHex = timeIn100Ns.toString(16).padStart(16, '0');
    const timeLow = timeHex.slice(8, 16);
    const timeMid = timeHex.slice(4, 8);
    const timeHiAndVersion = '1' + timeHex.slice(1, 4);

    const randomBytes = getRandomBytes(8);
    const clockSeq = ((randomBytes[0] & 0x3f) | 0x80).toString(16).padStart(2, '0') +
                     randomBytes[1].toString(16).padStart(2, '0');

    // Simulated 48-bit node ID with multicast bit set
    randomBytes[2] |= 0x01;
    const node = bytesToHex(randomBytes.slice(2, 8));

    return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`;
}

/**
 * Generate NanoID with customizable alphabet and length
 */
export function generateNanoId(length = 21, alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-'): string {
    const bytes = getRandomBytes(length);
    let id = '';
    const alphaLen = alphabet.length;
    for (let i = 0; i < length; i++) {
        id += alphabet[bytes[i] % alphaLen];
    }
    return id;
}

/**
 * Generate ULID (Universally Unique Lexicographically Sortable Identifier)
 */
export function generateUlid(): string {
    const now = Date.now();
    let timeStr = '';
    let t = now;
    for (let i = 9; i >= 0; i--) {
        const mod = t % 32;
        timeStr = CROCKFORD_BASE32[mod] + timeStr;
        t = Math.floor(t / 32);
    }

    const randomBytes = getRandomBytes(10);
    let randStr = '';
    for (let i = 0; i < 16; i++) {
        const byteIndex = Math.floor((i * 10) / 16);
        randStr += CROCKFORD_BASE32[randomBytes[byteIndex] % 32];
    }

    return timeStr + randStr;
}

/**
 * Generate CUID2 collision-resistant id
 */
export function generateCuid2(length = 24): string {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const firstChar = letters[getRandomBytes(1)[0] % letters.length];
    const alphaNum = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = getRandomBytes(length - 1);
    let rest = '';
    for (let i = 0; i < length - 1; i++) {
        rest += alphaNum[randomBytes[i] % alphaNum.length];
    }
    return firstChar + rest;
}

/**
 * Generate Nil UUID
 */
export function generateNilUuid(): string {
    return '00000000-0000-0000-0000-000000000000';
}

/**
 * Convert a standard hex UUID string to raw bytes and Base64
 */
export function uuidToBase64(uuidStr: string): string {
    const clean = uuidStr.replace(/[^0-9a-fA-F]/g, '');
    if (clean.length !== 32) return '';
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
    }
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Generate a single raw identifier based on type
 */
export function generateRawIdentifier(type: IdentifierType, nanoIdLength?: number, nanoIdAlphabet?: string): string {
    switch (type) {
        case 'v4':
            return generateUuidV4();
        case 'v7':
            return generateUuidV7();
        case 'v1':
            return generateUuidV1();
        case 'nanoid':
            return generateNanoId(nanoIdLength || 21, nanoIdAlphabet);
        case 'ulid':
            return generateUlid();
        case 'cuid2':
            return generateCuid2();
        case 'nil':
            return generateNilUuid();
        default:
            return generateUuidV4();
    }
}

/**
 * Format a raw identifier string with custom flags (hyphens, braces, quotes, urn, base64)
 */
export function formatIdentifier(raw: string, options: Partial<IdentifierFormatOptions>): string {
    let result = raw;

    const isUuidType = !['nanoid', 'ulid', 'cuid2'].includes(options.type || 'v4');

    if (isUuidType) {
        const clean = raw.replace(/-/g, '');
        if (clean.length === 32) {
            if (options.hyphens === false) {
                result = clean;
            } else {
                result = `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
            }
        }
    }

    if (options.uppercase) {
        result = result.toUpperCase();
    } else {
        result = result.toLowerCase();
    }

    if (options.encodeBase64 && isUuidType) {
        const b64 = uuidToBase64(raw);
        if (b64) result = b64;
    }

    if (options.urnPrefix && isUuidType) {
        result = `urn:uuid:${result}`;
    }

    if (options.braces && isUuidType) {
        result = `{${result}}`;
    }

    if (options.quotes === 'single') {
        result = `'${result}'`;
    } else if (options.quotes === 'double') {
        result = `"${result}"`;
    }

    return result;
}

/**
 * Generate a batch of formatted identifiers
 */
export function generateIdentifierBatch(options: IdentifierFormatOptions): string[] {
    const count = Math.max(1, Math.min(5000, options.count || 1));
    const results: string[] = [];

    for (let i = 0; i < count; i++) {
        const raw = generateRawIdentifier(options.type, options.nanoIdLength, options.nanoIdAlphabet);
        results.push(formatIdentifier(raw, options));
    }

    return results;
}

/**
 * Format timestamp into Persian Jalali date string
 */
function formatToJalali(date: Date): string {
    const j = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${j.jy}/${j.jm.toString().padStart(2, '0')}/${j.jd.toString().padStart(2, '0')} ${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Inspects and decodes any UUID string
 */
export function inspectUuid(input: string): UuidInspectionResult {
    const trimmed = (input || '').trim();
    if (!trimmed) {
        return { raw: '', isValid: false, errorReason: 'empty_input' };
    }

    // Strip optional enclosing braces or urn prefix
    let clean = trimmed;
    if (clean.toLowerCase().startsWith('urn:uuid:')) {
        clean = clean.substring(9);
    }
    if (clean.startsWith('{') && clean.endsWith('}')) {
        clean = clean.substring(1, clean.length - 1);
    }
    clean = clean.replace(/["']/g, '').trim();

    // Standard UUID format regex: 8-4-4-4-12 hex or 32 raw hex
    const uuidHyphenRegex = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i;
    const uuidCleanRegex = /^([0-9a-f]{32})$/i;

    let match = clean.match(uuidHyphenRegex);
    let hexString = '';

    if (match) {
        hexString = `${match[1]}${match[2]}${match[3]}${match[4]}${match[5]}`.toLowerCase();
    } else if (clean.match(uuidCleanRegex)) {
        hexString = clean.toLowerCase();
        match = [
            clean,
            hexString.slice(0, 8),
            hexString.slice(8, 12),
            hexString.slice(12, 16),
            hexString.slice(16, 20),
            hexString.slice(20, 32),
        ];
    } else {
        return {
            raw: trimmed,
            isValid: false,
            errorReason: 'invalid_format',
        };
    }

    const hyphenated = `${hexString.slice(0, 8)}-${hexString.slice(8, 12)}-${hexString.slice(12, 16)}-${hexString.slice(16, 20)}-${hexString.slice(20, 32)}`;

    // Nil UUID check
    if (hexString === '00000000000000000000000000000000') {
        return {
            raw: trimmed,
            isValid: true,
            version: 'Nil UUID',
            versionNumber: 0,
            variant: 'N/A',
            hyphenated,
            cleanHex: hexString,
            uppercase: hyphenated.toUpperCase(),
            base64: uuidToBase64(hyphenated),
            urn: `urn:uuid:${hyphenated}`,
        };
    }

    // Extract Version (bits 48-51, 13th hex char)
    const versionNibble = parseInt(hexString[12], 16);

    // Extract Variant (bits 64-65, 17th hex char)
    const variantNibble = parseInt(hexString[16], 16);
    let variantName = 'Unknown';
    if ((variantNibble & 0x8) === 0) {
        variantName = 'NCS backward compatibility';
    } else if ((variantNibble & 0xc) === 0x8) {
        variantName = 'RFC 4122 / RFC 9562 (Leach-Salz standard)';
    } else if ((variantNibble & 0xe) === 0xc) {
        variantName = 'Microsoft Corporation GUID';
    } else {
        variantName = 'Reserved for future definition';
    }

    let timestamp: Date | undefined;
    let formattedTimestampUtc: string | undefined;
    let formattedTimestampLocal: string | undefined;
    let formattedTimestampShamsi: string | undefined;

    // Check version timestamp
    if (versionNibble === 7) {
        // UUID v7: first 48 bits (12 hex digits) are Unix timestamp in ms
        const msHex = hexString.slice(0, 12);
        const epochMs = parseInt(msHex, 16);
        if (!isNaN(epochMs) && epochMs > 0 && epochMs < 32503680000000) {
            timestamp = new Date(epochMs);
            formattedTimestampUtc = timestamp.toUTCString();
            formattedTimestampLocal = timestamp.toLocaleString();
            formattedTimestampShamsi = formatToJalali(timestamp);
        }
    } else if (versionNibble === 1) {
        // UUID v1: 60-bit timestamp in 100-ns intervals since Oct 15, 1582
        const timeLow = hexString.slice(0, 8);
        const timeMid = hexString.slice(8, 12);
        const timeHi = hexString.slice(13, 16);
        const time60Hex = `${timeHi}${timeMid}${timeLow}`;
        try {
            const time100Ns = BigInt(`0x${time60Hex}`);
            const gregorianOffset = 12219292800000n * 10000n;
            const epochMs = Number((time100Ns - gregorianOffset) / 10000n);
            if (!isNaN(epochMs) && epochMs > -2000000000000 && epochMs < 32503680000000) {
                timestamp = new Date(epochMs);
                formattedTimestampUtc = timestamp.toUTCString();
                formattedTimestampLocal = timestamp.toLocaleString();
                formattedTimestampShamsi = formatToJalali(timestamp);
            }
        } catch {}
    }

    const versionLabels: Record<number, string> = {
        1: 'UUID v1 (زمان‌محور و سخت‌افزاری / Time-based)',
        2: 'UUID v2 (DCE Security)',
        3: 'UUID v3 (هش‌محور MD5 / Namespace MD5)',
        4: 'UUID v4 (تصادفی امن رمزنگاری‌شده / Cryptographically Random)',
        5: 'UUID v5 (هش‌محور SHA-1 / Namespace SHA-1)',
        6: 'UUID v6 (زمان‌محور بهینه‌شده)',
        7: 'UUID v7 (جدیدترین استاندارد RFC 9562 - مرتب‌شده زمانی بر اساس میلی‌ثانیه)',
        8: 'UUID v8 (سفارشی)',
    };

    return {
        raw: trimmed,
        isValid: true,
        version: versionLabels[versionNibble] || `Version ${versionNibble}`,
        versionNumber: versionNibble,
        variant: variantName,
        timestamp,
        formattedTimestampUtc,
        formattedTimestampLocal,
        formattedTimestampShamsi,
        hyphenated,
        cleanHex: hexString,
        uppercase: hyphenated.toUpperCase(),
        base64: uuidToBase64(hyphenated),
        urn: `urn:uuid:${hyphenated}`,
    };
}

/**
 * Format a list of IDs into code or file syntax
 */
export function exportIdentifiersToFormat(ids: string[], format: ExportFormat, options?: Partial<IdentifierFormatOptions>): string {
    switch (format) {
        case 'json':
            return JSON.stringify(ids, null, 2);
        case 'sql': {
            const table = options?.sqlTableName || 'items';
            const col = options?.sqlColumnName || 'id';
            return ids.map((id) => `INSERT INTO ${table} (${col}) VALUES ('${id.replace(/'/g, '')}');`).join('\n');
        }
        case 'csv':
            return `id\n${ids.join('\n')}`;
        case 'js':
            return `const ids = [\n  ${ids.map((id) => `"${id.replace(/"/g, '')}"`).join(',\n  ')}\n];`;
        case 'python':
            return `ids = [\n    ${ids.map((id) => `"${id.replace(/"/g, '')}"`).join(',\n    ')}\n]`;
        case 'go':
            return `ids := []string{\n\t${ids.map((id) => `"${id.replace(/"/g, '')}"`).join(',\n\t')},\n}`;
        case 'text':
        default:
            return ids.join('\n');
    }
}
