import { createHash, webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { phaseOneTools } from '@/lib/developer-tools/phase-one';
import { DeveloperToolError, type DeveloperToolCopies } from '@/lib/developer-tools/types';
import english from '@/dictionaries/en/developer-phase-one.json';
import persian from '@/dictionaries/fa/developer-phase-one.json';

const copies: DeveloperToolCopies[] = [english, persian];

function run(slug: string, values: Record<string, string>): Promise<string> {
    const tool = phaseOneTools.find(candidate => candidate.slug === slug);
    if (!tool) throw new Error('Missing test tool');
    return Promise.resolve().then(() => tool.run(values));
}

async function expectError(slug: string, values: Record<string, string>, code: string) {
    await expect(run(slug, values)).rejects.toMatchObject({ name: 'DeveloperToolError', code, message: code });
    for (const locale of copies) expect(locale[slug].errors?.[code]).toBeTruthy();
}

beforeEach(() => {
    // The same standard Web Crypto API as a secure-context browser, without a DOM shim.
    vi.stubGlobal('crypto', webcrypto);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('phase-one local utility contract', () => {
    it('exports exactly the requested tools with complete English and Persian copy', () => {
        expect(phaseOneTools.map(tool => tool.slug)).toEqual([
            'uuid-generator', 'hash-generator', 'case-converter', 'slug-generator',
            'line-ending-converter', 'whitespace-inspector', 'http-status-lookup', 'mime-type-lookup',
        ]);
        for (const locale of copies) {
            expect(Object.keys(locale).sort()).toEqual(phaseOneTools.map(tool => tool.slug).sort());
            for (const tool of phaseOneTools) {
                const copy = locale[tool.slug];
                expect(copy.title).toBeTruthy();
                expect(copy.shortDescription).toBeTruthy();
                expect(copy.description).toBeTruthy();
                expect(copy.note).toBeTruthy();
                for (const field of tool.fields) {
                    expect(copy.fields[field.id]).toBeTruthy();
                    for (const value of field.options ?? []) expect(copy.options?.[value]).toBeTruthy();
                }
            }
        }
    });

    it.each(phaseOneTools.map(tool => [tool.slug, tool] as const))('runs the %s sample', async (_slug, tool) => {
        const result = await tool.run(tool.sample);
        expect(result).toBeTypeOf('string');
        expect(result).not.toBe('');
    });
});

describe('UUID generator', () => {
    it('creates RFC version-4/variant-1 identifiers with bounded counts and secure entropy', async () => {
        const insecureRandom = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Insecure randomness'); });
        const values = (await run('uuid-generator', { version: 'v4', count: '1000' })).split('\n');
        expect(values).toHaveLength(1000);
        expect(new Set(values).size).toBe(1000);
        for (const value of values) expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(insecureRandom).not.toHaveBeenCalled();
    });

    it('encodes the exact 48-bit Unix millisecond timestamp in UUID v7', async () => {
        const timestamp = 1_792_281_234_567;
        vi.spyOn(Date, 'now').mockReturnValue(timestamp);
        const values = (await run('uuid-generator', { version: 'v7', count: '4' })).split('\n');
        for (const value of values) {
            expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
            expect(Number.parseInt(value.replace(/-/g, '').slice(0, 12), 16)).toBe(timestamp);
        }
        expect(new Set(values).size).toBe(4);
    });

    it.each(['0', '-1', '1001', '1.5', '1e2', '', '۰۰۲', 'Infinity', '2;private'])('rejects count %s without echoing it', async count => {
        await expectError('uuid-generator', { version: 'v4', count }, 'invalid_count');
    });

    it('handles unavailable entropy, invalid versions and invalid clocks explicitly', async () => {
        await expectError('uuid-generator', { version: 'v1', count: '1' }, 'invalid_option');
        vi.spyOn(Date, 'now').mockReturnValue(-1);
        await expectError('uuid-generator', { version: 'v7', count: '1' }, 'invalid_timestamp');
        vi.stubGlobal('crypto', undefined);
        await expectError('uuid-generator', { version: 'v4', count: '1' }, 'crypto_unavailable');
    });

    it('does not expose platform errors when secure entropy fails', async () => {
        vi.stubGlobal('crypto', { getRandomValues: () => { throw new Error('private platform details'); } });
        await expectError('uuid-generator', { version: 'v4', count: '1' }, 'crypto_unavailable');
    });
});

describe('Web Crypto hash generator', () => {
    it.each(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'])('matches independent UTF-8 %s vectors including empty text', async algorithm => {
        for (const input of ['', 'abc', 'سلام دنیا 👩‍💻\r\n', 'cafe\u0301']) {
            const digest = await run('hash-generator', { input, algorithm });
            expect(digest).toBe(createHash(algorithm.toLowerCase().replace('-', '')).update(input, 'utf8').digest('hex'));
            expect(digest).toMatch(/^[0-9a-f]+$/);
            expect(digest).toHaveLength(({ 'SHA-1': 40, 'SHA-256': 64, 'SHA-384': 96, 'SHA-512': 128 })[algorithm]!);
        }
    });

    it('hashes exact text without Unicode normalization or newline changes', async () => {
        const hash = (input: string) => run('hash-generator', { input, algorithm: 'SHA-256' });
        expect(await hash('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
        expect(await hash('café')).not.toBe(await hash('cafe\u0301'));
        expect(await hash('a\r\nb')).not.toBe(await hash('a\nb'));
    });

    it('does not pretend to provide MD5 and reports missing crypto without input leakage', async () => {
        await expectError('hash-generator', { input: 'private', algorithm: 'MD5' }, 'invalid_option');
        vi.stubGlobal('crypto', undefined);
        await expectError('hash-generator', { input: 'private', algorithm: 'SHA-256' }, 'crypto_unavailable');
    });

    it('maps rejected Web Crypto operations to a localized code without platform details', async () => {
        vi.stubGlobal('crypto', { subtle: { digest: async () => { throw new Error('private platform details'); } } });
        await expectError('hash-generator', { input: 'private', algorithm: 'SHA-512' }, 'crypto_unavailable');
    });
});

describe('case converter', () => {
    it.each([
        ['camel', 'xmlHttpRequestHelloWorldÉcole42'],
        ['pascal', 'XmlHttpRequestHelloWorldÉcole42'],
        ['snake', 'xml_http_request_hello_world_école42'],
        ['kebab', 'xml-http-request-hello-world-école42'],
        ['upper', '  XMLHTTPREQUEST HELLO-WORLD_ÉCOLE42  '],
    ])('converts acronym and existing case boundaries to %s', async (style, expected) => {
        expect(await run('case-converter', { input: '  XMLHttpRequest hello-world_école42  ', style })).toBe(expected);
    });

    it('preserves Persian, combining accents and supplementary-plane letter case', async () => {
        expect(await run('case-converter', { input: 'سلام دنیا ۲۰۲۶', style: 'snake' })).toBe('سلام_دنیا_۲۰۲۶');
        expect(await run('case-converter', { input: 'cafe\u0301 test', style: 'pascal' })).toBe('CaféTest');
        expect(await run('case-converter', { input: '𐐨 word', style: 'pascal' })).toBe('𐐀Word');
        expect(await run('case-converter', { input: '', style: 'camel' })).toBe('');
        expect(await run('case-converter', { input: '---😀', style: 'snake' })).toBe('');
        await expectError('case-converter', { input: 'private', style: 'unknown' }, 'invalid_option');
    });
});

describe('Unicode slug generator', () => {
    it('retains Persian letters and digits, replaces half-spaces and normalizes accented English', async () => {
        expect(await run('slug-generator', { input: '  پیش\u200cفرض، سلام دنیا! CAFE\u0301 ۲۰۲۶ 😀 ' }))
            .toBe('پیش-فرض-سلام-دنیا-café-۲۰۲۶');
        expect(await run('slug-generator', { input: 'اَلْعَرَبِيَّةُ / 日本語 -- Hello' }))
            .toBe('اَلْعَرَبِيَّةُ-日本語-hello'.normalize('NFC'));
    });

    it('returns explicit errors for empty or symbol-only text', async () => {
        await expectError('slug-generator', { input: ' \t\n' }, 'empty_input');
        await expectError('slug-generator', { input: '😀 --- \u0301' }, 'no_slug');
    });
});

describe('line ending converter', () => {
    it.each([['LF', '\n'], ['CRLF', '\r\n'], ['CR', '\r']])('converts mixed endings to %s without losing empty or trailing lines', async (ending, separator) => {
        expect(await run('line-ending-converter', { input: 'a\r\nb\rc\n\n', ending }))
            .toBe(['a', 'b', 'c', '', ''].join(separator));
        expect(await run('line-ending-converter', { input: '\r\r\n\n', ending })).toBe(separator.repeat(3));
        expect(await run('line-ending-converter', { input: 'سلام\u2028دنیا\u2029', ending })).toBe('سلام\u2028دنیا\u2029');
        expect(await run('line-ending-converter', { input: '', ending })).toBe('');
    });

    it('rejects unsupported newline settings', async () => {
        await expectError('line-ending-converter', { input: 'private', ending: 'auto' }, 'invalid_option');
    });
});

describe('whitespace inspector', () => {
    it('reveals common invisible characters and preserves LF display rows', async () => {
        expect(await run('whitespace-inspector', { input: 'a \t\r\n\u00a0\u200b\u200c\u200d\ufeff\v\f\u0085\u2028\u2029\u2060' }))
            .toBe('a[SP][TAB][CR][LF]\n[NBSP][ZWSP][ZWNJ][ZWJ][BOM][VT][FF][NEL][LS][PS][WJ]');
    });

    it('reveals Unicode spacing/direction controls as plain tokens and does not generate markup', async () => {
        expect(await run('whitespace-inspector', { input: '\u200e\u200f\u061c\u2009\u202e\u0000' }))
            .toBe('[LRM][RLM][ALM][U+2009][U+202E][U+0000]');
        expect(await run('whitespace-inspector', { input: '<b>سلام</b>😀' })).toBe('<b>سلام</b>😀');
        expect(await run('whitespace-inspector', { input: '' })).toBe('');
    });
});

describe('HTTP status reference', () => {
    it.each([
        ['100', 'Continue'], ['103', 'Early Hints'], ['204', 'No Content'], ['207', 'Multi-Status'],
        ['226', 'IM Used'], ['308', 'Permanent Redirect'], ['418', "I'm a teapot"],
        ['422', 'Unprocessable Content'], ['429', 'Too Many Requests'],
        ['451', 'Unavailable For Legal Reasons'], ['503', 'Service Unavailable'], ['511', 'Network Authentication Required'],
    ])('resolves %s correctly', async (code, phrase) => {
        expect(JSON.parse(await run('http-status-lookup', { code }))).toEqual({ code: Number(code), phrase });
    });

    it('distinguishes invalid syntax from an unlisted status and never guesses', async () => {
        await expectError('http-status-lookup', { code: '200 OK private' }, 'invalid_status');
        await expectError('http-status-lookup', { code: '۲۰۰' }, 'invalid_status');
        await expectError('http-status-lookup', { code: '2e2' }, 'invalid_status');
        await expectError('http-status-lookup', { code: '599' }, 'unknown_status');
        await expectError('http-status-lookup', { code: '306' }, 'unknown_status');
    });
});

describe('MIME type catalog', () => {
    it.each([
        ['.JPG', 'image/jpeg', ['jpg', 'jpeg', 'jpe']],
        ['report.pdf', 'application/pdf', ['pdf']],
        ['archive.tar.gz', 'application/gzip', ['gz', 'gzip']],
        ['woff2', 'font/woff2', ['woff2']],
        ['application/json', 'application/json', ['json', 'map']],
        [' TEXT/HTML; charset=utf-8 ', 'text/html', ['html', 'htm']],
        ['xml', 'application/xml', ['xml']],
        ['application/xml', 'application/xml', ['xml']],
        ['text/xml', 'text/xml', ['xml']],
    ])('looks up %s', async (query, mimeType, extensions) => {
        expect(JSON.parse(await run('mime-type-lookup', { query }))).toEqual({ mimeType, extensions });
    });

    it('reports unknown formats, malformed media types, empty queries and paths explicitly', async () => {
        await expectError('mime-type-lookup', { query: 'private.unknown-ext' }, 'unknown_mime');
        await expectError('mime-type-lookup', { query: 'application/x-private-unknown' }, 'unknown_mime');
        await expectError('mime-type-lookup', { query: '' }, 'empty_input');
        await expectError('mime-type-lookup', { query: 'not /a type' }, 'invalid_mime_input');
        await expectError('mime-type-lookup', { query: 'https://private.example/a.jpg' }, 'invalid_mime_input');
        await expectError('mime-type-lookup', { query: 'C:\\private\\photo.jpg' }, 'invalid_mime_input');
    });
});

describe('malformed Unicode handling', () => {
    it.each(['\ud800', '\udfff', 'private\ud800a'])('rejects unpaired surrogates without replacing or disclosing text', async input => {
        for (const [slug, values] of [
            ['hash-generator', { input, algorithm: 'SHA-256' }],
            ['case-converter', { input, style: 'camel' }],
            ['slug-generator', { input }],
            ['line-ending-converter', { input, ending: 'LF' }],
            ['whitespace-inspector', { input }],
            ['mime-type-lookup', { query: input }],
        ] as [string, Record<string, string>][]) {
            await expectError(slug, values, 'invalid_unicode');
        }
        expect(new DeveloperToolError('invalid_unicode').message).toBe('invalid_unicode');
    });
});
