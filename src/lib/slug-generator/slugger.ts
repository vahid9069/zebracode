import type {
    BatchSlugItem,
    SeparatorChar,
    SlugOptions,
    SlugVariants,
} from './types';

export const DEFAULT_SLUG_OPTIONS: SlugOptions = {
    mode: 'persian',
    separator: '-',
    lowercase: true,
    removeStopWords: false,
    stripNumbers: false,
    maxLength: 80,
    domainPrefix: 'https://zebracode.ir/blog/',
};

export const PERSIAN_STOP_WORDS = new Set([
    'از', 'به', 'در', 'با', 'برای', 'و', 'که', 'تا', 'یا', 'این', 'آن', 'یک', 'هم',
    'را', 'بر', 'بی', 'چون', 'اگر', 'چرا', 'اما', 'چون', 'نیز', 'چند', 'هر', 'چه',
    'شد', 'شده', 'است', 'بود', 'شدن', 'کرد', 'کرده', 'کردن', 'می', 'نمی',
]);

export const ENGLISH_STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'is', 'are', 'was', 'were', 'it', 'this', 'that', 'as', 'be',
]);

const TRANSLITERATION_MAP: Record<string, string> = {
    'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's',
    'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
    'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h',
    'ی': 'i', 'ي': 'i', 'ك': 'k', 'ة': 'e', 'ۀ': 'e', 'ئ': 'e', 'ء': '', 'ؤ': 'o',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/**
 * Normalizes Persian / Arabic characters and removes zero-width characters and converts Eastern digits
 */
export function normalizePersian(text: string): string {
    return text
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero width spaces
        .replace(/\u200C/g, ' ') // ZWNJ to space
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/ة/g, 'ه')
        .replace(/ۀ/g, 'ه')
        .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
        .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48));
}

/**
 * Transliterates Persian script into phonetically accurate Latin / Pinglish
 */
export function transliteratePersianToLatin(text: string): string {
    const normalized = normalizePersian(text);
    let result = '';

    for (const char of normalized) {
        if (TRANSLITERATION_MAP[char] !== undefined) {
            result += TRANSLITERATION_MAP[char];
        } else {
            result += char;
        }
    }

    return result;
}

/**
 * Cleans string, strips diacritics/accents, filters stop-words, and formats with separator
 */
export function generateSlug(input: string, options: Partial<SlugOptions> = {}): string {
    const opts: SlugOptions = { ...DEFAULT_SLUG_OPTIONS, ...options };
    if (!input || !input.trim()) return '';

    let text = normalizePersian(input);

    if (opts.mode === 'transliterate') {
        text = transliteratePersianToLatin(text);
    } else if (opts.mode === 'ascii') {
        // Strip accents and non-ASCII
        text = text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x00-\x7F]+/g, ' ');
    }

    // Lowercase if requested
    if (opts.lowercase) {
        text = text.toLowerCase();
    }

    // Strip numbers if requested
    if (opts.stripNumbers) {
        text = text.replace(/[0-9۰-۹٠-٩]/g, ' ');
    }

    // Convert symbols and punctuation to space
    text = text
        .replace(/[^\w\u0600-\u06FF\s\-]/g, ' ')
        .replace(/[\s\-_]+/g, ' ')
        .trim();

    let words = text.split(' ').filter((w) => w.length > 0);

    // Stop words filter
    if (opts.removeStopWords) {
        words = words.filter((w) => {
            const lower = w.toLowerCase();
            return !PERSIAN_STOP_WORDS.has(lower) && !ENGLISH_STOP_WORDS.has(lower);
        });
    }

    let slug = words.join(opts.separator);

    // Max length constraint without cutting words in half
    if (opts.maxLength && opts.maxLength > 0 && slug.length > opts.maxLength) {
        const truncated = slug.substring(0, opts.maxLength);
        const lastSep = truncated.lastIndexOf(opts.separator);
        slug = lastSep > 15 ? truncated.substring(0, lastSep) : truncated;
    }

    // Trim trailing or leading separator characters
    const sepEscaped = opts.separator === '.' ? '\\.' : opts.separator;
    slug = slug.replace(new RegExp(`^${sepEscaped}+|${sepEscaped}+$`, 'g'), '');

    return slug;
}

/**
 * Generates all slug variants simultaneously
 */
export function generateAllSlugVariants(input: string, options: Partial<SlugOptions> = {}): SlugVariants {
    const opts: SlugOptions = { ...DEFAULT_SLUG_OPTIONS, ...options };
    const domain = (opts.domainPrefix || 'https://zebracode.ir/blog/').replace(/\/+$/, '') + '/';

    const persian = generateSlug(input, { ...opts, mode: 'persian' });
    const transliterated = generateSlug(input, { ...opts, mode: 'transliterate' });
    const asciiOnly = generateSlug(input, { ...opts, mode: 'ascii' });
    const urlEncoded = encodeURIComponent(persian);

    const activeSlug = opts.mode === 'transliterate' ? transliterated : opts.mode === 'ascii' ? asciiOnly : persian;
    const fullUrl = `${domain}${activeSlug}`;

    return {
        persian,
        transliterated,
        asciiOnly,
        urlEncoded,
        fullUrl,
    };
}

/**
 * Batch processes multiple lines of titles into slugs
 */
export function generateBatchSlugs(linesText: string, options: Partial<SlugOptions> = {}): BatchSlugItem[] {
    const lines = linesText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    return lines.map((original) => ({
        original,
        slug: generateSlug(original, options),
    }));
}
