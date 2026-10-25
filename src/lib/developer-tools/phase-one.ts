import { DeveloperToolError, type DeveloperToolDefinition } from './types';

function textInput(value = ''): string {
    // Reject lone UTF-16 surrogates instead of silently hashing replacement characters.
    for (let index = 0; index < value.length; index += 1) {
        const unit = value.charCodeAt(index);
        if (unit >= 0xd800 && unit <= 0xdbff) {
            const next = value.charCodeAt(++index);
            if (!(next >= 0xdc00 && next <= 0xdfff)) throw new DeveloperToolError('invalid_unicode');
        } else if (unit >= 0xdc00 && unit <= 0xdfff) {
            throw new DeveloperToolError('invalid_unicode');
        }
    }
    return value;
}

function option(value: string, choices: readonly string[]): string {
    if (!choices.includes(value)) throw new DeveloperToolError('invalid_option');
    return value;
}

function uuid(version: string): string {
    if (!globalThis.crypto?.getRandomValues) throw new DeveloperToolError('crypto_unavailable');
    let bytes: Uint8Array;
    try {
        bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    } catch {
        throw new DeveloperToolError('crypto_unavailable');
    }
    if (version === 'v7') {
        let timestamp = Date.now();
        if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > 0xffffffffffff) {
            throw new DeveloperToolError('invalid_timestamp');
        }
        for (let index = 5; index >= 0; index -= 1) {
            bytes[index] = timestamp % 256;
            timestamp = Math.floor(timestamp / 256);
        }
    }
    bytes[6] = (bytes[6] & 0x0f) | (version === 'v7' ? 0x70 : 0x40);
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function words(input: string): string[] {
    return input.normalize('NFC')
        .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
        .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
        .match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu) ?? [];
}

function capitalize(value: string): string {
    const [first, ...rest] = Array.from(value);
    return first ? first.toUpperCase() + rest.join('') : '';
}

// Standard HTTP reason phrases are reference data, not interface copy.
const httpStatuses: Record<number, string> = {
    100: 'Continue', 101: 'Switching Protocols', 102: 'Processing', 103: 'Early Hints',
    200: 'OK', 201: 'Created', 202: 'Accepted', 203: 'Non-Authoritative Information',
    204: 'No Content', 205: 'Reset Content', 206: 'Partial Content', 207: 'Multi-Status',
    208: 'Already Reported', 226: 'IM Used',
    300: 'Multiple Choices', 301: 'Moved Permanently', 302: 'Found', 303: 'See Other',
    304: 'Not Modified', 305: 'Use Proxy', 307: 'Temporary Redirect', 308: 'Permanent Redirect',
    400: 'Bad Request', 401: 'Unauthorized', 402: 'Payment Required', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed', 406: 'Not Acceptable',
    407: 'Proxy Authentication Required', 408: 'Request Timeout', 409: 'Conflict',
    410: 'Gone', 411: 'Length Required', 412: 'Precondition Failed', 413: 'Content Too Large',
    414: 'URI Too Long', 415: 'Unsupported Media Type', 416: 'Range Not Satisfiable',
    417: 'Expectation Failed', 418: "I'm a teapot", 421: 'Misdirected Request',
    422: 'Unprocessable Content', 423: 'Locked', 424: 'Failed Dependency', 425: 'Too Early',
    426: 'Upgrade Required', 428: 'Precondition Required', 429: 'Too Many Requests',
    431: 'Request Header Fields Too Large', 451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error', 501: 'Not Implemented', 502: 'Bad Gateway',
    503: 'Service Unavailable', 504: 'Gateway Timeout', 505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates', 507: 'Insufficient Storage', 508: 'Loop Detected',
    510: 'Not Extended', 511: 'Network Authentication Required',
};

// A deliberately finite extension catalog; this is not content sniffing or the IANA registry.
const mimeCatalog: Record<string, string[]> = {
    'text/plain': ['txt', 'text', 'log'],
    'text/html': ['html', 'htm'],
    'text/css': ['css'],
    'text/csv': ['csv'],
    'text/tab-separated-values': ['tsv'],
    'text/markdown': ['md', 'markdown'],
    'text/javascript': ['js', 'mjs'],
    'application/xml': ['xml'],
    'text/calendar': ['ics'],
    'application/json': ['json', 'map'],
    'application/ld+json': ['jsonld'],
    'text/xml': ['xml'],
    'application/pdf': ['pdf'],
    'application/zip': ['zip'],
    'application/gzip': ['gz', 'gzip'],
    'application/x-tar': ['tar'],
    'application/x-7z-compressed': ['7z'],
    'application/vnd.rar': ['rar'],
    'application/octet-stream': ['bin'],
    'application/wasm': ['wasm'],
    'application/rtf': ['rtf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/vnd.ms-excel': ['xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'application/vnd.ms-powerpoint': ['ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
    'application/vnd.oasis.opendocument.text': ['odt'],
    'application/vnd.oasis.opendocument.spreadsheet': ['ods'],
    'application/vnd.oasis.opendocument.presentation': ['odp'],
    'application/epub+zip': ['epub'],
    'application/x-httpd-php': ['php'],
    'application/x-sh': ['sh'],
    'application/x-bzip': ['bz'],
    'application/x-bzip2': ['bz2'],
    'application/vnd.apple.installer+xml': ['mpkg'],
    'application/vnd.amazon.ebook': ['azw'],
    'application/vnd.mozilla.xul+xml': ['xul'],
    'application/vnd.visio': ['vsd'],
    'image/jpeg': ['jpg', 'jpeg', 'jpe'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'image/avif': ['avif'],
    'image/svg+xml': ['svg'],
    'image/bmp': ['bmp'],
    'image/tiff': ['tif', 'tiff'],
    'image/vnd.microsoft.icon': ['ico'],
    'image/heic': ['heic'],
    'audio/mpeg': ['mp3'],
    'audio/wav': ['wav'],
    'audio/ogg': ['oga', 'ogg'],
    'audio/opus': ['opus'],
    'audio/aac': ['aac'],
    'audio/flac': ['flac'],
    'audio/mp4': ['m4a'],
    'audio/midi': ['mid', 'midi'],
    'audio/webm': ['weba'],
    'video/mp4': ['mp4', 'm4v'],
    'video/mpeg': ['mpeg', 'mpg'],
    'video/webm': ['webm'],
    'video/ogg': ['ogv'],
    'video/quicktime': ['mov'],
    'video/x-msvideo': ['avi'],
    'font/woff': ['woff'],
    'font/woff2': ['woff2'],
    'font/ttf': ['ttf'],
    'font/otf': ['otf'],
    'application/vnd.ms-fontobject': ['eot'],
};

const whitespaceTokens: Record<string, string> = {
    ' ': '[SP]', '\t': '[TAB]', '\r': '[CR]', '\n': '[LF]\n',
    '\u00a0': '[NBSP]', '\u200b': '[ZWSP]', '\u200c': '[ZWNJ]', '\u200d': '[ZWJ]',
    '\ufeff': '[BOM]', '\v': '[VT]', '\f': '[FF]', '\u0085': '[NEL]',
    '\u2028': '[LS]', '\u2029': '[PS]', '\u2060': '[WJ]',
    '\u200e': '[LRM]', '\u200f': '[RLM]', '\u061c': '[ALM]',
};

export const phaseOneTools: DeveloperToolDefinition[] = [
    {
        slug: 'uuid-generator', category: 'generators', subCategory: 'identifiers',
        fields: [
            { id: 'version', type: 'select', options: ['v4', 'v7'] },
            { id: 'count', type: 'number', min: 1, max: 1000 },
        ],
        sample: { version: 'v4', count: '3' },
        outputExtension: 'txt',
        run: ({ version, count }) => {
            option(version, ['v4', 'v7']);
            const normalizedCount = (count ?? '').trim();
            if (!/^[1-9]\d{0,3}$/.test(normalizedCount) || Number(normalizedCount) > 1000) {
                throw new DeveloperToolError('invalid_count');
            }
            return Array.from({ length: Number(normalizedCount) }, () => uuid(version)).join('\n');
        },
    },
    {
        slug: 'hash-generator', category: 'generators', subCategory: 'hashes',
        fields: [
            { id: 'input', type: 'textarea' },
            { id: 'algorithm', type: 'select', options: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] },
        ],
        sample: { input: 'Hello, ZebraCode! سلام', algorithm: 'SHA-256' },
        outputExtension: 'txt',
        run: async ({ input, algorithm }) => {
            option(algorithm, ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);
            const bytes = new TextEncoder().encode(textInput(input));
            if (!globalThis.crypto?.subtle) throw new DeveloperToolError('crypto_unavailable');
            try {
                const digest = await globalThis.crypto.subtle.digest(algorithm, bytes);
                return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
            } catch {
                throw new DeveloperToolError('crypto_unavailable');
            }
        },
    },
    {
        slug: 'case-converter', category: 'converters', subCategory: 'text',
        fields: [
            { id: 'input', type: 'textarea' },
            { id: 'style', type: 'select', options: ['camel', 'pascal', 'snake', 'kebab', 'upper'] },
        ],
        sample: { input: 'helloWorld HTTP status', style: 'snake' },
        outputExtension: 'txt',
        run: ({ input, style }) => {
            option(style, ['camel', 'pascal', 'snake', 'kebab', 'upper']);
            const text = textInput(input);
            if (style === 'upper') return text.toUpperCase();
            const parts = words(text).map(word => word.toLowerCase());
            if (style === 'snake' || style === 'kebab') return parts.join(style === 'snake' ? '_' : '-');
            return parts.map((part, index) => style === 'camel' && index === 0 ? part : capitalize(part)).join('');
        },
    },
    {
        slug: 'slug-generator', category: 'generators', subCategory: 'text',
        fields: [{ id: 'input', type: 'textarea' }],
        sample: { input: 'سلام دنیا! Hello ZebraCode ۲۰۲۶' },
        outputExtension: 'txt',
        run: ({ input }) => {
            const text = textInput(input);
            if (!text.trim()) throw new DeveloperToolError('empty_input');
            const slug = (text.normalize('NFC').toLowerCase()
                .replace(/[\u200c\u200d]/g, '-')
                .match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu) ?? []).join('-');
            if (!slug) throw new DeveloperToolError('no_slug');
            return slug;
        },
    },
    {
        slug: 'line-ending-converter', category: 'converters', subCategory: 'text',
        fields: [
            { id: 'input', type: 'textarea' },
            { id: 'ending', type: 'select', options: ['LF', 'CRLF', 'CR'] },
        ],
        sample: { input: 'first\r\nsecond\nthird\rfourth\n', ending: 'LF' },
        outputExtension: 'txt',
        run: ({ input, ending }) => {
            option(ending, ['LF', 'CRLF', 'CR']);
            const separator = ending === 'CRLF' ? '\r\n' : ending === 'CR' ? '\r' : '\n';
            return textInput(input).replace(/\r\n|\r|\n/g, separator);
        },
    },
    {
        slug: 'whitespace-inspector', category: 'inspectors', subCategory: 'text',
        fields: [{ id: 'input', type: 'textarea' }],
        sample: { input: 'one two\tthree\r\nNBSP:\u00a0ZWSP:\u200bپیش\u200cفرض' },
        outputExtension: 'txt',
        run: ({ input }) => Array.from(textInput(input), character => {
            if (whitespaceTokens[character]) return whitespaceTokens[character];
            if (/[\p{White_Space}\p{Cf}\p{Cc}]/u.test(character)) {
                return `[U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}]`;
            }
            return character;
        }).join(''),
    },
    {
        slug: 'http-status-lookup', category: 'inspectors', subCategory: 'web',
        fields: [{ id: 'code', type: 'text' }],
        sample: { code: '429' },
        outputExtension: 'json',
        run: ({ code }) => {
            const query = (code ?? '').trim();
            if (!/^\d{3}$/.test(query)) throw new DeveloperToolError('invalid_status');
            const status = Number(query);
            if (!httpStatuses[status]) throw new DeveloperToolError('unknown_status');
            return JSON.stringify({ code: status, phrase: httpStatuses[status] }, null, 2);
        },
    },
    {
        slug: 'mime-type-lookup', category: 'inspectors', subCategory: 'web',
        fields: [{ id: 'query', type: 'text' }],
        sample: { query: '.webp' },
        outputExtension: 'json',
        run: ({ query }) => {
            const normalized = textInput(query).trim().toLowerCase();
            if (!normalized) throw new DeveloperToolError('empty_input');
            let mimeType: string | undefined;
            if (normalized.includes('/')) {
                const type = normalized.split(';', 1)[0].trim();
                if (!/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(type)) {
                    throw new DeveloperToolError('invalid_mime_input');
                }
                if (Object.hasOwn(mimeCatalog, type)) mimeType = type;
            } else {
                if (/[\s\\:;?\u0000-\u001f]/u.test(normalized)) throw new DeveloperToolError('invalid_mime_input');
                const extension = normalized.split('.').at(-1);
                mimeType = Object.keys(mimeCatalog).find(type => mimeCatalog[type].includes(extension ?? ''));
            }
            if (!mimeType) throw new DeveloperToolError('unknown_mime');
            return JSON.stringify({ mimeType, extensions: mimeCatalog[mimeType] }, null, 2);
        },
    },
];
