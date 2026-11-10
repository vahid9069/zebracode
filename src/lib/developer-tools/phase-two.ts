import type { SqlLanguage } from 'sql-formatter';
import { dump, JSON_SCHEMA, load } from 'js-yaml';
import { DeveloperToolError, type DeveloperToolDefinition } from './types';
import { validateRegexRequest } from './regex-helper';
import {
    checkedInput, curlToSource, dotenvToJson, jsonToDotenv, jsonToQuery,
    parseAbsoluteUrl, parseJson, queryToObject,
} from './phase-two-helpers';

export const REGEX_TIMEOUT_MS = 1_000;

function regexInWorker(values: Record<string, string>, signal?: AbortSignal): Promise<string> {
    const request = { pattern: values.pattern ?? '', flags: values.flags ?? '', input: values.input ?? '' };
    validateRegexRequest(request);
    if (signal?.aborted) throw new DeveloperToolError('aborted');
    if (typeof Worker === 'undefined') throw new DeveloperToolError('regexUnavailable');
    return new Promise((resolve, reject) => {
        let worker: Worker;
        try { worker = new Worker(new URL('./regex.worker.ts', import.meta.url), { type: 'module' }); }
        catch { reject(new DeveloperToolError('regexUnavailable')); return; }
        let finished = false;
        const finish = (output?: string, code?: string) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
            worker.terminate();
            if (code) reject(new DeveloperToolError(code));
            else resolve(output ?? '');
        };
        const abort = () => finish(undefined, 'aborted');
        const timer = setTimeout(() => finish(undefined, 'regexTimeout'), REGEX_TIMEOUT_MS);
        signal?.addEventListener('abort', abort, { once: true });
        worker.onmessage = (event: MessageEvent<{ output?: string; error?: string }>) => {
            const allowedErrors = ['inputLimit', 'regexInvalid', 'outputLimit', 'regexFailed'];
            if (typeof event.data?.output === 'string') finish(event.data.output);
            else finish(undefined, allowedErrors.includes(event.data?.error ?? '') ? event.data.error : 'regexFailed');
        };
        worker.onerror = () => finish(undefined, 'regexFailed');
        worker.onmessageerror = () => finish(undefined, 'regexFailed');
        try { worker.postMessage(request); }
        catch { finish(undefined, 'regexFailed'); }
    });
}

function option(value: string, allowed: readonly string[]): string {
    if (!allowed.includes(value)) throw new DeveloperToolError('optionInvalid');
    return value;
}

const dialects = ['sql', 'postgresql', 'mysql', 'sqlite', 'transactsql', 'bigquery', 'snowflake'];

export const phaseTwoTools: DeveloperToolDefinition[] = [
    {
        slug: 'regex-tester', category: 'inspectors', subCategory: 'text',
        fields: [{ id: 'pattern', type: 'text' }, { id: 'flags', type: 'text' }, { id: 'input', type: 'textarea' }],
        sample: { pattern: '(?<name>[A-Za-z]+)=(\\d+)', flags: 'g', input: 'apples=12 pears=7' },
        outputExtension: 'json', run: regexInWorker,
    },
    {
        slug: 'jsonpath-tester', category: 'inspectors', subCategory: 'json',
        fields: [{ id: 'input', type: 'textarea' }, { id: 'expression', type: 'text' }],
        sample: { input: '{"books":[{"title":"One"},{"title":"Two"}]}', expression: '$.books[*].title' },
        outputExtension: 'json',
        run: async values => {
            const json = parseJson(values.input);
            const path = checkedInput(values.expression).trim();
            if (!path.startsWith('$') || path.length > 2_000) throw new DeveloperToolError('jsonpathInvalid');
            if (path === '$') return JSON.stringify([json], null, 2);
            try {
                const { JSONPath } = await import('jsonpath-plus');
                return JSON.stringify(JSONPath({ path, json: json as object, eval: false, wrap: true }), null, 2);
            } catch { throw new DeveloperToolError('jsonpathInvalid'); }
        },
    },
    {
        slug: 'sql-formatter', category: 'converters', subCategory: 'formatters',
        fields: [{ id: 'input', type: 'textarea' }, { id: 'dialect', type: 'select', options: dialects }],
        sample: { input: 'select id,name from users where active=true order by name;', dialect: 'postgresql' },
        outputExtension: 'sql',
        run: async values => {
            const language = option(values.dialect, dialects) as SqlLanguage;
            const input = checkedInput(values.input);
            if (!input.trim()) throw new DeveloperToolError('inputRequired');
            try {
                const { format } = await import('sql-formatter');
                return format(input, { language, tabWidth: 2, keywordCase: 'upper' });
            }
            catch { throw new DeveloperToolError('sqlInvalid'); }
        },
    },
    {
        slug: 'yaml-formatter', category: 'converters', subCategory: 'formatters',
        fields: [{ id: 'input', type: 'textarea' }, { id: 'indent', type: 'select', options: ['2', '4'] }],
        sample: { input: 'name: ZebraCode\nitems: [json, yaml]\nenabled: true\n', indent: '2' },
        outputExtension: 'yaml',
        run: values => {
            const indent = Number(option(values.indent, ['2', '4']));
            const input = checkedInput(values.input);
            if (!input.trim()) throw new DeveloperToolError('inputRequired');
            try {
                const value = load(input, { schema: JSON_SCHEMA });
                if (value === undefined) throw new Error();
                return dump(value, { schema: JSON_SCHEMA, indent, lineWidth: 100, noRefs: false });
            } catch { throw new DeveloperToolError('yamlInvalid'); }
        },
    },
    {
        slug: 'env-parser', category: 'converters', subCategory: 'configuration',
        fields: [{ id: 'input', type: 'textarea' }, { id: 'mode', type: 'select', options: ['env-to-json', 'json-to-env'] }],
        sample: { input: 'export APP_NAME="ZebraCode"\nPORT=3000 # local port\nMESSAGE="hello\\nworld"', mode: 'env-to-json' },
        outputExtension: 'txt',
        run: values => option(values.mode, ['env-to-json', 'json-to-env']) === 'env-to-json'
            ? dotenvToJson(values.input) : jsonToDotenv(values.input),
    },
    {
        slug: 'query-string-parser', category: 'converters', subCategory: 'web',
        fields: [{ id: 'input', type: 'textarea' }, { id: 'mode', type: 'select', options: ['query-to-json', 'json-to-query'] }],
        sample: { input: '?tag=json&tag=tools&q=hello+world', mode: 'query-to-json' },
        outputExtension: 'txt',
        run: values => option(values.mode, ['query-to-json', 'json-to-query']) === 'query-to-json'
            ? JSON.stringify(queryToObject(values.input), null, 2) : jsonToQuery(values.input),
    },
    {
        slug: 'url-parser', category: 'inspectors', subCategory: 'web',
        fields: [{ id: 'input', type: 'textarea' }],
        sample: { input: 'https://example.com:8443/tools?tag=json&tag=yaml#details' },
        outputExtension: 'json',
        run: values => {
            const url = parseAbsoluteUrl(values.input);
            return JSON.stringify({
                href: url.href, origin: url.origin, protocol: url.protocol,
                username: url.username, password: url.password,
                host: url.host, hostname: url.hostname, port: url.port,
                pathname: url.pathname, search: url.search, hash: url.hash,
                query: queryToObject(url.search),
            }, null, 2);
        },
    },
    {
        slug: 'curl-to-fetch', category: 'converters', subCategory: 'web',
        fields: [{ id: 'input', type: 'textarea' }, { id: 'target', type: 'select', options: ['fetch', 'axios'] }],
        sample: { input: 'curl \'https://example.com/api/items\' -X POST -H \'Content-Type: application/json\' --data-raw \'{"name":"ZebraCode"}\'', target: 'fetch' },
        outputExtension: 'js', run: values => curlToSource(values.input, values.target),
    },
];
