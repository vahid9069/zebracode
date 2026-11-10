import { DeveloperToolError } from './types';

export const INPUT_LIMIT = 200_000;
const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);

export function checkedInput(input: string): string {
    if (input.length > INPUT_LIMIT) throw new DeveloperToolError('inputLimit');
    return input;
}

export function parseJson(input: string): unknown {
    try {
        return JSON.parse(checkedInput(input));
    } catch (error) {
        if (error instanceof DeveloperToolError) throw error;
        throw new DeveloperToolError('jsonInvalid');
    }
}

export function jsonObject(input: string): Record<string, unknown> {
    const parsed = parseJson(input);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new DeveloperToolError('objectRequired');
    }
    return parsed as Record<string, unknown>;
}

function checkKey(key: string): void {
    if (unsafeKeys.has(key)) throw new DeveloperToolError('unsafeKey');
}

function scalar(value: unknown): string {
    if (value === null) return 'null';
    if (typeof value === 'string' || typeof value === 'boolean'
        || (typeof value === 'number' && Number.isFinite(value))) return String(value);
    throw new DeveloperToolError('scalarRequired');
}

export function dotenvToJson(input: string): string {
    const result: Record<string, string> = Object.create(null);
    for (const line of checkedInput(input).replace(/^\uFEFF/, '').split(/\r?\n/)) {
        const text = line.trim();
        if (!text || text.startsWith('#')) continue;
        const assignment = /^(?:export[\t ]+)?([A-Za-z_][A-Za-z0-9_]*)[\t ]*=[\t ]*(.*)$/.exec(text);
        if (!assignment) throw new DeveloperToolError('envInvalid');
        const [, key, raw] = assignment;
        checkKey(key);
        let value: string;
        if (raw.startsWith('"') || raw.startsWith("'")) {
            const quote = raw[0];
            let end = 1;
            for (; end < raw.length; end++) {
                if (quote === '"' && raw[end] === '\\') { end++; continue; }
                if (raw[end] === quote) break;
            }
            if (end >= raw.length || !/^[\t ]*(?:#.*)?$/.test(raw.slice(end + 1))) {
                throw new DeveloperToolError('envInvalid');
            }
            if (quote === "'") value = raw.slice(1, end);
            else {
                try { value = JSON.parse(raw.slice(0, end + 1)); }
                catch { throw new DeveloperToolError('envInvalid'); }
            }
        } else {
            value = raw.split('#', 1)[0].trim();
        }
        result[key] = value;
    }
    return JSON.stringify(result, null, 2);
}

export function jsonToDotenv(input: string): string {
    return Object.entries(jsonObject(input)).map(([key, value]) => {
        checkKey(key);
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new DeveloperToolError('envKeyInvalid');
        return `${key}=${JSON.stringify(scalar(value))}`;
    }).join('\n');
}

export function queryToObject(input: string): Record<string, string | string[]> {
    const query = checkedInput(input).replace(/^\?/, '');
    try {
        // URLSearchParams silently replaces broken percent/UTF-8 sequences. Report them instead.
        for (const part of query.split('&')) decodeURIComponent(part.replace(/\+/g, ' '));
    } catch { throw new DeveloperToolError('queryInvalid'); }
    const result: Record<string, string | string[]> = Object.create(null);
    for (const [key, value] of new URLSearchParams(query)) {
        if (!Object.hasOwn(result, key)) result[key] = value;
        else {
            const previous = result[key];
            if (Array.isArray(previous)) previous.push(value);
            else result[key] = [previous, value];
        }
    }
    return result;
}

export function jsonToQuery(input: string): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(jsonObject(input))) {
        checkKey(key);
        for (const item of Array.isArray(value) ? value : [value]) params.append(key, scalar(item));
    }
    return params.toString();
}

export function parseAbsoluteUrl(input: string): URL {
    checkedInput(input);
    try {
        if (!input.trim() || /[\u0000-\u001f\u007f-\u009f]/.test(input)) throw new Error();
        return new URL(input);
    } catch { throw new DeveloperToolError('urlInvalid'); }
}

/** Tokenizes a deliberately small POSIX-style command subset; never executes a shell. */
export function tokenizeCurl(input: string): string[] {
    input = checkedInput(input).trim();
    const tokens: string[] = [];
    let token = '';
    let started = false;
    let quote: '"' | "'" | null = null;
    const push = () => {
        if (started) tokens.push(token);
        token = ''; started = false;
        if (tokens.length > 1_000) throw new DeveloperToolError('inputLimit');
    };
    for (let index = 0; index < input.length; index++) {
        const char = input[index];
        if (char === '\0') throw new DeveloperToolError('curlSyntax');
        if (quote === "'") {
            if (char === "'") quote = null;
            else token += char;
            continue;
        }
        if (char === '\\') {
            const next = input[++index];
            if (next === undefined) throw new DeveloperToolError('curlSyntax');
            if (next === '\n') continue;
            if (next === '\r' && input[index + 1] === '\n') { index++; continue; }
            if (quote === '"' && !['$', '`', '"', '\\'].includes(next)) token += '\\';
            token += next; started = true;
            continue;
        }
        if (char === '$' || char === '`') throw new DeveloperToolError('curlShell');
        if (quote === '"') {
            if (char === '"') quote = null;
            else token += char;
            continue;
        }
        if (char === '"' || char === "'") { quote = char; started = true; continue; }
        if (char === ' ' || char === '\t') { push(); continue; }
        if (/[;&|<>()\r\n*?\[\]{}#~]/.test(char)) throw new DeveloperToolError('curlShell');
        token += char; started = true;
    }
    if (quote) throw new DeveloperToolError('curlSyntax');
    push();
    return tokens;
}

export function curlToSource(input: string, target: string): string {
    if (target !== 'fetch' && target !== 'axios') throw new DeveloperToolError('optionInvalid');
    const tokens = tokenizeCurl(input);
    if (tokens.shift() !== 'curl') throw new DeveloperToolError('curlSyntax');
    let url: string | undefined;
    let method: string | undefined;
    const headers: [string, string][] = [];
    const data: string[] = [];
    let positionalOnly = false;
    const takeUrl = (value: string) => {
        if (url !== undefined) throw new DeveloperToolError('curlMultipleUrls');
        url = value;
    };
    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        if (token === '--' && !positionalOnly) { positionalOnly = true; continue; }
        if (positionalOnly || !token.startsWith('-')) { takeUrl(token); continue; }
        if (token === '-I' || token === '--head') { method = 'HEAD'; continue; }
        const equal = token.startsWith('--') ? token.indexOf('=') : -1;
        const shortJoined = /^-[XHd].+/.test(token);
        const flag = equal !== -1 ? token.slice(0, equal) : shortJoined ? token.slice(0, 2) : token;
        if (!['-X', '--request', '-H', '--header', '-d', '--data', '--data-raw', '--url'].includes(flag)) {
            throw new DeveloperToolError('curlFlagUnsupported');
        }
        const value = equal !== -1 ? token.slice(equal + 1) : shortJoined ? token.slice(2) : tokens[++index];
        if (value === undefined) throw new DeveloperToolError('curlSyntax');
        if (flag === '-X' || flag === '--request') {
            if (!/^[A-Za-z]+$/.test(value)) throw new DeveloperToolError('curlMethodInvalid');
            method = value.toUpperCase();
        } else if (flag === '--url') takeUrl(value);
        else if (flag === '-H' || flag === '--header') {
            const colon = value.indexOf(':');
            const name = value.slice(0, colon).trim();
            const content = value.slice(colon + 1).trim();
            if (colon < 1 || !/^[!#$%&'*+.^_`|~A-Za-z0-9-]+$/.test(name)
                || unsafeKeys.has(name.toLowerCase()) || !content
                || /[\u0000-\u0008\u000a-\u001f\u007f]/.test(content)) throw new DeveloperToolError('curlHeaderInvalid');
            headers.push([name, content]);
        } else {
            if (flag !== '--data-raw' && value.startsWith('@')) throw new DeveloperToolError('curlFileUnsupported');
            data.push(value);
        }
    }
    if (url === undefined) throw new DeveloperToolError('curlSyntax');
    const parsedUrl = parseAbsoluteUrl(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
        throw new DeveloperToolError('curlUrlUnsupported');
    }
    method ??= data.length ? 'POST' : 'GET';
    if (data.length && ['GET', 'HEAD'].includes(method)) throw new DeveloperToolError('curlBodyUnsupported');
    if (['CONNECT', 'TRACE', 'TRACK'].includes(method)) throw new DeveloperToolError('curlMethodInvalid');
    if (data.length && !headers.some(([key]) => key.toLowerCase() === 'content-type')) {
        headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
    }
    if (target === 'fetch') {
        const options = {
            method,
            ...(headers.length ? { headers } : {}),
            ...(data.length ? { body: data.join('&') } : {}),
        };
        return `const response = await fetch(${JSON.stringify(parsedUrl.href)}, ${JSON.stringify(options, null, 2)});`;
    }
    const axiosHeaders: Record<string, string | string[]> = Object.create(null);
    for (const [name, value] of headers) {
        const key = name.toLowerCase();
        if (!Object.hasOwn(axiosHeaders, key)) axiosHeaders[key] = value;
        else {
            const previous = axiosHeaders[key];
            if (Array.isArray(previous)) previous.push(value);
            else axiosHeaders[key] = [previous, value];
        }
    }
    return `import axios from 'axios';\n\nconst response = await axios(${JSON.stringify({
        url: parsedUrl.href,
        method,
        ...(headers.length ? { headers: axiosHeaders } : {}),
        ...(data.length ? { data: data.join('&') } : {}),
    }, null, 2)});`;
}
