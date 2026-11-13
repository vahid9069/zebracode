export type SlugMode = 'persian' | 'transliterate' | 'ascii' | 'encoded';

export type SeparatorChar = '-' | '_' | '.' | '/';

export interface SlugOptions {
    mode: SlugMode;
    separator: SeparatorChar;
    lowercase: boolean;
    removeStopWords: boolean;
    maxLength?: number;
    stripNumbers: boolean;
    domainPrefix?: string;
}

export interface SlugVariants {
    persian: string;
    transliterated: string;
    asciiOnly: string;
    urlEncoded: string;
    fullUrl: string;
}

export interface BatchSlugItem {
    original: string;
    slug: string;
}
