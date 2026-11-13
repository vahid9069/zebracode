export type HashAlgorithm =
    | 'MD5'
    | 'SHA-1'
    | 'SHA-256'
    | 'SHA-384'
    | 'SHA-512'
    | 'CRC32'
    | 'RIPEMD-160';

export type HashMode = 'text' | 'file' | 'hmac' | 'verify';

export interface HashResultItem {
    algorithm: HashAlgorithm;
    bitLength: number;
    hex: string;
    base64?: string;
    isSecure: boolean;
    description: string;
}

export interface FileHashProgress {
    fileName: string;
    fileSize: number;
    percentage: number;
    isCalculating: boolean;
}

export interface ChecksumVerificationResult {
    expected: string;
    matched: boolean;
    matchedAlgorithm?: HashAlgorithm;
    isMatchCaseInsensitive: boolean;
}
