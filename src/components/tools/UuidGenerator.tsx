'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import {
    AlertCircle,
    Calendar,
    Check,
    ChevronDown,
    Clock,
    Code2,
    Copy,
    Cpu,
    Database,
    Download,
    Eye,
    Fingerprint,
    HelpCircle,
    Layers,
    Lock,
    RefreshCw,
    Search,
    ShieldCheck,
    Sliders,
    Sparkles,
    Trash2,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
    ExportFormat,
    IdentifierFormatOptions,
    IdentifierType,
    UuidInspectionResult,
} from '@/lib/uuid-generator/types';
import {
    DEFAULT_FORMAT_OPTIONS,
    exportIdentifiersToFormat,
    formatIdentifier,
    generateIdentifierBatch,
    generateRawIdentifier,
    inspectUuid,
} from '@/lib/uuid-generator/generator';

interface UuidGeneratorProps {
    locale?: 'fa' | 'en';
    dict?: any;
}

export default function UuidGenerator({ locale = 'fa', dict }: UuidGeneratorProps) {
    const isFa = locale === 'fa';

    // Tabs
    const [activeTab, setActiveTab] = useState<'generator' | 'inspector'>('generator');

    // Generator Options
    const [options, setOptions] = useState<IdentifierFormatOptions>(DEFAULT_FORMAT_OPTIONS);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('text');

    // Hero Live Single UUID
    const [heroId, setHeroId] = useState<string>('');
    const [heroCopied, setHeroCopied] = useState<boolean>(false);

    // Batch Generated Output
    const [generatedIds, setGeneratedIds] = useState<string[]>([]);
    const [batchCopied, setBatchCopied] = useState<boolean>(false);
    const [generationTimeMs, setGenerationTimeMs] = useState<number>(0);

    // Inspector State
    const [inspectInput, setInspectInput] = useState<string>('');
    const [inspectionResult, setInspectionResult] = useState<UuidInspectionResult | null>(null);

    // Toast
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    // Regenerate hero ID
    const regenerateHero = useCallback(() => {
        const raw = generateRawIdentifier(options.type, options.nanoIdLength, options.nanoIdAlphabet);
        const formatted = formatIdentifier(raw, options);
        setHeroId(formatted);
    }, [options]);

    // Generate batch
    const runBatchGenerate = useCallback(() => {
        const start = performance.now();
        const batch = generateIdentifierBatch(options);
        const duration = Math.round((performance.now() - start) * 10) / 10;
        setGeneratedIds(batch);
        setGenerationTimeMs(duration);
    }, [options]);

    // Initial generation
    useEffect(() => {
        regenerateHero();
        runBatchGenerate();
    }, [regenerateHero, runBatchGenerate]);

    // Run inspection when inspectInput changes
    useEffect(() => {
        if (!inspectInput.trim()) {
            setInspectionResult(null);
            return;
        }
        const res = inspectUuid(inspectInput);
        setInspectionResult(res);
    }, [inspectInput]);

    // Localized Strings
    const t = useMemo(() => {
        return {
            title: isFa ? 'تولیدکننده و بازرس پیشرفته UUID و شناسه یکتا' : 'Advanced UUID & Unique Identifier Generator',
            subtitle: isFa
                ? 'تولید شناسه استاندارد UUID v4، UUID v7 (مرتب‌شده زمانی)، NanoID، ULID، CUID2 و Nil با امکان دیکود و استخراج تاریخ'
                : 'Cryptographically secure UUID v4, time-ordered UUID v7, NanoID, ULID, CUID2 generator with live UUID inspector and timestamp decoder.',
            badgePrivate: isFa ? '۱۰۰٪ کلاینت‌ساید و امن (WebCrypto)' : '100% Client-Side WebCrypto',
            badgeOffline: isFa ? 'بدون ارسال به سرور' : 'Zero Server Calls',
            tabGenerator: isFa ? 'تولیدکننده شناسه (Generator)' : 'Identifier Generator',
            tabInspector: isFa ? 'بازرس و دیکودر UUID (Inspector)' : 'UUID Inspector & Decoder',
            btnRegenerate: isFa ? 'تولید مجدد' : 'Regenerate',
            btnCopy: isFa ? 'کپی' : 'Copy',
            btnCopyAll: isFa ? 'کپی همه' : 'Copy All',
            btnDownload: isFa ? 'دانلود خروجی' : 'Download',
            copiedSuccess: isFa ? 'در کلیپ‌بورد کپی شد!' : 'Copied to clipboard!',
            typeLabel: isFa ? 'نوع شناسه' : 'Identifier Standard',
            countLabel: isFa ? 'تعداد تولید' : 'Batch Quantity',
            formatOptionsTitle: isFa ? 'قالب‌بندی و سبک نمایش' : 'Formatting & Style',
            hyphensLabel: isFa ? 'خط تیره (Hyphens)' : 'Hyphens (-)',
            uppercaseLabel: isFa ? 'حروف بزرگ (Uppercase)' : 'Uppercase',
            bracesLabel: isFa ? 'آکولاد { }' : 'Enclose in Braces { }',
            urnLabel: isFa ? 'پیشوند URN (urn:uuid:)' : 'URN Prefix (urn:uuid:)',
            base64Label: isFa ? 'انکود Base64' : 'Base64 Encoded',
            quotesLabel: isFa ? 'علامت نقل‌قول' : 'Quotes',
            quotesNone: isFa ? 'بدون کوتیشن' : 'None',
            quotesSingle: isFa ? 'تکی (\'...\')' : 'Single (\'...\')',
            quotesDouble: isFa ? 'دوتایی ("...")' : 'Double ("...")',
            exportLabel: isFa ? 'فرمت خروجی کد' : 'Export Code Format',
            inspectorPlaceholder: isFa
                ? 'شناسه UUID مورد نظر را اینجا پیست کنید تا نسخه، استاندارد و تاریخ ساخت آن استخراج شود...'
                : 'Paste any UUID here to inspect version, variant, validity, and creation timestamp...',
            sampleV7: isFa ? 'نمونه UUID v7 (زمان‌محور)' : 'Sample UUID v7',
            sampleV4: isFa ? 'نمونه UUID v4 (تصادفی)' : 'Sample UUID v4',
            sampleV1: isFa ? 'نمونه UUID v1' : 'Sample UUID v1',
            sampleNil: isFa ? 'نمونه Nil UUID' : 'Sample Nil UUID',
            validUuid: isFa ? 'شناسه UUID معتبر است' : 'Valid RFC UUID',
            invalidUuid: isFa ? 'فرمت UUID نامعتبر است' : 'Invalid UUID Format',
            versionLabel: isFa ? 'نسخه UUID' : 'UUID Version',
            variantLabel: isFa ? 'استاندارد واریانت' : 'Variant Specification',
            extractedTimestamp: isFa ? 'تاریخ و زمان دقیق ساخت (Timestamp)' : 'Extracted Creation Timestamp',
            shamsiDate: isFa ? 'تاریخ جلالی (شمسی)' : 'Jalali / Solar Hijri',
            utcDate: isFa ? 'زمان هماهنگ جهانی (UTC)' : 'Coordinated Universal Time (UTC)',
            localDate: isFa ? 'زمان محلی سیستم' : 'Local System Time',
            featuresTitle: isFa ? 'ویژگی‌ها و استانداردهای پشتیبانی‌شده' : 'Supported Identifier Standards',
            features: [
                {
                    title: 'UUID v7 (RFC 9562)',
                    desc: isFa
                        ? 'مدرن‌ترین استاندارد پایگاه‌داده؛ این شناسه‌ها بر اساس زمان میلی‌ثانیه مرتب می‌شوند و در کلید اصلی دیتابیس بدون پراکندگی B-Tree عمل می‌کنند.'
                        : 'The modern database standard. Naturally time-ordered with millisecond precision, eliminating index fragmentation in B-Tree tables.',
                    icon: '⚡',
                },
                {
                    title: 'UUID v4 (RFC 4122)',
                    desc: isFa
                        ? 'شناخته‌شده‌ترین نوع شناسه تصادفی در جهان بر پایه ۱۲۲ بیت تصادفی رمزنگاری‌شده با ضریب برخورد عملاً صفر.'
                        : 'Globally recognized cryptographically random identifier powered by 122 bits of high entropy.',
                    icon: '🎲',
                },
                {
                    title: 'NanoID',
                    desc: isFa
                        ? 'شناسه‌های فشرده و امن ۲۱ کاراکتری با حروف URL-friendly، ایده‌آل برای لینک‌های کوتاه و اپلیکیشن‌های تحت وب.'
                        : 'Compact 21-character URL-friendly identifier with customizable alphabet, optimal for web links.',
                    icon: '🚀',
                },
                {
                    title: 'ULID',
                    desc: isFa
                        ? 'شناسه ۱۲۸ بیتی سازگار با Base32 و مرتب‌شونده بر اساس زمان به صورت لغوی (Lexicographically Sortable).'
                        : '128-bit sortable identifier encoded in Crockford Base32 with 48-bit timestamp and 80-bit randomness.',
                    icon: '⏱️',
                },
                {
                    title: 'CUID2',
                    desc: isFa
                        ? 'شناسه امن و ضد تصادم مخصوص سیستم‌های توزیع‌شده با طول دلخواه که با حروف آغاز می‌شود.'
                        : 'Collision-resistant identifier designed for horizontal scale and distributed database architecture.',
                    icon: '🛡️',
                },
                {
                    title: isFa ? 'بازرس و استخراج‌گر زمان' : 'Live Timestamp Inspector',
                    desc: isFa
                        ? 'امکان استخراج تاریخ و ثانیه دقیق ساخت از روی شناسه‌های v7 و v1 به دو تقویم شمسی و میلادی.'
                        : 'Extract millisecond creation date and system time from UUID v7 and v1 into UTC and Jalali dates.',
                    icon: '🔍',
                },
            ],
            faqTitle: isFa ? 'پرسش‌های متداول درباره UUID و شناسه‌های یکتا' : 'Frequently Asked Questions About UUIDs',
            faq: [
                {
                    q: isFa ? 'تفاوت UUID v4 و UUID v7 چیست و کدام برای دیتابیس بهتر است؟' : 'What is the difference between UUID v4 and UUID v7, and which is better for databases?',
                    a: isFa
                        ? 'شناسه UUID v4 کاملاً تصادفی است؛ وقتی در کلید اصلی (Primary Key) دیتابیس‌های SQL (مانند PostgreSQL یا MySQL) استفاده شود، به دلیل تصادفی بودن باعث تکه‌تکه شدن شاخص (B-Tree Index Fragmentation) و کندی اینزرت می‌شود. اما UUID v7 بر اساس زمان مرتب است و راندمان اینزرت در دیتابیس را همانند Auto-Increment عددی، سریع و بدون افت سرعت حفظ می‌کند.'
                        : 'UUID v4 is completely random, which causes severe B-Tree index fragmentation during database inserts. UUID v7 combines a 48-bit millisecond timestamp with random entropy, providing time-ordered sequentiality that matches the insert performance of integer IDs while maintaining global uniqueness.',
                },
                {
                    q: isFa ? 'شانس تکراری شدن (Collision) یک شناسه UUID v4 چقدر است؟' : 'What are the chances of a duplicate / collision in UUID v4?',
                    a: isFa
                        ? 'احتمال تکراری شدن UUID v4 عملاً صفر است. برای اینکه ۵۰٪ شانس دیدن حتی یک تکراری داشته باشید، باید حدود ۲.۷۱ کوینتیلیون (۲,۷۱۰,۰۰۰,۰۰۰,۰۰۰,۰۰۰,۰۰۰,۰۰۰) شناسه تولید کنید که معادل تولید یک میلیارد UUID در ثانیه برای ۸۵ سال متوالی است!'
                        : 'The probability of a collision in UUID v4 is practically zero. You would need to generate approximately 2.71 quintillion UUIDs to reach a 50% chance of a single collision—generating 1 billion UUIDs per second for 85 years.',
                },
                {
                    q: isFa ? 'شناسه NanoID چیست و در چه مواردی به کار می‌رود؟' : 'What is NanoID and when should it be used?',
                    a: isFa
                        ? 'شناسه NanoID ابزاری سبک‌تر و کوتاه‌تر از UUID است (معمولاً ۲۱ کاراکتر به جای ۳۶ کاراکتر) که فقط از کاراکترهای مجاز در آدرس‌های وب (A-Z, a-z, 0-9, _, -) استفاده می‌کند. برای کوتاه کردن لینک‌ها، شناسه‌های URL و ریدایرکت‌ها بهترین گزینه است.'
                        : 'NanoID is a compact, URL-safe alternative to UUID (typically 21 characters instead of 36). It uses only URL-safe characters (A-Z, a-z, 0-9, _, -), making it ideal for shortened links, public IDs, and web URLs.',
                },
                {
                    q: isFa ? 'آیا شناسه‌های تولید شده امن هستند و به سرور ارسال می‌شوند؟' : 'Are generated identifiers secure, and are they sent to any server?',
                    a: isFa
                        ? 'کاملاً امن هستند. تمام شناسه‌ها با استفاده از ماژول استاندارد رمزنگاری مرورگر (Web Crypto API: crypto.getRandomValues) به صورت کاملاً تصادفی و غیرقابل حدس در سیستم شما تولید می‌شوند و هیچ ارتباط سروری وجود ندارد.'
                        : '100% secure. All IDs are generated using the Web Crypto API (crypto.getRandomValues) locally in your browser. Not a single character is transmitted or logged.',
                },
            ],
        };
    }, [isFa]);

    // Handle Copy Single Hero
    const handleCopyHero = async () => {
        if (!heroId) return;
        await navigator.clipboard.writeText(heroId);
        setHeroCopied(true);
        showToast(t.copiedSuccess);
        setTimeout(() => setHeroCopied(false), 2000);
    };

    // Handle Copy Batch
    const handleCopyBatch = async () => {
        const text = exportIdentifiersToFormat(generatedIds, exportFormat, options);
        await navigator.clipboard.writeText(text);
        setBatchCopied(true);
        showToast(t.copiedSuccess);
        setTimeout(() => setBatchCopied(false), 2000);
    };

    // Handle Download Batch
    const handleDownloadBatch = () => {
        const text = exportIdentifiersToFormat(generatedIds, exportFormat, options);
        let ext = 'txt';
        let mime = 'text/plain';
        if (exportFormat === 'json') {
            ext = 'json';
            mime = 'application/json';
        } else if (exportFormat === 'sql') {
            ext = 'sql';
        } else if (exportFormat === 'csv') {
            ext = 'csv';
            mime = 'text/csv';
        } else if (exportFormat === 'js') {
            ext = 'js';
        } else if (exportFormat === 'python') {
            ext = 'py';
        } else if (exportFormat === 'go') {
            ext = 'go';
        }

        const blob = new Blob([text], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zebracode-identifiers.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    };

    const typeButtons: { id: IdentifierType; label: string; badge: string }[] = [
        { id: 'v7', label: 'UUID v7', badge: isFa ? 'پیشنهادی دیتابیس' : 'DB Recommended' },
        { id: 'v4', label: 'UUID v4', badge: isFa ? 'تصادفی امن' : 'Secure Random' },
        { id: 'nanoid', label: 'NanoID', badge: isFa ? 'مخصوص URL' : 'URL-Friendly' },
        { id: 'ulid', label: 'ULID', badge: isFa ? 'مرتب‌شونده' : 'Lexicographical' },
        { id: 'cuid2', label: 'CUID2', badge: isFa ? 'توزیع‌شده' : 'Distributed' },
        { id: 'v1', label: 'UUID v1', badge: isFa ? 'زمان/سخت‌افزار' : 'Timestamp' },
        { id: 'nil', label: 'Nil UUID', badge: '0000...0000' },
    ];

    return (
        <div className="relative min-h-screen bg-canvas text-text pb-20 selection:bg-action selection:text-action-foreground" dir={isFa ? 'rtl' : 'ltr'}>
            {/* Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform rounded-full bg-text px-5 py-2.5 text-sm font-medium text-surface shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4">
                    {toastMessage}
                </div>
            )}

            <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-8 border-b border-border pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 mb-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-action-soft text-action">
                                <Fingerprint className="h-5 w-5" />
                            </span>
                            <Badge className="bg-success-soft text-success border-success/20 gap-1 font-medium">
                                <Lock className="h-3 w-3" />
                                {t.badgePrivate}
                            </Badge>
                            <Badge className="bg-surface-inset text-text-muted border-border font-medium">
                                {t.badgeOffline}
                            </Badge>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
                            {t.title}
                        </h1>
                        <p className="mt-1 text-sm sm:text-base text-text-muted max-w-2xl">
                            {t.subtitle}
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="inline-flex rounded-xl border border-border p-1 bg-surface-inset text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('generator')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                activeTab === 'generator'
                                    ? 'bg-surface text-text shadow-xs font-bold'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            <Sparkles className="h-4 w-4 text-action" />
                            {t.tabGenerator}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('inspector')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                activeTab === 'inspector'
                                    ? 'bg-surface text-text shadow-xs font-bold'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            <Search className="h-4 w-4 text-action" />
                            {t.tabInspector}
                        </button>
                    </div>
                </header>

                {/* Hero Instant Single UUID Banner */}
                <div className="mb-8 rounded-2xl border border-action/20 bg-action-soft/20 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1 w-full min-w-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted mb-1.5">
                            <span className="flex h-2 w-2 rounded-full bg-success" />
                            <span>{isFa ? 'شناسه زنده فعلی' : 'Current Live Identifier'} ({options.type.toUpperCase()}):</span>
                        </div>
                        <div dir="ltr" className="font-mono text-base sm:text-xl font-bold text-text truncate select-all bg-surface px-3 py-2 rounded-lg border border-border">
                            {heroId}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={regenerateHero}
                            className="gap-1.5 h-10 px-3 text-xs"
                            title={t.btnRegenerate}
                        >
                            <RefreshCw className="h-4 w-4 text-action" />
                            {t.btnRegenerate}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleCopyHero}
                            className="gap-1.5 h-10 px-4 text-xs font-semibold"
                        >
                            {heroCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {heroCopied ? (isFa ? 'کپی شد!' : 'Copied!') : t.btnCopy}
                        </Button>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                {activeTab === 'generator' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Settings Column (5 cols) */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Standard Selection */}
                            <Card className="p-5 bg-surface border-border shadow-xs">
                                <label className="block text-xs font-bold text-text mb-3">
                                    {t.typeLabel}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {typeButtons.map((btn) => (
                                        <button
                                            key={btn.id}
                                            type="button"
                                            onClick={() => {
                                                const next = { ...options, type: btn.id };
                                                setOptions(next);
                                            }}
                                            className={`p-2.5 rounded-xl border text-start transition-all ${
                                                options.type === btn.id
                                                    ? 'border-action bg-action-soft/40 ring-1 ring-action'
                                                    : 'border-border bg-surface hover:bg-surface-inset text-text'
                                            }`}
                                        >
                                            <div className="font-bold text-xs text-text">{btn.label}</div>
                                            <div className="text-[10px] text-text-muted mt-0.5">{btn.badge}</div>
                                        </button>
                                    ))}
                                </div>

                                {options.type === 'nanoid' && (
                                    <div className="mt-4 pt-3 border-t border-border space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-text-muted">{isFa ? 'طول NanoID' : 'NanoID Length'}:</span>
                                            <span className="font-bold text-action">{options.nanoIdLength || 21}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={6}
                                            max={64}
                                            value={options.nanoIdLength || 21}
                                            onChange={(e) => setOptions({ ...options, nanoIdLength: Number(e.target.value) })}
                                            className="w-full accent-action cursor-pointer"
                                        />
                                    </div>
                                )}
                            </Card>

                            {/* Batch Quantity */}
                            <Card className="p-5 bg-surface border-border shadow-xs">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-text">
                                        {t.countLabel}
                                    </label>
                                    <span className="text-xs font-bold text-action bg-action-soft px-2 py-0.5 rounded">
                                        {options.count}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={100}
                                    value={options.count}
                                    onChange={(e) => setOptions({ ...options, count: Number(e.target.value) })}
                                    className="w-full accent-action cursor-pointer"
                                />
                                <div className="mt-3 flex items-center gap-1.5">
                                    {[1, 5, 10, 25, 50, 100].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setOptions({ ...options, count: num })}
                                            className={`flex-1 py-1 rounded text-xs font-semibold border ${
                                                options.count === num
                                                    ? 'bg-action text-action-foreground border-action'
                                                    : 'border-border bg-surface-inset text-text-muted hover:text-text'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </Card>

                            {/* Formatting Options */}
                            <Card className="p-5 bg-surface border-border shadow-xs">
                                <h3 className="text-xs font-bold text-text mb-3">{t.formatOptionsTitle}</h3>
                                <div className="space-y-2.5 text-xs">
                                    <label className="flex items-center justify-between cursor-pointer select-none">
                                        <span className="text-text-muted">{t.hyphensLabel}</span>
                                        <input
                                            type="checkbox"
                                            checked={options.hyphens}
                                            onChange={(e) => setOptions({ ...options, hyphens: e.target.checked })}
                                            className="h-4 w-4 rounded border-border-strong text-action focus:ring-focus"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer select-none">
                                        <span className="text-text-muted">{t.uppercaseLabel}</span>
                                        <input
                                            type="checkbox"
                                            checked={options.uppercase}
                                            onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
                                            className="h-4 w-4 rounded border-border-strong text-action focus:ring-focus"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer select-none">
                                        <span className="text-text-muted">{t.bracesLabel}</span>
                                        <input
                                            type="checkbox"
                                            checked={options.braces}
                                            onChange={(e) => setOptions({ ...options, braces: e.target.checked })}
                                            className="h-4 w-4 rounded border-border-strong text-action focus:ring-focus"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer select-none">
                                        <span className="text-text-muted">{t.urnLabel}</span>
                                        <input
                                            type="checkbox"
                                            checked={options.urnPrefix}
                                            onChange={(e) => setOptions({ ...options, urnPrefix: e.target.checked })}
                                            className="h-4 w-4 rounded border-border-strong text-action focus:ring-focus"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer select-none">
                                        <span className="text-text-muted">{t.base64Label}</span>
                                        <input
                                            type="checkbox"
                                            checked={options.encodeBase64}
                                            onChange={(e) => setOptions({ ...options, encodeBase64: e.target.checked })}
                                            className="h-4 w-4 rounded border-border-strong text-action focus:ring-focus"
                                        />
                                    </label>
                                </div>
                            </Card>
                        </div>

                        {/* Right Output Column (7 cols) */}
                        <div className="lg:col-span-7 flex flex-col space-y-4">
                            <Card className="flex-1 p-5 bg-surface border-border shadow-xs flex flex-col">
                                {/* Top Output Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <Code2 className="h-4 w-4 text-action" />
                                        <span className="text-xs font-bold text-text">
                                            {generatedIds.length} {isFa ? 'شناسه تولیدشده' : 'Identifiers'}
                                        </span>
                                        {generationTimeMs > 0 && (
                                            <span className="text-[10px] text-text-subtle font-mono">
                                                ({generationTimeMs}ms)
                                            </span>
                                        )}
                                    </div>

                                    {/* Format Selector Pills */}
                                    <div className="flex items-center gap-1 text-xs">
                                        {(['text', 'json', 'sql', 'csv', 'js', 'python'] as ExportFormat[]).map((fmt) => (
                                            <button
                                                key={fmt}
                                                type="button"
                                                onClick={() => setExportFormat(fmt)}
                                                className={`px-2 py-1 rounded text-[11px] font-semibold uppercase transition-all ${
                                                    exportFormat === fmt
                                                        ? 'bg-action text-action-foreground shadow-2xs'
                                                        : 'bg-surface-inset text-text-muted hover:text-text'
                                                }`}
                                            >
                                                {fmt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Textarea Box */}
                                <div className="relative flex-1 min-h-[360px]">
                                    <textarea
                                        readOnly
                                        dir="ltr"
                                        value={exportIdentifiersToFormat(generatedIds, exportFormat, options)}
                                        className="h-full w-full resize-none rounded-xl border border-border bg-surface-inset p-4 font-mono text-xs sm:text-sm text-text focus:outline-none"
                                    />
                                </div>

                                {/* Footer Action Buttons */}
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={runBatchGenerate}
                                        className="text-xs gap-1.5"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        {t.btnRegenerate}
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDownloadBatch}
                                            className="text-xs gap-1.5"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            {t.btnDownload}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleCopyBatch}
                                            className="text-xs gap-1.5"
                                        >
                                            {batchCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                            {batchCopied ? (isFa ? 'کپی شد!' : 'Copied!') : t.btnCopyAll}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : (
                    /* INSPECTOR TAB */
                    <div className="space-y-6">
                        <Card className="p-6 bg-surface border-border shadow-xs">
                            <label className="block text-xs font-bold text-text mb-2">
                                {isFa ? 'ورودی شناسه جهت بازرسی و واکاوی' : 'Paste UUID to Inspect & Decode'}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    dir="ltr"
                                    value={inspectInput}
                                    onChange={(e) => setInspectInput(e.target.value)}
                                    placeholder={t.inspectorPlaceholder}
                                    className="w-full rounded-xl border border-border-strong bg-surface px-4 py-3 font-mono text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus pe-10"
                                />
                                {inspectInput && (
                                    <button
                                        type="button"
                                        onClick={() => setInspectInput('')}
                                        className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Sample presets for quick testing */}
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-text-muted font-medium">{isFa ? 'تست با نمونه‌های آماده:' : 'Test Samples:'}</span>
                                <button
                                    type="button"
                                    onClick={() => setInspectInput(generateRawIdentifier('v7'))}
                                    className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action font-medium hover:bg-action-soft"
                                >
                                    {t.sampleV7}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInspectInput(generateRawIdentifier('v4'))}
                                    className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action font-medium hover:bg-action-soft"
                                >
                                    {t.sampleV4}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInspectInput(generateRawIdentifier('v1'))}
                                    className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action font-medium hover:bg-action-soft"
                                >
                                    {t.sampleV1}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInspectInput('00000000-0000-0000-0000-000000000000')}
                                    className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-text-muted font-medium hover:bg-surface-inset"
                                >
                                    {t.sampleNil}
                                </button>
                            </div>
                        </Card>

                        {/* Inspection Results Dashboard */}
                        {inspectionResult && (
                            <Card className="p-6 bg-surface border-border shadow-xs animate-in fade-in">
                                {inspectionResult.isValid ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-border pb-4">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-success-soft text-success border-success/20 gap-1 text-xs">
                                                    <Check className="h-3 w-3" />
                                                    {t.validUuid}
                                                </Badge>
                                                <span className="text-sm font-bold text-text">
                                                    {inspectionResult.version}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (inspectionResult.hyphenated) {
                                                        navigator.clipboard.writeText(inspectionResult.hyphenated);
                                                        showToast(t.copiedSuccess);
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-action hover:underline"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                                {t.btnCopy}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Version Card */}
                                            <div className="rounded-xl bg-surface-inset p-4">
                                                <div className="text-xs text-text-muted font-medium mb-1">{t.versionLabel}</div>
                                                <div className="text-sm font-bold text-text">
                                                    {inspectionResult.version}
                                                </div>
                                            </div>

                                            {/* Variant Card */}
                                            <div className="rounded-xl bg-surface-inset p-4">
                                                <div className="text-xs text-text-muted font-medium mb-1">{t.variantLabel}</div>
                                                <div className="text-sm font-bold text-text truncate" title={inspectionResult.variant}>
                                                    {inspectionResult.variant}
                                                </div>
                                            </div>

                                            {/* Timestamp Card (if v7 or v1) */}
                                            {inspectionResult.timestamp && (
                                                <div className="rounded-xl bg-action-soft/30 border border-action/20 p-4">
                                                    <div className="text-xs text-action font-bold mb-1 flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {t.extractedTimestamp}
                                                    </div>
                                                    <div className="text-xs font-bold text-text">
                                                        {t.shamsiDate}: <span className="font-mono">{inspectionResult.formattedTimestampShamsi}</span>
                                                    </div>
                                                    <div className="text-[11px] text-text-muted mt-1 font-mono">
                                                        {inspectionResult.formattedTimestampUtc}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Standard Formats Grid */}
                                        <div className="pt-2">
                                            <h4 className="text-xs font-bold text-text mb-3">
                                                {isFa ? 'نمایش در فرمت‌های مختلف' : 'Standard Encoded Formats'}
                                            </h4>
                                            <div className="space-y-2 text-xs font-mono">
                                                <div className="flex items-center justify-between rounded-lg bg-surface-inset p-2.5">
                                                    <span className="text-text-muted">Standard (Hyphenated):</span>
                                                    <span className="font-bold text-text select-all">{inspectionResult.hyphenated}</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg bg-surface-inset p-2.5">
                                                    <span className="text-text-muted">Clean Hex (No hyphens):</span>
                                                    <span className="font-bold text-text select-all">{inspectionResult.cleanHex}</span>
                                                </div>
                                                <div className="flex items-center justify-between rounded-lg bg-surface-inset p-2.5">
                                                    <span className="text-text-muted">Uppercase:</span>
                                                    <span className="font-bold text-text select-all">{inspectionResult.uppercase}</span>
                                                </div>
                                                {inspectionResult.base64 && (
                                                    <div className="flex items-center justify-between rounded-lg bg-surface-inset p-2.5">
                                                        <span className="text-text-muted">Base64 Encoded:</span>
                                                        <span className="font-bold text-text select-all">{inspectionResult.base64}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between rounded-lg bg-surface-inset p-2.5">
                                                    <span className="text-text-muted">URN Format:</span>
                                                    <span className="font-bold text-text select-all">{inspectionResult.urn}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 text-danger p-4 rounded-xl bg-danger-soft/40 border border-danger/20">
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                        <div>
                                            <strong className="block text-sm font-bold">{t.invalidUuid}</strong>
                                            <span className="text-xs">
                                                {isFa
                                                    ? 'رشته وارد شده با ساختار ۳۲ نویسه‌ای هگزادسیمال یا فرمت استاندارد ۸-۴-۴-۴-۱۲ همخوانی ندارد.'
                                                    : 'The string entered does not match standard 32-character hex or 8-4-4-4-12 UUID format.'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>
                )}

                {/* Features Showcase */}
                <section className="mt-16">
                    <h2 className="text-xl font-bold text-text mb-6 text-center">
                        {t.featuresTitle}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {t.features.map((feat, idx) => (
                            <Card key={idx} className="p-5 bg-surface border-border hover:border-action/40 transition-colors">
                                <div className="text-2xl mb-2">{feat.icon}</div>
                                <h3 className="text-sm font-bold text-text mb-1">{feat.title}</h3>
                                <p className="text-xs text-text-muted leading-relaxed">{feat.desc}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* FAQ Accordion */}
                <section className="mt-16 border-t border-border pt-12">
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <HelpCircle className="h-8 w-8 text-action mx-auto mb-2" />
                        <h2 className="text-xl font-bold text-text">
                            {t.faqTitle}
                        </h2>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        <Accordion.Root type="single" collapsible className="space-y-3">
                            {t.faq.map((item, index) => (
                                <Accordion.Item
                                    key={index}
                                    value={`faq-${index}`}
                                    className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs"
                                >
                                    <Accordion.Header>
                                        <Accordion.Trigger className="flex w-full items-center justify-between p-4 text-start text-xs sm:text-sm font-semibold text-text hover:bg-surface-inset transition-colors">
                                            <span>{item.q}</span>
                                            <ChevronDown className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-200" />
                                        </Accordion.Trigger>
                                    </Accordion.Header>
                                    <Accordion.Content className="px-4 pb-4 pt-1 text-xs sm:text-sm text-text-muted leading-relaxed border-t border-border/50">
                                        {item.a}
                                    </Accordion.Content>
                                </Accordion.Item>
                            ))}
                        </Accordion.Root>
                    </div>
                </section>
            </div>
        </div>
    );
}
