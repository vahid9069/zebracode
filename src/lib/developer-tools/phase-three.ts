import { DEFAULT_SCHEMA, load } from 'js-yaml';
import type { ErrorObject } from 'ajv';
import { DeveloperToolError, type DeveloperToolDefinition } from './types';

type Values = Record<string, string>;
type Mapping = Record<string, unknown>;
const mapping = (value: unknown): value is Mapping => value !== null && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const report = (value: unknown) => JSON.stringify(value, null, 2);
const pointer = (value: string) => value.replace(/~/g, '~0').replace(/\//g, '~1');

function required(value: string | undefined): string {
    if (!value?.trim()) throw new DeveloperToolError('required');
    return value;
}

function parseDocument(input: string): unknown {
    try {
        // js-yaml v4's default safe schema supports aliases/merges, not executable tags.
        return load(required(input), { schema: DEFAULT_SCHEMA });
    } catch (error) {
        if (error instanceof DeveloperToolError) throw error;
        throw new DeveloperToolError('document_parse');
    }
}

function openapi(values: Values): string {
    const doc = parseDocument(values.document);
    if (!mapping(doc)) throw new DeveloperToolError('document_object');
    const issues: string[] = [];
    const check = (valid: boolean, path: string, message: string) => { if (!valid) issues.push(`${path}: ${message}`); };
    const version = typeof doc.openapi === 'string' ? doc.openapi : '';
    check(/^3\.[01]\.\d+(?:[-+][\w.-]+)?$/.test(version), '/openapi', 'Expected an OpenAPI 3.0.x or 3.1.x version string.');
    check(mapping(doc.info), '/info', 'Expected an info object.');
    if (mapping(doc.info)) {
        check(nonempty(doc.info.title), '/info/title', 'Expected a nonempty string.');
        check(nonempty(doc.info.version), '/info/version', 'Expected a nonempty string.');
    }
    if (version.startsWith('3.0.')) check(mapping(doc.paths), '/paths', 'OpenAPI 3.0 requires a paths object (which may be empty).');
    if (version.startsWith('3.1.')) check(['paths', 'webhooks', 'components'].some(key => mapping(doc[key])), '/', 'OpenAPI 3.1 needs at least one paths, webhooks, or components object.');
    for (const key of ['paths', 'webhooks', 'components']) {
        if (doc[key] !== undefined) check(mapping(doc[key]), `/${key}`, 'Expected an object.');
    }
    if (doc.servers !== undefined) {
        check(Array.isArray(doc.servers), '/servers', 'Expected an array.');
        if (Array.isArray(doc.servers)) doc.servers.forEach((server, index) => {
            check(mapping(server) && nonempty(server.url), `/servers/${index}`, 'Expected an object with a nonempty url string.');
        });
    }
    for (const group of ['paths', 'webhooks']) {
        const paths = doc[group];
        if (!mapping(paths)) continue;
        for (const [name, item] of Object.entries(paths)) {
            if (name.startsWith('x-')) continue;
            const path = `/${group}/${pointer(name)}`;
            if (group === 'paths') check(name.startsWith('/'), path, 'Path keys must begin with /.');
            check(mapping(item), path, 'Expected a path-item object.');
            if (!mapping(item)) continue;
            if (item.$ref !== undefined) check(nonempty(item.$ref), `${path}/$ref`, 'Expected a nonempty reference string; references are not resolved.');
            if (item.parameters !== undefined) check(Array.isArray(item.parameters), `${path}/parameters`, 'Expected an array.');
            for (const method of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']) {
                const operation = item[method];
                if (operation === undefined) continue;
                const opPath = `${path}/${method}`;
                check(mapping(operation), opPath, 'Expected an operation object.');
                if (!mapping(operation)) continue;
                if (operation.parameters !== undefined) check(Array.isArray(operation.parameters), `${opPath}/parameters`, 'Expected an array.');
                if (operation.responses !== undefined || version.startsWith('3.0.')) check(mapping(operation.responses) && Object.keys(operation.responses).length > 0, `${opPath}/responses`, 'Expected a nonempty responses object.');
                if (mapping(operation.responses)) for (const [code, response] of Object.entries(operation.responses)) {
                    if (code.startsWith('x-')) continue;
                    const responsePath = `${opPath}/responses/${pointer(code)}`;
                    check(code === 'default' || /^[1-5](?:\d{2}|XX)$/.test(code), responsePath, 'Expected default, a 100–599 status, or a 1XX–5XX range.');
                    check(mapping(response), responsePath, 'Expected a response object or reference.');
                    if (mapping(response)) {
                        if (response.$ref !== undefined) check(nonempty(response.$ref), `${responsePath}/$ref`, 'Expected a nonempty reference string.');
                        else check(typeof response.description === 'string', `${responsePath}/description`, 'Expected a description string.');
                    }
                }
            }
        }
    }
    return report({ status: issues.length ? 'issues-found' : 'structural-checks-passed', issues, scope: 'Limited OpenAPI 3.0/3.1 structural checks only: version, info, root objects, servers, path keys, operation/parameter shapes and response objects. No reference resolution, schema validation, endpoint requests, or full OpenAPI compliance validation.' });
}

function parseJson(input: string | undefined, code: string): unknown {
    try { return JSON.parse(required(input)); }
    catch (error) {
        if (error instanceof DeveloperToolError) throw error;
        throw new DeveloperToolError(code);
    }
}

function rejectExternalReferences(value: unknown): void {
    if (Array.isArray(value)) { value.forEach(rejectExternalReferences); return; }
    if (!mapping(value)) return;
    for (const key of ['$ref', '$dynamicRef', '$recursiveRef']) {
        if (typeof value[key] === 'string' && !value[key].startsWith('#')) {
            throw new DeveloperToolError('schema_external_ref');
        }
    }
    // Follow schema-bearing keywords, never instance-data annotations such as const/default.
    for (const key of ['$defs', 'definitions', 'properties', 'patternProperties', 'dependentSchemas']) {
        if (mapping(value[key])) Object.values(value[key]).forEach(rejectExternalReferences);
    }
    for (const key of ['allOf', 'anyOf', 'oneOf', 'prefixItems', 'items', 'additionalItems', 'additionalProperties', 'unevaluatedItems', 'unevaluatedProperties', 'contains', 'propertyNames', 'not', 'if', 'then', 'else', 'contentSchema']) rejectExternalReferences(value[key]);
    if (mapping(value.dependencies)) Object.values(value.dependencies).filter(child => !Array.isArray(child)).forEach(rejectExternalReferences);
}

async function jsonSchema(values: Values): Promise<string> {
    const schema = parseJson(values.schema, 'schema_parse');
    const data = parseJson(values.data, 'data_parse');
    if (!mapping(schema) && typeof schema !== 'boolean') throw new DeveloperToolError('schema_object');
    rejectExternalReferences(schema);
    const dialect = mapping(schema) ? schema.$schema : undefined;
    const draft2020 = dialect === 'https://json-schema.org/draft/2020-12/schema' || dialect === 'http://json-schema.org/draft/2020-12/schema';
    if (dialect !== undefined && !draft2020 && (typeof dialect !== 'string' || !/^https?:\/\/json-schema\.org\/draft-07\/schema#?$/.test(dialect))) {
        throw new DeveloperToolError('schema_draft');
    }
    const [{ default: Ajv }, { default: Ajv2020 }, { default: addFormats }] = await Promise.all([
        import('ajv'), import('ajv/dist/2020.js'), import('ajv-formats'),
    ]);
    // Synchronous compile has no loading hook; external refs are explicitly rejected too.
    const ajv = draft2020 ? new Ajv2020({ allErrors: true, strict: false, validateFormats: true, logger: false }) : new Ajv({ allErrors: true, strict: false, validateFormats: true, logger: false });
    addFormats(ajv);
    // Normalize accepted aliases to Ajv's built-in meta-schema identifiers.
    const normalizedSchema = mapping(schema) && dialect !== undefined ? { ...schema, $schema: draft2020 ? 'https://json-schema.org/draft/2020-12/schema' : 'http://json-schema.org/draft-07/schema#' } : schema;
    let validate;
    try {
        if (mapping(normalizedSchema) && normalizedSchema.$async) throw new DeveloperToolError('schema_invalid');
        validate = ajv.compile(normalizedSchema);
    } catch { throw new DeveloperToolError('schema_invalid'); }
    let valid;
    try { valid = validate(data); }
    catch { throw new DeveloperToolError('schema_invalid'); }
    const errors = (validate.errors ?? []).map((error: ErrorObject) => ({
        instancePath: error.instancePath,
        location: error.instancePath || '(root)',
        schemaPath: error.schemaPath,
        keyword: error.keyword,
        message: error.message,
    }));
    return report({ valid, draft: draft2020 ? '2020-12' : 'draft-07', errors, scope: 'Local validation with Ajv and ajv-formats. Only fragment references are accepted; no remote schemas are fetched. The original data is not included in this report.' });
}

function compose(values: Values): string {
    const doc = parseDocument(values.document);
    if (!mapping(doc)) throw new DeveloperToolError('document_object');
    const issues: string[] = [];
    if (!mapping(doc.services) || Object.keys(doc.services).length === 0) issues.push('/services: Expected a nonempty mapping of service names to service objects.');
    if (mapping(doc.services)) for (const [name, service] of Object.entries(doc.services)) {
        const path = `/services/${pointer(name)}`;
        if (!mapping(service)) { issues.push(`${path}: Expected a service mapping.`); continue; }
        if (service.ports !== undefined) {
            if (!Array.isArray(service.ports)) issues.push(`${path}/ports: Expected a list of short port strings/numbers or long port mappings.`);
            else service.ports.forEach((port, index) => {
                const portPath = `${path}/ports/${index}`;
                if (typeof port === 'number') {
                    if (!Number.isInteger(port) || port < 1 || port > 65535) issues.push(`${portPath}: Numeric container ports must be integers from 1 to 65535.`);
                } else if (typeof port === 'string') {
                    if (!port.trim()) issues.push(`${portPath}: Short port syntax must not be empty.`);
                } else if (mapping(port)) {
                    if (!((typeof port.target === 'number' && Number.isInteger(port.target) && port.target >= 1 && port.target <= 65535) || (typeof port.target === 'string' && nonempty(port.target)))) issues.push(`${portPath}/target: Long port mappings need a numeric port or nonempty target string.`);
                    if (port.published !== undefined && !['string', 'number'].includes(typeof port.published)) issues.push(`${portPath}/published: Expected a string or number.`);
                    if (port.protocol !== undefined && (typeof port.protocol !== 'string' || !['tcp', 'udp', 'sctp'].includes(port.protocol))) issues.push(`${portPath}/protocol: Expected tcp, udp, or sctp.`);
                    if (port.host_ip !== undefined && typeof port.host_ip !== 'string') issues.push(`${portPath}/host_ip: Expected a string.`);
                } else issues.push(`${portPath}: Expected a short port string/number or long port mapping.`);
            });
        }
        if (service.environment !== undefined) {
            if (Array.isArray(service.environment)) service.environment.forEach((entry, index) => {
                if (typeof entry !== 'string' || !/^[^=\s]+(?:=[\s\S]*)?$/.test(entry)) issues.push(`${path}/environment/${index}: Expected NAME or NAME=value strings.`);
            });
            else if (mapping(service.environment)) {
                for (const [key, value] of Object.entries(service.environment)) if (!key || (value !== null && !['string', 'number', 'boolean'].includes(typeof value))) issues.push(`${path}/environment/${pointer(key)}: Expected a scalar string, number, boolean, or null.`);
            } else issues.push(`${path}/environment: Expected a mapping or a list of NAME/NAME=value strings.`);
        }
    }
    return report({ status: issues.length ? 'issues-found' : 'structural-checks-passed', issues, scope: 'Static YAML structure only: services, service mappings, ports and environment shapes. Short port strings and interpolation are not resolved. No Docker engine validation, image lookup, networking checks, or execution.' });
}

const ipv4 = (value: number) => [24, 16, 8, 0].map(shift => Math.floor(value / 2 ** shift) % 256).join('.');

export function calculateIPv4Cidr(input: string) {
    const text = required(input).trim();
    if (text.includes(':')) throw new DeveloperToolError('ipv4_only');
    const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(text);
    if (!match) throw new DeveloperToolError('cidr_invalid');
    const octets = match.slice(1, 5).map(Number);
    const prefix = Number(match[5]);
    if (octets.some(value => value > 255) || prefix > 32) throw new DeveloperToolError('cidr_invalid');
    const address = octets.reduce((sum, value) => sum * 256 + value, 0);
    const totalAddresses = 2 ** (32 - prefix);
    const network = Math.floor(address / totalAddresses) * totalAddresses;
    const broadcast = network + totalAddresses - 1;
    const pointToPoint = prefix >= 31;
    return {
        cidr: `${ipv4(network)}/${prefix}`,
        address: ipv4(address), prefix, netmask: ipv4(2 ** 32 - totalAddresses),
        network: ipv4(network), broadcast: ipv4(broadcast),
        firstAddress: ipv4(network), lastAddress: ipv4(broadcast), totalAddresses,
        firstUsable: ipv4(pointToPoint ? network : network + 1),
        lastUsable: ipv4(pointToPoint ? broadcast : broadcast - 1),
        usableAddresses: pointToPoint ? totalAddresses : totalAddresses - 2,
        convention: prefix === 31 ? 'RFC 3021 point-to-point: both addresses usable; the upper address is not a directed broadcast.' : prefix === 32 ? 'Single host route: one usable address; no directed broadcast.' : 'Conventional IPv4 subnet: network and broadcast excluded from usable hosts.',
        scope: 'IPv4 only. Broadcast reports the numeric upper subnet boundary, including /31 and /32.',
    };
}

export interface AccessibilitySnapshot {
    images: { alt: string | null; decorative: boolean }[];
    controls: { named: boolean }[];
    headings: { level: number; text: string }[];
    mainCount: number;
    navigationLabels: string[];
}

/** Pure checks separated from DOM extraction so their limits can be tested in Node. */
export function auditAccessibilitySnapshot(snapshot: AccessibilitySnapshot): string[] {
    const issues: string[] = [];
    snapshot.images.forEach((image, index) => {
        if (!image.decorative && !image.alt?.trim()) issues.push(`Image ${index + 1}: missing or empty alternative text.`);
    });
    snapshot.controls.forEach((control, index) => {
        if (!control.named) issues.push(`Form control ${index + 1}: no nonempty associated label or aria label found.`);
    });
    if (!snapshot.headings.some(heading => heading.level === 1 && heading.text.trim())) issues.push('Headings: no nonempty h1 found.');
    let previous = 0;
    snapshot.headings.forEach((heading, index) => {
        if (!heading.text.trim()) issues.push(`Heading ${index + 1}: empty accessible text.`);
        if (previous && heading.level > previous + 1) issues.push(`Heading ${index + 1}: skipped a heading level.`);
        previous = heading.level;
    });
    if (snapshot.mainCount !== 1) issues.push('Landmarks: expected exactly one main landmark.');
    if (snapshot.navigationLabels.length > 1 && snapshot.navigationLabels.some(label => !label.trim())) issues.push('Landmarks: multiple navigation regions should have distinct nonempty labels.');
    const labels = snapshot.navigationLabels.filter(label => label.trim());
    if (new Set(labels).size !== labels.length) issues.push('Landmarks: navigation labels are repeated.');
    return issues;
}

function accessibility(values: Values): string {
    const html = required(values.html);
    if (typeof DOMParser === 'undefined') throw new DeveloperToolError('dom_unavailable');
    // A template's contents are inert: no image/frame loads or script execution.
    // DOMParser creates the detached owner document; user markup stays in its template.
    const doc = new DOMParser().parseFromString('<!doctype html><html><body></body></html>', 'text/html');
    const template = doc.createElement('template');
    template.innerHTML = html;
    const root = template.content;
    const hidden = (element: Element) => Boolean(element.closest('[hidden], [aria-hidden="true"]'));
    const accessibleText = (element: Element | null): string => {
        if (!element || hidden(element)) return '';
        const ariaLabel = element.getAttribute('aria-label')?.trim();
        if (ariaLabel) return ariaLabel;
        const copy = element.cloneNode(true) as Element;
        copy.querySelectorAll('script, style, template, [hidden], [aria-hidden="true"]').forEach(child => child.remove());
        return copy.textContent?.trim() || '';
    };
    const ariaName = (element: Element): string => {
        const ids = element.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
        return ids.map(id => accessibleText(root.getElementById(id))).filter(Boolean).join(' ') || element.getAttribute('aria-label')?.trim() || '';
    };
    const labelText = (label: Element | null): string => {
        if (!label || hidden(label)) return '';
        const copy = label.cloneNode(true) as Element;
        // A select option or textarea value is not the control's label.
        copy.querySelectorAll('input, select, textarea, script, style, template, [hidden], [aria-hidden="true"]').forEach(child => child.remove());
        return accessibleText(copy);
    };
    const snapshot: AccessibilitySnapshot = {
        images: Array.from(root.querySelectorAll('img')).map(image => {
            const interactive = image.closest('a[href], button');
            const otherName = interactive && (ariaName(interactive) || accessibleText(interactive));
            const alt = image.getAttribute('alt');
            return { alt, decorative: hidden(image) || ['none', 'presentation'].includes(image.getAttribute('role') || '') || (alt === '' && (!interactive || Boolean(otherName))) };
        }),
        controls: Array.from(root.querySelectorAll('input, select, textarea')).filter(element => !hidden(element) && !['hidden', 'button', 'submit', 'reset'].includes(element.getAttribute('type') || '')).map(element => {
            const id = element.getAttribute('id');
            const explicit = id ? Array.from(root.querySelectorAll('label')).some(label => label.htmlFor === id && labelText(label)) : false;
            const wrapping = labelText(element.closest('label'));
            const imageName = element.getAttribute('type') === 'image' && nonempty(element.getAttribute('alt'));
            return { named: Boolean(ariaName(element) || explicit || wrapping || imageName) };
        }),
        headings: Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6')).filter(element => !hidden(element)).map(element => ({ level: Number(element.tagName[1]), text: ariaName(element) || accessibleText(element) })),
        mainCount: Array.from(root.querySelectorAll('main, [role="main"]')).filter(element => !hidden(element)).length,
        navigationLabels: Array.from(root.querySelectorAll('nav, [role="navigation"]')).filter(element => !hidden(element)).map(ariaName),
    };
    const issues = auditAccessibilitySnapshot(snapshot);
    return ['Static HTML accessibility review', `${issues.length} potential issue(s).`, ...issues.map(issue => `- ${issue}`), '', 'Scope: image alternatives (explicit empty alt is decorative except unnamed image-only links/buttons), form label associations, heading order/text, and main/navigation landmarks. Detached DOMParser parsing only; scripts are not executed and markup is never inserted into the page. This is not a WCAG conformance audit. CSS visibility, computed accessible names, keyboard behavior, contrast, dynamic states and assistive-technology testing require manual review.'].join('\n');
}

async function svg(values: Values): Promise<string> {
    const input = required(values.svg).trim();
    if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(input)) throw new DeveloperToolError('svg_doctype');
    if (!/^(?:<\?xml\s[^?]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg(?:\s|\/?>)/.test(input)) throw new DeveloperToolError('svg_invalid');
    try {
        const { optimize } = await import('svgo/browser');
        let originalViewBox: string | undefined;
        const result = optimize(input, {
            multipass: true,
            // Explicit plugins avoid removing viewBox or IDs and retain useful accessibility data.
            plugins: [{
                name: 'validateSvgRoot',
                fn: root => {
                    const elements = root.children.filter(child => child.type === 'element');
                    if (elements.length !== 1 || elements[0].name !== 'svg') throw new Error('invalid');
                    const namespace = elements[0].attributes.xmlns;
                    if (namespace !== undefined && namespace !== 'http://www.w3.org/2000/svg') throw new Error('invalid');
                    originalViewBox = elements[0].attributes.viewBox;
                },
            }, 'removeXMLProcInst', 'removeComments', 'removeMetadata', 'cleanupAttrs', 'cleanupNumericValues', 'convertColors', 'removeEmptyAttrs', 'removeEmptyText', 'sortAttrs', {
                name: 'preserveViewBox',
                fn: root => {
                    const svgRoot = root.children.find(child => child.type === 'element');
                    if (svgRoot?.type === 'element' && originalViewBox !== undefined) svgRoot.attributes.viewBox = originalViewBox;
                },
            }],
        });
        if (!/^<svg(?:\s|\/?>)/.test(result.data)) throw new Error('invalid');
        return result.data;
    } catch { throw new DeveloperToolError('svg_invalid'); }
}

function base64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
    try {
        if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) throw new Error('format');
        const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
        const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
        if (base64Url(bytes) !== value) throw new Error('canonical');
        return bytes;
    } catch { throw new DeveloperToolError('jwt_invalid'); }
}

function tokenObject(segment: string): Mapping {
    try {
        const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decodeBase64Url(segment)));
        if (!mapping(value)) throw new Error('object');
        return value;
    } catch { throw new DeveloperToolError('jwt_invalid'); }
}

function validateTimeClaims(payload: Mapping): void {
    for (const claim of ['exp', 'nbf']) if (payload[claim] !== undefined && (typeof payload[claim] !== 'number' || !Number.isFinite(payload[claim]))) throw new DeveloperToolError('jwt_claims');
}

async function cryptoOperation<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch { throw new DeveloperToolError('crypto_failure'); }
}

async function jwt(values: Values): Promise<string> {
    if (!globalThis.crypto?.subtle) throw new DeveloperToolError('crypto_unavailable');
    if (!values.secret) throw new DeveloperToolError('secret_required');
    if (!['encode', 'verify'].includes(values.mode)) throw new DeveloperToolError('mode_invalid');
    const subtle = globalThis.crypto.subtle;
    const key = await cryptoOperation(() => subtle.importKey('raw', new TextEncoder().encode(values.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']));
    if (values.mode === 'encode') {
        const payload = parseJson(values.payload, 'payload_parse');
        if (!mapping(payload)) throw new DeveloperToolError('payload_object');
        validateTimeClaims(payload);
        const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
        const body = base64Url(new TextEncoder().encode(JSON.stringify(payload)));
        const signingInput = `${header}.${body}`;
        const signature = await cryptoOperation(() => subtle.sign('HMAC', key, new TextEncoder().encode(signingInput)));
        return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
    }
    const parts = required(values.token).trim().split('.');
    if (parts.length !== 3) throw new DeveloperToolError('jwt_invalid');
    const header = tokenObject(parts[0]);
    if (header.alg !== 'HS256') throw new DeveloperToolError('jwt_algorithm');
    // No critical extensions or unencoded payload extension are implemented.
    if (header.crit !== undefined || header.b64 !== undefined) throw new DeveloperToolError('jwt_header');
    const signature = decodeBase64Url(parts[2]);
    const verified = await cryptoOperation(() => subtle.verify('HMAC', key, signature, new TextEncoder().encode(`${parts[0]}.${parts[1]}`)));
    if (!verified) return report({ signature: 'invalid', temporalStatus: 'not-evaluated', trusted: false, note: 'Signature mismatch. Payload and time claims are untrusted and were not evaluated.' });
    const payload = tokenObject(parts[1]);
    validateTimeClaims(payload);
    const now = Date.now() / 1000;
    const expired = typeof payload.exp === 'number' && payload.exp <= now;
    const notYetActive = typeof payload.nbf === 'number' && payload.nbf > now;
    return report({ signature: 'valid', expired, notYetActive, expirationClaimPresent: payload.exp !== undefined, notBeforeClaimPresent: payload.nbf !== undefined, temporalStatus: expired && notYetActive ? 'expired-and-not-yet-active' : expired ? 'expired' : notYetActive ? 'not-yet-active' : 'within-provided-time-bounds', note: 'HS256 signature verified with the supplied secret. This is not an authorization decision: issuer, audience, replay, secret strength and application policy are not checked. No payload or secret is included in this report.' });
}

export const phaseThreeTools: DeveloperToolDefinition[] = [
    { slug: 'openapi-validator', category: 'validators', subCategory: 'api', fields: [{ id: 'document', type: 'textarea' }], sample: { document: 'openapi: 3.1.0\ninfo:\n  title: Local example\n  version: 1.0.0\npaths:\n  /health:\n    get:\n      responses:\n        "200":\n          description: Healthy\n' }, run: openapi },
    { slug: 'json-schema-validator', category: 'validators', subCategory: 'json', fields: [{ id: 'schema', type: 'textarea' }, { id: 'data', type: 'textarea' }], sample: { schema: '{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"email":{"type":"string","format":"email"}},"required":["email"],"additionalProperties":false}', data: '{"email":"developer@example.com"}' }, run: jsonSchema },
    { slug: 'docker-compose-validator', category: 'validators', subCategory: 'configuration', fields: [{ id: 'document', type: 'textarea' }], sample: { document: 'services:\n  web:\n    image: nginx:alpine\n    ports:\n      - "8080:80"\n    environment:\n      APP_MODE: development\n' }, run: compose },
    { slug: 'cidr-calculator', category: 'inspectors', subCategory: 'network', fields: [{ id: 'cidr', type: 'text' }], sample: { cidr: '192.168.1.42/24' }, run: values => report(calculateIPv4Cidr(values.cidr)) },
    { slug: 'html-accessibility-checker', category: 'inspectors', subCategory: 'html', fields: [{ id: 'html', type: 'textarea' }], sample: { html: '<!doctype html>\n<html lang="en"><body><main>\n<h1>Contact</h1>\n<label for="email">Email</label><input id="email" type="email">\n<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" alt="" role="presentation">\n</main></body></html>' }, outputExtension: 'txt', run: accessibility },
    { slug: 'svg-optimizer', category: 'converters', subCategory: 'svg', fields: [{ id: 'svg', type: 'textarea' }], sample: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><!-- sample --><rect x="10.000" y="10.000" width="80" height="80" fill="#ff0000"/></svg>' }, outputExtension: 'svg', run: svg },
    { slug: 'jwt-encoder-verifier', category: 'inspectors', subCategory: 'security', fields: [{ id: 'mode', type: 'select', options: ['encode', 'verify'] }, { id: 'token', type: 'textarea' }, { id: 'payload', type: 'textarea' }, { id: 'secret', type: 'password' }], sample: { mode: 'encode', token: '', payload: '{"sub":"demo-user","role":"reader"}', secret: 'public-demo-key-not-for-production' }, outputExtension: 'txt', run: jwt },
];
