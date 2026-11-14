'use client';

import React, { useCallback, useMemo, useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import {
    AlignLeft,
    Check,
    ChevronDown,
    Code2,
    Copy,
    Database,
    Eye,
    FileText,
    HelpCircle,
    Layers,
    Lock,
    Minimize2,
    Palette,
    RefreshCw,
    Scissors,
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
import type { CaseResultItem, CaseStyleId } from '@/lib/case-converter/types';
import {
    calculateTextStatistics,
    convertToAllCases,
} from '@/lib/case-converter/converter';

interface CaseConverterProps {
    locale?: 'fa' | 'en';
    dict?: any;
}

export default function CaseConverter({ locale = 'fa', dict }: CaseConverterProps) {
    const isFa = locale === 'fa';

    // State: Input
    const [input, setInput] = useState<string>('userProfileAuthenticationToken');
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'code' | 'text' | 'fun'>('all');

    // State: Copy feedback
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    }, []);

    // Localized Strings
    const t = useMemo(() => {
        return {
            title: isFa ? 'مبدل فرمت حروف و نام‌گذاری متغیرها (Case Converter)' : 'Text Case & Variable Naming Converter',
            subtitle: isFa
                ? 'تبدیل همزمان و زنده به تمامی استانداردهای camelCase، PascalCase، snake_case، kebab-case، CONSTANT_CASE، Title Case و dot.case'
                : 'Real-time multi-format case converter: camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, dot.case, and more.',
            badgePrivate: isFa ? '۱۰۰٪ کلاینت‌ساید و محلی' : '100% Client-Side in Browser',
            badgeOffline: isFa ? 'بدون ارسال به سرور' : 'Zero Server Calls',
            inputLabel: isFa ? 'متن یا نام متغیر ورودی' : 'Input Text or Identifier',
            inputPlaceholder: isFa ? 'متن خود را اینجا وارد یا پیست کنید تا بلافاصله به تمام فرمت‌ها تبدیل شود...' : 'Type or paste text to convert to all cases simultaneously...',
            sampleVariable: isFa ? 'نمونه متغیر کمل‌کیس' : 'Sample camelCase',
            sampleHeadline: isFa ? 'نمونه تیتر انگلیسی' : 'Sample Title',
            sampleConstant: isFa ? 'نمونه ثوابت و env' : 'Sample CONSTANT',
            sampleSentence: isFa ? 'نمونه جمله متن' : 'Sample Sentence',
            btnClear: isFa ? 'پاک‌سازی' : 'Clear',
            tabAll: isFa ? 'همه فرمت‌ها' : 'All Cases',
            tabCode: isFa ? 'کدنویسی و توسعه' : 'Programming & Code',
            tabText: isFa ? 'متن و نگارش' : 'Typography & Text',
            tabFun: isFa ? 'فانتزی و سرگرمی' : 'Fun & Stylistic',
            statsTitle: isFa ? 'آمار زنده متن' : 'Live Text Statistics',
            statChars: isFa ? 'کاراکترها' : 'Characters',
            statCharsNoSpaces: isFa ? 'بدون فاصله' : 'Without Spaces',
            statWords: isFa ? 'کلمات' : 'Words',
            statLines: isFa ? 'خطوط' : 'Lines',
            statReadingTime: isFa ? 'زمان مطالعه تقریبی' : 'Est. Reading Time',
            btnCopy: isFa ? 'کپی' : 'Copy',
            btnCopyAllJson: isFa ? 'کپی همه در قالب JSON' : 'Copy All as JSON',
            copiedSuccess: isFa ? 'در کلیپ‌بورد کپی شد!' : 'Copied to clipboard!',
            toolCleanSpaces: isFa ? 'حذف فاصله‌های اضافی' : 'Trim Extra Spaces',
            toolRemoveLinebreaks: isFa ? 'تک‌خطی کردن' : 'Remove Linebreaks',
            toolReverse: isFa ? 'معکوس کردن متن' : 'Reverse Text',
            featuresTitle: isFa ? 'استانداردهای نام‌گذاری در برنامه‌نویسی' : 'Industry Naming Conventions',
            features: [
                {
                    title: 'camelCase',
                    desc: isFa ? 'استاندارد اصلی برای متغیرها، توابع و پراپرتی‌های اشیاء در جاوااسکریپت، تایپ‌اسکریپت و جاوا.' : 'Primary standard for variables, methods, and object keys in JS/TS.',
                    icon: '🐪',
                },
                {
                    title: 'snake_case',
                    desc: isFa ? 'قالب مرسوم در پایگاه‌های داده رابطه‌ای (SQL Columns)، پایتون (PEP 8) و زبان راست (Rust).' : 'Standard in SQL table columns, Python (PEP 8), and Rust.',
                    icon: '🐍',
                },
                {
                    title: 'kebab-case',
                    desc: isFa ? 'استاندارد نام کلاس‌های CSS، تگ‌های وب‌کامپوننت و آدرس‌های سئو فرندلی صفحات وب (URL Slugs).' : 'Standard for CSS classes, custom HTML elements, and URL slugs.',
                    icon: '🍢',
                },
                {
                    title: 'PascalCase',
                    desc: isFa ? 'نام‌گذاری کلاس‌های شی‌ءگرا، کامپوننت‌های React و اینترفیس‌های تایپ‌اسکریپت.' : 'Used for classes, React components, and TypeScript interfaces.',
                    icon: '🏛️',
                },
                {
                    title: 'CONSTANT_CASE',
                    desc: isFa ? 'نام‌گذاری متغیرهای محیطی در فایل‌های .env و مقادیر غیرقابل تغییر سراسری.' : 'Used for environment variables (.env) and global immutable constants.',
                    icon: '🔒',
                },
                {
                    title: 'Title Case',
                    desc: isFa ? 'فرمت حرفه‌ای برای تیتر مقالات، عنوان دکمه‌ها و سربرگ‌های نگارشی انگلیسی.' : 'Capitalized title format for article headlines, menus, and buttons.',
                    icon: '📰',
                },
            ],
            faqTitle: isFa ? 'پرسش‌های متداول درباره فرمت‌های نام‌گذاری متغیرها' : 'Frequently Asked Questions About Case Conversion',
            faq: [
                {
                    q: isFa ? 'تفاوت camelCase و PascalCase چیست؟' : 'What is the difference between camelCase and PascalCase?',
                    a: isFa
                        ? 'در camelCase حرف اول کلمه اول همیشه کوچک است (مانند userName) اما در PascalCase حرف اول تمام کلمات بزرگ است (مانند UserName). معمولاً در جاوااسکریپت برای متغیرها از camelCase و برای کلاس‌ها یا کامپوننت‌های ری‌اکت از PascalCase استفاده می‌شود.'
                        : 'camelCase begins with a lowercase letter (e.g. userName), whereas PascalCase capitalizes every word including the first (e.g. UserName). JavaScript typically reserves camelCase for variables and PascalCase for classes and React components.',
                },
                {
                    q: isFa ? 'چرا در URLها از kebab-case به جای snake_case استفاده می‌شود؟' : 'Why is kebab-case preferred over snake_case in web URLs?',
                    a: isFa
                        ? 'موتورهای جستجو مانند گوگل خط تیره (-) را به عنوان جداکننده کلمات (Word Separator) می‌شناسند، در حالی که خط زیر (_) را بخشی از همان کلمه در نظر می‌گیرند. بنابراین استفاده از kebab-case در اسلاگ‌های URL رتبه سئو سایت را بهبود می‌بخشد.'
                        : 'Search engines like Google treat hyphens (-) as word separators, while underscores (_) are considered part of the word. Using kebab-case in URLs drastically improves search discoverability.',
                },
                {
                    q: isFa ? 'این ابزار چگونه کلمات ترکیبی پیچیده مانند XMLHTTPRequest را تفکیک می‌کند؟' : 'How does this tool handle complex acronyms like XMLHTTPRequest?',
                    a: isFa
                        ? 'موتور پارسر ما از الگوریتم هوشمند مرزبندی کلمات و حروف بزرگ متوالی (Acronym Parsing) بهره می‌برد. عبارتی مانند XMLHTTPRequest به صورت خودکار به سه کلمه XML و HTTP و Request تفکیک شده و بدون بهم‌ریختگی به فرمت‌های مختلف تبدیل می‌شود.'
                        : 'Our parser uses smart boundary detection for acronyms and camelCase transitions, properly separating terms like XMLHTTPRequest into XML, HTTP, and Request without garbling the output.',
                },
            ],
        };
    }, [isFa]);

    // Live Converted Results
    const allCases = useMemo(() => {
        return convertToAllCases(input, isFa ? 'fa' : 'en');
    }, [input, isFa]);

    // Live Statistics
    const statistics = useMemo(() => {
        return calculateTextStatistics(input);
    }, [input]);

    // Filtered by category
    const filteredCases = useMemo(() => {
        if (selectedCategory === 'all') return allCases;
        return allCases.filter((c) => c.category === selectedCategory);
    }, [allCases, selectedCategory]);

    // Copy single value
    const handleCopy = async (val: string, id: string) => {
        if (!val) return;
        await navigator.clipboard.writeText(val);
        setCopiedId(id);
        showToast(t.copiedSuccess);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Copy all as JSON
    const handleCopyAllJson = async () => {
        const obj: Record<string, string> = {};
        for (const c of allCases) {
            obj[c.id] = c.value;
        }
        await navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
        showToast(t.copiedSuccess);
    };

    // Quick text transformers
    const cleanExtraSpaces = () => {
        setInput((prev) => prev.replace(/\s+/g, ' ').trim());
    };

    const removeLinebreaks = () => {
        setInput((prev) => prev.replace(/[\r\n]+/g, ' ').trim());
    };

    const reverseText = () => {
        setInput((prev) => Array.from(prev).reverse().join(''));
    };

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
                                <Type className="h-5 w-5" />
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

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyAllJson}
                            className="text-xs gap-1.5"
                        >
                            <Code2 className="h-4 w-4" />
                            {t.btnCopyAllJson}
                        </Button>
                    </div>
                </header>

                {/* Input Editor Card */}
                <Card className="p-5 bg-surface border-border shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-text">
                            {t.inputLabel}
                        </label>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="font-mono">{statistics.words} {isFa ? 'کلمه' : 'words'}</span>
                            <span>·</span>
                            <span className="font-mono">{statistics.charactersWithSpaces} {isFa ? 'کاراکتر' : 'chars'}</span>
                            {input && (
                                <button
                                    type="button"
                                    onClick={() => setInput('')}
                                    className="text-danger hover:underline ms-2 font-medium"
                                >
                                    {t.btnClear}
                                </button>
                            )}
                        </div>
                    </div>

                    <textarea
                        rows={3}
                        dir="ltr"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t.inputPlaceholder}
                        className="w-full rounded-xl border border-border-strong bg-surface-inset p-3.5 font-mono text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus resize-none"
                    />

                    {/* Presets and Quick Transformers Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-text-muted font-medium">{isFa ? 'نمونه‌ها:' : 'Presets:'}</span>
                            <button
                                type="button"
                                onClick={() => setInput('userProfileAuthenticationToken')}
                                className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action hover:bg-action-soft"
                            >
                                {t.sampleVariable}
                            </button>
                            <button
                                type="button"
                                onClick={() => setInput('the quick brown fox jumps over the lazy dog')}
                                className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action hover:bg-action-soft"
                            >
                                {t.sampleHeadline}
                            </button>
                            <button
                                type="button"
                                onClick={() => setInput('NEXT_PUBLIC_API_GATEWAY_URL')}
                                className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action hover:bg-action-soft"
                            >
                                {t.sampleConstant}
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={cleanExtraSpaces}
                                className="rounded-md border border-border bg-surface px-2.5 py-1 text-text-muted hover:text-text hover:bg-surface-inset"
                            >
                                {t.toolCleanSpaces}
                            </button>
                            <button
                                type="button"
                                onClick={removeLinebreaks}
                                className="rounded-md border border-border bg-surface px-2.5 py-1 text-text-muted hover:text-text hover:bg-surface-inset"
                            >
                                {t.toolRemoveLinebreaks}
                            </button>
                            <button
                                type="button"
                                onClick={reverseText}
                                className="rounded-md border border-border bg-surface px-2.5 py-1 text-text-muted hover:text-text hover:bg-surface-inset"
                            >
                                {t.toolReverse}
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Filter Tabs Bar */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
                    <div className="inline-flex rounded-xl border border-border p-1 bg-surface-inset text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                selectedCategory === 'all'
                                    ? 'bg-surface text-text shadow-xs font-bold'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            {t.tabAll} ({allCases.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('code')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                selectedCategory === 'code'
                                    ? 'bg-surface text-text shadow-xs font-bold'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            {t.tabCode}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('text')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                selectedCategory === 'text'
                                    ? 'bg-surface text-text shadow-xs font-bold'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            {t.tabText}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('fun')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                selectedCategory === 'fun'
                                    ? 'bg-surface text-text shadow-xs font-bold'
                                    : 'text-text-muted hover:text-text'
                            }`}
                        >
                            {t.tabFun}
                        </button>
                    </div>

                    {/* Stats pills */}
                    <div className="hidden sm:flex items-center gap-3 text-xs text-text-muted">
                        <span>{statistics.charactersWithSpaces} {t.statChars}</span>
                        <span>·</span>
                        <span>{statistics.words} {t.statWords}</span>
                        <span>·</span>
                        <span>{statistics.lines} {t.statLines}</span>
                    </div>
                </div>

                {/* Converted Cases Grid */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCases.map((item) => {
                        const isCopied = copiedId === item.id;

                        return (
                            <Card
                                key={item.id}
                                className="p-4 bg-surface border-border hover:border-action/40 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-text">
                                                {item.label}
                                            </span>
                                            <Badge className="bg-surface-inset text-text-muted text-[10px] px-1.5 py-0 border-border">
                                                {item.category}
                                            </Badge>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleCopy(item.value, item.id)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-action hover:underline"
                                        >
                                            {isCopied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                                            {isCopied ? (isFa ? 'کپی شد!' : 'Copied!') : t.btnCopy}
                                        </button>
                                    </div>

                                    {/* Value box */}
                                    <div
                                        dir="ltr"
                                        onClick={() => handleCopy(item.value, item.id)}
                                        className="cursor-pointer rounded-lg bg-surface-inset p-3 font-mono text-xs sm:text-sm text-text break-all select-all hover:bg-action-soft/40 transition-colors border border-border/60"
                                    >
                                        {item.value || <span className="text-text-subtle italic">empty</span>}
                                    </div>
                                </div>

                                <div className="mt-2.5 text-[11px] text-text-subtle">
                                    {item.description}
                                </div>
                            </Card>
                        );
                    })}
                </div>

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
