'use client';

import React, { useCallback, useMemo, useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import {
    AlertCircle,
    Check,
    ChevronDown,
    Copy,
    Download,
    ExternalLink,
    FileText,
    Globe,
    HelpCircle,
    Layers,
    Link as LinkIcon,
    Lock,
    RefreshCw,
    Search,
    Sliders,
    Sparkles,
    Trash2,
    Type,
    Wand2,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
    SeparatorChar,
    SlugMode,
    SlugOptions,
} from '@/lib/slug-generator/types';
import {
    DEFAULT_SLUG_OPTIONS,
    generateAllSlugVariants,
    generateBatchSlugs,
    generateSlug,
} from '@/lib/slug-generator/slugger';

interface SlugGeneratorProps {
    locale?: 'fa' | 'en';
    dict?: any;
}

export default function SlugGenerator({ locale = 'fa', dict }: SlugGeneratorProps) {
    const isFa = locale === 'fa';

    // Tabs
    const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

    // Single Input & Options
    const [titleInput, setTitleInput] = useState<string>('راهنمای جامع و کاربردی سئو برای برنامه‌نویسان Next.js 15');
    const [options, setOptions] = useState<SlugOptions>(DEFAULT_SLUG_OPTIONS);

    // Batch Input
    const [batchInput, setBatchInput] = useState<string>(
        'راهنمای جامع Next.js 15\nبهینه‌سازی تصاویر برای سئو\n۱۰ نکته کلیدی در جاوااسکریپت مدرن\nمعماری پایگاه داده با PostgreSQL'
    );

    // Toast
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    }, []);

    // Localized Strings
    const t = useMemo(() => {
        return {
            title: isFa ? 'تولیدکننده اسلاگ سئو برای URL (SEO Slug Generator)' : 'SEO Friendly URL Slug Generator',
            subtitle: isFa
                ? 'تولید اسلاگ استاندارد فارسی و فینگلیش برای مقالات و محصولات، با قابلیت حذف کلمات توقف (Stop Words) و پیش‌نمایش نتایج گوگل'
                : 'Generate high-ranking Persian, Pinglish, and ASCII SEO URL slugs with automatic stop words removal and live Google SERP preview.',
            badgePrivate: isFa ? '۱۰۰٪ کلاینت‌ساید و محلی' : '100% Client-Side in Browser',
            badgeOffline: isFa ? 'بدون ارسال به سرور' : 'Zero Server Calls',
            tabSingle: isFa ? 'اسلاگ تکی و پیش‌نمایش گوگل' : 'Single Slug & SERP Preview',
            tabBatch: isFa ? 'تولید دسته‌ای (Batch)' : 'Batch Multi-Line Generator',
            inputLabel: isFa ? 'عنوان مقاله، محصول یا صفحه وب' : 'Page / Article / Product Title',
            inputPlaceholder: isFa ? 'عنوان مورد نظر را وارد یا پیست کنید...' : 'Enter your headline or title here...',
            samplePersianBlog: isFa ? 'نمونه مقاله وبلاگ' : 'Persian Blog Post',
            sampleTech: isFa ? 'نمونه تکنولوژی و کد' : 'Tech Headline',
            sampleEcommerce: isFa ? 'نمونه محصول فروشگاهی' : 'E-commerce Product',
            sampleEnglish: isFa ? 'نمونه انگلیسی' : 'English Article',
            settingsTitle: isFa ? 'تنظیمات سئو و ساختار URL' : 'SEO & URL Settings',
            separatorLabel: isFa ? 'کاراکتر جداکننده (Separator)' : 'Word Separator',
            sepDash: isFa ? '- (خط تیره - پیشنهاد رسمی گوگل)' : '- (Hyphen - Google Recommended)',
            sepUnderscore: '_ (خط زیر / Underscore)',
            sepDot: '. (نقطه / Dot)',
            sepSlash: '/ (اسلش / Sub-path)',
            modeLabel: isFa ? 'نوع و زبان اسلاگ' : 'Slug Mode',
            modePersian: isFa ? 'فارسی تمیز (دیجی‌کالا / زومیت)' : 'Persian Unicode Slug',
            modePinglish: isFa ? 'فینگلیش آوایی (Pinglish / Transliterated)' : 'Pinglish (Transliterated)',
            modeAscii: isFa ? 'انگلیسی خالص (Pure ASCII)' : 'Pure ASCII Only',
            stopWordsLabel: isFa ? 'حذف کلمات توقف (Stop Words)' : 'Remove Stop Words',
            stopWordsHint: isFa ? 'حذف خودکار حروفی مثل «از، به، در، برای، و، the، for» جهت ارتقای سئو' : 'Automatically strips unnecessary filler words',
            stripNumbersLabel: isFa ? 'حذف اعداد' : 'Strip Numbers',
            maxLengthLabel: isFa ? 'حداکثر طول کاراکتر' : 'Max Length Constraint',
            domainPrefixLabel: isFa ? 'پیشوند دامنه سایت' : 'Site URL Prefix',
            previewSerpTitle: isFa ? 'پیش‌نمایش زنده در نتایج جستجوی گوگل (SERP Snippet Preview)' : 'Live Google Search Result Preview',
            btnCopySlug: isFa ? 'کپی اسلاگ' : 'Copy Slug',
            btnCopyFullUrl: isFa ? 'کپی آدرس کامل (Full URL)' : 'Copy Full URL',
            copiedSuccess: isFa ? 'در کلیپ‌بورد کپی شد!' : 'Copied to clipboard!',
            variantsTitle: isFa ? 'انواع اسلاگ تولیدشده' : 'Generated Slug Variants',
            varPersian: isFa ? 'اسلاگ فارسی تمیز' : 'Clean Persian Slug',
            varPinglish: isFa ? 'اسلاگ فینگلیش هوشمند' : 'Smart Pinglish Transliteration',
            varAscii: isFa ? 'اسلاگ لاتین خالص' : 'Pure ASCII / English Slug',
            varEncoded: isFa ? 'خام انکودشده مرورگر (%D8%...)' : 'Raw URL-Encoded',
            batchTitle: isFa ? 'ورودی عناوین چندخطی (یک عنوان در هر خط)' : 'Multi-line Titles (One per line)',
            batchPlaceholder: isFa ? 'عناوین مقالات یا محصولات را اینجا پیست کنید...' : 'Paste multiple titles here...',
            btnDownloadBatch: isFa ? 'دانلود خروجی (TXT)' : 'Download Slugs (TXT)',
            btnCopyAllSlugs: isFa ? 'کپی همه اسلاگ‌ها' : 'Copy All Slugs',
            featuresTitle: isFa ? 'چرا اسلاگ استاندارد برای سئو حیاتی است؟' : 'Why High-Quality Slugs Matter for SEO?',
            features: [
                {
                    title: isFa ? 'استفاده از خط تیره (-) به جای خط زیر' : 'Hyphens vs Underscores',
                    desc: isFa ? 'گوگل خط تیره (-) را رسماً جداکننده کلمات می‌داند در حالی که خط زیر (_) را بخشی از کلمه می‌شمارد.' : 'Google explicitly indexes hyphens as word separators while ignoring underscores.',
                    icon: '➖',
                },
                {
                    title: isFa ? 'فینگلیش هوشمند و دقیق' : 'Accurate Transliteration',
                    desc: isFa ? 'تبدیل آوایی حروف فارسی به لاتین برای سیستم‌هایی که از کاراکترهای یونیکد در URL پشتیبانی نمی‌کنند.' : 'Convert Persian words to English phonetics for legacy web systems.',
                    icon: '🔤',
                },
                {
                    title: isFa ? 'حذف هوشمند کلمات اضافه (Stop Words)' : 'Stop Words Filtering',
                    desc: isFa ? 'کوتاه‌تر کردن URL با حذف حروف ربط و اضافه فارسی و انگلیسی برای افزایش نرخ کلیک (CTR).' : 'Strip low-value filler words to create compact, high-CTR web addresses.',
                    icon: '✂️',
                },
                {
                    title: isFa ? 'پیش‌نمایش پیشرفته گوگل' : 'Google SERP Simulator',
                    desc: isFa ? 'مشاهده دقیق نحوه نمایش آدرس صفحه در موتور جستجوی گوگل پیش از انتشار.' : 'Simulate how your link and URL structure will appear on Google search.',
                    icon: '🔎',
                },
                {
                    title: isFa ? 'تولید دسته‌ای برای فروشگاه‌ها' : 'Bulk Batch Slug Processing',
                    desc: isFa ? 'تولید همزمان صدها اسلاگ برای دیتابیس محصولات یا مقالات در کسری از ثانیه.' : 'Process dozens of product or post slugs simultaneously with 1-click.',
                    icon: '⚡',
                },
                {
                    title: isFa ? '۱۰۰٪ محلی و خصوصی' : '100% Client-Side Privacy',
                    desc: isFa ? 'تمام پردازش‌ها در مرورگر شما انجام شده و هیچ داده‌ای در اینترنت ذخیره نمی‌شود.' : 'All transformations happen in browser memory with zero network calls.',
                    icon: '🔒',
                },
            ],
            faqTitle: isFa ? 'پرسش‌های متداول درباره اسلاگ‌های URL و سئو' : 'Frequently Asked Questions About URL Slugs',
            faq: [
                {
                    q: isFa ? 'آیا اسلاگ فارسی برای سئو بهتر است یا انگلیسی؟' : 'Is a Persian or English URL slug better for SEO?',
                    a: isFa
                        ? 'هر دو روش مورد تایید گوگل هستند. اسلاگ فارسی در نتایج جستجوی کاربران ایرانی کلمات کلیدی را بولد کرده و نرخ کلیک (CTR) بالاتری ایجاد می‌کند (مانند دیجی‌کالا و زومیت). در مقابل، اسلاگ انگلیسی یا فینگلیش هنگام کپی در شبکه‌های اجتماعی زیباتر است و به کدهای طولانی %D8%... تبدیل نمی‌شود.'
                        : 'Both are indexed properly by Google. Localized slugs match user search queries directly and improve Click-Through-Rate (CTR), while English/ASCII slugs share cleanly on social media without percentage encoding.',
                },
                {
                    q: isFa ? 'چرا حذف کلمات توقف (Stop Words) در اسلاگ توصیه می‌شود؟' : 'Why is removing stop words recommended in slugs?',
                    a: isFa
                        ? 'کلماتی مانند «از»، «به»، «در»، «برای»، «و» هیچ ارزش معنایی برای موتورهای جستجو ندارند. حذف آنها باعث کوتاه‌تر شدن URL، تمرکز قدرت لینک روی کلمات کلیدی اصلی و خوانایی بیشتر برای کاربران می‌شود.'
                        : 'Filler words (e.g. in, on, the, for) carry negligible search weight. Removing them yields shorter, cleaner URLs with concentrated keyword relevance.',
                },
                {
                    q: isFa ? 'طول ایده‌آل یک اسلاگ URL چقدر باید باشد؟' : 'What is the optimal URL slug length?',
                    a: isFa
                        ? 'بهترین طول برای اسلاگ بین ۳ تا ۵ کلمه یا حدود ۳۰ تا ۶۰ کاراکتر است. اسلاگ‌های بیش از ۸۰ کاراکتر در نتایج گوگل کوتاه شده (Truncate) و خوانایی خود را از دست می‌دهند.'
                        : 'The ideal slug length is between 3 to 5 words (roughly 30 to 60 characters). Slugs over 80 characters risk truncation in search engine snippets.',
                },
            ],
        };
    }, [isFa]);

    // Live Variants
    const variants = useMemo(() => {
        return generateAllSlugVariants(titleInput, options);
    }, [options, titleInput]);

    // Active Slug according to mode
    const activeSlug = useMemo(() => {
        if (options.mode === 'transliterate') return variants.transliterated;
        if (options.mode === 'ascii') return variants.asciiOnly;
        return variants.persian;
    }, [options.mode, variants]);

    // Batch Items
    const batchItems = useMemo(() => {
        return generateBatchSlugs(batchInput, options);
    }, [batchInput, options]);

    // Copy action helper
    const handleCopy = async (text: string, key: string) => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        showToast(t.copiedSuccess);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Download batch
    const handleDownloadBatch = () => {
        const text = batchItems.map((item) => `${item.original}\t${item.slug}`).join('\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'zebracode-seo-slugs.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    };

    // Length status styling
    const lengthStatus = useMemo(() => {
        const len = activeSlug.length;
        if (len === 0) return { label: '0 chars', color: 'text-text-muted', badge: 'bg-surface-inset' };
        if (len <= 55) return { label: `${len} chars (عالی / Optimal)`, color: 'text-success', badge: 'bg-success-soft text-success border-success/20' };
        if (len <= 80) return { label: `${len} chars (مناسب / Acceptable)`, color: 'text-warning', badge: 'bg-warning-soft text-warning border-warning/20' };
        return { label: `${len} chars (طولانی / Too Long)`, color: 'text-danger', badge: 'bg-danger-soft text-danger border-danger/20' };
    }, [activeSlug.length]);

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
                                <LinkIcon className="h-5 w-5" />
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
                            onClick={() => setActiveTab('single')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                activeTab === 'single'
                                    ? 'bg-surface text-text shadow-xs font-bold'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            <Sparkles className="h-4 w-4 text-action" />
                            {t.tabSingle}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('batch')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                activeTab === 'batch'
                                    ? 'bg-surface text-text shadow-xs font-bold'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            <Layers className="h-4 w-4 text-action" />
                            {t.tabBatch}
                        </button>
                    </div>
                </header>

                {activeTab === 'single' ? (
                    <div className="space-y-6">
                        {/* HERO: Active Live Slug Display */}
                        <div className="rounded-2xl border border-action/20 bg-action-soft/20 p-5 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                                    <span className="flex h-2 w-2 rounded-full bg-success" />
                                    <span>{isFa ? 'اسلاگ سئو فعال' : 'Active Generated SEO Slug'}:</span>
                                    <Badge className={`${lengthStatus.badge} text-[10px] px-2 py-0 font-bold border`}>
                                        {lengthStatus.label}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopy(variants.fullUrl, 'hero-url')}
                                        className="h-8 text-xs gap-1"
                                    >
                                        {copiedKey === 'hero-url' ? <Check className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                        {t.btnCopyFullUrl}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleCopy(activeSlug, 'hero-slug')}
                                        className="h-8 text-xs gap-1 font-semibold"
                                    >
                                        {copiedKey === 'hero-slug' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                        {t.btnCopySlug}
                                    </Button>
                                </div>
                            </div>

                            {/* Prominent Slug Box */}
                            <div
                                dir="ltr"
                                onClick={() => handleCopy(activeSlug, 'hero-slug')}
                                className="cursor-pointer rounded-xl bg-surface border border-border p-3.5 font-mono text-sm sm:text-base font-bold text-text break-all select-all hover:border-action transition-colors shadow-2xs"
                            >
                                {activeSlug || <span className="text-text-subtle italic">empty-slug</span>}
                            </div>
                        </div>

                        {/* Input & Parameters Card */}
                        <Card className="p-5 bg-surface border-border shadow-xs space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text mb-2">
                                    {t.inputLabel}
                                </label>
                                <input
                                    type="text"
                                    value={titleInput}
                                    onChange={(e) => setTitleInput(e.target.value)}
                                    placeholder={t.inputPlaceholder}
                                    className="w-full rounded-xl border border-border-strong bg-surface-inset px-4 py-3 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus"
                                />
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-text-muted font-medium">{isFa ? 'نمونه‌ها:' : 'Presets:'}</span>
                                <button
                                    type="button"
                                    onClick={() => setTitleInput('راهنمای جامع و کاربردی سئو برای برنامه‌نویسان Next.js 15')}
                                    className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action hover:bg-action-soft"
                                >
                                    {t.samplePersianBlog}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTitleInput('گوشی موبایل سامسونگ مدل Galaxy S24 Ultra ظرفیت 512 گیگابایت')}
                                    className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action hover:bg-action-soft"
                                >
                                    {t.sampleEcommerce}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTitleInput('How to Build Lightning Fast Web Applications with Vite & React')}
                                    className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action hover:bg-action-soft"
                                >
                                    {t.sampleEnglish}
                                </button>
                            </div>

                            {/* Settings Grid */}
                            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                {/* Separator */}
                                <div>
                                    <label className="block font-bold text-text-muted mb-1.5">
                                        {t.separatorLabel}
                                    </label>
                                    <select
                                        value={options.separator}
                                        onChange={(e) => setOptions({ ...options, separator: e.target.value as SeparatorChar })}
                                        className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-focus"
                                    >
                                        <option value="-">{t.sepDash}</option>
                                        <option value="_">{t.sepUnderscore}</option>
                                        <option value=".">{t.sepDot}</option>
                                        <option value="/">{t.sepSlash}</option>
                                    </select>
                                </div>

                                {/* Mode */}
                                <div>
                                    <label className="block font-bold text-text-muted mb-1.5">
                                        {t.modeLabel}
                                    </label>
                                    <select
                                        value={options.mode}
                                        onChange={(e) => setOptions({ ...options, mode: e.target.value as SlugMode })}
                                        className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-focus"
                                    >
                                        <option value="persian">{t.modePersian}</option>
                                        <option value="transliterate">{t.modePinglish}</option>
                                        <option value="ascii">{t.modeAscii}</option>
                                    </select>
                                </div>

                                {/* Domain prefix */}
                                <div>
                                    <label className="block font-bold text-text-muted mb-1.5">
                                        {t.domainPrefixLabel}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={options.domainPrefix || ''}
                                        onChange={(e) => setOptions({ ...options, domainPrefix: e.target.value })}
                                        placeholder="https://mysite.com/blog/"
                                        className="w-full rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-mono text-text focus:outline-none focus:ring-2 focus:ring-focus"
                                    />
                                </div>

                                {/* Toggles */}
                                <div className="space-y-2 pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-text-muted">
                                        <input
                                            type="checkbox"
                                            checked={options.removeStopWords}
                                            onChange={(e) => setOptions({ ...options, removeStopWords: e.target.checked })}
                                            className="h-3.5 w-3.5 rounded border-border-strong text-action focus:ring-focus"
                                        />
                                        <span className="font-semibold text-text">{t.stopWordsLabel}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-text-muted">
                                        <input
                                            type="checkbox"
                                            checked={options.stripNumbers}
                                            onChange={(e) => setOptions({ ...options, stripNumbers: e.target.checked })}
                                            className="h-3.5 w-3.5 rounded border-border-strong text-action focus:ring-focus"
                                        />
                                        <span>{t.stripNumbersLabel}</span>
                                    </label>
                                </div>
                            </div>
                        </Card>

                        {/* Live Google Search Snippet Simulation */}
                        <Card className="p-5 bg-surface border-border shadow-xs space-y-3">
                            <h3 className="text-xs font-bold text-text flex items-center gap-2">
                                <Search className="h-4 w-4 text-action" />
                                {t.previewSerpTitle}
                            </h3>

                            <div className="rounded-xl border border-border bg-surface-inset p-4 space-y-1.5" dir="ltr">
                                {/* Google breadcrumb */}
                                <div className="flex items-center gap-2 text-xs text-text-muted">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-border text-[10px] font-bold text-action">
                                        Z
                                    </div>
                                    <div className="truncate">
                                        <span className="font-semibold text-text">ZebraCode</span>
                                        <span className="mx-1">›</span>
                                        <span className="text-text-muted truncate">{variants.fullUrl}</span>
                                    </div>
                                </div>

                                {/* Google Title */}
                                <div className="text-base sm:text-lg font-semibold text-action hover:underline cursor-pointer truncate">
                                    {titleInput || 'Your Page Title Preview'}
                                </div>

                                {/* Google Snippet Description */}
                                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                                    {isFa
                                        ? `این پیش‌نمایش نحوه دیده شدن آدرس صفحه شما در موتور جستجوی گوگل است. داشتن اسلاگ تمیز و کلمات کلیدی رتبه سئو را به شدت تقویت می‌کند.`
                                        : `This is a live preview of how your page link appears in Google search engine result pages. Clean URL slugs improve search rankings.`}
                                </p>
                            </div>
                        </Card>

                        {/* All Slug Variants Cards */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-text">{t.variantsTitle}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Persian Slug */}
                                <Card className="p-3.5 bg-surface border-border hover:border-action/40 transition-colors">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <strong className="text-text">{t.varPersian}</strong>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(variants.persian, 'var-fa')}
                                            className="text-action hover:underline text-xs flex items-center gap-1 font-semibold"
                                        >
                                            {copiedKey === 'var-fa' ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                                            {t.btnCopySlug}
                                        </button>
                                    </div>
                                    <div dir="ltr" className="p-2 rounded bg-surface-inset font-mono text-xs text-text select-all break-all">
                                        {variants.persian || '—'}
                                    </div>
                                </Card>

                                {/* Pinglish Transliterated */}
                                <Card className="p-3.5 bg-surface border-border hover:border-action/40 transition-colors">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <strong className="text-text">{t.varPinglish}</strong>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(variants.transliterated, 'var-ping')}
                                            className="text-action hover:underline text-xs flex items-center gap-1 font-semibold"
                                        >
                                            {copiedKey === 'var-ping' ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                                            {t.btnCopySlug}
                                        </button>
                                    </div>
                                    <div dir="ltr" className="p-2 rounded bg-surface-inset font-mono text-xs text-text select-all break-all">
                                        {variants.transliterated || '—'}
                                    </div>
                                </Card>

                                {/* ASCII Only */}
                                <Card className="p-3.5 bg-surface border-border hover:border-action/40 transition-colors">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <strong className="text-text">{t.varAscii}</strong>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(variants.asciiOnly, 'var-ascii')}
                                            className="text-action hover:underline text-xs flex items-center gap-1 font-semibold"
                                        >
                                            {copiedKey === 'var-ascii' ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                                            {t.btnCopySlug}
                                        </button>
                                    </div>
                                    <div dir="ltr" className="p-2 rounded bg-surface-inset font-mono text-xs text-text select-all break-all">
                                        {variants.asciiOnly || '—'}
                                    </div>
                                </Card>

                                {/* URL Encoded */}
                                <Card className="p-3.5 bg-surface border-border hover:border-action/40 transition-colors">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <strong className="text-text">{t.varEncoded}</strong>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(variants.urlEncoded, 'var-enc')}
                                            className="text-action hover:underline text-xs flex items-center gap-1 font-semibold"
                                        >
                                            {copiedKey === 'var-enc' ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                                            {t.btnCopySlug}
                                        </button>
                                    </div>
                                    <div dir="ltr" className="p-2 rounded bg-surface-inset font-mono text-xs text-text-muted select-all break-all">
                                        {variants.urlEncoded || '—'}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* BATCH TAB */
                    <div className="space-y-6">
                        <Card className="p-5 bg-surface border-border shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-text">
                                    {t.batchTitle}
                                </label>
                                <span className="text-xs text-text-muted font-mono">
                                    {batchItems.length} {isFa ? 'عنوان' : 'titles'}
                                </span>
                            </div>

                            <textarea
                                rows={6}
                                value={batchInput}
                                onChange={(e) => setBatchInput(e.target.value)}
                                placeholder={t.batchPlaceholder}
                                className="w-full rounded-xl border border-border-strong bg-surface-inset p-3.5 font-mono text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus resize-none"
                            />

                            <div className="flex items-center justify-between pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadBatch}
                                    className="text-xs gap-1.5"
                                >
                                    <Download className="h-4 w-4" />
                                    {t.btnDownloadBatch}
                                </Button>

                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const text = batchItems.map((i) => i.slug).join('\n');
                                        handleCopy(text, 'batch-all');
                                    }}
                                    className="text-xs gap-1.5"
                                >
                                    {copiedKey === 'batch-all' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {t.btnCopyAllSlugs}
                                </Button>
                            </div>
                        </Card>

                        {/* Batch Results Table */}
                        <Card className="overflow-hidden bg-surface border-border shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-surface-inset border-b border-border text-text-muted font-semibold">
                                        <tr>
                                            <th className="p-3 text-start">{isFa ? 'عنوان اصلی' : 'Original Title'}</th>
                                            <th className="p-3 text-start">{isFa ? 'اسلاگ سئو' : 'Generated Slug'}</th>
                                            <th className="p-3 text-center w-20">{isFa ? 'کپی' : 'Action'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {batchItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-surface-inset/50">
                                                <td className="p-3 font-medium text-text max-w-xs truncate">{item.original}</td>
                                                <td className="p-3 font-mono text-text select-all" dir="ltr">{item.slug}</td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(item.slug, `batch-${idx}`)}
                                                        className="text-action hover:underline p-1 text-xs"
                                                    >
                                                        {copiedKey === `batch-${idx}` ? '✓' : (isFa ? 'کپی' : 'Copy')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
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
