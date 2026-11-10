import { createHmac, webcrypto } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { auditAccessibilitySnapshot, calculateIPv4Cidr, phaseThreeTools, type AccessibilitySnapshot } from '@/lib/developer-tools/phase-three';
import { DeveloperToolError, type DeveloperToolCopies } from '@/lib/developer-tools/types';
import en from '@/dictionaries/en/developer-phase-three.json';
import fa from '@/dictionaries/fa/developer-phase-three.json';

const definition = (slug: string) => phaseThreeTools.find(tool => tool.slug === slug)!;
const run = async (slug: string, values: Record<string, string>) => definition(slug).run(values);
const jsonResult = async (slug: string, values: Record<string, string>) => JSON.parse(await run(slug, values));
const secret = 'test-only-secret-🔑-never-a-production-key';
const encode = (payload: object) => run('jwt-encoder-verifier', { mode: 'encode', secret, payload: JSON.stringify(payload) });
const verify = (token: string, key = secret) => jsonResult('jwt-encoder-verifier', { mode: 'verify', token, secret: key });
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

beforeAll(() => { vi.stubGlobal('crypto', webcrypto); });
afterAll(() => { vi.unstubAllGlobals(); });

describe('phase three tool contract and translated copy', () => {
    it('exposes exactly the seven requested tools and both complete locale copies', () => {
        const slugs = ['openapi-validator', 'json-schema-validator', 'docker-compose-validator', 'cidr-calculator', 'html-accessibility-checker', 'svg-optimizer', 'jwt-encoder-verifier'].sort();
        expect(phaseThreeTools.map(tool => tool.slug).sort()).toEqual(slugs);
        for (const copies of [en, fa] satisfies DeveloperToolCopies[]) {
            expect(Object.keys(copies).sort()).toEqual(slugs);
            for (const tool of phaseThreeTools) {
                const copy = (copies as DeveloperToolCopies)[tool.slug];
                expect(copy.title).toBeTruthy();
                expect(copy.note).toBeTruthy();
                for (const field of tool.fields) {
                    expect(copy.fields[field.id]).toBeTruthy();
                    for (const option of field.options ?? []) expect(copy.options?.[option]).toBeTruthy();
                }
                expect(copy.errors?.required).toBeTruthy();
            }
        }
    });

    it.each(phaseThreeTools.filter(tool => tool.slug !== 'html-accessibility-checker'))('runs the $slug sample without browser DOM', async tool => {
        expect(await tool.run(tool.sample)).toBeTruthy();
    });
});

describe('OpenAPI documented structural checks', () => {
    it('accepts YAML and JSON OpenAPI 3.0 and 3.1 examples without claiming compliance', async () => {
        const yaml = await jsonResult('openapi-validator', definition('openapi-validator').sample);
        expect(yaml.status).toBe('structural-checks-passed');
        expect(yaml.scope).toContain('No reference resolution');
        const doc = { openapi: '3.0.3', info: { title: 'Example', version: '1' }, paths: {} };
        expect((await jsonResult('openapi-validator', { document: JSON.stringify(doc) })).issues).toEqual([]);
        expect((await jsonResult('openapi-validator', { document: JSON.stringify({ ...doc, openapi: '3.1.0', paths: undefined, components: {} }) })).issues).toEqual([]);
    });

    it('reports missing info, bad path/operation/response shapes and unsupported versions', async () => {
        const output = await jsonResult('openapi-validator', { document: JSON.stringify({ openapi: '2.0', info: { title: '' }, paths: { pets: { get: { parameters: {}, responses: { '999': {} } }, post: 'not-an-operation' } } }) });
        expect(output.status).toBe('issues-found');
        expect(output.issues.join('\n')).toContain('/openapi');
        expect(output.issues.join('\n')).toContain('/info/title');
        expect(output.issues.join('\n')).toContain('/paths/pets/get/parameters');
        expect(output.issues.join('\n')).toContain('/paths/pets/get/responses/999/description');
    });

    it('returns coded parser errors without echoing input', async () => {
        await expect(run('openapi-validator', { document: 'secret-document: [' })).rejects.toEqual(new DeveloperToolError('document_parse'));
        await expect(run('openapi-validator', { document: '[]' })).rejects.toEqual(new DeveloperToolError('document_object'));
    });
});

describe('JSON Schema draft selection, formats and isolated references', () => {
    it('validates draft-07 tuple schemas and normalizes HTTPS meta-schema aliases', async () => {
        const schema = { $schema: 'https://json-schema.org/draft-07/schema#', type: 'array', items: [{ type: 'integer' }], additionalItems: false };
        expect(await jsonResult('json-schema-validator', { schema: JSON.stringify(schema), data: '[5]' })).toMatchObject({ valid: true, draft: 'draft-07' });
        expect((await jsonResult('json-schema-validator', { schema: JSON.stringify(schema), data: '[5,6]' })).valid).toBe(false);
    });

    it('uses 2020-12 prefixItems and reports meaningful nested instance paths for formats', async () => {
        const schema = { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', properties: { contacts: { type: 'array', prefixItems: [{ type: 'string', format: 'email' }], items: false } } };
        const result = await jsonResult('json-schema-validator', { schema: JSON.stringify(schema), data: '{"contacts":["not-an-email"]}' });
        expect(result).toMatchObject({ valid: false, draft: '2020-12' });
        expect(result.errors[0]).toMatchObject({ instancePath: '/contacts/0', keyword: 'format' });
        expect(JSON.stringify(result)).not.toContain('not-an-email');
    });

    it('supports boolean and local-ref schemas, and rejects unresolved local refs', async () => {
        expect((await jsonResult('json-schema-validator', { schema: 'false', data: 'null' })).valid).toBe(false);
        expect((await jsonResult('json-schema-validator', { schema: '{"definitions":{"value":{"type":"number"}},"$ref":"#/definitions/value"}', data: '4' })).valid).toBe(true);
        await expect(run('json-schema-validator', { schema: '{"$ref":"#/$defs/missing"}', data: '{}' })).rejects.toMatchObject({ code: 'schema_invalid' });
        const literal = { $ref: 'https://example.com/literal-data-not-a-schema-ref' };
        expect((await jsonResult('json-schema-validator', { schema: JSON.stringify({ const: literal }), data: JSON.stringify(literal) })).valid).toBe(true);
    });

    it('rejects remote/relative references, unsupported drafts and invalid schemas without fetching', async () => {
        const fetch = vi.fn(() => { throw new Error('No network allowed'); });
        vi.stubGlobal('fetch', fetch);
        for (const ref of ['https://example.com/schema.json', 'relative.json', 'file:///secret']) {
            await expect(run('json-schema-validator', { schema: JSON.stringify({ $ref: ref }), data: '{}' })).rejects.toMatchObject({ code: 'schema_external_ref' });
        }
        expect(fetch).not.toHaveBeenCalled();
        await expect(run('json-schema-validator', { schema: '{"$schema":"https://json-schema.org/draft/2019-09/schema"}', data: '{}' })).rejects.toMatchObject({ code: 'schema_draft' });
        await expect(run('json-schema-validator', { schema: '{"type":25}', data: '{}' })).rejects.toMatchObject({ code: 'schema_invalid' });
        await expect(run('json-schema-validator', { schema: '{"$async":true}', data: '{}' })).rejects.toMatchObject({ code: 'schema_invalid' });
        await expect(run('json-schema-validator', { schema: 'private malformed schema', data: '{}' })).rejects.toEqual(new DeveloperToolError('schema_parse'));
        await expect(run('json-schema-validator', { schema: '{}', data: 'private malformed data' })).rejects.toEqual(new DeveloperToolError('data_parse'));
    });
});

describe('Docker Compose static shape validation', () => {
    it('accepts YAML anchors and supported port/environment shapes', async () => {
        const document = 'services:\n  web: &web\n    ports:\n      - "8080:80"\n      - 443\n      - target: 80\n        published: "8081"\n        protocol: tcp\n    environment:\n      APP_MODE: local\n      COUNT: 2\n      OPTIONAL: null\n  worker: *web\n';
        expect((await jsonResult('docker-compose-validator', { document })).issues).toEqual([]);
        expect((await jsonResult('docker-compose-validator', { document: 'services:\n  web:\n    environment: [MODE=local, OPTIONAL]' })).issues).toEqual([]);
        expect((await jsonResult('docker-compose-validator', { document: 'x-common: &common\n  environment: {INVALID: []}\nservices:\n  web:\n    <<: *common\n' })).issues).toHaveLength(1);
    });

    it('finds missing services and malformed services, ports and environment values', async () => {
        expect((await jsonResult('docker-compose-validator', { document: 'services: []' })).status).toBe('issues-found');
        const output = await jsonResult('docker-compose-validator', { document: 'services:\n  invalid: false\n  web:\n    ports: [false, 70000, {published: 80}]\n    environment: {NESTED: {bad: value}}\n' });
        expect(output.issues).toHaveLength(5);
        expect(output.scope).toContain('No Docker engine');
        expect((await jsonResult('docker-compose-validator', { document: 'services:\n  web:\n    ports: {}\n    environment: 5' })).issues).toHaveLength(2);
    });

    it('rejects executable YAML tags and nonmapping roots', async () => {
        await expect(run('docker-compose-validator', { document: 'services: !!js/function "function () {}"' })).rejects.toMatchObject({ code: 'document_parse' });
        await expect(run('docker-compose-validator', { document: '[]' })).rejects.toMatchObject({ code: 'document_object' });
    });
});

describe('IPv4 CIDR arithmetic', () => {
    it('computes an ordinary subnet with high-bit IPv4 addresses', () => {
        expect(calculateIPv4Cidr('192.168.1.42/24')).toMatchObject({ cidr: '192.168.1.0/24', netmask: '255.255.255.0', network: '192.168.1.0', broadcast: '192.168.1.255', firstUsable: '192.168.1.1', lastUsable: '192.168.1.254', totalAddresses: 256, usableAddresses: 254 });
    });

    it('handles /0 without signed overflow', () => {
        expect(calculateIPv4Cidr('255.255.255.255/0')).toMatchObject({ network: '0.0.0.0', broadcast: '255.255.255.255', netmask: '0.0.0.0', totalAddresses: 4294967296, usableAddresses: 4294967294, firstUsable: '0.0.0.1', lastUsable: '255.255.255.254' });
    });

    it('uses RFC 3021 /31 and single-host /32 conventions', () => {
        expect(calculateIPv4Cidr('203.0.113.9/31')).toMatchObject({ network: '203.0.113.8', broadcast: '203.0.113.9', firstUsable: '203.0.113.8', lastUsable: '203.0.113.9', usableAddresses: 2 });
        expect(calculateIPv4Cidr('255.255.255.255/32')).toMatchObject({ network: '255.255.255.255', netmask: '255.255.255.255', firstUsable: '255.255.255.255', lastUsable: '255.255.255.255', totalAddresses: 1, usableAddresses: 1 });
    });

    it.each(['256.0.0.1/24', '1.2.3.4/33', '1.2.3/24', '1.2.3.4/-1', '1.2.3.4'])('rejects invalid CIDR %s', value => {
        expect(() => calculateIPv4Cidr(value)).toThrow('cidr_invalid');
    });

    it('clearly rejects IPv6 rather than giving IPv4 arithmetic', () => {
        expect(() => calculateIPv4Cidr('2001:db8::1/64')).toThrow('ipv4_only');
    });
});

describe('HTML accessibility pure heuristics (Node has no DOMParser)', () => {
    const good: AccessibilitySnapshot = { images: [{ alt: '', decorative: true }, { alt: 'Logo', decorative: false }], controls: [{ named: true }], headings: [{ level: 1, text: 'Title' }, { level: 2, text: 'Details' }], mainCount: 1, navigationLabels: ['Primary', 'Footer'] };

    it('excludes decorative images and accepts nonempty names and meaningful structure', () => {
        expect(auditAccessibilitySnapshot(good)).toEqual([]);
    });

    it('flags missing/empty nondecorative alt, missing labels, empty/skipped headings and landmarks', () => {
        const issues = auditAccessibilitySnapshot({ images: [{ alt: null, decorative: false }, { alt: '', decorative: false }], controls: [{ named: false }], headings: [{ level: 2, text: '' }, { level: 4, text: 'Jump' }], mainCount: 0, navigationLabels: ['', ''] });
        expect(issues).toHaveLength(8);
        expect(issues.join('\n')).toContain('no nonempty associated label');
        expect(issues.join('\n')).toContain('skipped a heading level');
    });

    it('does not claim DOM extraction coverage in Node and returns a helpful coded failure', async () => {
        expect(typeof DOMParser).toBe('undefined');
        await expect(run('html-accessibility-checker', definition('html-accessibility-checker').sample)).rejects.toMatchObject({ code: 'dom_unavailable' });
    });
});

describe('SVG optimization as source text', () => {
    it('runs SVGO browser build and preserves viewBox and accessible title', async () => {
        const output = await run('svg-optimizer', { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-labelledby="title"><title id="title">Example</title><!-- remove me --><rect x="10.000" width="80" height="80" fill="#ff0000"/></svg>' });
        expect(output).toContain('viewBox="0 0 100 100"');
        expect(output).toContain('<title id="title">Example</title>');
        expect(output).not.toContain('remove me');
        expect(output).not.toContain('10.000');
        expect(output).toMatch(/^<svg/);
        const precise = await run('svg-optimizer', { svg: '<svg viewBox="0 0 100.123456789 100.987654321"><path d="M0 0h10v10z"/></svg>' });
        expect(precise).toContain('viewBox="0 0 100.123456789 100.987654321"');
    });

    it.each(['<html><body>not SVG</body></html>', '<svg><g></svg>', '<svg/><svg/>'])('rejects malformed or non-SVG input', async svg => {
        await expect(run('svg-optimizer', { svg })).rejects.toMatchObject({ code: 'svg_invalid' });
    });

    it('rejects DOCTYPE and external entities before optimization', async () => {
        await expect(run('svg-optimizer', { svg: '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "https://example.com/private">]><svg>&xxe;</svg>' })).rejects.toMatchObject({ code: 'svg_doctype' });
        await expect(run('svg-optimizer', { svg: '<!ENTITY secret "value"><svg/>' })).rejects.toMatchObject({ code: 'svg_doctype' });
    });
});

describe('HS256 JWT HMAC signing and explicit trust boundaries', () => {
    it('round-trips UTF-8 payloads and verifies with the matching UTF-8 secret', async () => {
        const token = await encode({ sub: 'کاربر 👋', exp: Math.floor(Date.now() / 1000) + 3600 });
        expect(token.split('.')).toHaveLength(3);
        expect(JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString())).toEqual({ alg: 'HS256', typ: 'JWT' });
        const [header, payload, signature] = token.split('.');
        expect(signature).toBe(createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url'));
        expect(await verify(token)).toMatchObject({ signature: 'valid', expired: false, notYetActive: false, temporalStatus: 'within-provided-time-bounds' });
    });

    it('detects a tampered payload or wrong secret without trusting/evaluating claims', async () => {
        const token = await encode({ sub: 'original' });
        const parts = token.split('.');
        parts[1] = b64({ sub: 'tampered', exp: 1 });
        expect(await verify(parts.join('.'))).toMatchObject({ signature: 'invalid', temporalStatus: 'not-evaluated', trusted: false });
        expect(await verify(token, 'wrong-secret')).toMatchObject({ signature: 'invalid', temporalStatus: 'not-evaluated' });
    });

    it.each(['none', 'HS384', 'RS256'])('rejects algorithm %s explicitly', async alg => {
        const token = await encode({ sub: 'example' });
        const parts = token.split('.');
        parts[0] = b64({ alg });
        await expect(verify(parts.join('.'))).rejects.toMatchObject({ code: 'jwt_algorithm' });
    });

    it('separates valid signatures from expired and not-yet-active claims', async () => {
        expect(await verify(await encode({ exp: 1 }))).toMatchObject({ signature: 'valid', expired: true, notYetActive: false, temporalStatus: 'expired' });
        expect(await verify(await encode({ nbf: Math.floor(Date.now() / 1000) + 3600 }))).toMatchObject({ signature: 'valid', expired: false, notYetActive: true, temporalStatus: 'not-yet-active' });
        expect(await verify(await encode({}))).toMatchObject({ signature: 'valid', expirationClaimPresent: false, notBeforeClaimPresent: false });
    });

    it('rejects invalid claim types, unsupported extensions, malformed tokens and payloads without echoing secrets', async () => {
        await expect(encode({ exp: 'tomorrow' })).rejects.toEqual(new DeveloperToolError('jwt_claims'));
        await expect(run('jwt-encoder-verifier', { mode: 'encode', secret, payload: 'private raw payload' })).rejects.toEqual(new DeveloperToolError('payload_parse'));
        await expect(run('jwt-encoder-verifier', { mode: 'encode', secret: '', payload: '{}' })).rejects.toMatchObject({ code: 'secret_required' });
        await expect(verify('not.a.valid.token')).rejects.toEqual(new DeveloperToolError('jwt_invalid'));
        const token = await encode({});
        const parts = token.split('.');
        parts[0] = b64({ alg: 'HS256', crit: ['custom'] });
        await expect(verify(parts.join('.'))).rejects.toEqual(new DeveloperToolError('jwt_header'));
    });
});
