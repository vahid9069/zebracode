export type IdentifierType = 'v4' | 'v7' | 'v1' | 'nanoid' | 'ulid' | 'cuid2' | 'nil';

export type ExportFormat = 'text' | 'json' | 'sql' | 'csv' | 'js' | 'python' | 'go';

export interface IdentifierFormatOptions {
    type: IdentifierType;
    count: number;
    hyphens: boolean;
    uppercase: boolean;
    braces: boolean;
    quotes: 'none' | 'single' | 'double';
    urnPrefix: boolean;
    encodeBase64: boolean;
    nanoIdLength?: number;
    nanoIdAlphabet?: string;
    sqlTableName?: string;
    sqlColumnName?: string;
}

export interface UuidInspectionResult {
    raw: string;
    isValid: boolean;
    version?: string;
    versionNumber?: number;
    variant?: string;
    timestamp?: Date;
    formattedTimestampUtc?: string;
    formattedTimestampLocal?: string;
    formattedTimestampShamsi?: string;
    clockSequence?: number;
    nodeId?: string;
    randomBitsHex?: string;
    hyphenated?: string;
    cleanHex?: string;
    uppercase?: string;
    base64?: string;
    urn?: string;
    errorReason?: string;
}
