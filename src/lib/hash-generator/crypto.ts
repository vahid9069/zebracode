import type {
    ChecksumVerificationResult,
    HashAlgorithm,
    HashResultItem,
} from './types';

// ==========================================
// CRC32 Pure Implementation
// ==========================================
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    CRC_TABLE[i] = c;
}

export function computeCrc32(bytes: Uint8Array): { hex: string; uint32: number } {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
    }
    const finalVal = (crc ^ 0xffffffff) >>> 0;
    return {
        hex: finalVal.toString(16).padStart(8, '0'),
        uint32: finalVal,
    };
}

// ==========================================
// MD5 Pure Implementation (RFC 1321)
// ==========================================
function md5Cycle(x: Int32Array, k: number[]): void {
    let a = x[0], b = x[1], c = x[2], d = x[3];

    const cmn = (q: number, a: number, b: number, x: number, s: number, t: number) => {
        a = (a + q + x + t) | 0;
        return (((a << s) | (a >>> (32 - s))) + b) | 0;
    };
    const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
        cmn((b & c) | (~b & d), a, b, x, s, t);
    const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
        cmn((b & d) | (c & ~d), a, b, x, s, t);
    const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
        cmn(b ^ c ^ d, a, b, x, s, t);
    const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
        cmn(c ^ (b | ~d), a, b, x, s, t);

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = (x[0] + a) | 0;
    x[1] = (x[1] + b) | 0;
    x[2] = (x[2] + c) | 0;
    x[3] = (x[3] + d) | 0;
}

export function computeMd5(bytes: Uint8Array): string {
    const n = bytes.length;
    const state = new Int32Array([1732584193, -271733879, -1732584194, 271733878]);
    const block = new Array(16);

    let i = 0;
    for (i = 64; i <= n; i += 64) {
        for (let j = 0; j < 16; j++) {
            const idx = i - 64 + (j << 2);
            block[j] = bytes[idx] | (bytes[idx + 1] << 8) | (bytes[idx + 2] << 16) | (bytes[idx + 3] << 24);
        }
        md5Cycle(state, block);
    }

    const tail = new Uint8Array(64);
    const rem = n % 64;
    tail.set(bytes.subarray(n - rem), 0);
    tail[rem] = 0x80;

    if (rem >= 56) {
        for (let j = 0; j < 16; j++) {
            const idx = j << 2;
            block[j] = tail[idx] | (tail[idx + 1] << 8) | (tail[idx + 2] << 16) | (tail[idx + 3] << 24);
        }
        md5Cycle(state, block);
        tail.fill(0);
    }

    for (let j = 0; j < 14; j++) {
        const idx = j << 2;
        block[j] = tail[idx] | (tail[idx + 1] << 8) | (tail[idx + 2] << 16) | (tail[idx + 3] << 24);
    }

    const bitLen = n * 8;
    block[14] = bitLen & 0xffffffff;
    block[15] = Math.floor(bitLen / 0x100000000);
    md5Cycle(state, block);

    let hex = '';
    for (let j = 0; j < 4; j++) {
        const v = state[j];
        hex += (v & 0xff).toString(16).padStart(2, '0');
        hex += ((v >>> 8) & 0xff).toString(16).padStart(2, '0');
        hex += ((v >>> 16) & 0xff).toString(16).padStart(2, '0');
        hex += ((v >>> 24) & 0xff).toString(16).padStart(2, '0');
    }
    return hex;
}

// ==========================================
// SubtleCrypto Helpers (SHA-1, SHA-256, etc.)
// ==========================================
export async function computeSubtleHash(
    algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512',
    data: ArrayBuffer | Uint8Array
): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('Web Cryptography API is unavailable');
    }
    const digest = await crypto.subtle.digest(algorithm, data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function computeHmac(
    algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512',
    keyString: string,
    data: Uint8Array
): Promise<{ hex: string; base64: string }> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('Web Cryptography API is unavailable');
    }
    const enc = new TextEncoder();
    const keyData = enc.encode(keyString || '');

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: { name: algorithm } },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    const uint8 = new Uint8Array(signature);
    const hex = Array.from(uint8, (b) => b.toString(16).padStart(2, '0')).join('');

    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);

    return { hex, base64 };
}

// Convert Hex string to Base64
export function hexToBase64(hex: string): string {
    const clean = hex.replace(/[^0-9a-fA-F]/g, '');
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
    }
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Computes all standard hash algorithms simultaneously
 */
export async function computeAllHashes(data: Uint8Array): Promise<HashResultItem[]> {
    const [sha1, sha256, sha384, sha512] = await Promise.all([
        computeSubtleHash('SHA-1', data),
        computeSubtleHash('SHA-256', data),
        computeSubtleHash('SHA-384', data),
        computeSubtleHash('SHA-512', data),
    ]);

    const md5 = computeMd5(data);
    const crc32 = computeCrc32(data);

    return [
        {
            algorithm: 'SHA-256',
            bitLength: 256,
            hex: sha256,
            base64: hexToBase64(sha256),
            isSecure: true,
            description: 'استاندارد طلایی رمزنگاری، امضاهای دیجیتال و بیت‌کوین (NIST FIPS 180-4)',
        },
        {
            algorithm: 'SHA-512',
            bitLength: 512,
            hex: sha512,
            base64: hexToBase64(sha512),
            isSecure: true,
            description: 'بالاترین سطح امنیت رمزنگاری با طول کلید ۵۱۲ بیت (NSA Suite B)',
        },
        {
            algorithm: 'MD5',
            bitLength: 128,
            hex: md5,
            base64: hexToBase64(md5),
            isSecure: false,
            description: 'چک‌سام کلاسیک ۱۲۸ بیتی؛ سریع برای بررسی یکپارچگی فایل‌ها (غیر امن برای پسورد)',
        },
        {
            algorithm: 'SHA-1',
            bitLength: 160,
            hex: sha1,
            base64: hexToBase64(sha1),
            isSecure: false,
            description: 'مورد استفاده در سیستم گیت (Git Commit Hash)؛ منسوخ‌شده برای امنیت تراکنش',
        },
        {
            algorithm: 'SHA-384',
            bitLength: 384,
            hex: sha384,
            base64: hexToBase64(sha384),
            isSecure: true,
            description: 'شاخه با امنیت تقویت‌شده SHA-2 مناسب برای گواهی‌های امنیتی SSL/TLS',
        },
        {
            algorithm: 'CRC32',
            bitLength: 32,
            hex: crc32.hex,
            isSecure: false,
            description: `چک‌سام سریع شبکه‌ای و فایل‌های فشرده ZIP/PNG (مقدار ده‌دهی: ${crc32.uint32})`,
        },
    ];
}

/**
 * Checks an expected hash against the computed hashes
 */
export function verifyChecksum(expectedInput: string, computed: HashResultItem[]): ChecksumVerificationResult {
    const cleanExpected = expectedInput.replace(/[\s\r\n\t]/g, '').trim();
    if (!cleanExpected) {
        return { expected: '', matched: false, isMatchCaseInsensitive: false };
    }

    for (const item of computed) {
        if (cleanExpected.toLowerCase() === item.hex.toLowerCase()) {
            return {
                expected: cleanExpected,
                matched: true,
                matchedAlgorithm: item.algorithm,
                isMatchCaseInsensitive: cleanExpected !== item.hex,
            };
        }
    }

    return {
        expected: cleanExpected,
        matched: false,
        isMatchCaseInsensitive: false,
    };
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
