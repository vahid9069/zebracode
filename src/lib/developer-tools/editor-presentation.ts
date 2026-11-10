import type { CodeEditorLanguage } from '@/components/CodeMirrorEditorComponent';

type Values = Record<string, string>;
type Format = 'JSON' | 'YAML' | 'SQL' | 'HTML' | 'SVG' | 'JAVASCRIPT' | 'DOTENV' | 'QUERY' | 'CURL' | 'URL' | 'JWT' | 'TEXT';

/** Presentation only: never parse, transform or execute input to select its editor mode. */
export function getDeveloperFieldFormat(slug: string, fieldId: string, values: Values): Format {
    if (slug === 'json-schema-validator' || (slug === 'jwt-encoder-verifier' && fieldId === 'payload')) return 'JSON';
    if (slug === 'jsonpath-tester' && fieldId === 'input') return 'JSON';
    if (slug === 'sql-formatter') return 'SQL';
    if (slug === 'yaml-formatter' || slug === 'docker-compose-validator') return 'YAML';
    if (slug === 'openapi-validator') return /^[\s]*[\[{]/.test(values[fieldId] ?? '') ? 'JSON' : 'YAML';
    if (slug === 'html-accessibility-checker') return 'HTML';
    if (slug === 'svg-optimizer') return 'SVG';
    if (slug === 'env-parser') return values.mode === 'json-to-env' ? 'JSON' : 'DOTENV';
    if (slug === 'query-string-parser') return values.mode === 'json-to-query' ? 'JSON' : 'QUERY';
    if (slug === 'url-parser') return 'URL';
    if (slug === 'curl-to-fetch') return 'CURL';
    if (slug === 'jwt-encoder-verifier' && fieldId === 'token') return 'JWT';
    return 'TEXT';
}

export function getDeveloperOutputFormat(slug: string, values: Values): Format {
    if (slug === 'sql-formatter') return 'SQL';
    if (slug === 'yaml-formatter') return 'YAML';
    if (slug === 'svg-optimizer') return 'SVG';
    if (slug === 'curl-to-fetch') return 'JAVASCRIPT';
    if (slug === 'env-parser') return values.mode === 'json-to-env' ? 'DOTENV' : 'JSON';
    if (slug === 'query-string-parser') return values.mode === 'json-to-query' ? 'QUERY' : 'JSON';
    if (slug === 'jwt-encoder-verifier') return values.mode === 'verify' ? 'JSON' : 'JWT';
    if (['http-status-lookup', 'mime-type-lookup', 'regex-tester', 'jsonpath-tester', 'url-parser',
        'openapi-validator', 'json-schema-validator', 'docker-compose-validator', 'cidr-calculator'].includes(slug)) return 'JSON';
    return 'TEXT';
}

function editorLanguage(format: Format): CodeEditorLanguage {
    switch (format) {
        case 'JSON': return 'json';
        case 'SQL': return 'sql';
        case 'HTML': return 'html';
        case 'SVG': return 'xml';
        case 'JAVASCRIPT': return 'javascript';
        // No YAML/shell/INI grammar is installed. Keep honest format badges with plain-text editing.
        default: return 'text';
    }
}

export const getDeveloperFieldLanguage = (slug: string, fieldId: string, values: Values): CodeEditorLanguage =>
    editorLanguage(getDeveloperFieldFormat(slug, fieldId, values));

export const getDeveloperOutputLanguage = (slug: string, values: Values): CodeEditorLanguage =>
    editorLanguage(getDeveloperOutputFormat(slug, values));

export function getCodeEditorStats(value: string) {
    return {
        lines: value ? value.split(/\r\n|\r|\n/).length : 0,
        characters: value.length,
        bytes: value ? new TextEncoder().encode(value).byteLength : 0,
    };
}
