import { afterEach, describe, expect, it, vi } from 'vitest';
import { phaseTwoTools, REGEX_TIMEOUT_MS } from '@/lib/developer-tools/phase-two';
import { evaluateRegex } from '@/lib/developer-tools/regex-helper';
import { DeveloperToolError, type DeveloperToolCopies } from '@/lib/developer-tools/types';
import en from '@/dictionaries/en/developer-phase-two.json';
import fa from '@/dictionaries/fa/developer-phase-two.json';

function tool(slug: string) {
    const definition = phaseTwoTools.find(item => item.slug === slug);
    if (!definition) throw new Error('Missing test tool');
    return definition;
}

async function run(slug: string, values: Record<string, string>) {
    return await tool(slug).run({ ...tool(slug).sample, ...values });
}

async function errorCode(slug: string, values: Record<string, string>, code: string) {
    try {
        await run(slug, values);
        throw new Error('Expected tool failure');
    } catch (error) {
        expect(error).toBeInstanceOf(DeveloperToolError);
        expect((error as DeveloperToolError).code).toBe(code);
        expect((error as Error).message).toBe(code);
        for (const copy of [en, fa] as DeveloperToolCopies[]) expect(copy[slug].errors?.[code]).toBeTruthy();
    }
}

class TestWorker {
    static instances: TestWorker[] = [];
    static hang = false;
    onmessage: ((event: { data: { output?: string; error?: string } }) => void) | null = null;
    onerror: (() => void) | null = null;
    onmessageerror: (() => void) | null = null;
    terminate = vi.fn();
    constructor() { TestWorker.instances.push(this); }
    postMessage(values: Parameters<typeof evaluateRegex>[0]) {
        if (TestWorker.hang) return;
        try { this.onmessage?.({ data: { output: evaluateRegex(values) } }); }
        catch (error) { this.onmessage?.({ data: { error: (error as DeveloperToolError).code } }); }
    }
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    TestWorker.instances = [];
    TestWorker.hang = false;
});

describe('phase two definitions and localized copy', () => {
    it('provides working samples and localized fields and options for all eight tools', async () => {
        vi.stubGlobal('Worker', TestWorker);
        expect(phaseTwoTools).toHaveLength(8);
        for (const definition of phaseTwoTools) {
            expect(await definition.run(definition.sample)).toBeTypeOf('string');
            for (const copies of [en, fa] as DeveloperToolCopies[]) {
                const copy = copies[definition.slug];
                expect(copy.title).toBeTruthy();
                expect(copy.shortDescription).toBeTruthy();
                expect(copy.description).toBeTruthy();
                expect(copy.note).toBeTruthy();
                for (const field of definition.fields) {
                    expect(copy.fields[field.id]).toBeTruthy();
                    expect(definition.sample[field.id]).toBeTypeOf('string');
                    for (const option of field.options ?? []) expect(copy.options?.[option]).toBeTruthy();
                }
            }
        }
    });

    it('rejects over-limit inputs without leaking any input', async () => {
        const input = 'sensitive'.repeat(25_001);
        for (const definition of phaseTwoTools.filter(item => item.slug !== 'regex-tester')) {
            await errorCode(definition.slug, { input }, 'inputLimit');
        }
        await errorCode('regex-tester', { input }, 'inputLimit');
    });
});

describe('isolated regex tester', () => {
    it('reports indexes, captures, unmatched groups and named groups', async () => {
        vi.stubGlobal('Worker', TestWorker);
        const result = JSON.parse(await run('regex-tester', { pattern: '(?<letter>a)(b)?', flags: 'gd', input: 'a ab' }));
        expect(result.count).toBe(2);
        expect(result.matches[0]).toMatchObject({ match: 'a', index: 0, groups: ['a', null], namedGroups: { letter: 'a' }, indices: [[0, 1], [0, 1], null] });
        expect(result.matches[1].index).toBe(2);
        expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
    });

    it('handles no matches, non-global mode and zero-length Unicode matches', () => {
        expect(JSON.parse(evaluateRegex({ pattern: 'z', flags: 'g', input: 'abc' })).matches).toEqual([]);
        expect(JSON.parse(evaluateRegex({ pattern: 'a', flags: '', input: 'aaa' })).count).toBe(1);
        expect(JSON.parse(evaluateRegex({ pattern: '', flags: 'gu', input: '😀' })).matches.map((match: { index: number }) => match.index)).toEqual([0, 2]);
    });

    it('rejects malformed patterns/flags and caps the result count', async () => {
        vi.stubGlobal('Worker', TestWorker);
        await errorCode('regex-tester', { pattern: '[' }, 'regexInvalid');
        await errorCode('regex-tester', { flags: 'gg' }, 'regexInvalid');
        await errorCode('regex-tester', { flags: 'x' }, 'regexInvalid');
        await errorCode('regex-tester', { pattern: '', flags: 'g', input: 'a'.repeat(1_001) }, 'outputLimit');
    });

    it('terminates an unresponsive worker and does not run the regex on the UI thread', async () => {
        vi.useFakeTimers();
        TestWorker.hang = true;
        vi.stubGlobal('Worker', TestWorker);
        const result = errorCode('regex-tester', { pattern: '(a+)+$', input: `${'a'.repeat(50)}!` }, 'regexTimeout');
        await vi.advanceTimersByTimeAsync(REGEX_TIMEOUT_MS);
        await result;
        expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('refuses to use a main-thread fallback when workers are unavailable', async () => {
        vi.stubGlobal('Worker', undefined);
        await errorCode('regex-tester', {}, 'regexUnavailable');
    });

    it('terminates workers on execution failures', async () => {
        TestWorker.hang = true;
        vi.stubGlobal('Worker', TestWorker);
        const result = errorCode('regex-tester', {}, 'regexFailed');
        TestWorker.instances[0].onerror?.();
        await result;
        expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
    });
});

describe('JSONPath and formatters', () => {
    it('supports selections, recursive descent, missing values and scalar JSON', async () => {
        expect(JSON.parse(await run('jsonpath-tester', {}))).toEqual(['One', 'Two']);
        expect(JSON.parse(await run('jsonpath-tester', { expression: '$..title' }))).toEqual(['One', 'Two']);
        expect(JSON.parse(await run('jsonpath-tester', { expression: '$.missing' }))).toEqual([]);
        expect(JSON.parse(await run('jsonpath-tester', { expression: '$', input: '42' }))).toEqual([42]);
        expect(JSON.parse(await run('jsonpath-tester', { expression: '$', input: 'false' }))).toEqual([false]);
        expect(JSON.parse(await run('jsonpath-tester', { expression: '$', input: 'null' }))).toEqual([null]);
    });

    it('rejects malformed JSON and expressions without executing script filters', async () => {
        await errorCode('jsonpath-tester', { input: '{private' }, 'jsonInvalid');
        await errorCode('jsonpath-tester', { expression: 'books' }, 'jsonpathInvalid');
        await errorCode('jsonpath-tester', { expression: '$.books[?(@.title)]' }, 'jsonpathInvalid');
        await errorCode('jsonpath-tester', { expression: '$.books[?(globalThis.__phaseTwoExecuted = true)]' }, 'jsonpathInvalid');
        expect((globalThis as Record<string, unknown>).__phaseTwoExecuted).toBeUndefined();
    });

    it('formats PostgreSQL, MySQL, SQLite and the remaining supported SQL dialects', async () => {
        expect(await run('sql-formatter', { input: 'select id from users where id=1;' })).toContain('SELECT\n');
        for (const dialect of tool('sql-formatter').fields[1].options ?? []) {
            expect(await run('sql-formatter', { input: 'select 1;', dialect })).toContain('SELECT');
        }
        await errorCode('sql-formatter', { dialect: 'unknown' }, 'optionInvalid');
        await errorCode('sql-formatter', { input: ' ' }, 'inputRequired');
        await errorCode('sql-formatter', { input: "select 'secret" }, 'sqlInvalid');
    });

    it('formats YAML while preserving data values and rejects syntax/custom tags/multiple documents', async () => {
        const output = await run('yaml-formatter', { input: 'root: {items: [one, two], date: 2026-10-17}', indent: '4' });
        expect(output).toContain('    items:');
        expect(output).toContain('2026-10-17');
        await errorCode('yaml-formatter', { input: 'private: [broken' }, 'yamlInvalid');
        await errorCode('yaml-formatter', { input: 'x: !!js/function function() {}' }, 'yamlInvalid');
        await errorCode('yaml-formatter', { input: 'a: 1\n---\nb: 2' }, 'yamlInvalid');
        await errorCode('yaml-formatter', { input: '' }, 'inputRequired');
    });
});

describe('dotenv converter', () => {
    it('handles export, comments, literal single quotes, escaped double quotes and duplicate assignments', async () => {
        const result = JSON.parse(await run('env-parser', {
            input: '# comment\nexport NAME="hello\\nworld\\\"!" # tail\nLITERAL=\'a#b $HOME\'\nKEY=first\nKEY=last # comment\nEMPTY=',
        }));
        expect(result).toEqual({ NAME: 'hello\nworld"!', LITERAL: 'a#b $HOME', KEY: 'last', EMPTY: '' });
        expect(await run('env-parser', { input: '# comment only' })).toBe('{}');
    });

    it('round trips JSON-style escapes, Unicode and scalars without expansion', async () => {
        const original = { TEXT: 'a"b\\c\nline\t\b\f\u0001 😀 $HOME # x', PORT: 3, ENABLED: true, NIL: null };
        const env = await run('env-parser', { mode: 'json-to-env', input: JSON.stringify(original) });
        const result = JSON.parse(await run('env-parser', { input: env }));
        expect(result).toEqual({ TEXT: original.TEXT, PORT: '3', ENABLED: 'true', NIL: 'null' });
    });

    it.each([
        ['BAD-KEY=1', 'env-to-json', 'envInvalid'],
        ['A="unterminated', 'env-to-json', 'envInvalid'],
        ['A="ok" trailing', 'env-to-json', 'envInvalid'],
        ['A="hello\nworld"', 'env-to-json', 'envInvalid'],
        ['A="bad\\q"', 'env-to-json', 'envInvalid'],
        ['__proto__=danger', 'env-to-json', 'unsafeKey'],
        ['constructor=secret', 'env-to-json', 'unsafeKey'],
        ['{"prototype":"secret"}', 'json-to-env', 'unsafeKey'],
        ['{"A":{}}', 'json-to-env', 'scalarRequired'],
        ['{"A":[]}', 'json-to-env', 'scalarRequired'],
        ['{"A":1e999}', 'json-to-env', 'scalarRequired'],
        ['{"bad-key":1}', 'json-to-env', 'envKeyInvalid'],
        ['[]', 'json-to-env', 'objectRequired'],
    ])('rejects unsupported dotenv/JSON boundary %s', async (input, mode, code) => {
        await errorCode('env-parser', { input, mode }, code);
        expect(({} as Record<string, unknown>).danger).toBeUndefined();
    });
});

describe('query and URL parsers', () => {
    it('preserves duplicate/empty values, percent escapes and Unicode', async () => {
        const result = JSON.parse(await run('query-string-parser', { input: '?a=1&a=&q=a+b%2Bc&fa=%D8%B3%D9%84%D8%A7%D9%85&empty' }));
        expect(result).toEqual({ a: ['1', ''], q: 'a b+c', fa: 'سلام', empty: '' });
        const encoded = await run('query-string-parser', { mode: 'json-to-query', input: JSON.stringify(result) });
        expect(JSON.parse(await run('query-string-parser', { input: encoded }))).toEqual(result);
        expect(JSON.parse(await run('query-string-parser', { input: '' }))).toEqual({});
        expect(await run('query-string-parser', { input: '{"a":[1,true,null],"empty":[]}', mode: 'json-to-query' })).toBe('a=1&a=true&a=null');
    });

    it('treats dangerous query keys as own data, never a prototype mutation', async () => {
        const result = JSON.parse(await run('query-string-parser', { input: '__proto__=one&__proto__=two&constructor=x' }));
        expect(result.__proto__).toEqual(['one', 'two']);
        expect(result.constructor).toBe('x');
        await errorCode('query-string-parser', { input: '{"__proto__":"x"}', mode: 'json-to-query' }, 'unsafeKey');
    });

    it('rejects malformed encoding and nested query values', async () => {
        for (const input of ['x=%', 'x=%GG', 'x=%C0%AF']) await errorCode('query-string-parser', { input }, 'queryInvalid');
        await errorCode('query-string-parser', { input: '{"x":[{}]}', mode: 'json-to-query' }, 'scalarRequired');
    });

    it('returns normalized URL components with duplicate query values', async () => {
        const result = JSON.parse(await run('url-parser', { input: 'https://user:pass@EXAMPLE.com:443/a?q=1&q=2#part' }));
        expect(result).toMatchObject({ protocol: 'https:', username: 'user', password: 'pass', hostname: 'example.com', port: '', pathname: '/a', hash: '#part', query: { q: ['1', '2'] } });
        expect(JSON.parse(await run('url-parser', { input: 'mailto:hello@example.com' })).origin).toBe('null');
        for (const input of ['', '/relative', 'https://', 'https://example.com:99999', 'https://exa\nmple.com']) await errorCode('url-parser', { input }, 'urlInvalid');
    });
});

describe('cURL source conversion', () => {
    it('generates text with method, headers and literal body without requesting a URL', async () => {
        const fetchSpy = vi.fn(() => { throw new Error('Unexpected network operation'); });
        vi.stubGlobal('fetch', fetchSpy);
        const source = await run('curl-to-fetch', {});
        expect(source).toContain('await fetch("https://example.com/api/items"');
        expect(source).toContain('"method": "POST"');
        expect(source).toContain('"Content-Type"');
        expect(source).toContain('"body": "{\\"name\\":\\"ZebraCode\\"}"');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('supports quoted values, continuations, joined flags and repeated headers/data', async () => {
        const input = 'curl \\\n "https://example.com/?q=1&x=2" -XPOST -H\'X-Test: one\' --header="x-test: two" --data=one=1 --data-raw \'two=$literal\'';
        const source = await run('curl-to-fetch', { input, target: 'axios' });
        expect(source).toContain("import axios from 'axios'");
        expect(source).toContain('"x-test": [\n      "one",\n      "two"');
        expect(source).toContain('"data": "one=1&two=$literal"');
        expect(source).toContain('application/x-www-form-urlencoded');
        expect(await run('curl-to-fetch', { input: 'curl --head --url=https://example.com' })).toContain('"method": "HEAD"');
        expect(await run('curl-to-fetch', { input: 'curl --data-raw \'@literal\' https://example.com' })).toContain('"body": "@literal"');
        expect(await run('curl-to-fetch', { input: 'curl https://example.com\n' })).toContain('"method": "GET"');
    });

    it.each([
        ['curl https://example.com; touch pwn', 'curlShell'],
        ['curl https://example.com | sh', 'curlShell'],
        ['curl "https://example.com/$(id)"', 'curlShell'],
        ['curl "https://example.com/`id`"', 'curlShell'],
        ['curl $URL', 'curlShell'],
        ['curl https://example.com -d ~', 'curlShell'],
        ['curl https://example.com > output', 'curlShell'],
        ['curl https://example.com\ncurl https://other.test', 'curlShell'],
        ['curl https://example.com --compressed', 'curlFlagUnsupported'],
        ['curl -F file=@secret https://example.com', 'curlFlagUnsupported'],
        ['curl -d @secret https://example.com', 'curlFileUnsupported'],
        ['curl https://one.test https://two.test', 'curlMultipleUrls'],
        ['curl -H \'Invalid\' https://example.com', 'curlHeaderInvalid'],
        ['curl -H \'X-Test:\' https://example.com', 'curlHeaderInvalid'],
        ['curl -H \'X-Test: ok\r\nInjected: bad\' https://example.com', 'curlHeaderInvalid'],
        ['curl -X GET -d x https://example.com', 'curlBodyUnsupported'],
        ['curl -X TRACE https://example.com', 'curlMethodInvalid'],
        ['curl ftp://example.com', 'curlUrlUnsupported'],
        ['curl https://user:secret@example.com', 'curlUrlUnsupported'],
        ['curl "https://example.com', 'curlSyntax'],
        ['wget https://example.com', 'curlSyntax'],
    ])('rejects unsupported/unsafe command %s', async (input, code) => {
        await errorCode('curl-to-fetch', { input }, code);
    });
});
