'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import {
    ArrowDown, ArrowLeftRight, ArrowUp, Check, ChevronDown, Clipboard, Download,
    Eye, FileUp, GitCompareArrows, Maximize2, Minimize2, SplitSquareVertical,
    Trash2, Zap,
} from 'lucide-react';
import CodeMirrorEditorComponent from '@/components/CodeMirrorEditorComponent';
import { useTheme } from 'next-themes';
import { buildDiffRows, countDiffTokens, MAX_DIFF_TOKENS } from '@/lib/text-diff';
import type { DiffGranularity, DiffOperation, DiffRow } from '@/lib/text-diff';

interface TextDiffProps {
    locale?: 'fa' | 'en';
    title?: string;
    description?: string;
}

type ViewMode = 'split' | 'unified';
type Language = 'typescript' | 'json' | 'python' | 'javascript' | 'html' | 'markdown' | 'text';

interface DiffSummary {
    addedLines: number;
    removedLines: number;
    modifiedLines: number;
    similarityPercentage: number;
}

const SAMPLE_ORIGINAL = `interface ServiceConfig {
  name: string;
  port: number;
  debug: boolean;
}

const service: ServiceConfig = {
  name: "zebracode-api",
  port: 3000,
  debug: false,
};`;
const SAMPLE_MODIFIED = `interface ServiceConfig {
  name: string;
  port: number;
  host: string;
  debug: boolean;
}

const service: ServiceConfig = {
  name: "zebracode-api",
  port: 8080,
  host: "127.0.0.1",
  debug: true,
};`;

const en = {
    home: 'Home',
    category: 'Text tools',
    local: '100% local and private in your browser',
    engine: 'Diff Engine v2.4 · Myers Core',
    original: 'Original · Before',
    modified: 'Modified · After',
    compare: 'Compare again',
    sample: 'Load sample',
    swap: 'Swap texts',
    clear: 'Clear all',
    language: 'Language',
    split: 'Side-by-side',
    unified: 'Unified',
    granularity: 'Granularity',
    line: 'Lines',
    word: 'Words',
    char: 'Characters',
    ignoreWhitespace: 'Ignore whitespace',
    caseSensitive: 'Case-sensitive',
    execution: 'Run time',
    changes: 'changes',
    similarity: 'Similarity',
    added: 'added',
    removed: 'deleted',
    modifiedCount: 'modified',
    noChanges: 'No changes',
    showUnchanged: 'Show unchanged',
    hideUnchanged: 'Hide unchanged',
    copyMerged: 'Copy modified text',
    exportHtml: 'Download HTML diff',
    exportPatch: 'Download .patch',
    copy: 'Copy',
    copied: 'Copied',
    upload: 'Upload',
    download: 'Download',
    fullscreen: 'Fullscreen',
    lines: 'lines',
    chars: 'chars',
    utf8: 'UTF-8',
    clearConfirm: 'Clear both text editors?',
    compareError: 'Unable to compare these texts.',
    tooLarge: `This comparison is limited to ${MAX_DIFF_TOKENS.toLocaleString('en-US')} tokens. Reduce the input size and try again.`,
    faqTitle: 'Frequently asked questions',
    faq: [
        ['What is the difference between split and unified views?', 'Split view places the original and modified text side by side. Unified view shows changes in a single, ordered list.'],
        ['Is there a text size limit?', `For responsive comparisons, the diff engine accepts up to ${MAX_DIFF_TOKENS.toLocaleString('en-US')} tokens per comparison.`],
        ['How can I share the differences?', 'Download a self-contained HTML report or a unified patch file, or copy the modified version.'],
    ],
    features: [
        ['Myers diff algorithm', 'An efficient shortest-edit-script algorithm commonly used in version control tools.'],
        ['RTL interface, LTR code', 'Persian interface works naturally alongside code and line numbers rendered left-to-right.'],
        ['Private by design', 'Text is compared locally in your browser and is never uploaded.'],
    ],
    empty: 'Edit either version to see the differences.',
    next: 'Next change',
    previous: 'Previous change',
    reset: 'Load realistic TypeScript sample',
    changesLabel: 'Change',
    of: 'of',
    versionA: 'A',
    versionB: 'B',
};

const fa = {
    home: 'خانه',
    category: 'ابزارهای متن',
    local: 'پردازش ۱۰۰٪ محلی و امن در مرورگر',
    engine: 'موتور Diff نسخهٔ ۲.۴ · الگوریتم Myers',
    original: 'متن اصلی · قبل',
    modified: 'متن جدید · بعد',
    compare: 'مقایسهٔ مجدد',
    sample: 'بارگذاری نمونه',
    swap: 'جابه‌جایی متن‌ها',
    clear: 'پاک‌سازی',
    language: 'زبان',
    split: 'دوقلو',
    unified: 'یکپارچه',
    granularity: 'تفکیک',
    line: 'خط‌به‌خط',
    word: 'کلمه‌ای',
    char: 'کاراکتری',
    ignoreWhitespace: 'نادیده‌گرفتن فاصله‌ها',
    caseSensitive: 'حساس به بزرگی حروف',
    execution: 'زمان اجرا',
    changes: 'تغییر',
    similarity: 'میزان شباهت',
    added: 'خط اضافه',
    removed: 'خط حذف',
    modifiedCount: 'خط ویرایش',
    noChanges: 'بدون تغییر',
    showUnchanged: 'نمایش خطوط ثابت',
    hideUnchanged: 'مخفی‌کردن خطوط ثابت',
    copyMerged: 'کپی نسخهٔ جدید',
    exportHtml: 'دانلود گزارش HTML',
    exportPatch: 'دانلود فایل .patch',
    copy: 'کپی',
    copied: 'کپی شد',
    upload: 'بارگذاری',
    download: 'دانلود',
    fullscreen: 'تمام‌صفحه',
    lines: 'سطر',
    chars: 'کاراکتر',
    utf8: 'UTF-8',
    clearConfirm: 'هر دو ویرایشگر پاک شوند؟',
    compareError: 'مقایسهٔ متن‌ها انجام نشد.',
    tooLarge: `برای حفظ سرعت، حداکثر ${MAX_DIFF_TOKENS.toLocaleString('fa-IR')} توکن را در هر مقایسه وارد کنید.`,
    faqTitle: 'پرسش‌های متداول',
    faq: [
        ['تفاوت حالت دوقلو با حالت یکپارچه چیست؟', 'در حالت دوقلو، متن اصلی و جدید کنار هم قرار می‌گیرند؛ حالت یکپارچه تغییرات را در یک فهرست مرتب نمایش می‌دهد.'],
        ['آیا برای حجم متن محدودیتی وجود دارد؟', `برای حفظ سرعت، موتور مقایسه در هر نوبت تا ${MAX_DIFF_TOKENS.toLocaleString('fa-IR')} توکن را پردازش می‌کند.`],
        ['چطور تفاوت‌ها را برای همکارانم بفرستم؟', 'گزارش HTML مستقل یا فایل patch دانلود کنید، یا نسخهٔ جدید را کپی کنید.'],
    ],
    features: [
        ['الگوریتم Myers Diff', 'الگوریتمی سریع برای یافتن کوتاه‌ترین مسیر تغییر که در ابزارهای کنترل نسخه کاربرد دارد.'],
        ['رابط راست‌چین، کد چپ‌چین', 'رابط فارسی در کنار کد و شماره‌خط‌های چپ‌به‌راست به‌درستی نمایش داده می‌شود.'],
        ['حریم خصوصی در طراحی', 'مقایسه فقط در مرورگر انجام می‌شود و متن به هیچ سروری ارسال نمی‌شود.'],
    ],
    empty: 'برای دیدن تفاوت‌ها، یکی از نسخه‌ها را ویرایش کنید.',
    next: 'تغییر بعدی',
    previous: 'تغییر قبلی',
    reset: 'بارگذاری نمونهٔ واقعی TypeScript',
    changesLabel: 'تغییر',
    of: 'از',
    versionA: 'A',
    versionB: 'B',
};

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character] || character);
}

function DownloadButton({ label, onClick, icon }: { label: string; onClick: () => void; icon: React.ReactNode }) {
    return <button type="button" onClick={onClick} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">{icon}{label}</button>;
}

export default function TextDiff({ locale = 'fa', title, description }: TextDiffProps) {
    const text = locale === 'fa' ? fa : en;
    const heading = title || (locale === 'fa' ? 'مقایسه‌گر متن و سورس‌کد' : 'Text and code diff checker');
    const subheading = description || (locale === 'fa'
        ? 'مقایسهٔ دقیق و زندهٔ متن یا کد؛ تغییرات را خط‌به‌خط، کلمه‌ای یا کاراکتری ببینید. تمام پردازش در مرورگر انجام می‌شود.'
        : 'Compare text or code live and inspect line, word, or character changes. Processing stays in your browser.');
    const [originalText, setOriginalText] = useState(SAMPLE_ORIGINAL);
    const [modifiedText, setModifiedText] = useState(SAMPLE_MODIFIED);
    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [diffGranularity, setDiffGranularity] = useState<DiffGranularity>('line');
    const [ignoreWhitespace, setIgnoreWhitespace] = useState(true);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [language, setLanguage] = useState<Language>('typescript');
    const [diffRows, setDiffRows] = useState<DiffRow[]>([]);
    const [executionTimeMs, setExecutionTimeMs] = useState(0);
    const [activeDiffIndex, setActiveDiffIndex] = useState(0);
    const [hideUnchanged, setHideUnchanged] = useState(false);
    const [copied, setCopied] = useState('');
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { theme } = useTheme();
    const fileInputA = useRef<HTMLInputElement>(null);
    const fileInputB = useRef<HTMLInputElement>(null);
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const compare = useCallback((oldValue = originalText, newValue = modifiedText) => {
        const tokenCount = countDiffTokens(oldValue, diffGranularity) + countDiffTokens(newValue, diffGranularity);
        if (tokenCount > MAX_DIFF_TOKENS) {
            setDiffRows([]);
            setError(text.tooLarge);
            return;
        }
        const start = performance.now();
        try {
            const rows = buildDiffRows(oldValue, newValue, diffGranularity, ignoreWhitespace, caseSensitive);
            setDiffRows(rows);
            setExecutionTimeMs(performance.now() - start);
            setActiveDiffIndex(0);
            setError('');
        } catch (diffError) {
            console.error('Text comparison failed:', diffError);
            setError(diffError instanceof Error ? diffError.message : text.compareError);
        }
    }, [caseSensitive, diffGranularity, ignoreWhitespace, modifiedText, originalText, text.compareError, text.tooLarge]);

    useEffect(() => {
        const timer = window.setTimeout(() => compare(), 180);
        return () => window.clearTimeout(timer);
    }, [compare]);

    useEffect(() => {
        const handleKeys = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                compare();
            } else if (event.altKey && event.key.toLowerCase() === 'n') {
                event.preventDefault();
                navigateDiff(1);
            } else if (event.altKey && event.key.toLowerCase() === 'p') {
                event.preventDefault();
                navigateDiff(-1);
            } else if (event.altKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                setIsFullscreen(value => !value);
            } else if (event.key === 'Escape') {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    });

    useEffect(() => () => {
        if (copyTimer.current) clearTimeout(copyTimer.current);
    }, []);

    const summary = useMemo<DiffSummary>(() => {
        const addedLines = diffRows.filter(row => row.type === 'added').length;
        const removedLines = diffRows.filter(row => row.type === 'removed').length;
        const modifiedLines = diffRows.filter(row => row.type === 'modified').length;
        const total = Math.max(originalText.split('\n').length, modifiedText.split('\n').length, 1);
        const changed = addedLines + removedLines + modifiedLines;
        return {
            addedLines,
            removedLines,
            modifiedLines,
            similarityPercentage: Math.max(0, Math.round((1 - changed / total) * 100)),
        };
    }, [diffRows, modifiedText, originalText]);

    const changes = useMemo(() => diffRows
        .map((row, index) => row.type === 'unchanged' ? -1 : index)
        .filter(index => index >= 0), [diffRows]);

    function navigateDiff(direction: 1 | -1) {
        if (!changes.length) return;
        const next = (activeDiffIndex + direction + changes.length) % changes.length;
        setActiveDiffIndex(next);
        rowRefs.current[changes[next]]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const copyValue = useCallback(async (value: string, feedbackKey: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(feedbackKey);
            if (copyTimer.current) clearTimeout(copyTimer.current);
            copyTimer.current = setTimeout(() => setCopied(''), 1800);
        } catch (copyError) {
            setError(copyError instanceof Error ? copyError.message : text.compareError);
        }
    }, [text.compareError]);

    const downloadFile = (name: string, content: string, mimeType: string) => {
        const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const exportHtml = () => {
        const rows = diffRows.flatMap(row => {
            const className = row.type === 'added' ? 'added' : row.type === 'removed' ? 'removed' : row.type === 'modified' ? 'modified' : 'same';
            if (row.type === 'modified') {
                return `<div class="removed"><span>-</span><code>${escapeHtml(row.oldText || '')}</code></div><div class="added"><span>+</span><code>${escapeHtml(row.newText || '')}</code></div>`;
            }
            const value = (row.type === 'removed' ? row.oldText : row.newText ?? row.oldText) ?? '';
            const prefix = row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' ';
            return `<div class="${className}"><span>${prefix}</span><code>${escapeHtml(value)}</code></div>`;
        }).join('\n');
        const document = `<!doctype html><html lang="${locale}" dir="${locale === 'fa' ? 'rtl' : 'ltr'}"><meta charset="utf-8"><title>${escapeHtml(heading)} diff</title><style>body{font:14px system-ui;background:#f8f9ff;padding:24px;color:#0f172a}.report{max-width:1100px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:auto;padding:16px}div{white-space:pre;font:13px/1.8 ui-monospace,monospace;padding:0 8px}.added{background:#ecfdf5;color:#047857}.removed{background:#fff1f2;color:#be123c}.modified{background:#fffbeb;color:#b45309}.same{color:#475569}span{display:inline-block;width:24px}</style><h1>${escapeHtml(heading)}</h1><main class="report" dir="ltr">${rows}</main></html>`;
        downloadFile('text-diff.html', document, 'text/html;charset=utf-8');
    };

    const exportPatch = () => {
        const oldLineCount = originalText.split('\n').length;
        const newLineCount = modifiedText.split('\n').length;
        const patch = [
            '--- a/text',
            '+++ b/text',
            `@@ -1,${oldLineCount} +1,${newLineCount} @@`,
            ...diffRows.flatMap(row => row.type === 'unchanged'
                ? [` ${row.oldText ?? ''}`]
                : row.type === 'removed'
                    ? [`-${row.oldText ?? ''}`]
                    : row.type === 'added'
                        ? [`+${row.newText ?? ''}`]
                        : [`-${row.oldText ?? ''}`, `+${row.newText ?? ''}`]),
        ].join('\n');
        downloadFile('text-diff.patch', `${patch}\n`, 'text/x-diff;charset=utf-8');
    };

    const handleLoadFile = (file: File | undefined, setter: (value: string) => void) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') setter(reader.result);
        };
        reader.onerror = () => setError(file.name);
        reader.readAsText(file);
    };

    const handleClear = () => {
        if (!window.confirm(text.clearConfirm)) return;
        setOriginalText('');
        setModifiedText('');
        setDiffRows([]);
        setError('');
    };

    const lineStats = (value: string) => ({
        lines: value ? value.split('\n').length : 0,
        chars: value.length,
    });

    const renderInline = (parts: DiffOperation<string>[] | undefined, side: 'old' | 'new', textValue: string) => {
        if (!parts) return textValue || ' ';
        return parts.map((part, index) => {
            if (part.type === 'equal') return <React.Fragment key={index}>{part.value}</React.Fragment>;
            const highlight = side === 'old'
                ? part.type === 'removed' ? 'rounded bg-rose-200/80 px-0.5 font-semibold dark:bg-rose-900/70' : ''
                : part.type === 'added' ? 'rounded bg-emerald-200/80 px-0.5 font-semibold dark:bg-emerald-900/70' : '';
            return <mark key={index} className={`rounded px-0.5 ${highlight || 'opacity-60'}`}>{part.value}</mark>;
        });
    };

    const rowClass = (row: DiffRow, side: 'old' | 'new') => {
        if (row.type === 'modified') return side === 'old'
            ? 'border-r-4 border-rose-500 bg-rose-50/80 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100'
            : 'border-r-4 border-amber-400 bg-amber-50/80 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100';
        if (row.type === 'removed' && side === 'old') return 'border-r-4 border-rose-500 bg-rose-50/80 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100';
        if (row.type === 'added' && side === 'new') return 'border-r-4 border-emerald-500 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100';
        return 'border-r-4 border-transparent text-slate-700 dark:text-slate-300';
    };

    const renderCodeRow = (row: DiffRow, index: number, side: 'old' | 'new', unified = false) => {
        const value = side === 'old' ? row.oldText : row.newText;
        const lineNumber = side === 'old' ? row.oldLine : row.newLine;
        const shouldShow = unified || (side === 'old' ? row.type !== 'added' : row.type !== 'removed');
        const prefix = row.type === 'added' ? '+' : row.type === 'removed' ? '−' : row.type === 'modified' ? '~' : '';
        return <div
            key={`${index}-${side}`}
            ref={element => {
                if (side === 'old') rowRefs.current[index] = element;
            }}
            className={`flex min-h-7 min-w-max items-start font-mono text-xs leading-7 ${rowClass(row, side)}`}
            dir="ltr"
            aria-label={`${row.type} line ${lineNumber ?? ''}`}
        >
            <span className="sticky left-0 w-12 shrink-0 select-none bg-inherit px-2 text-right text-slate-400">{unified ? `${row.oldLine ?? ''}${row.newLine ? `/${row.newLine}` : ''}` : lineNumber ?? ''}</span>
            <span className={`w-6 shrink-0 select-none text-center font-bold ${row.type === 'added' ? 'text-emerald-700 dark:text-emerald-300' : row.type === 'removed' ? 'text-rose-700 dark:text-rose-300' : row.type === 'modified' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-300'}`}>{prefix}</span>
            <code className="min-w-0 whitespace-pre px-2" dir="ltr">
                {shouldShow
                    ? row.type === 'modified'
                        ? renderInline(side === 'old' ? row.oldParts : row.newParts, side, value || '')
                        : value || ' '
                    : <span aria-hidden="true">&nbsp;</span>}
            </code>
        </div>;
    };

    const changePosition = changes.length ? Math.min(activeDiffIndex + 1, changes.length) : 0;
    const direction = locale === 'fa' ? 'rtl' : 'ltr';
    const renderEditor = (side: 'old' | 'new') => {
        const original = side === 'old';
        const value = original ? originalText : modifiedText;
        const setter = original ? setOriginalText : setModifiedText;
        const stats = lineStats(value);
        const fileInput = original ? fileInputA : fileInputB;
        return <section className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <header className="flex min-h-12 items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="hidden shrink-0 items-center gap-1.5 sm:flex" aria-hidden="true"><i className="h-2 w-2 rounded-full bg-rose-400" /><i className="h-2 w-2 rounded-full bg-amber-400" /><i className="h-2 w-2 rounded-full bg-emerald-400" /></span>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${original ? 'bg-blue-600' : 'bg-emerald-600'}`}>{original ? text.versionA : text.versionB}</span>
                    <h2 className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{original ? text.original : text.modified}</h2>
                    {!original && diffRows.some(row => row.type !== 'unchanged') && <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200 sm:inline-flex">{locale === 'fa' ? 'تغییر یافته' : 'Changed'}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <span className="hidden rounded bg-blue-100 px-2 py-1 font-mono text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 sm:inline-flex">{language}</span>
                    <button type="button" onClick={() => void copyValue(value, original ? 'original' : 'modified')} title={text.copy} aria-label={`${text.copy} ${original ? text.original : text.modified}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800">{copied === (original ? 'original' : 'modified') ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}</button>
                    <button type="button" onClick={() => fileInput.current?.click()} title={text.upload} aria-label={`${text.upload} ${original ? text.original : text.modified}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"><FileUp className="h-4 w-4" /></button>
                    <input ref={fileInput} type="file" className="hidden" onChange={event => handleLoadFile(event.target.files?.[0], setter)} />
                </div>
            </header>
            <div className="min-h-[360px] flex-1 overflow-hidden">
                <CodeMirrorEditorComponent
                    theme={theme}
                    language={language === 'python' ? 'text' : language}
                    value={value}
                    onChange={next => setter(next ?? '')}
                    readOnly={false}
                    toolbarConfig={{ copy: false, clear: false, paste: true, save: false }}
                    rightToolbarButtons={[]}
                    direction="ltr"
                />
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                <span>{stats.lines} {text.lines}</span><span>{stats.chars} {text.chars}</span><span>{text.utf8}</span>
                <span className={`rounded-full px-2 py-0.5 ${original ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'}`}>
                    {original ? `−${summary.removedLines + summary.modifiedLines}` : `+${summary.addedLines + summary.modifiedLines}`}
                </span>
            </footer>
        </section>;
    };

    return <main dir={direction} className="min-h-screen bg-[#f8f9ff] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <nav aria-label={locale === 'fa' ? 'مسیر صفحه' : 'Breadcrumb'} className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{text.home}</span><span aria-hidden="true">/</span><span>{text.category}</span><span aria-hidden="true">/</span><span className="font-medium text-slate-700 dark:text-slate-300">{heading}</span>
                </nav>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><i className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />{text.local}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300" dir="ltr">{text.engine}</span>
                </div>
            </div>

            <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:px-5 sm:py-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white"><GitCompareArrows className="h-5 w-5" /></span>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h1>
                        <span className="rounded-full bg-blue-50 px-2 py-1 font-mono text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300" dir="ltr">Diff Checker</span>
                    </div>
                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{subheading}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setOriginalText(SAMPLE_ORIGINAL); setModifiedText(SAMPLE_MODIFIED); setLanguage('typescript'); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"><span className="font-mono text-blue-600">{'{}'}</span>{text.sample}</button>
                    <button type="button" onClick={() => { setOriginalText(modifiedText); setModifiedText(originalText); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"><ArrowLeftRight className="h-4 w-4 text-blue-600" />{text.swap}</button>
                    <button type="button" onClick={handleClear} className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-700 shadow-sm hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950"><Trash2 className="h-4 w-4" />{text.clear}</button>
                </div>
            </header>

            <section aria-label={locale === 'fa' ? 'تنظیمات مقایسه' : 'Diff settings'} className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950" role="group" aria-label={locale === 'fa' ? 'حالت نمایش' : 'View mode'}>
                            <button type="button" aria-pressed={viewMode === 'split'} onClick={() => setViewMode('split')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${viewMode === 'split' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800'}`}><SplitSquareVertical className="h-3.5 w-3.5" />{text.split}</button>
                            <button type="button" aria-pressed={viewMode === 'unified'} onClick={() => setViewMode('unified')} className={`rounded-md px-2.5 py-1.5 text-xs ${viewMode === 'unified' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800'}`}>{text.unified}</button>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <span>{text.language}</span>
                            <select value={language} onChange={event => setLanguage(event.target.value as Language)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950">
                                <option value="typescript">TypeScript</option><option value="javascript">JavaScript</option><option value="json">JSON</option><option value="python">Python</option><option value="html">HTML</option><option value="markdown">Markdown</option><option value="text">Plain text</option>
                            </select>
                        </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-700" role="group" aria-label={text.granularity}>
                            {[['line', text.line], ['word', text.word], ['char', text.char]].map(([value, label]) => <button key={value} type="button" aria-pressed={diffGranularity === value} onClick={() => setDiffGranularity(value as DiffGranularity)} className={`rounded-md px-2 py-1 text-[11px] ${diffGranularity === value ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{label}</button>)}
                        </div>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300"><input type="checkbox" checked={ignoreWhitespace} onChange={event => setIgnoreWhitespace(event.target.checked)} className="accent-blue-600" />{text.ignoreWhitespace}</label>
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300"><input type="checkbox" checked={caseSensitive} onChange={event => setCaseSensitive(event.target.checked)} className="accent-blue-600" />{text.caseSensitive}</label>
                        <button type="button" onClick={() => compare()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><GitCompareArrows className="h-3.5 w-3.5" />{text.compare}<kbd className="hidden rounded bg-white/20 px-1 py-0.5 text-[9px] sm:inline">Ctrl+↵</kbd></button>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-mono text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300" dir="ltr"><Zap className="h-3 w-3" />{text.execution}: {executionTimeMs.toFixed(2)}ms</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => navigateDiff(-1)} disabled={!changes.length} aria-label={text.previous} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowUp className="h-4 w-4" /></button>
                            <button type="button" onClick={() => navigateDiff(1)} disabled={!changes.length} aria-label={text.next} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowDown className="h-4 w-4" /></button>
                            <span className="min-w-16 text-center font-mono text-[10px] text-slate-500" dir="ltr">{changePosition} {text.of} {changes.length} {text.changes}</span>
                            <span className="hidden font-mono text-[9px] text-slate-400 lg:inline" dir="ltr">Alt+P / Alt+N</span>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">+{summary.addedLines} {text.added}</span>
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">−{summary.removedLines} {text.removed}</span>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">~{summary.modifiedLines} {text.modifiedCount}</span>
                    </div>
                    <div className="flex min-w-52 flex-1 items-center justify-end gap-2 sm:flex-none">
                        <span className="text-[11px] text-slate-500">{text.similarity}</span>
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="progressbar" aria-label={text.similarity} aria-valuenow={summary.similarityPercentage} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${summary.similarityPercentage}%` }} /></div>
                        <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-300" dir="ltr">{summary.similarityPercentage}%</span>
                    </div>
                </div>
            </section>

            {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

            {viewMode === 'split'
                ? <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">{renderEditor('old')}{renderEditor('new')}</div>
                : <div className="grid grid-cols-1 gap-4">{renderEditor('old')}{renderEditor('new')}</div>}

            <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${isFullscreen ? 'fixed inset-3 z-50 flex flex-col shadow-2xl sm:inset-6' : ''}`}>
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold">{locale === 'fa' ? 'پیش‌نمایش تغییرات' : 'Diff preview'}</h2>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">+{summary.addedLines}</span>
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-700 dark:bg-rose-950 dark:text-rose-300">−{summary.removedLines}</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700 dark:bg-amber-950 dark:text-amber-300">~{summary.modifiedLines}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setHideUnchanged(value => !value)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"><Eye className="h-3.5 w-3.5" />{hideUnchanged ? text.showUnchanged : text.hideUnchanged}</button>
                        <button type="button" onClick={() => setIsFullscreen(value => !value)} aria-label={text.fullscreen} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
                        <span className="hidden rounded bg-slate-200 px-2 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:inline" dir="ltr">Alt+F</span>
                    </div>
                </header>
                {diffRows.length === 0 ? <div className="flex min-h-24 items-center justify-center px-4 text-sm text-slate-500">{text.noChanges}</div> : (
                    <div className={`overflow-auto ${isFullscreen ? 'flex-1' : 'max-h-[560px]'}`} dir="ltr">
                        {viewMode === 'split' ? <div className="grid min-w-0 grid-cols-1 divide-y divide-slate-200 dark:divide-slate-800 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                            <div className="min-w-0 overflow-x-auto py-2" aria-label={text.original}>
                                {diffRows.map((row, index) => hideUnchanged && row.type === 'unchanged'
                                    ? <div key={`old-${index}`} ref={element => { rowRefs.current[index] = element; }} />
                                    : renderCodeRow(row, index, 'old'))}
                            </div>
                            <div className="min-w-0 overflow-x-auto py-2" aria-label={text.modified}>
                                {diffRows.map((row, index) => hideUnchanged && row.type === 'unchanged'
                                    ? <div key={`new-${index}`} />
                                    : renderCodeRow(row, index, 'new'))}
                            </div>
                        </div> : <div className="min-w-0 overflow-x-auto py-2">
                            {diffRows.map((row, index) => hideUnchanged && row.type === 'unchanged' ? null : row.type === 'modified'
                                ? <React.Fragment key={`unified-${index}`}>{renderCodeRow(row, index, 'old', true)}{renderCodeRow(row, index, 'new', true)}</React.Fragment>
                                : renderCodeRow(row, index, row.type === 'removed' ? 'old' : 'new', true))}
                        </div>}
                    </div>
                )}
            </section>

            <section aria-label={locale === 'fa' ? 'خروجی‌ها' : 'Export actions'} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <button type="button" onClick={() => void copyValue(modifiedText, 'merged')} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"><Clipboard className="h-4 w-4" />{copied === 'merged' ? text.copied : text.copyMerged}</button>
                <DownloadButton label={text.exportHtml} onClick={exportHtml} icon={<Download className="h-4 w-4 text-blue-600" />} />
                <DownloadButton label={text.exportPatch} onClick={exportPatch} icon={<Download className="h-4 w-4 text-blue-600" />} />
                {isFullscreen && <span className="text-xs text-slate-500">{text.fullscreen} · Esc</span>}
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {text.features.map(([featureTitle, featureDescription], index) => <article key={featureTitle} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{index === 0 ? <GitCompareArrows className="h-4 w-4" /> : index === 1 ? <ArrowLeftRight className="h-4 w-4" /> : <Check className="h-4 w-4" />}</span>
                    <h3 className="mb-2 text-sm font-semibold">{featureTitle}</h3>
                    <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">{featureDescription}</p>
                </article>)}
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-bold">{text.faqTitle}</h2>
                <Accordion.Root type="single" collapsible className="space-y-2">
                    {text.faq.map(([question, answer], index) => <Accordion.Item key={question} value={`faq-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
                        <Accordion.Header><Accordion.Trigger className="flex w-full items-center justify-between gap-4 py-4 text-start text-sm font-medium hover:text-blue-700">{question}<ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" /></Accordion.Trigger></Accordion.Header>
                        <Accordion.Content className="pb-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{answer}</Accordion.Content>
                    </Accordion.Item>)}
                </Accordion.Root>
            </section>
        </div>
    </main>;
}
