import type {
    CaseResultItem,
    CaseStyleDefinition,
    CaseStyleId,
    TextStatistics,
} from './types';

export const CASE_STYLES: CaseStyleDefinition[] = [
    {
        id: 'camel',
        labelFa: 'camelCase (کمل کیس)',
        labelEn: 'camelCase',
        descriptionFa: 'نام‌گذاری استاندارد متغیرها و متدها در جاوااسکریپت، پایتون و جاوا',
        descriptionEn: 'Standard variable and function naming in JavaScript, TypeScript, and Java',
        example: 'userNameAttribute',
        category: 'code',
    },
    {
        id: 'pascal',
        labelFa: 'PascalCase (پاسکال کیس)',
        labelEn: 'PascalCase',
        descriptionFa: 'نام‌گذاری کلاس‌ها، اینترفیس‌ها و کامپوننت‌های React و تایپ‌اسکریپت',
        descriptionEn: 'Standard class, interface, and React component naming',
        example: 'UserNameAttribute',
        category: 'code',
    },
    {
        id: 'snake',
        labelFa: 'snake_case (اسنیک کیس)',
        labelEn: 'snake_case',
        descriptionFa: 'نام‌گذاری ستون‌های پایگاه‌داده SQL و متغیرهای زبان‌های پایتون و راست',
        descriptionEn: 'Database column names, Python and Rust variable naming',
        example: 'user_name_attribute',
        category: 'code',
    },
    {
        id: 'kebab',
        labelFa: 'kebab-case (کباب کیس)',
        labelEn: 'kebab-case',
        descriptionFa: 'نام کلاس‌های CSS، تگ‌های سفارشی HTML و آدرس‌های سئو URL اسلاگ',
        descriptionEn: 'CSS class names, HTML attributes, and SEO URL slugs',
        example: 'user-name-attribute',
        category: 'code',
    },
    {
        id: 'constant',
        labelFa: 'CONSTANT_CASE (حروف بزرگ با خط زیر)',
        labelEn: 'CONSTANT_CASE',
        descriptionFa: 'نام متغیرهای محیطی .env، ثوابت سراسری و enumها',
        descriptionEn: 'Environment variables (.env), constants, and enum definitions',
        example: 'USER_NAME_ATTRIBUTE',
        category: 'code',
    },
    {
        id: 'title',
        labelFa: 'Title Case (عنوان و تیتر)',
        labelEn: 'Title Case',
        descriptionFa: 'تیتر مقالات، عنوان دکمه‌ها و سرتیترهای استاندارد انگلیسی',
        descriptionEn: 'Capitalized first letter of every word, ideal for titles and headlines',
        example: 'User Name Attribute',
        category: 'text',
    },
    {
        id: 'sentence',
        labelFa: 'Sentence case (جمله‌ای)',
        labelEn: 'Sentence case',
        descriptionFa: 'بزرگ کردن حرف اول هر جمله، مناسب برای متن پاراگراف‌ها',
        descriptionEn: 'Capitalize only the first letter of each sentence',
        example: 'User name attribute.',
        category: 'text',
    },
    {
        id: 'upper',
        labelFa: 'UPPERCASE (تمام حروف بزرگ)',
        labelEn: 'UPPERCASE',
        descriptionFa: 'تمام کاراکترها با حروف بزرگ انگلیسی',
        descriptionEn: 'All uppercase characters',
        example: 'USER NAME ATTRIBUTE',
        category: 'text',
    },
    {
        id: 'lower',
        labelFa: 'lowercase (تمام حروف کوچک)',
        labelEn: 'lowercase',
        descriptionFa: 'تمام کاراکترها با حروف کوچک انگلیسی',
        descriptionEn: 'All lowercase characters',
        example: 'user name attribute',
        category: 'text',
    },
    {
        id: 'dot',
        labelFa: 'dot.case (دات کیس)',
        labelEn: 'dot.case',
        descriptionFa: 'کلیدهای فایل‌های کانفیگ، نام بسته‌ها و کلیدهای ترجمه i18n',
        descriptionEn: 'Config properties, i18n translation keys, and package names',
        example: 'user.name.attribute',
        category: 'code',
    },
    {
        id: 'path',
        labelFa: 'path/case (مسیر دایرکتوری)',
        labelEn: 'path/case',
        descriptionFa: 'مسیر فایل‌ها، دایرکتوری‌ها و روت‌های API',
        descriptionEn: 'File paths, module paths, and URL sub-routes',
        example: 'user/name/attribute',
        category: 'code',
    },
    {
        id: 'train',
        labelFa: 'Train-Case / Header-Case',
        labelEn: 'Train-Case / Header-Case',
        descriptionFa: 'نام هدرهای استاندارد HTTP مانند Content-Type و X-Api-Key',
        descriptionEn: 'HTTP header naming conventions (e.g. Content-Type)',
        example: 'User-Name-Attribute',
        category: 'code',
    },
    {
        id: 'alternating',
        labelFa: 'aLtErNaTiNg cAsE (حروف متناوب)',
        labelEn: 'aLtErNaTiNg cAsE',
        descriptionFa: 'یکی در میان کوچک و بزرگ، مناسب برای شوخی و طنز شبکه اجتماعی',
        descriptionEn: 'SpongeBob / alternating case for memes and stylistic text',
        example: 'uSeR nAmE aTtRiBuTe',
        category: 'fun',
    },
    {
        id: 'inverted',
        labelFa: 'Inverted Case (وارونه کردن حروف)',
        labelEn: 'Inverted Case',
        descriptionFa: 'تبدیل حروف کوچک به بزرگ و حروف بزرگ به کوچک (رفع Caps Lock ناخواسته)',
        descriptionEn: 'Invert the case of every character (useful if Caps Lock was on)',
        example: 'uSER nAME aTTRIBUTE',
        category: 'fun',
    },
];

/**
 * Parses any string into individual words handling camelCase, acronyms, and various delimiters
 */
export function extractWords(input: string): string[] {
    if (!input || !input.trim()) return [];

    // Replace common delimiters with space
    let text = input.replace(/[\-_.\/\\:]+/g, ' ');

    // Handle camelCase and acronym boundaries:
    // e.g. "XMLHTTPRequest" -> "XML HTTP Request"
    // e.g. "camelCaseWord" -> "camel Case Word"
    text = text
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2');

    return text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);
}

export function toCamelCase(words: string[]): string {
    if (words.length === 0) return '';
    return words
        .map((w, i) => {
            const lower = w.toLowerCase();
            return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join('');
}

export function toPascalCase(words: string[]): string {
    return words
        .map((w) => {
            const lower = w.toLowerCase();
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join('');
}

export function toSnakeCase(words: string[]): string {
    return words.map((w) => w.toLowerCase()).join('_');
}

export function toKebabCase(words: string[]): string {
    return words.map((w) => w.toLowerCase()).join('-');
}

export function toConstantCase(words: string[]): string {
    return words.map((w) => w.toUpperCase()).join('_');
}

export function toTitleCase(input: string, words: string[]): string {
    if (words.length === 0) return '';
    return words
        .map((w) => {
            const lower = w.toLowerCase();
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(' ');
}

export function toSentenceCase(input: string): string {
    if (!input) return '';
    // Capitalize first character after sentence delimiters (. ! ?)
    return input
        .toLowerCase()
        .replace(/(^\s*|[.!?]\s*)([a-z])/g, (_, prefix, char) => `${prefix}${char.toUpperCase()}`);
}

export function toDotCase(words: string[]): string {
    return words.map((w) => w.toLowerCase()).join('.');
}

export function toPathCase(words: string[]): string {
    return words.map((w) => w.toLowerCase()).join('/');
}

export function toTrainCase(words: string[]): string {
    return words
        .map((w) => {
            const lower = w.toLowerCase();
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join('-');
}

export function toAlternatingCase(input: string): string {
    let result = '';
    let shouldUpper = false;
    for (const char of input) {
        if (/[a-zA-Z]/.test(char)) {
            result += shouldUpper ? char.toUpperCase() : char.toLowerCase();
            shouldUpper = !shouldUpper;
        } else {
            result += char;
        }
    }
    return result;
}

export function toInvertedCase(input: string): string {
    let result = '';
    for (const char of input) {
        if (char === char.toUpperCase() && char !== char.toLowerCase()) {
            result += char.toLowerCase();
        } else if (char === char.toLowerCase() && char !== char.toUpperCase()) {
            result += char.toUpperCase();
        } else {
            result += char;
        }
    }
    return result;
}

/**
 * Calculates text statistics (words, chars, lines, reading time)
 */
export function calculateTextStatistics(input: string): TextStatistics {
    const charsWithSpaces = input.length;
    const charsWithoutSpaces = input.replace(/\s/g, '').length;
    const lines = input ? input.split(/\r\n|\r|\n/).length : 0;
    const paragraphs = input ? input.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0;

    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    // Average reading speed: 200 words per minute (~3.3 words per second)
    const readingTimeSeconds = words > 0 ? Math.ceil((words / 200) * 60) : 0;

    return {
        charactersWithSpaces: charsWithSpaces,
        charactersWithoutSpaces: charsWithoutSpaces,
        words,
        lines,
        paragraphs: Math.max(1, paragraphs),
        readingTimeSeconds,
    };
}

/**
 * Converts input text into all supported case styles simultaneously
 */
export function convertToAllCases(input: string, locale: 'fa' | 'en' = 'fa'): CaseResultItem[] {
    const words = extractWords(input);
    const isFa = locale === 'fa';

    return CASE_STYLES.map((style) => {
        let value = '';

        switch (style.id) {
            case 'camel':
                value = toCamelCase(words);
                break;
            case 'pascal':
                value = toPascalCase(words);
                break;
            case 'snake':
                value = toSnakeCase(words);
                break;
            case 'kebab':
                value = toKebabCase(words);
                break;
            case 'constant':
                value = toConstantCase(words);
                break;
            case 'title':
                value = toTitleCase(input, words);
                break;
            case 'sentence':
                value = toSentenceCase(input);
                break;
            case 'upper':
                value = input.toUpperCase();
                break;
            case 'lower':
                value = input.toLowerCase();
                break;
            case 'dot':
                value = toDotCase(words);
                break;
            case 'path':
                value = toPathCase(words);
                break;
            case 'train':
                value = toTrainCase(words);
                break;
            case 'alternating':
                value = toAlternatingCase(input);
                break;
            case 'inverted':
                value = toInvertedCase(input);
                break;
        }

        return {
            id: style.id,
            label: isFa ? style.labelFa : style.labelEn,
            value,
            description: isFa ? style.descriptionFa : style.descriptionEn,
            category: style.category,
        };
    });
}
