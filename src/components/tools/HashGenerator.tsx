'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    ChevronDown,
    Copy,
    Database,
    Download,
    Eye,
    EyeOff,
    FileCheck,
    FileText,
    Fingerprint,
    HelpCircle,
    Key,
    Lock,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Sparkles,
    Trash2,
    UploadCloud,
    X,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
    ChecksumVerificationResult,
    HashAlgorithm,
    HashMode,
    HashResultItem,
} from '@/lib/hash-generator/types';
import {
    computeAllHashes,
    computeHmac,
    formatBytes,
    verifyChecksum,
} from '@/lib/hash-generator/crypto';

interface HashGeneratorProps {
    locale?: 'fa' | 'en';
    dict?: any;
}

export default function HashGenerator({ locale = 'fa', dict }: HashGeneratorProps) {
    const isFa = locale === 'fa';

    // State: Mode
    const [mode, setMode] = useState<HashMode>('text');

    // State: Inputs
    const [textInput, setTextInput] = useState<string>('Hello, ZebraCode! سلام زبراکد');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [hmacKey, setHmacKey] = useState<string>('secret-signing-key-123');
    const [showHmacKey, setShowHmacKey] = useState<boolean>(false);
    const [hmacAlgorithm, setHmacAlgorithm] = useState<'SHA-256' | 'SHA-512' | 'SHA-384' | 'SHA-1'>('SHA-256');
    const [expectedChecksum, setExpectedChecksum] = useState<string>('');

    // State: Options
    const [isUppercase, setIsUppercase] = useState<boolean>(false);
    const [showBase64, setShowBase64] = useState<boolean>(false);

    // State: Outputs
    const [hashes, setHashes] = useState<HashResultItem[]>([]);
    const [hmacResult, setHmacResult] = useState<{ hex: string; base64: string } | null>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [calcDurationMs, setCalcDurationMs] = useState<number>(0);

    // State: Copy & Toast
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    }, []);

    // Localized Strings
    const t = useMemo(() => {
        return {
            title: isFa ? 'محاسبه‌گر و اعتبارسنج هش آنلاین (Hash Generator & Checksum)' : 'Online Hash Generator & Checksum Verifier',
            subtitle: isFa
                ? 'محاسبه همزمان هش‌های SHA-256، SHA-512، MD5، SHA-1، CRC32 برای متن و فایل به همراه تولید HMAC و اعتبارسنجی چکسام'
                : 'Compute real-time SHA-256, SHA-512, MD5, SHA-1, CRC32 hashes for text and files, generate HMAC signatures, and verify checksum integrity.',
            badgePrivate: isFa ? '۱۰۰٪ کلاینت‌ساید و امن (WebCrypto)' : '100% Client-Side WebCrypto',
            badgeOffline: isFa ? 'بدون ارسال به سرور' : 'Zero Server Calls',
            tabText: isFa ? 'هش متن (Text)' : 'Text Hash',
            tabFile: isFa ? 'هش و چکسام فایل (File)' : 'File Checksum',
            tabHmac: isFa ? 'احراز اصالت HMAC' : 'HMAC Signature',
            tabVerify: isFa ? 'بررسی چکسام (Verify)' : 'Verify Checksum',
            textPlaceholder: isFa ? 'متن خود را اینجا تایپ یا پیست کنید...' : 'Type or paste your text here...',
            sampleEnglish: isFa ? 'نمونه انگلیسی' : 'English Sample',
            samplePersian: isFa ? 'نمونه فارسی' : 'Persian Sample',
            sampleJson: isFa ? 'نمونه JSON' : 'JSON Sample',
            uppercaseToggle: isFa ? 'حروف بزرگ (UPPERCASE)' : 'UPPERCASE',
            base64Toggle: isFa ? 'نمایش Base64' : 'Show Base64',
            copiedSuccess: isFa ? 'هش در کلیپ‌بورد کپی شد!' : 'Hash copied to clipboard!',
            fileDropTitle: isFa ? 'فایل مورد نظر را اینجا بکشید و رها کنید' : 'Drag & Drop any file here',
            fileDropSubtitle: isFa
                ? 'یا کلیک کنید برای انتخاب فایل · بدون محدودیت حجم و بدون آپلود به سرور'
                : 'or click to browse · No size limit, processed 100% locally in your browser',
            btnBrowse: isFa ? 'انتخاب فایل' : 'Browse File',
            fileDetails: isFa ? 'مشخصات فایل' : 'File Information',
            hmacKeyLabel: isFa ? 'کلید محرمانه (Secret Key)' : 'Secret Key',
            hmacAlgoLabel: isFa ? 'الگوریتم HMAC' : 'HMAC Algorithm',
            verifyInputLabel: isFa ? 'چک‌سام مورد انتظار (Expected Hash)' : 'Expected Checksum Value',
            verifyPlaceholder: isFa ? 'هش مورد انتظار را پیست کنید (مثلاً sha256 دانلود شده از سایت سازنده)...' : 'Paste expected hash to verify file integrity...',
            verifyMatchTitle: isFa ? 'تطابق کامل یافت شد! یکپارچگی فایل تایید شد.' : 'Match Found! Integrity verified.',
            verifyMismatchTitle: isFa ? 'عدم تطابق! هش فایل با مقدار مورد انتظار همخوانی ندارد.' : 'Checksum Mismatch! File may be corrupt or altered.',
            featuresTitle: isFa ? 'ویژگی‌ها و کاربردهای هشینگ' : 'Key Hashing Features & Security Standards',
            features: [
                {
                    title: 'SHA-256 (FIPS 180-4)',
                    desc: isFa ? 'استاندارد جهانی امنیت سایبری، بلاک‌چین و امضای دیجیتال با ۲۵۶ بیت آنتروپی غیرقابل معکوس.' : 'Gold standard cryptographic hash used in SSL, Git, and blockchain.',
                    icon: '🔒',
                },
                {
                    title: isFa ? 'محاسبه مستقیم هش فایل' : 'Instant Client-Side File Hashing',
                    desc: isFa ? 'محاسبه چکسام فایل‌های سنگین درون مرورگر بدون ارسال به سرور برای اطمینان از سلامت دانلود.' : 'Calculate file checksums client-side without uploading to ensure download integrity.',
                    icon: '📁',
                },
                {
                    title: 'HMAC Authentication',
                    desc: isFa ? 'تولید کدهای احراز اصالت بر پایه کلید مشترک (HMAC) برای وب‌هوک‌ها و APIهای امنیتی.' : 'Keyed-hash message authentication code generator for API webhooks and security.',
                    icon: '🔑',
                },
                {
                    title: 'MD5 & CRC32 Checksums',
                    desc: isFa ? 'محاسبه سریع چکسام‌های ۳۲ بیتی و ۱۲۸ بیتی برای بررسی فایل‌های فشرده و سلامت انتقال شبکه.' : 'Fast classic checksum calculation for zip archives and network packet integrity.',
                    icon: '⚡',
                },
                {
                    title: isFa ? 'اعتبارسنجی خودکار چکسام' : 'Auto Checksum Verifier',
                    desc: isFa ? 'تشخیص و مقایسه هوشمند هش فایل با هش سازنده برای جلوگیری از بدافزارها و فایل‌های ناقص.' : 'Smart checksum matching to verify against vendor release hashes and detect corruption.',
                    icon: '✅',
                },
                {
                    title: isFa ? '۱۰۰٪ محرمانه و آفلاین' : '100% Private & Offline',
                    desc: isFa ? 'تضمین حریم خصوصی کامل؛ داده‌های شما هرگز در فضای ابری ذخیره یا منتقل نمی‌شوند.' : 'Guaranteed local processing via Web Crypto API with zero network requests.',
                    icon: '🛡️',
                },
            ],
            faqTitle: isFa ? 'پرسش‌های متداول درباره توابع هش و امنیت' : 'Frequently Asked Questions About Hashes',
            faq: [
                {
                    q: isFa ? 'تابع هش (Hash Function) چیست و چه کاربردی دارد؟' : 'What is a hash function and what is it used for?',
                    a: isFa
                        ? 'تابع هش یک الگوریتم ریاضی یک‌طرفه است که هر داده با هر حجمی (از یک کلمه تا یک فایل چند گیگابایتی) را به یک رشته متنی با طول ثابت (مثلاً ۶۴ کاراکتر در SHA-256) تبدیل می‌کند. حتی اگر یک نقطه یا فاصله در داده تغییر کند، هش خروجی کاملاً متفاوت خواهد بود (اثر بهمنی یا Avalanche Effect).'
                        : 'A hash function is a one-way mathematical algorithm that converts arbitrary data into a fixed-length string. Even the slightest alteration to the input will drastically change the output hash (Avalanche Effect).',
                },
                {
                    q: isFa ? 'چرا نباید از MD5 و SHA-1 برای رمزهای عبور استفاده کرد؟' : 'Why should MD5 and SHA-1 not be used for password hashing?',
                    a: isFa
                        ? 'الگوریتم‌های MD5 و SHA-1 امروزه به دلیل وجود حملات برخورد (Collision Attacks) و سرعت بالای سخت‌افزارهای مدرن در کرک کردن جدول‌های رنگین‌کمان (Rainbow Tables) از نظر امنیتی منسوخ شده‌اند. این الگوریتم‌ها صرفاً برای چک‌سام سریع یکپارچگی فایل‌ها مناسب هستند، نه ذخیره امن پسورد.'
                        : 'MD5 and SHA-1 suffer from proven cryptographic collision vulnerabilities and can be rapidly brute-forced on modern GPUs. They should only be used as lightweight data integrity checksums, never for sensitive credentials.',
                },
                {
                    q: isFa ? 'کد HMAC چیست و در وب‌هوک‌ها (Webhooks) چه نقشی دارد؟' : 'What is HMAC and how is it used in webhooks and APIs?',
                    a: isFa
                        ? 'کد HMAC حاصل ترکیب داده با یک کلید محرمانه (Secret Key) است. در وب‌هوک‌ها (مانند درگاه‌های پرداخت، گیت‌هاب یا تلگرام)، فرستنده بدنه درخواست را با کلید امنیتی هش می‌کند تا گیرنده مطمئن شود پیام در مسیر تغییر نکرده و حتماً از مبدأ واقعی ارسال شده است.'
                        : 'HMAC combines the message data with a private secret key. It allows receivers of API webhooks (e.g. GitHub, Stripe) to verify both data authenticity and data integrity simultaneously.',
                },
                {
                    q: isFa ? 'آیا فایل‌هایی که در این صفحه بررسی می‌کنم در سرور آپلود می‌شوند؟' : 'Are files hashed on this page uploaded to a server?',
                    a: isFa
                        ? 'خیر! تمامی محاسبات هش با استفاده از APIهای بومی مرورگر (HTML5 FileReader و Web Crypto API) ۱۰۰٪ به صورت محلی در حافظه دستگاه شما انجام می‌شود و هیچ اطلاعاتی به اینترنت ارسال نمی‌گردد.'
                        : 'No. All calculations run strictly client-side inside your browser memory via the Web Crypto API. No data is ever uploaded.',
                },
            ],
        };
    }, [isFa]);

    // Recalculate Hashes for Text
    const calculateTextHashes = useCallback(async (text: string) => {
        setIsCalculating(true);
        const startTime = performance.now();
        try {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(text);
            const items = await computeAllHashes(bytes);
            setHashes(items);
            setCalcDurationMs(Math.round((performance.now() - startTime) * 10) / 10);
        } catch (err) {
            console.error('Hash calculation error:', err);
        } finally {
            setIsCalculating(false);
        }
    }, []);

    // Recalculate Hashes for File
    const calculateFileHashes = useCallback(async (file: File) => {
        setIsCalculating(true);
        const startTime = performance.now();
        try {
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            const items = await computeAllHashes(bytes);
            setHashes(items);
            setCalcDurationMs(Math.round((performance.now() - startTime) * 10) / 10);
        } catch (err) {
            console.error('File hash calculation error:', err);
        } finally {
            setIsCalculating(false);
        }
    }, []);

    // Recalculate HMAC
    const calculateHmacResult = useCallback(async () => {
        try {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(textInput);
            const res = await computeHmac(hmacAlgorithm, hmacKey, bytes);
            setHmacResult(res);
        } catch (err) {
            console.error('HMAC calculation error:', err);
        }
    }, [hmacAlgorithm, hmacKey, textInput]);

    // Trigger calculations based on active mode
    useEffect(() => {
        if (mode === 'text' || mode === 'verify') {
            calculateTextHashes(textInput);
        } else if (mode === 'file' && selectedFile) {
            calculateFileHashes(selectedFile);
        } else if (mode === 'hmac') {
            calculateHmacResult();
        }
    }, [calculateFileHashes, calculateHmacResult, calculateTextHashes, mode, selectedFile, textInput]);

    // Copy action helper
    const handleCopy = async (text: string, key: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        showToast(t.copiedSuccess);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Verification evaluation
    const verification = useMemo(() => {
        if (!expectedChecksum.trim() || hashes.length === 0) return null;
        return verifyChecksum(expectedChecksum, hashes);
    }, [expectedChecksum, hashes]);

    return (
        <div className="relative min-h-screen bg-canvas text-text pb-20 selection:bg-action selection:text-action-foreground" dir={isFa ? 'rtl' : 'ltr'}>
            {/* Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform rounded-full bg-text px-5 py-2.5 text-sm font-medium text-surface shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4">
                    {toastMessage}
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setMode('file');
                    }
                    e.target.value = '';
                }}
            />

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

                    {/* Mode Tabs */}
                    <div className="inline-flex rounded-xl border border-border p-1 bg-surface-inset text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setMode('text')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                                mode === 'text' ? 'bg-surface text-text shadow-xs font-bold' : 'text-text-muted hover:text-text'
                            }`}
                        >
                            <FileText className="h-3.5 w-3.5 text-action" />
                            {t.tabText}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('file')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                                mode === 'file' ? 'bg-surface text-text shadow-xs font-bold' : 'text-text-muted hover:text-text'
                            }`}
                        >
                            <FileCheck className="h-3.5 w-3.5 text-action" />
                            {t.tabFile}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('hmac')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                                mode === 'hmac' ? 'bg-surface text-text shadow-xs font-bold' : 'text-text-muted hover:text-text'
                            }`}
                        >
                            <Key className="h-3.5 w-3.5 text-action" />
                            {t.tabHmac}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('verify')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                                mode === 'verify' ? 'bg-surface text-text shadow-xs font-bold' : 'text-text-muted hover:text-text'
                            }`}
                        >
                            <Search className="h-3.5 w-3.5 text-action" />
                            {t.tabVerify}
                        </button>
                    </div>
                </header>

                {/* Input Area Depending on Mode */}
                <div className="space-y-6">
                    {mode === 'text' && (
                        <Card className="p-5 bg-surface border-border shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-text">
                                    {isFa ? 'ورودی متن جهت هش' : 'Input String'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-text-subtle">
                                        {textInput.length} {isFa ? 'کاراکتر' : 'chars'} · {new TextEncoder().encode(textInput).length} {isFa ? 'بایت' : 'bytes'}
                                    </span>
                                </div>
                            </div>

                            <textarea
                                rows={3}
                                dir="ltr"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder={t.textPlaceholder}
                                className="w-full rounded-xl border border-border-strong bg-surface-inset p-3.5 font-mono text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus resize-none"
                            />

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-text-muted font-medium">{isFa ? 'نمونه‌ها:' : 'Presets:'}</span>
                                    <button
                                        type="button"
                                        onClick={() => setTextInput('The quick brown fox jumps over the lazy dog')}
                                        className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action hover:bg-action-soft"
                                    >
                                        {t.sampleEnglish}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTextInput('سلام زبراکد؛ سامانه ابزارهای آنلاین برنامه‌نویسی')}
                                        className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action hover:bg-action-soft"
                                    >
                                        {t.samplePersian}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTextInput('{"user":"developer","verified":true,"roles":["admin"]}')}
                                        className="rounded-md border border-border bg-surface-inset px-2.5 py-1 text-action hover:bg-action-soft"
                                    >
                                        {t.sampleJson}
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-text-muted">
                                        <input
                                            type="checkbox"
                                            checked={isUppercase}
                                            onChange={(e) => setIsUppercase(e.target.checked)}
                                            className="h-3.5 w-3.5 rounded border-border-strong text-action focus:ring-focus"
                                        />
                                        <span>{t.uppercaseToggle}</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-text-muted">
                                        <input
                                            type="checkbox"
                                            checked={showBase64}
                                            onChange={(e) => setShowBase64(e.target.checked)}
                                            className="h-3.5 w-3.5 rounded border-border-strong text-action focus:ring-focus"
                                        />
                                        <span>{t.base64Toggle}</span>
                                    </label>
                                </div>
                            </div>
                        </Card>
                    )}

                    {mode === 'file' && (
                        <Card className="p-6 bg-surface border-border shadow-xs">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                        setSelectedFile(e.dataTransfer.files[0]);
                                    }
                                }}
                                className="cursor-pointer rounded-2xl border-2 border-dashed border-border-strong hover:border-action p-8 text-center transition-colors bg-surface-inset/40 hover:bg-action-soft/20"
                            >
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-action-soft text-action mb-3">
                                    <UploadCloud className="h-6 w-6" />
                                </div>
                                <h3 className="text-sm font-bold text-text mb-1">{t.fileDropTitle}</h3>
                                <p className="text-xs text-text-muted mb-4">{t.fileDropSubtitle}</p>
                                <Button type="button" size="sm" className="gap-2">
                                    <FileCheck className="h-4 w-4" />
                                    {t.btnBrowse}
                                </Button>
                            </div>

                            {selectedFile && (
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-inset p-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <FileCheck className="h-4 w-4 text-action" />
                                        <span className="font-bold text-text">{selectedFile.name}</span>
                                        <Badge className="bg-surface text-text-muted border-border">
                                            {formatBytes(selectedFile.size, locale)}
                                        </Badge>
                                        <span className="text-text-subtle">({selectedFile.type || 'unknown type'})</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setHashes([]);
                                        }}
                                        className="text-text-muted hover:text-danger p-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </Card>
                    )}

                    {mode === 'hmac' && (
                        <Card className="p-5 bg-surface border-border shadow-xs space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text mb-2">
                                        {t.hmacKeyLabel}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showHmacKey ? 'text' : 'password'}
                                            dir="ltr"
                                            value={hmacKey}
                                            onChange={(e) => setHmacKey(e.target.value)}
                                            className="w-full rounded-xl border border-border-strong bg-surface-inset px-3.5 py-2 font-mono text-xs text-text focus:outline-none focus:ring-2 focus:ring-focus pe-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowHmacKey(!showHmacKey)}
                                            className="absolute end-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1"
                                        >
                                            {showHmacKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-text mb-2">
                                        {t.hmacAlgoLabel}
                                    </label>
                                    <select
                                        value={hmacAlgorithm}
                                        onChange={(e) => setHmacAlgorithm(e.target.value as any)}
                                        className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-focus"
                                    >
                                        <option value="SHA-256">HMAC-SHA256 (پیشنهادی / Recommended)</option>
                                        <option value="SHA-512">HMAC-SHA512</option>
                                        <option value="SHA-384">HMAC-SHA384</option>
                                        <option value="SHA-1">HMAC-SHA1</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text mb-1">
                                    {isFa ? 'پیام ورودی برای امضا' : 'Message Payload'}
                                </label>
                                <textarea
                                    rows={2}
                                    dir="ltr"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    className="w-full rounded-xl border border-border-strong bg-surface-inset p-3 font-mono text-xs text-text focus:outline-none focus:ring-2 focus:ring-focus resize-none"
                                />
                            </div>

                            {/* HMAC Result */}
                            {hmacResult && (
                                <div className="mt-4 pt-4 border-t border-border space-y-3">
                                    <div className="rounded-xl border border-action/30 bg-action-soft/20 p-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-action">
                                                {hmacAlgorithm} Signature (Hex):
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(hmacResult.hex, 'hmac-hex')}
                                                className="text-xs font-semibold text-action hover:underline flex items-center gap-1"
                                            >
                                                {copiedKey === 'hmac-hex' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                                {copiedKey === 'hmac-hex' ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی' : 'Copy')}
                                            </button>
                                        </div>
                                        <div dir="ltr" className="font-mono text-xs font-bold text-text break-all select-all">
                                            {isUppercase ? hmacResult.hex.toUpperCase() : hmacResult.hex}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border bg-surface-inset p-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-text-muted">
                                                {hmacAlgorithm} Signature (Base64):
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(hmacResult.base64, 'hmac-b64')}
                                                className="text-xs font-semibold text-action hover:underline flex items-center gap-1"
                                            >
                                                {copiedKey === 'hmac-b64' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                                {copiedKey === 'hmac-b64' ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی' : 'Copy')}
                                            </button>
                                        </div>
                                        <div dir="ltr" className="font-mono text-xs font-bold text-text break-all select-all">
                                            {hmacResult.base64}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {mode === 'verify' && (
                        <Card className="p-5 bg-surface border-border shadow-xs space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text mb-2">
                                    {t.verifyInputLabel}
                                </label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    value={expectedChecksum}
                                    onChange={(e) => setExpectedChecksum(e.target.value)}
                                    placeholder={t.verifyPlaceholder}
                                    className="w-full rounded-xl border border-border-strong bg-surface px-4 py-3 font-mono text-xs text-text focus:outline-none focus:ring-2 focus:ring-focus"
                                />
                            </div>

                            {/* Verification Banner */}
                            {verification && (
                                <div className="animate-in fade-in">
                                    {verification.matched ? (
                                        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success-soft p-4 text-success">
                                            <CheckCircle2 className="h-6 w-6 shrink-0" />
                                            <div>
                                                <strong className="block text-sm font-bold">{t.verifyMatchTitle}</strong>
                                                <span className="text-xs text-text">
                                                    {isFa
                                                        ? `چک‌سام واردشده دقیقاً با الگوریتم ${verification.matchedAlgorithm} ورودی مطابقت دارد.`
                                                        : `Expected checksum exactly matches the computed ${verification.matchedAlgorithm} hash.`}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-danger">
                                            <AlertCircle className="h-6 w-6 shrink-0" />
                                            <div>
                                                <strong className="block text-sm font-bold">{t.verifyMismatchTitle}</strong>
                                                <span className="text-xs text-text">
                                                    {isFa
                                                        ? 'رشته چک‌سام با هیچ‌کدام از هش‌های ورودی همخوانی ندارد. ممکن است فایل دستکاری شده یا ناقص دانلود شده باشد.'
                                                        : 'Expected hash does not match any computed algorithm. The data may be corrupted or altered.'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-text">
                                        {isFa ? 'ورودی متن جهت اعتبارسنجی' : 'Input to Verify Against'}
                                    </label>
                                </div>
                                <textarea
                                    rows={2}
                                    dir="ltr"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    className="w-full rounded-xl border border-border-strong bg-surface-inset p-3 font-mono text-xs text-text focus:outline-none focus:ring-2 focus:ring-focus resize-none"
                                />
                            </div>
                        </Card>
                    )}

                    {/* Multi-Hash Dashboard Matrix (Shown in Text, File, and Verify modes) */}
                    {mode !== 'hmac' && hashes.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                                    <Fingerprint className="h-4 w-4 text-action" />
                                    {isFa ? 'نتایج جامع محاسبات هش' : 'Computed Hash Matrix'}
                                    {calcDurationMs > 0 && (
                                        <span className="text-[11px] text-text-subtle font-mono">
                                            ({calcDurationMs}ms)
                                        </span>
                                    )}
                                </h3>
                                <span className="text-xs text-text-muted">
                                    {hashes.length} {isFa ? 'الگوریتم استاندارد' : 'algorithms'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {hashes.map((item) => {
                                    const displayHex = isUppercase ? item.hex.toUpperCase() : item.hex;
                                    const isMatched = verification?.matched && verification.matchedAlgorithm === item.algorithm;

                                    return (
                                        <Card
                                            key={item.algorithm}
                                            className={`p-4 transition-all ${
                                                isMatched
                                                    ? 'border-success bg-success-soft/30 ring-2 ring-success shadow-md'
                                                    : 'bg-surface border-border hover:border-border-strong'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-text font-mono">
                                                        {item.algorithm}
                                                    </span>
                                                    <Badge className="bg-surface-inset text-text-muted text-[10px] px-1.5 py-0 border-border">
                                                        {item.bitLength} bit
                                                    </Badge>
                                                    {item.isSecure ? (
                                                        <Badge className="bg-success-soft text-success border-success/20 text-[10px] px-1.5 py-0 font-medium">
                                                            {isFa ? 'امن' : 'Secure'}
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-surface-inset text-text-subtle border-border text-[10px] px-1.5 py-0">
                                                            {isFa ? 'چک‌سام' : 'Checksum'}
                                                        </Badge>
                                                    )}
                                                    {isMatched && (
                                                        <Badge className="bg-success text-white text-[10px] px-2 py-0 font-bold animate-pulse">
                                                            ✓ MATCHED
                                                        </Badge>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(displayHex, item.algorithm)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-action hover:underline"
                                                >
                                                    {copiedKey === item.algorithm ? (
                                                        <Check className="h-3.5 w-3.5 text-success" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                    {copiedKey === item.algorithm ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی هش' : 'Copy')}
                                                </button>
                                            </div>

                                            {/* Hash Hex String */}
                                            <div
                                                dir="ltr"
                                                onClick={() => handleCopy(displayHex, item.algorithm)}
                                                className="cursor-pointer rounded-lg bg-surface-inset p-2.5 font-mono text-xs text-text break-all select-all hover:bg-action-soft/40 transition-colors"
                                            >
                                                {displayHex}
                                            </div>

                                            {/* Optional Base64 */}
                                            {showBase64 && item.base64 && (
                                                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-muted">
                                                    <span className="shrink-0 me-2">Base64:</span>
                                                    <span dir="ltr" className="truncate select-all text-text">
                                                        {item.base64}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(item.base64!, `${item.algorithm}-b64`)}
                                                        className="text-action ms-2 hover:underline shrink-0"
                                                    >
                                                        {copiedKey === `${item.algorithm}-b64` ? '✓' : (isFa ? 'کپی' : 'Copy')}
                                                    </button>
                                                </div>
                                            )}

                                            <div className="mt-2 text-[11px] text-text-subtle">
                                                {item.description}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
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
