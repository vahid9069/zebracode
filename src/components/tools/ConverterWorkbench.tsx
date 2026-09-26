'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import {
    ArrowLeftRight, Check, ChevronDown, Clipboard, Code2, Download,
    FileUp, Maximize2, Minimize2, Play, Sparkles, Trash2, Zap, CircleAlert,
    Braces, FileCode2, ListTree, Network, Package, ShieldCheck, Table, Workflow,
} from 'lucide-react';
import type { ToolCodeSnippet, ToolFaq, ToolFeature, ToolOption, ToolOptionValue } from '@/config/tools';

export type ConverterOptions = Record<string, ToolOptionValue>;

export interface ConverterWorkbenchProps<InputType = string, OutputType = string> {
    title: string;
    description: string;
    locale?: 'fa' | 'en';
    inputLanguage: string;
    outputLanguage: string;
    inputExtension: string[];
    outputExtension: string;
    outputMimeType?: string;
    initialInput: string;
    category?: string;
    version?: string;
    specification?: string;
    toolOptions?: ToolOption[];
    features?: ToolFeature[];
    codeSnippets?: ToolCodeSnippet[];
    faqs?: ToolFaq[];
    validate: (input: string) => InputType;
    convert: (input: InputType, options: ConverterOptions, sourceText?: string) => OutputType | Promise<OutputType>;
    serialize: (output: OutputType) => string;
    sampleInput?: string;
}

const COPY_FEEDBACK_MS = 2000;
const CONVERSION_DEBOUNCE_MS = 150;
const featureIcons = {
    Braces,
    Code2,
    Download,
    FileCode2,
    ListTree,
    Network,
    Package,
    ShieldCheck,
    Table,
    Workflow,
} as const;

const fa = {
    home: 'خانه',
    category: 'مبدل‌های داده و کانفیگ',
    local: 'موتور آفلاین (پردازش محلی)',
    sample: 'نمونه داده واقعی',
    upload: 'آپلود فایل',
    clear: 'پاک‌سازی محیط',
    comments: 'حفظ کامنت‌ها',
    commentHint: 'کامنت‌های مستقل YAML به انتهای خروجی منتقل می‌شوند.',
    indent: 'تورفتگی',
    spaces: 'فاصله',
    flatten: 'فشرده‌سازی آرایه‌های تودرتو',
    live: 'تبدیل زنده',
    convert: 'تبدیل دستی',
    input: 'ورودی',
    output: 'خروجی',
    valid: 'معتبر',
    invalid: 'نامعتبر',
    generated: 'تولید خودکار',
    copyResult: 'کپی سریع',
    copied: 'کپی شد!',
    format: 'مرتب‌سازی',
    minify: 'فشرده‌سازی',
    copy: 'کپی ورودی',
    fullscreen: 'تمام‌صفحه',
    empty: 'خروجی تبدیل در اینجا نمایش داده می‌شود',
    lines: 'خط',
    chars: 'کاراکتر',
    size: 'حجم',
    utf8: 'UTF-8',
    guideTitle: 'راهنمای این ابزار',
    tablesTitle: 'پشتیبانی از جداول و بخش‌ها',
    tablesBody: 'آبجکت‌های تودرتو به جدول‌های TOML و فهرست آبجکت‌ها به آرایه‌ای از جدول‌ها تبدیل می‌شوند.',
    privacyTitle: 'امنیت و پردازش محلی',
    privacyBody: 'محتوای فایل در مرورگر شما پردازش می‌شود و برای تبدیل به سرور ارسال نمی‌شود.',
    ecosystemTitle: 'سازگاری با Python و Rust',
    ecosystemBody: 'خروجی TOML برای فایل‌هایی مانند Cargo.toml و pyproject.toml مناسب است.',
    quickstart: 'نمونه استفاده در پروژه',
    python: 'Python',
    rust: 'Rust',
    node: 'Node.js',
    faqTitle: 'سوالات متداول',
    faq1: 'چرا TOML برای فایل‌های پیکربندی پیشنهاد می‌شود؟',
    faq1a: 'ساختار صریح جدول‌ها و نحو ساده، خواندن و نگهداری بسیاری از فایل‌های پیکربندی را آسان می‌کند.',
    faq2: 'آیا ساختارهای تودرتو در TOML پشتیبانی می‌شوند؟',
    faq2a: 'بله. آبجکت‌های تودرتو به جدول‌ها و آرایه‌های آبجکت به آرایه‌های جدول در TOML تبدیل می‌شوند.',
    faq3: 'آیا اطلاعات خصوصی و کلیدهای API امن باقی می‌مانند؟',
    faq3a: 'بله. تبدیل در سمت مرورگر انجام می‌شود و ورودی شما به سرور ارسال نمی‌شود.',
    reduce: 'تغییر حجم',
    spec: 'سازگار با TOML',
    error: 'خطا در تبدیل ورودی',
    confirmClear: 'ورودی و خروجی پاک شوند؟',
};

const en = {
    home: 'Home',
    category: 'Data & Config Converters',
    local: 'Offline engine (processed locally)',
    sample: 'Load sample',
    upload: 'Upload file',
    clear: 'Clear workspace',
    comments: 'Preserve comments',
    commentHint: 'Standalone YAML comments are moved to the end of the output.',
    indent: 'Indentation',
    spaces: 'spaces',
    flatten: 'Flatten nested arrays',
    live: 'Live sync',
    convert: 'Convert',
    input: 'Input',
    output: 'Output',
    valid: 'Valid',
    invalid: 'Invalid',
    generated: 'Auto-generated',
    copyResult: 'Copy result',
    copied: 'Copied!',
    format: 'Format',
    minify: 'Minify',
    copy: 'Copy input',
    fullscreen: 'Fullscreen',
    empty: 'Converted output will appear here',
    lines: 'lines',
    chars: 'chars',
    size: 'Size',
    utf8: 'UTF-8',
    guideTitle: 'Tool guide',
    tablesTitle: 'Tables and sections',
    tablesBody: 'Nested objects become TOML tables, and lists of objects become arrays of tables.',
    privacyTitle: 'Private, local processing',
    privacyBody: 'Your file is processed in the browser and is not sent to a server for conversion.',
    ecosystemTitle: 'Python and Rust compatibility',
    ecosystemBody: 'TOML output works well with files such as Cargo.toml and pyproject.toml.',
    quickstart: 'Read the result in your project',
    python: 'Python',
    rust: 'Rust',
    node: 'Node.js',
    faqTitle: 'Frequently asked questions',
    faq1: 'Why use TOML for configuration files?',
    faq1a: 'Its explicit tables and simple syntax make many configuration files easier to read and maintain.',
    faq2: 'Are nested structures supported in TOML?',
    faq2a: 'Yes. Nested objects become tables, and arrays of objects become arrays of tables.',
    faq3: 'Do private values and API keys remain secure?',
    faq3a: 'Yes. Conversion runs in your browser and your input is not sent to a server.',
    reduce: 'Size change',
    spec: 'TOML compliant',
    error: 'Input conversion failed',
    confirmClear: 'Clear the input and output?',
};

function formatBytes(bytes: number) {
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(2)} KB`;
}

function StatusBar({ value, locale, trailing }: { value: string; locale: 'fa' | 'en'; trailing?: React.ReactNode }) {
    const text = locale === 'fa' ? fa : en;
    return <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{text.lines}: {value ? value.split('\n').length : 0}</span>
            <span>{text.chars}: {value.length}</span>
            <span>{text.size}: {formatBytes(new Blob([value]).size)}</span>
            <span>{text.utf8}</span>
        </div>
        {trailing}
    </div>;
}

function EditorPanel({
    title, language, value, onChange, readOnly, isValid, locale, actions, emptyText, footer,
}: {
    title: string;
    language: string;
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    isValid?: boolean | null;
    locale: 'fa' | 'en';
    actions: React.ReactNode;
    emptyText?: string;
    footer?: React.ReactNode;
}) {
    const text = locale === 'fa' ? fa : en;
    const lineCount = Math.max(1, value.split('\n').length);
    return <section className="flex min-h-[460px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <header className="flex min-h-12 items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex min-w-0 items-center gap-2">
                <span className="hidden shrink-0 items-center gap-1.5 sm:flex" aria-hidden="true">
                    <i className="h-2 w-2 rounded-full bg-red-400" />
                    <i className="h-2 w-2 rounded-full bg-amber-400" />
                    <i className="h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="rounded bg-blue-100 px-2 py-1 font-mono text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300" dir="ltr">{language.toUpperCase()}</span>
                <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</span>
                {isValid !== undefined && <span className={`hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] sm:inline-flex ${isValid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                    {isValid ? <Check className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}{isValid ? text.valid : text.invalid}
                </span>}
            </div>
            <div className="flex shrink-0 items-center gap-1">{actions}</div>
        </header>
        <div className="relative flex flex-1 overflow-hidden bg-white dark:bg-[#0b1020]">
            <div aria-hidden="true" className="select-none overflow-hidden border-l border-slate-100 bg-slate-50 px-2 py-3 text-right font-mono text-xs leading-6 text-slate-400 dark:border-slate-800 dark:bg-slate-900/60">
                {Array.from({ length: lineCount }, (_, index) => <div key={index}>{index + 1}</div>)}
            </div>
            {readOnly ? <pre dir="ltr" aria-label={`${title} ${language} output`} className="min-w-0 flex-1 overflow-auto whitespace-pre p-3 font-mono text-[13px] leading-6 text-slate-800 dark:text-slate-200">
                {value || <span className="flex h-full min-h-64 items-center justify-center gap-2 whitespace-normal text-center font-sans text-sm text-slate-400"><Code2 className="h-5 w-5" />{emptyText}</span>}
            </pre> : <textarea
                dir="ltr"
                value={value}
                onChange={event => onChange?.(event.target.value)}
                spellCheck={false}
                autoComplete="off"
                aria-label={`${title} ${language} input`}
                className="min-w-0 flex-1 resize-none overflow-auto bg-transparent p-3 font-mono text-[13px] leading-6 text-slate-800 outline-none selection:bg-blue-100 dark:text-slate-200 dark:selection:bg-blue-900"
            />}
        </div>
        <StatusBar value={value} locale={locale} trailing={footer} />
    </section>;
}

export default function ConverterWorkbench<InputType = string, OutputType = string>({
    title, description, locale = 'fa', inputLanguage, outputLanguage, inputExtension,
    outputExtension, outputMimeType = 'text/plain;charset=utf-8', initialInput, category, version = 'v1.0.0', specification = 'v1.0.0',
    toolOptions = [], features = [], codeSnippets = [], faqs = [],
    validate, convert, serialize, sampleInput = initialInput,
}: ConverterWorkbenchProps<InputType, OutputType>) {
    const text = locale === 'fa' ? fa : en;
    const [inputText, setInputText] = useState(initialInput);
    const [outputText, setOutputText] = useState('');
    const [isLiveSync, setIsLiveSync] = useState(true);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionTime, setConversionTime] = useState<number | null>(null);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [optionValues, setOptionValues] = useState<ConverterOptions>(
        () => Object.fromEntries(toolOptions.map(option => [option.id, option.defaultValue]))
    );
    const [error, setError] = useState('');
    const [codeTab, setCodeTab] = useState(0);
    const [codeCopied, setCodeCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const codeCopyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const conversionId = useRef(0);
    const workspaceRef = useRef<HTMLDivElement>(null);

    const options = useMemo<ConverterOptions>(() => optionValues, [optionValues]);
    const formatSupported = ['json', 'yaml', 'yml'].includes(inputLanguage.toLowerCase());
    const indentSpaces = typeof optionValues.indentSpaces === 'number' ? optionValues.indentSpaces : 2;
    const outputBytes = new Blob([outputText]).size;
    const inputBytes = new Blob([inputText]).size;
    const sizeChange = inputBytes ? ((outputBytes - inputBytes) / inputBytes) * 100 : 0;

    const runConversion = useCallback(async (source: string, currentOptions: ConverterOptions) => {
        const currentId = ++conversionId.current;
        if (!source.trim()) {
            setIsValid(null);
            setOutputText('');
            setError('');
            setIsConverting(false);
            return;
        }

        setIsConverting(true);
        setError('');
        const startedAt = performance.now();
        try {
            const parsed = validate(source);
            setIsValid(true);
            const output = await convert(parsed, currentOptions, source);
            if (currentId === conversionId.current) setOutputText(serialize(output));
        } catch (conversionError) {
            if (currentId === conversionId.current) {
                setIsValid(false);
                setOutputText('');
                setError(conversionError instanceof Error ? conversionError.message : text.error);
            }
        } finally {
            if (currentId === conversionId.current) {
                setConversionTime(performance.now() - startedAt);
                setIsConverting(false);
            }
        }
    }, [convert, serialize, text.error, validate]);

    useEffect(() => {
        if (!isLiveSync) return;
        const timer = setTimeout(() => void runConversion(inputText, options), CONVERSION_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [inputText, isLiveSync, options, runConversion]);

    useEffect(() => {
        const handleKeys = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                void runConversion(inputText, options);
            }
            if (event.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [inputText, isFullscreen, options, runConversion]);

    useEffect(() => () => {
        if (copyTimer.current) clearTimeout(copyTimer.current);
        if (codeCopyTimer.current) clearTimeout(codeCopyTimer.current);
        conversionId.current++;
    }, []);

    const copyText = async (value: string, code = false) => {
        await navigator.clipboard.writeText(value);
        const setFeedback = code ? setCodeCopied : setCopied;
        const timer = code ? codeCopyTimer : copyTimer;
        setFeedback(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setFeedback(false), COPY_FEEDBACK_MS);
    };

    const clearWorkspace = () => {
        if (!window.confirm(text.confirmClear)) return;
        setInputText('');
        setOutputText('');
        setIsValid(null);
        setError('');
    };

    const loadFile = (file?: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setInputText(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => setError(fileInputRef.current?.files?.[0]?.name || text.error);
        reader.readAsText(file);
    };

    const formatInput = (compressed: boolean) => {
        try {
            if (inputLanguage.toLowerCase() === 'json') {
                setInputText(JSON.stringify(JSON.parse(inputText), null, compressed ? 0 : 2));
                return;
            }
            if (inputLanguage.toLowerCase() === 'yaml' || inputLanguage.toLowerCase() === 'yml') {
                const parsed = validate(inputText);
                import('js-yaml').then(({ default: yaml }) => {
                setInputText(yaml.dump(parsed, {
                    indent: indentSpaces,
                    flowLevel: compressed ? 0 : -1,
                    lineWidth: compressed ? -1 : 80,
                }));
                }).catch(error => setError(error instanceof Error ? error.message : text.error));
                return;
            }
        } catch (formatError) {
            setIsValid(false);
            setError(formatError instanceof Error ? formatError.message : text.error);
        }
    };

    const editorArea = (fullscreen = false) => <div ref={fullscreen ? workspaceRef : undefined} className={`grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 ${fullscreen ? 'h-full' : ''}`}>
        <EditorPanel
            title={`${text.input} (${inputLanguage.toUpperCase()})`}
            language={inputLanguage}
            value={inputText}
            onChange={setInputText}
            isValid={isValid}
            locale={locale}
            actions={
                <>
                    {formatSupported && <>
                        <button type="button" onClick={() => formatInput(false)} title={text.format} aria-label={text.format} className="rounded p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"><Sparkles className="h-4 w-4" /></button>
                        <button type="button" onClick={() => formatInput(true)} title={text.minify} aria-label={text.minify} className="rounded p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"><Code2 className="h-4 w-4" /></button>
                    </>}
                    <button type="button" onClick={() => void copyText(inputText)} title={text.copy} aria-label={text.copy} className="rounded p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"><Clipboard className="h-4 w-4" /></button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} title={text.upload} aria-label={text.upload} className="rounded p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"><FileUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setIsFullscreen(value => !value)} title={text.fullscreen} aria-label={text.fullscreen} className="rounded p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"><Maximize2 className="h-4 w-4" /></button>
                </>
            }
            footer={toolOptions.some(option => option.id === 'indentSpaces') ? <span>Spaces: {indentSpaces}</span> : null}
        />
        <EditorPanel
            title={`${text.output} (${outputLanguage.toUpperCase()})`}
            language={outputLanguage}
            value={outputText}
            readOnly
            locale={locale}
            emptyText={text.empty}
            actions={
                <>
                    <span className="hidden items-center gap-1 text-[10px] text-slate-500 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{text.generated}</span>
                    <button type="button" onClick={() => void copyText(outputText)} disabled={!outputText} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-50" aria-label={text.copyResult}>
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}{copied ? text.copied : text.copyResult}
                    </button>
                    <button type="button" onClick={() => {
                        const url = URL.createObjectURL(new Blob([outputText], { type: outputMimeType }));
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = `converted.${outputExtension.replace(/^\./, '')}`;
                        anchor.click();
                        URL.revokeObjectURL(url);
                    }} disabled={!outputText} title="Download" aria-label="Download output" className="rounded p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-50 dark:hover:bg-slate-800"><Download className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setIsFullscreen(value => !value)} title={text.fullscreen} aria-label={text.fullscreen} className="rounded p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"><Maximize2 className="h-4 w-4" /></button>
                </>
            }
            footer={<>
                <span>{text.reduce}: {sizeChange > 0 ? '+' : ''}{sizeChange.toFixed(2)}%</span>
                <span>{text.spec}: {specification}</span>
            </>}
        />
    </div>;

    const selectedSnippet = codeSnippets[codeTab] || codeSnippets[0];

    return <main dir={locale === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8f9ff] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{text.home}</span><span aria-hidden="true">/</span><span>{category || text.category}</span><span aria-hidden="true">/</span><span className="font-medium text-slate-700 dark:text-slate-300">{title}</span>
                </nav>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />{text.local}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{outputLanguage.toUpperCase()} {specification} Spec</span>
                </div>
            </div>

            <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:px-5 sm:py-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white"><ArrowLeftRight className="h-5 w-5" /></span>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                        <span className="rounded-full bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500 dark:bg-slate-800">{version}</span>
                    </div>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setInputText(sampleInput)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"><Code2 className="h-4 w-4 text-blue-600" />{text.sample}</button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"><FileUp className="h-4 w-4 text-blue-600" />{text.upload}</button>
                    <input ref={fileInputRef} type="file" accept={inputExtension.map(extension => extension.startsWith('.') ? extension : `.${extension}`).join(',')} className="hidden" onChange={event => loadFile(event.target.files?.[0])} />
                    <button type="button" onClick={clearWorkspace} className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:hover:bg-red-950"><Trash2 className="h-4 w-4" />{text.clear}</button>
                </div>
            </header>

            <section aria-label="Converter settings" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                    {toolOptions.map(option => <label key={option.id} className="flex items-center gap-2">
                        {option.type === 'boolean' ? <input
                            type="checkbox"
                            checked={optionValues[option.id] === true}
                            onChange={event => setOptionValues(previous => ({ ...previous, [option.id]: event.target.checked }))}
                            className="accent-blue-600"
                        /> : <select
                            value={String(optionValues[option.id] ?? '')}
                            onChange={event => {
                                const selected = option.selectOptions?.find(item => String(item.value) === event.target.value)?.value ?? event.target.value;
                                setOptionValues(previous => ({ ...previous, [option.id]: selected }));
                            }}
                            aria-label={option.label}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
                        >
                            {option.selectOptions?.map(item => <option key={String(item.value)} value={String(item.value)}>{locale === 'en' ? item.labelEn || item.label : item.label}</option>)}
                        </select>}
                        {locale === 'en' ? option.labelEn || option.label : option.label}
                    </label>)}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={isLiveSync} onChange={event => setIsLiveSync(event.target.checked)} className="accent-blue-600" />{text.live}</label>
                    <button type="button" onClick={() => void runConversion(inputText, options)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60" disabled={isConverting}>
                        {isConverting ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Play className="h-3.5 w-3.5" />}
                        {text.convert}<kbd className="hidden rounded bg-white/20 px-1.5 py-0.5 text-[9px] sm:inline">Ctrl+Enter</kbd>
                    </button>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-mono text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Zap className="h-3 w-3" />{isConverting ? '…' : `${conversionTime?.toFixed(2) ?? '—'}ms`}</span>
                </div>
            </section>

            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
            <section aria-label="Converter editors">{editorArea()}</section>

            {isFullscreen && <div role="dialog" aria-modal="true" aria-label={text.fullscreen} className="fixed inset-0 z-50 overflow-auto bg-[#f8f9ff] p-4 dark:bg-slate-950 sm:p-6">
                <div className="mx-auto flex min-h-full max-w-[1800px] flex-col gap-4">
                    <div className="flex justify-end"><button type="button" onClick={() => setIsFullscreen(false)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"><Minimize2 className="h-4 w-4" />{text.fullscreen} (Esc)</button></div>
                    <div className="flex-1">{editorArea(true)}</div>
                </div>
            </div>}

            <section className="space-y-3">
                <h2 className="text-lg font-bold">{text.guideTitle}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {features.map(feature => {
                        const FeatureIcon = featureIcons[feature.icon as keyof typeof featureIcons] || Sparkles;
                        return <article key={feature.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <FeatureIcon className="mb-3 h-5 w-5 text-blue-600" />
                            <h3 className="mb-2 text-sm font-semibold">{locale === 'en' ? feature.titleEn || feature.title : feature.title}</h3><p className="text-xs leading-6 text-slate-600 dark:text-slate-300">{locale === 'en' ? feature.descriptionEn || feature.description : feature.description}</p>
                        </article>;
                    })}
                </div>
            </section>

            {selectedSnippet && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                    <h2 className="text-sm font-semibold">{text.quickstart}</h2>
                    <div className="flex items-center gap-1">
                        {codeSnippets.map((snippet, index) => <button key={`${snippet.languageTab}-${index}`} type="button" onClick={() => setCodeTab(index)} className={`rounded-md px-2.5 py-1 text-xs ${codeTab === index ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{snippet.languageTab}</button>)}
                        <button type="button" onClick={() => void copyText(selectedSnippet.code, true)} aria-label="Copy code snippet" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{codeCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}</button>
                    </div>
                </div>
                <pre dir="ltr" className="overflow-x-auto p-4 text-left font-mono text-xs leading-6 text-slate-700 dark:text-slate-200"><code>{selectedSnippet.code}</code></pre>
            </section>}

            {faqs.length > 0 && <section className="space-y-3">
                <h2 className="text-lg font-bold">{text.faqTitle}</h2>
                <Accordion.Root type="single" collapsible className="space-y-2">
                    {faqs.map((faq, index) => <Accordion.Item key={faq.question} value={`faq-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
                        <Accordion.Header>
                            <Accordion.Trigger className="flex w-full items-center justify-between gap-4 py-4 text-right text-sm font-medium hover:text-blue-700">
                                {locale === 'en' ? faq.questionEn || faq.question : faq.question}<ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                            </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="pb-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{locale === 'en' ? faq.answerEn || faq.answer : faq.answer}</Accordion.Content>
                    </Accordion.Item>)}
                </Accordion.Root>
            </section>}
        </div>
    </main>;
}
