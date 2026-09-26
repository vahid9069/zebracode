import yaml from 'js-yaml';
import toml from 'toml';
import { xml2json } from 'xml-js';
import tomlify from 'tomlify-j0.4';
import { AllToolsList } from '@/lib/registry/tools';
import { samples } from '@/lib/registry/samples';
import type { ToolMeta } from '@/types/types';

export type ToolOptionValue = string | number | boolean;

export interface ToolOption {
    id: string;
    label: string;
    type: 'boolean' | 'select';
    defaultValue: ToolOptionValue;
    labelEn?: string;
    selectOptions?: { label: string; labelEn?: string; value: ToolOptionValue }[];
}

export interface ToolFeature {
    title: string;
    description: string;
    icon: string;
    titleEn?: string;
    descriptionEn?: string;
}

export interface ToolCodeSnippet {
    languageTab: string;
    code: string;
}

export interface ToolFaq {
    question: string;
    answer: string;
    questionEn?: string;
    answerEn?: string;
}

export interface ToolDefinition {
    slug: string;
    type: string;
    title: string;
    persianTitle: string;
    category: string;
    version: string;
    description: string;
    input: {
        language: string;
        badge: string;
        acceptedExtensions: string[];
        sampleCode: string;
    };
    output: {
        language: string;
        badge: string;
        fileExtension: string;
        downloadMimeType: string;
    };
    options?: ToolOption[];
    features: ToolFeature[];
    codeSnippets: ToolCodeSnippet[];
    faqs: ToolFaq[];
    validate: (source: string) => void;
    transform: (source: string, options: Record<string, ToolOptionValue>) => string | Promise<string>;
}

const samplesByLanguage: Record<string, string> = {
    css: `.card {
  display: flex;
  gap: 1rem;
  color: #2563eb;
}`,
    graphql: `type User {
  id: ID!
  name: String!
  email: String
}`,
    html: `<!doctype html>
<html>
  <body><h1>ZebraCode</h1></body>
</html>`,
    javascript: `const user = {
  id: 42,
  name: "Ada Lovelace",
  active: true
};`,
    json: `{
  "name": "zebracode-api",
  "server": { "host": "127.0.0.1", "port": 8080 },
  "features": ["fast", "private"]
}`,
    markdown: `# ZebraCode

Convert developer data formats locally.`,
    sql: `CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);`,
    toml: `[server]
host = "127.0.0.1"
port = 8080`,
    typescript: `interface User {
  id: number;
  name: string;
  active: boolean;
}`,
    xml: `<?xml version="1.0"?>
<user>
  <name>Ada Lovelace</name>
  <active>true</active>
</user>`,
    yaml: `app:
  name: zebracode-api
  debug: false
server:
  host: 127.0.0.1
  port: 8080
features:
  - fast
  - private`,
};

const yamlTomlSample = `# Local service configuration
app:
  name: zebracode-api
  debug: false
server:
  host: 127.0.0.1
  port: 8080
  trusted_proxies:
    - 10.0.0.1
    - 10.0.0.2
database:
  primary:
    driver: postgres
    pool_size: 12
features:
  - name: rate-limit
    enabled: true
  - name: audit-log
    enabled: false`;

const explicitToolContent: Record<string, {
    persianTitle: string;
    description: string;
    sample: string;
    features: ToolFeature[];
    codeSnippets: ToolCodeSnippet[];
    faqs: ToolFaq[];
}> = {
    'yaml-to-toml': {
        persianTitle: 'تبدیل YAML به TOML',
        description: 'YAML را در مرورگر به TOML خوانا تبدیل کنید؛ جداول تودرتو و آرایه‌ها پشتیبانی می‌شوند و داده از دستگاه شما خارج نمی‌شود.',
        sample: yamlTomlSample,
        features: [
            { title: 'جداول و آرایه‌ها', description: 'ساختارهای تودرتو به جداول و آرایه‌های TOML تبدیل می‌شوند.', titleEn: 'Tables and arrays', descriptionEn: 'Nested structures are converted to TOML tables and arrays.', icon: 'Table' },
            { title: 'پردازش محلی', description: 'فایل‌ها فقط در مرورگر شما پردازش می‌شوند.', titleEn: 'Local processing', descriptionEn: 'Files are processed only in your browser.', icon: 'ShieldCheck' },
            { title: 'Rust و Python', description: 'خروجی برای Cargo.toml و pyproject.toml مناسب است.', titleEn: 'Rust and Python', descriptionEn: 'The output works with Cargo.toml and pyproject.toml.', icon: 'Package' },
        ],
        codeSnippets: [
            { languageTab: 'Python', code: 'import tomllib\\nfrom pathlib import Path\\n\\nconfig = tomllib.loads(Path(\"config.toml\").read_text())\\nprint(config[\"server\"][\"host\"])' },
            { languageTab: 'Rust', code: 'let source = std::fs::read_to_string(\"config.toml\")?;\\nlet config: toml::Value = toml::from_str(&source)?;\\nprintln!(\"{}\", config[\"server\"][\"host\"]);' },
            { languageTab: 'Node.js', code: 'import { parse } from \"toml\";\\nimport { readFile } from \"node:fs/promises\";\\n\\nconst config = parse(await readFile(\"config.toml\", \"utf8\"));' },
        ],
        faqs: [
            { question: 'چرا TOML برای فایل‌های پیکربندی پیشنهاد می‌شود؟', answer: 'جدول‌های صریح و نحو ساده، خواندن و نگهداری بسیاری از تنظیمات را آسان می‌کند.', questionEn: 'Why use TOML for configuration files?', answerEn: 'Explicit tables and simple syntax make many configuration files easier to read and maintain.' },
            { question: 'آیا ساختارهای تودرتو پشتیبانی می‌شوند؟', answer: 'بله، آبجکت‌های تودرتو به جدول‌های TOML و فهرست آبجکت‌ها به آرایه‌ای از جدول‌ها تبدیل می‌شوند.', questionEn: 'Are nested structures supported?', answerEn: 'Yes. Nested objects become TOML tables, and arrays of objects become arrays of tables.' },
            { question: 'آیا اطلاعات خصوصی امن باقی می‌مانند؟', answer: 'بله، پردازش در مرورگر انجام می‌شود و ورودی به سرور ارسال نمی‌شود.', questionEn: 'Does my private data stay secure?', answerEn: 'Yes. Conversion runs in your browser and input is not sent to a server.' },
        ],
    },
    'json-to-yaml': {
        persianTitle: 'تبدیل JSON به YAML',
        description: 'داده JSON را به YAML خوانا تبدیل کنید؛ ترتیب و ساختار داده حفظ می‌شود و پردازش کاملاً محلی است.',
        sample: samplesByLanguage.json,
        features: [
            { title: 'ساختارهای تودرتو', description: 'آبجکت‌ها و آرایه‌های JSON با تورفتگی خوانا تبدیل می‌شوند.', titleEn: 'Nested structures', descriptionEn: 'JSON objects and arrays are converted with readable indentation.', icon: 'Braces' },
            { title: 'پردازش محلی', description: 'محتوای JSON در دستگاه شما می‌ماند.', titleEn: 'Local processing', descriptionEn: 'Your JSON data stays on your device.', icon: 'ShieldCheck' },
            { title: 'آماده برای پیکربندی', description: 'مناسب برای فایل‌های Docker Compose و CI/CD.', titleEn: 'Configuration ready', descriptionEn: 'Useful for Docker Compose and CI/CD configuration files.', icon: 'FileCode2' },
        ],
        codeSnippets: [
            { languageTab: 'Node.js', code: 'import yaml from \"js-yaml\";\\nimport { readFile } from \"node:fs/promises\";\\n\\nconst input = JSON.parse(await readFile(\"data.json\", \"utf8\"));\\nconsole.log(yaml.dump(input));' },
            { languageTab: 'Python', code: 'import json, yaml\\nfrom pathlib import Path\\n\\ndata = json.loads(Path(\"data.json\").read_text())\\nprint(yaml.safe_dump(data))' },
        ],
        faqs: [
            { question: 'آیا آرایه‌ها و آبجکت‌های تو در تو حفظ می‌شوند؟', answer: 'بله، ساختار داده هنگام تبدیل از JSON به YAML حفظ می‌شود.', questionEn: 'Are arrays and nested objects preserved?', answerEn: 'Yes. The data structure is preserved when converting JSON to YAML.' },
            { question: 'آیا خروجی برای فایل‌های پیکربندی مناسب است؟', answer: 'بله، خروجی YAML برای Docker Compose، Kubernetes و CI/CD قابل استفاده است.', questionEn: 'Can I use the output in configuration files?', answerEn: 'Yes. YAML output can be used with Docker Compose, Kubernetes, and CI/CD.' },
        ],
    },
    'json-to-typescript': {
        persianTitle: 'تبدیل JSON به TypeScript',
        description: 'از نمونه JSON، تعریف‌های TypeScript بسازید تا مدل‌های داده را سریع‌تر و با خطای کمتر در برنامه استفاده کنید.',
        sample: samplesByLanguage.json,
        features: [
            { title: 'تعریف نوع‌ها', description: 'ساختار JSON به interface یا typeهای TypeScript تبدیل می‌شود.', titleEn: 'Type definitions', descriptionEn: 'JSON structure is converted to TypeScript interfaces or types.', icon: 'Braces' },
            { title: 'پردازش خصوصی', description: 'داده نمونه شما در مرورگر باقی می‌ماند.', titleEn: 'Private processing', descriptionEn: 'Your sample data stays in your browser.', icon: 'ShieldCheck' },
            { title: 'یکپارچگی سریع', description: 'کد خروجی آماده کپی در پروژه است.', titleEn: 'Quick integration', descriptionEn: 'The generated code is ready to copy into your project.', icon: 'Code2' },
        ],
        codeSnippets: [
            { languageTab: 'TypeScript', code: 'export interface ServerConfig {\\n  host: string;\\n  port: number;\\n}\\n\\nexport interface AppConfig {\\n  server: ServerConfig;\\n}' },
        ],
        faqs: [
            { question: 'آیا آرایه‌ها و مقادیر nullable شناسایی می‌شوند؟', answer: 'بله، نوع فیلدها از نمونه ورودی استخراج می‌شود.', questionEn: 'Are arrays and nullable values detected?', answerEn: 'Yes. Field types are inferred from the input sample.' },
            { question: 'آیا داده ورودی ارسال می‌شود؟', answer: 'خیر، تبدیل در مرورگر انجام می‌شود.', questionEn: 'Is my input uploaded?', answerEn: 'No. Conversion runs in your browser.' },
        ],
    },
    'xml-to-json': {
        persianTitle: 'تبدیل XML به JSON',
        description: 'اسناد XML را به JSON تبدیل کنید؛ عناصر تودرتو، ویژگی‌ها و داده‌ها با تنظیمات مبدل پردازش می‌شوند.',
        sample: samplesByLanguage.xml,
        features: [
            { title: 'عناصر تودرتو', description: 'ساختار والد و فرزند XML به آبجکت‌های JSON نگاشت می‌شود.', titleEn: 'Nested elements', descriptionEn: 'XML parent-child structure is mapped to JSON objects.', icon: 'Network' },
            { title: 'ویژگی‌های XML', description: 'ویژگی‌ها همراه با محتوای عناصر تبدیل می‌شوند.', titleEn: 'XML attributes', descriptionEn: 'Attributes are converted alongside element content.', icon: 'ListTree' },
            { title: 'پردازش محلی', description: 'محتوای XML روی دستگاه شما پردازش می‌شود.', titleEn: 'Local processing', descriptionEn: 'XML content is processed on your device.', icon: 'ShieldCheck' },
        ],
        codeSnippets: [
            { languageTab: 'Node.js', code: 'import { xml2js } from \"xml-js\";\\nimport { readFile } from \"node:fs/promises\";\\n\\nconst xml = await readFile(\"document.xml\", \"utf8\");\\nconst result = xml2js(xml, { compact: true });\\nconsole.log(JSON.stringify(result, null, 2));' },
        ],
        faqs: [
            { question: 'ویژگی‌های XML چگونه تبدیل می‌شوند؟', answer: 'ویژگی‌ها طبق ساختار خروجی انتخاب‌شده در JSON قرار می‌گیرند.', questionEn: 'How are XML attributes converted?', answerEn: 'Attributes are represented in JSON according to the selected output structure.' },
            { question: 'آیا عناصر تکراری پشتیبانی می‌شوند؟', answer: 'بله، عناصر تکراری در خروجی به آرایه تبدیل می‌شوند.', questionEn: 'Are repeated elements supported?', answerEn: 'Yes. Repeated elements are represented as arrays in the output.' },
        ],
    },
};

const extensionsByLanguage: Record<string, string[]> = {
    css: ['css', 'scss'],
    graphql: ['graphql', 'gql'],
    html: ['html', 'htm'],
    javascript: ['js', 'mjs', 'cjs'],
    json: ['json'],
    markdown: ['md', 'markdown'],
    sql: ['sql'],
    toml: ['toml'],
    typescript: ['ts', 'tsx'],
    xml: ['xml'],
    yaml: ['yaml', 'yml'],
};

const outputExtensionsByLanguage: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    markdown: 'md',
};

const mimeTypesByLanguage: Record<string, string> = {
    css: 'text/css;charset=utf-8',
    html: 'text/html;charset=utf-8',
    json: 'application/json;charset=utf-8',
    markdown: 'text/markdown;charset=utf-8',
    toml: 'application/toml;charset=utf-8',
    xml: 'application/xml;charset=utf-8',
    yaml: 'application/yaml;charset=utf-8',
};

const genericFeatures: ToolFeature[] = [
    { title: 'تبدیل دقیق', description: 'ساختار ورودی با مبدل تخصصی همان ابزار پردازش می‌شود.', titleEn: 'Accurate conversion', descriptionEn: 'Input is processed by this tool’s dedicated converter.', icon: 'Workflow' },
    { title: 'پردازش محلی', description: 'ورودی در مرورگر پردازش می‌شود و ارسال شبکه‌ای ندارد.', titleEn: 'Local processing', descriptionEn: 'Your input is processed in your browser and is not uploaded.', icon: 'ShieldCheck' },
    { title: 'خروجی آماده استفاده', description: 'نتیجه را کپی یا به‌صورت فایل ذخیره کنید.', titleEn: 'Ready-to-use output', descriptionEn: 'Copy the result or save it as a file.', icon: 'Download' },
];

const defaultFaqs: ToolFaq[] = [
    { question: 'آیا داده ورودی به سرور ارسال می‌شود؟', answer: 'خیر، عملیات تبدیل در مرورگر انجام می‌شود.', questionEn: 'Is my input sent to a server?', answerEn: 'No. Conversion runs in your browser.' },
    { question: 'چطور می‌توانم نتیجه را ذخیره کنم؟', answer: 'از دکمه کپی یا دانلود در پنل خروجی استفاده کنید.', questionEn: 'How can I save the result?', answerEn: 'Use the copy or download action in the output panel.' },
];

function validateSource(tool: ToolMeta, source: string) {
    if (tool.validateInput && !tool.validateInput(source)) {
        throw new Error(tool.validationErrorMessage || 'Invalid input');
    }

    switch (tool.inputLanguage.toLowerCase()) {
        case 'json':
            JSON.parse(source);
            break;
        case 'yaml':
            yaml.load(source);
            break;
        case 'toml':
            toml.parse(source);
            break;
        case 'xml':
            xml2json(source, { compact: true });
            break;
    }
}

function flattenArrays(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(flattenArrays).flat(Infinity);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, flattenArrays(item)]));
    }
    return value;
}

function buildToolDefinition(slug: string, tool: ToolMeta): ToolDefinition {
    const explicit = explicitToolContent[slug];
    const inputLanguage = tool.inputLanguage.toLowerCase();
    const outputLanguage = tool.outputLanguage.toLowerCase();
    return {
        slug,
        type: tool.type,
        title: tool.title,
        persianTitle: explicit?.persianTitle || tool.title,
        category: tool.subCategory,
        version: 'v1.0.0',
        description: explicit?.description || tool.shortDescription,
        input: {
            language: inputLanguage,
            badge: inputLanguage.toUpperCase(),
            acceptedExtensions: (extensionsByLanguage[inputLanguage] || ['txt']).map(extension => `.${extension}`),
            sampleCode: explicit?.sample || tool.sampleCodeSimple || samples[inputLanguage as keyof typeof samples]?.simple || samplesByLanguage[inputLanguage] || '',
        },
        output: {
            language: outputLanguage,
            badge: outputLanguage.toUpperCase(),
            fileExtension: `.${outputExtensionsByLanguage[outputLanguage] || outputLanguage}`,
            downloadMimeType: mimeTypesByLanguage[outputLanguage] || 'text/plain;charset=utf-8',
        },
        options: slug === 'yaml-to-toml' ? [
            { id: 'preserveComments', label: 'حفظ کامنت‌ها (#)', labelEn: 'Preserve comments (#)', type: 'boolean', defaultValue: false },
            { id: 'indentSpaces', label: 'تورفتگی', labelEn: 'Indentation', type: 'select', defaultValue: 2, selectOptions: [{ label: '۲ فاصله', labelEn: '2 spaces', value: 2 }, { label: '۴ فاصله', labelEn: '4 spaces', value: 4 }] },
            { id: 'flattenArrays', label: 'فشرده‌سازی آرایه‌های ساده', labelEn: 'Flatten simple arrays', type: 'boolean', defaultValue: false },
        ] : [],
        features: explicit?.features || genericFeatures,
        codeSnippets: explicit?.codeSnippets || [],
        faqs: explicit?.faqs || defaultFaqs,
        validate: source => validateSource(tool, source),
        transform: async (source, options) => {
            if (slug === 'yaml-to-toml') {
                const parsed = yaml.load(source);
                const data = options.flattenArrays === true ? flattenArrays(parsed) : parsed;
                const result = tomlify.toToml(data, { space: options.indentSpaces === 4 ? 4 : 2 }).replace(/^\s+(\[)/gm, '$1');
                if (options.preserveComments !== true) return result;
                const comments = source.split(/\r?\n/).filter(line => /^\s*#/.test(line));
                return [...comments, result].filter(Boolean).join('\n');
            }

            const output: unknown = await tool.transformFunction(source);
            return typeof output === 'string' ? output : JSON.stringify(output, null, 2);
        },
    };
}

const slugByTool = Object.entries(AllToolsList).flatMap(([key, tool]) => {
    if (tool.category !== 'converters' || tool.requiresSecondaryInput) return [];
    const slug = tool.href.split('/').filter(Boolean).pop();
    return slug ? [[slug, buildToolDefinition(slug, tool)] as const] : [[key, buildToolDefinition(key, tool)] as const];
});

export const tools: Record<string, ToolDefinition> = Object.fromEntries(slugByTool);

export function getToolDefinition(slug: string) {
    return tools[slug];
}
