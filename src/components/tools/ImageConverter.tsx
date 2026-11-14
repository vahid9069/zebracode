'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import {
    Archive,
    ArrowLeftRight,
    ArrowRight,
    Check,
    ChevronDown,
    Clipboard,
    Copy,
    Download,
    Eye,
    FileImage,
    FlipHorizontal,
    FlipVertical,
    HelpCircle,
    Image as ImageIcon,
    Layers,
    Lock,
    Maximize2,
    Palette,
    RefreshCw,
    RotateCcw,
    RotateCw,
    Sliders,
    Sparkles,
    Trash2,
    UploadCloud,
    Wand2,
    X,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
    ConverterFileItem,
    ConverterTransformOptions,
    TargetImageFormat,
} from '@/lib/image-converter/types';
import {
    convertImage,
    copyConvertedImageToClipboard,
    createConvertedZipBundle,
    createConverterSample,
    DEFAULT_CONVERTER_OPTIONS,
    downloadConvertedBlob,
    formatBytes,
    getConverterImageMetadata,
    getFormatExtension,
    SUPPORTED_TARGET_FORMATS,
} from '@/lib/image-converter/converter';

interface ImageConverterProps {
    locale?: 'fa' | 'en';
    dict?: any;
}

export default function ImageConverter({ locale = 'fa', dict }: ImageConverterProps) {
    const isFa = locale === 'fa';

    // State: Global Conversion Options
    const [options, setOptions] = useState<ConverterTransformOptions>(DEFAULT_CONVERTER_OPTIONS);
    const [selectedIcoSizes, setSelectedIcoSizes] = useState<number[]>([16, 32, 48, 64]);

    // State: Items in Queue
    const [items, setItems] = useState<ConverterFileItem[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);

    // State: Inspect / Preview Modal
    const [previewingItemId, setPreviewingItemId] = useState<string | null>(null);

    // Toast
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    // Localized Text Strings
    const t = useMemo(() => {
        return {
            title: isFa ? 'مبدل فرمت تصاویر آنلاین (Image Converter)' : 'Online Image Converter & Transformer',
            badgePrivate: isFa ? '۱۰۰٪ محلی و امن در مرورگر' : '100% Local & Private in Browser',
            badgeOffline: isFa ? 'بدون ارسال به سرور' : 'Zero Server Uploads',
            subtitle: isFa
                ? 'تبدیل سریع و باکیفیت تمامی فرمت‌های تصویری (PNG, JPG, WebP, AVIF, SVG, ICO, BMP) به یکدیگر با امکان تغییر سایز، چرخش و ساخت آیکون Favicon'
                : 'Convert any image format (PNG, JPG, WebP, AVIF, SVG, ICO, BMP) with zero quality loss, SVG rasterization, rotation, and Favicon generation.',
            dropTitle: isFa ? 'تصاویر یا فایل‌های SVG را اینجا رها کنید' : 'Drag & Drop images or SVG files here',
            dropSubtitle: isFa
                ? 'یا کلیک کنید برای انتخاب فایل‌ها · پشتیبانی از JPG, PNG, WebP, AVIF, SVG, GIF, BMP'
                : 'or click to browse · Supports JPG, PNG, WebP, AVIF, SVG, GIF, BMP',
            pasteHint: isFa
                ? 'می‌توانید عکس را مستقیماً با کلیدهای Ctrl+V پیست کنید'
                : 'You can paste images directly from clipboard with Ctrl+V',
            btnBrowse: isFa ? 'انتخاب تصاویر' : 'Browse Files',
            btnPaste: isFa ? 'پیست از کلیپ‌بورد' : 'Paste from Clipboard',
            sampleSvg: isFa ? 'نمونه لوگوی SVG وکتور' : 'Sample SVG Vector Logo',
            samplePhoto: isFa ? 'نمونه عکس JPG' : 'Sample JPG Photo',
            sampleBadge: isFa ? 'نمونه آیکون شفاف PNG' : 'Sample Transparent PNG',
            quickPresets: isFa ? 'تبدیل‌های سریع محبوب:' : 'Popular Quick Conversions:',
            presetToWebp: isFa ? 'تبدیل به WebP' : 'Convert to WebP',
            presetToPng: isFa ? 'تبدیل به PNG' : 'Convert to PNG',
            presetToJpg: isFa ? 'تبدیل به JPG' : 'Convert to JPG',
            presetToIco: isFa ? 'ساخت فاوآیکون (ICO)' : 'Create Favicon (.ICO)',
            presetToAvif: isFa ? 'تبدیل به AVIF' : 'Convert to AVIF',
            settingsTitle: isFa ? 'تنظیمات تبدیل و ویرایش' : 'Conversion & Transform Settings',
            targetFormatLabel: isFa ? 'فرمت خروجی هدف' : 'Target Output Format',
            qualityLabel: isFa ? 'کیفیت خروجی (فرمت‌های فشرده)' : 'Output Quality',
            scaleLabel: isFa ? 'ضریب ابعاد و رزولوشن (مناسب SVG)' : 'Scale Multiplier (Retina / SVG)',
            scale1x: '1x (عادی / Standard)',
            scale2x: '2x (کیفیت بالا / Retina)',
            scale4x: '4x (فوق‌العاده / Ultra HD)',
            transformTools: isFa ? 'چرخش و معکوس‌سازی' : 'Rotation & Flips',
            filterGrayscale: isFa ? 'سیاه‌وسفید (Grayscale)' : 'Black & White (Grayscale)',
            bgFillLabel: isFa ? 'رنگ زمینه برای بخش‌های شفاف (تبدیل به JPG/BMP)' : 'Background color for transparency (in JPG/BMP)',
            icoSizesLabel: isFa ? 'اندازه‌های بسته‌ی Favicon (.ICO)' : 'Favicon Icon Sizes (.ICO)',
            queueTitle: isFa ? 'صف تبدیل تصاویر' : 'Conversion Queue',
            btnClearAll: isFa ? 'پاک‌سازی همه' : 'Clear All',
            btnDownloadZip: isFa ? 'دانلود همه در فایل ZIP' : 'Download All as ZIP',
            btnReconvertAll: isFa ? 'تبدیل مجدد همه' : 'Re-convert All',
            btnDownload: isFa ? 'دانلود' : 'Download',
            btnCopy: isFa ? 'کپی در کلیپ‌بورد' : 'Copy to Clipboard',
            btnPreview: isFa ? 'مشاهده و بررسی' : 'Preview',
            btnRemove: isFa ? 'حذف' : 'Remove',
            totalOriginal: isFa ? 'حجم اولیه کل' : 'Total Original',
            totalConverted: isFa ? 'حجم نهایی کل' : 'Total Converted',
            statusConverting: isFa ? 'در حال تبدیل...' : 'Converting...',
            statusDone: isFa ? 'تبدیل شد' : 'Converted',
            copiedSuccess: isFa ? 'تصویر با موفقیت در کلیپ‌بورد کپی شد!' : 'Image copied to clipboard!',
            zipCreated: isFa ? 'فایل فشرده ZIP آماده دانلود شد!' : 'ZIP archive ready for download!',
            close: isFa ? 'بستن' : 'Close',
            featuresTitle: isFa ? 'چرا مبدل تصویر زبراکد قدرتمندترین ابزار است؟' : 'Why ZebraCode Image Converter Stands Out?',
            features: [
                {
                    title: isFa ? 'تبدیل وکتور SVG به تصویر با کیفیت دلخواه' : 'High-DPI SVG Vector Rasterization',
                    desc: isFa ? 'لوگوها و آیکون‌های SVG را بدون کوچک‌ترین تارشدگی با ضریب ۲ یا ۴ برابر (Retina) به PNG یا WebP تبدیل کنید.' : 'Rasterize vector SVGs at 1x, 2x, or 4x scale without any pixelation.',
                    icon: '📐',
                },
                {
                    title: isFa ? 'تولید حرفه‌ای آیکون فاوآیکون (.ICO)' : 'True Windows & Web Favicon (.ICO)',
                    desc: isFa ? 'تبدیل هر تصویری به فایل چنداندازه‌ای استاندارد ICO (۱۶، ۳۲، ۴۸، ۶۴) برای تب مرورگر و برنامه‌ها.' : 'Generate multi-resolution valid .ico files for browser tabs and apps.',
                    icon: '✨',
                },
                {
                    title: isFa ? '۱۰۰٪ امنیت و حریم خصوصی کلاینت‌ساید' : '100% Client-Side Privacy',
                    desc: isFa ? 'فایل‌های شما هرگز در اینترنت آپلود نمی‌شوند. تمامی پردازش‌ها کاملاً درون مرورگر انجام می‌پذیرد.' : 'Files never leave your machine. Zero server upload and fully offline.',
                    icon: '🔒',
                },
                {
                    title: isFa ? 'چرخش، معکوس‌سازی و فیلتر سیاه‌وسفید' : 'Rotate, Flip & Grayscale Filters',
                    desc: isFa ? 'امکان چرخش ۹۰ یا ۱۸۰ درجه، آینه‌ای کردن افقی/عمودی و تبدیل به تصویر سیاه و سفید با یک کلیک.' : 'Rotate 90°/180°, flip horizontally/vertically, and apply monochrome filters.',
                    icon: '🔄',
                },
                {
                    title: isFa ? 'دانلود گروهی در قالب فایل ZIP' : 'Batch Conversion to ZIP',
                    desc: isFa ? 'ده‌ها تصویر را همزمان به فرمت‌های دلخواه تبدیل کرده و همگی را یک‌جا با یک کلیک در ZIP دریافت کنید.' : 'Batch convert dozens of images and download all outputs in a single ZIP.',
                    icon: '📦',
                },
                {
                    title: isFa ? 'کپی مستقیم در کلیپ‌بورد سیستم' : 'Direct Clipboard Copy',
                    desc: isFa ? 'خروجی تبدیل‌شده را مستقیماً کپی کرده و بدون ذخیره در هارد، در فتوشاپ، فیگما یا چت پیست کنید.' : 'Copy converted output directly to paste into Figma, Photoshop, or messaging.',
                    icon: '📋',
                },
            ],
            faqTitle: isFa ? 'پرسش‌های متداول درباره تبدیل فرمت تصاویر' : 'Frequently Asked Questions About Image Conversion',
            faq: [
                {
                    q: isFa ? 'چه تفاوتی بین فرمت‌های WebP و PNG و JPEG وجود دارد؟' : 'What is the difference between WebP, PNG, and JPEG?',
                    a: isFa
                        ? 'فرمت PNG بدون افت کیفیت (Lossless) بوده و از شفافیت پس‌زمینه پشتیبانی می‌کند اما حجم بالاتری دارد. JPEG برای عکس‌ها سازگاری عمومی دارد ولی شفافیت ندارد. WebP مدرن‌ترین فرمت استاندارد است که هم شفافیت دارد و هم حجم آن حدود ۳۰ تا ۵۰ درصد کمتر از JPEG و PNG است.'
                        : 'PNG is lossless and supports transparency, making it great for logos. JPEG offers universal compatibility for photographs but lacks alpha transparency. WebP gives you the best of both worlds: full transparency and 30–50% smaller sizes than JPEG and PNG.',
                },
                {
                    q: isFa ? 'چگونه فایل SVG را به PNG با کیفیت بالا (بدون تار شدن) تبدیل کنم؟' : 'How can I convert an SVG to a sharp, high-resolution PNG?',
                    a: isFa
                        ? 'فایل‌های SVG برداری هستند. در بخش تنظیمات ابزار، گزینه «ضریب ابعاد (Scale)» را روی 2x یا 4x بگذارید تا تصویر SVG با رزولوشن فوق‌العاده بالا و بدون هرگونه افت کیفیتی به PNG تبدیل شود.'
                        : 'SVGs are vector based. In our settings panel, select a 2x (Retina) or 4x (Ultra HD) scale multiplier before converting to rasterize your vector graphic into an ultra-sharp PNG.',
                },
                {
                    q: isFa ? 'چگونه یک فاوآیکون (Favicon.ico) استاندارد برای سایتم بسازم؟' : 'How do I generate a standard favicon (.ico) for my website?',
                    a: isFa
                        ? 'کافی است لوگو یا آیکون خود را آپلود کرده، فرمت خروجی را روی ICO (Favicon) بگذارید. ابزار به صورت خودکار اندازه‌های استاندارد ۱۶×۱۶، ۳۲×۳۲، ۴۸×۴۸ و ۶۴×۶۴ را درون یک فایل استاندارد favicon.ico ادغام می‌کند.'
                        : 'Simply upload your logo or icon and select ICO (Favicon) as the target format. Our engine bundles standard sizes (16x16, 32x32, 48x48, 64x64) into a single valid favicon.ico file ready for production.',
                },
                {
                    q: isFa ? 'آیا تصاویر آپلود شده به سروری ارسال می‌شوند؟' : 'Are my uploaded images sent to any server?',
                    a: isFa
                        ? 'خیر! تمامی مراحل تبدیل و پردازش به صورت ۱۰۰٪ محلی درون مرورگر شما با وب‌کدها انجام می‌شود. اطلاعات شما به هیچ وجه از دستگاهتان خارج نمی‌شود.'
                        : 'No. All conversion operations execute 100% locally in your client browser via HTML5 Canvas and Web APIs. Your images remain completely private.',
                },
            ],
        };
    }, [isFa]);

    // Single item conversion runner
    const runItemConversion = useCallback(
        async (item: ConverterFileItem, currentOptions: ConverterTransformOptions): Promise<ConverterFileItem> => {
            try {
                const effectiveOpts: ConverterTransformOptions = {
                    ...currentOptions,
                    ...(item.customOptions || {}),
                };

                const res = await convertImage(item.file, effectiveOpts);

                return {
                    ...item,
                    status: 'done',
                    convertedBlob: res.blob,
                    convertedSize: res.size,
                    convertedWidth: res.width,
                    convertedHeight: res.height,
                    convertedFormat: res.format,
                    convertedPreviewUrl: res.previewUrl,
                    processingTimeMs: res.durationMs,
                };
            } catch (err: any) {
                return {
                    ...item,
                    status: 'error',
                    errorMessage: err?.message || 'Conversion error',
                };
            }
        },
        []
    );

    // Process new uploaded files
    const handleFiles = useCallback(
        async (files: FileList | File[]) => {
            const fileList = Array.from(files).filter(
                (f) => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.svg')
            );
            if (fileList.length === 0) return;

            setIsProcessingBatch(true);
            const newItems: ConverterFileItem[] = [];

            for (const file of fileList) {
                const meta = await getConverterImageMetadata(file);
                const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                const rawItem: ConverterFileItem = {
                    id,
                    file,
                    name: file.name,
                    originalSize: file.size,
                    originalWidth: meta.width,
                    originalHeight: meta.height,
                    originalType: file.type || (meta.isSvg ? 'image/svg+xml' : 'image/png'),
                    originalPreviewUrl: meta.url,
                    isSvg: meta.isSvg,
                    status: 'converting',
                };

                newItems.push(rawItem);
            }

            setItems((prev) => [...prev, ...newItems]);

            const currentOptions: ConverterTransformOptions = {
                ...options,
                icoSizes: selectedIcoSizes,
            };

            const processed = await Promise.all(
                newItems.map((item) => runItemConversion(item, currentOptions))
            );

            setItems((prev) =>
                prev.map((existing) => {
                    const match = processed.find((p) => p.id === existing.id);
                    return match || existing;
                })
            );

            setIsProcessingBatch(false);
        },
        [options, runItemConversion, selectedIcoSizes]
    );

    // Re-run conversion across all queue items
    const reConvertAll = useCallback(
        async (customOpts?: ConverterTransformOptions) => {
            if (items.length === 0) return;
            setIsProcessingBatch(true);

            const activeOpts = customOpts || {
                ...options,
                icoSizes: selectedIcoSizes,
            };

            setItems((prev) => prev.map((i) => ({ ...i, status: 'converting' })));
            const updated = await Promise.all(items.map((item) => runItemConversion(item, activeOpts)));
            setItems(updated);
            setIsProcessingBatch(false);
        },
        [items, options, runItemConversion, selectedIcoSizes]
    );

    // Format selection
    const handleFormatChange = (fmt: TargetImageFormat) => {
        const updated: ConverterTransformOptions = {
            ...options,
            targetFormat: fmt,
        };
        setOptions(updated);
        reConvertAll(updated);
    };

    // Quick presets
    const applyQuickPreset = (fmt: TargetImageFormat, scale = 1) => {
        const updated: ConverterTransformOptions = {
            ...options,
            targetFormat: fmt,
            scaleMultiplier: scale,
        };
        setOptions(updated);
        reConvertAll(updated);
    };

    // Rotation triggers
    const handleRotate = (deg: 90 | -90) => {
        const current = options.rotationAngle;
        let nextAngle = (current + deg) % 360;
        if (nextAngle < 0) nextAngle += 360;
        const validAngle = (nextAngle === 90 || nextAngle === 180 || nextAngle === 270 ? nextAngle : 0) as 0 | 90 | 180 | 270;

        const updated: ConverterTransformOptions = {
            ...options,
            rotationAngle: validAngle,
        };
        setOptions(updated);
        reConvertAll(updated);
    };

    // Flip triggers
    const handleToggleFlip = (axis: 'h' | 'v') => {
        const updated: ConverterTransformOptions = {
            ...options,
            flipHorizontal: axis === 'h' ? !options.flipHorizontal : options.flipHorizontal,
            flipVertical: axis === 'v' ? !options.flipVertical : options.flipVertical,
        };
        setOptions(updated);
        reConvertAll(updated);
    };

    // Toggle grayscale
    const handleToggleGrayscale = () => {
        const updated: ConverterTransformOptions = {
            ...options,
            grayscale: !options.grayscale,
        };
        setOptions(updated);
        reConvertAll(updated);
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    // Clipboard Paste Listener (Ctrl+V)
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
                const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
                if (files.length > 0) {
                    e.preventDefault();
                    handleFiles(files);
                    showToast(isFa ? 'تصویر پیست‌شده دریافت شد' : 'Pasted image received');
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleFiles, isFa, showToast]);

    // Single item download
    const handleDownloadSingle = (item: ConverterFileItem) => {
        if (!item.convertedBlob || !item.convertedFormat) return;
        const base = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const ext = getFormatExtension(item.convertedFormat);
        downloadConvertedBlob(item.convertedBlob, `${base}.${ext}`);
    };

    // Copy to clipboard
    const handleCopySingle = async (item: ConverterFileItem) => {
        if (!item.convertedBlob) return;
        try {
            await copyConvertedImageToClipboard(item.convertedBlob);
            showToast(t.copiedSuccess);
        } catch {
            showToast(isFa ? 'مرورگر شما از کپی مستقیم تصویر پشتیبانی نمی‌کند' : 'Clipboard image copy not supported');
        }
    };

    // Download All as ZIP
    const handleDownloadZip = async () => {
        const doneItems = items.filter((i) => i.status === 'done' && i.convertedBlob);
        if (doneItems.length === 0) return;
        showToast(isFa ? 'در حال ایجاد فایل ZIP...' : 'Generating ZIP...');
        const zipBlob = await createConvertedZipBundle(doneItems);
        downloadConvertedBlob(zipBlob, 'zebracode-converted-images.zip');
        showToast(t.zipCreated);
    };

    // Remove single item
    const handleRemoveItem = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
        if (previewingItemId === id) setPreviewingItemId(null);
    };

    // Clear all items
    const handleClearAll = () => {
        setItems([]);
        setPreviewingItemId(null);
    };

    // Load sample
    const handleLoadSample = async (type: 'svg' | 'photo' | 'icon') => {
        const sampleFile = await createConverterSample(type);
        handleFiles([sampleFile]);
    };

    // Total stats
    const stats = useMemo(() => {
        const done = items.filter((i) => i.status === 'done' && i.convertedSize);
        const origTotal = done.reduce((a, b) => a + b.originalSize, 0);
        const convTotal = done.reduce((a, b) => a + (b.convertedSize || 0), 0);
        return {
            totalCount: items.length,
            doneCount: done.length,
            origTotal,
            convTotal,
        };
    }, [items]);

    const activePreviewItem = useMemo(() => {
        return items.find((i) => i.id === previewingItemId) || null;
    }, [items, previewingItemId]);

    return (
        <div className="relative min-h-screen bg-canvas text-text pb-20 selection:bg-action selection:text-action-foreground" dir={isFa ? 'rtl' : 'ltr'}>
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform rounded-full bg-text px-5 py-2.5 text-sm font-medium text-surface shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4">
                    {toastMessage}
                </div>
            )}

            {/* Hidden native input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.svg"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                    e.target.value = '';
                }}
            />

            <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
                    <div>
                        <div className="inline-flex items-center gap-2 mb-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-action-soft text-action">
                                <ArrowLeftRight className="h-5 w-5" />
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

                    {/* Quick Demo Sample Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadSample('svg')}
                            className="text-xs gap-1.5"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-action" />
                            {t.sampleSvg}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadSample('photo')}
                            className="text-xs gap-1.5"
                        >
                            <FileImage className="h-3.5 w-3.5 text-action" />
                            {t.samplePhoto}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadSample('icon')}
                            className="text-xs gap-1.5"
                        >
                            <Layers className="h-3.5 w-3.5 text-action" />
                            {t.sampleBadge}
                        </Button>
                    </div>
                </header>

                {/* Quick Presets Pills Bar */}
                <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-text-muted me-1">{t.quickPresets}</span>
                    <button
                        type="button"
                        onClick={() => applyQuickPreset('webp')}
                        className="rounded-full border border-border bg-surface px-3 py-1 font-medium hover:border-action hover:text-action transition-colors shadow-2xs"
                    >
                        {t.presetToWebp}
                    </button>
                    <button
                        type="button"
                        onClick={() => applyQuickPreset('png')}
                        className="rounded-full border border-border bg-surface px-3 py-1 font-medium hover:border-action hover:text-action transition-colors shadow-2xs"
                    >
                        {t.presetToPng}
                    </button>
                    <button
                        type="button"
                        onClick={() => applyQuickPreset('jpeg')}
                        className="rounded-full border border-border bg-surface px-3 py-1 font-medium hover:border-action hover:text-action transition-colors shadow-2xs"
                    >
                        {t.presetToJpg}
                    </button>
                    <button
                        type="button"
                        onClick={() => applyQuickPreset('ico')}
                        className="rounded-full border border-action/40 bg-action-soft text-action px-3 py-1 font-semibold hover:bg-action hover:text-action-foreground transition-all shadow-2xs"
                    >
                        {t.presetToIco}
                    </button>
                    <button
                        type="button"
                        onClick={() => applyQuickPreset('png', 2)}
                        className="rounded-full border border-border bg-surface px-3 py-1 font-medium hover:border-action hover:text-action transition-colors shadow-2xs"
                    >
                        SVG → PNG (2x Retina)
                    </button>
                    <button
                        type="button"
                        onClick={() => applyQuickPreset('avif')}
                        className="rounded-full border border-border bg-surface px-3 py-1 font-medium hover:border-action hover:text-action transition-colors shadow-2xs"
                    >
                        {t.presetToAvif}
                    </button>
                </div>

                {/* Drag-and-drop & Upload Area */}
                <section
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                        isDragging
                            ? 'border-action bg-action-soft/30 scale-[1.01]'
                            : 'border-border-strong hover:border-action hover:bg-surface-inset/60 bg-surface'
                    }`}
                >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-action-soft text-action mb-4 transition-transform group-hover:scale-110">
                        <UploadCloud className="h-7 w-7" />
                    </div>
                    <h2 className="text-lg font-bold text-text mb-1">
                        {t.dropTitle}
                    </h2>
                    <p className="text-sm text-text-muted mb-4 max-w-md mx-auto">
                        {t.dropSubtitle}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            className="gap-2 shadow-sm"
                        >
                            <FileImage className="h-4 w-4" />
                            {t.btnBrowse}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    const clipboardItems = await navigator.clipboard.read();
                                    for (const clipItem of clipboardItems) {
                                        for (const type of clipItem.types) {
                                            if (type.startsWith('image/')) {
                                                const blob = await clipItem.getType(type);
                                                const file = new File([blob], `clipboard-${Date.now()}.png`, { type });
                                                handleFiles([file]);
                                                showToast(isFa ? 'تصویر از کلیپ‌بورد بارگذاری شد' : 'Image loaded from clipboard');
                                                return;
                                            }
                                        }
                                    }
                                    showToast(isFa ? 'هیچ تصویری در کلیپ‌بورد یافت نشد' : 'No image found in clipboard');
                                } catch {
                                    showToast(isFa ? 'دسترسی کلیپ‌بورد در مرورگر مسدود است، لطفاً از Ctrl+V استفاده کنید' : 'Clipboard access denied, press Ctrl+V directly');
                                }
                            }}
                            className="gap-2"
                        >
                            <Clipboard className="h-4 w-4" />
                            {t.btnPaste}
                        </Button>
                    </div>
                    <div className="mt-4 text-xs text-text-subtle">
                        {t.pasteHint}
                    </div>
                </section>

                {/* Global Settings & Transformation Panel */}
                <Card className="mt-6 p-5 bg-surface border-border shadow-xs">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                        <div className="flex items-center gap-2">
                            <Sliders className="h-4 w-4 text-action" />
                            <h3 className="text-sm font-bold text-text">{t.settingsTitle}</h3>
                        </div>
                        {items.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => reConvertAll()}
                                disabled={isProcessingBatch}
                                className="text-xs gap-1.5 h-8 text-action hover:text-action-hover hover:bg-action-soft"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
                                {t.btnReconvertAll}
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* 1. Target Format Selection */}
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-2">
                                {t.targetFormatLabel}
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {SUPPORTED_TARGET_FORMATS.map((fmt) => (
                                    <button
                                        key={fmt.id}
                                        type="button"
                                        onClick={() => handleFormatChange(fmt.id)}
                                        className={`px-2.5 py-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                                            options.targetFormat === fmt.id
                                                ? 'bg-action text-action-foreground border-action shadow-xs'
                                                : 'border-border bg-surface-inset hover:bg-action-soft hover:text-action text-text'
                                        }`}
                                    >
                                        {fmt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Format Specific Options (Quality or Favicon sizes) */}
                        <div>
                            {options.targetFormat === 'ico' ? (
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-2">
                                        {t.icoSizesLabel}
                                    </label>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {[16, 32, 48, 64].map((size) => {
                                            const active = selectedIcoSizes.includes(size);
                                            return (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => {
                                                        const next = active
                                                            ? selectedIcoSizes.filter((s) => s !== size)
                                                            : [...selectedIcoSizes, size];
                                                        setSelectedIcoSizes(next.length > 0 ? next : [32]);
                                                        reConvertAll({ ...options, icoSizes: next.length > 0 ? next : [32] });
                                                    }}
                                                    className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${
                                                        active
                                                            ? 'bg-action text-action-foreground border-action'
                                                            : 'bg-surface-inset text-text-muted border-border'
                                                    }`}
                                                >
                                                    {size}×{size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-2 text-[11px] text-text-subtle">
                                        {isFa ? 'آیکون چنداندازه‌ای سازگار با همه مرورگرها' : 'Multi-size icon package for all browsers'}
                                    </p>
                                </div>
                            ) : options.targetFormat === 'png' || options.targetFormat === 'bmp' ? (
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-2">
                                        {isFa ? 'ویژگی‌های فرمت' : 'Format Features'}
                                    </label>
                                    <div className="rounded-lg bg-surface-inset p-3 text-xs text-text-muted">
                                        <p className="font-semibold text-text mb-1">
                                            {options.targetFormat === 'png' ? 'PNG (Lossless)' : 'BMP (Bitmap)'}
                                        </p>
                                        <p className="text-[11px] leading-relaxed">
                                            {options.targetFormat === 'png'
                                                ? isFa
                                                    ? 'بدون افت کیفیت با پشتیبانی کامل از شفافیت (Alpha Channel).'
                                                    : 'Lossless compression preserving 100% pixel fidelity with alpha transparency.'
                                                : isFa
                                                    ? 'فرمت سنتی و بدون فشرده‌سازی بیت‌مپ.'
                                                    : 'Uncompressed raster bitmap graphic format.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold text-text-muted">
                                            {t.qualityLabel}
                                        </label>
                                        <span className="text-xs font-bold text-action">
                                            {Math.round(options.quality * 100)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={10}
                                        max={100}
                                        value={Math.round(options.quality * 100)}
                                        onChange={(e) => {
                                            const val = Number(e.target.value) / 100;
                                            setOptions({ ...options, quality: val });
                                        }}
                                        onMouseUp={() => reConvertAll()}
                                        onTouchEnd={() => reConvertAll()}
                                        className="w-full accent-action cursor-pointer h-1.5 bg-surface-inset rounded-lg"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-subtle mt-1">
                                        <span>{isFa ? 'فشرده‌تر' : 'Higher compression'}</span>
                                        <span>{isFa ? 'حداکثر شفافیت' : 'Maximum fidelity'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Scale Multiplier (SVG / Retina scaling) */}
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-2">
                                {t.scaleLabel}
                            </label>
                            <select
                                value={options.scaleMultiplier}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const updated = { ...options, scaleMultiplier: val };
                                    setOptions(updated);
                                    reConvertAll(updated);
                                }}
                                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-focus"
                            >
                                <option value={1}>{t.scale1x}</option>
                                <option value={1.5}>1.5x (مقیاس ۱.۵ برابر)</option>
                                <option value={2}>{t.scale2x}</option>
                                <option value={3}>3x (کیفیت بسیار بالا)</option>
                                <option value={4}>{t.scale4x}</option>
                            </select>

                            {(options.targetFormat === 'jpeg' || options.targetFormat === 'bmp') && (
                                <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                                    <span className="truncate">{t.bgFillLabel}:</span>
                                    <input
                                        type="color"
                                        value={options.backgroundColor || '#ffffff'}
                                        onChange={(e) => {
                                            const updated = { ...options, backgroundColor: e.target.value };
                                            setOptions(updated);
                                            reConvertAll(updated);
                                        }}
                                        className="h-6 w-8 shrink-0 rounded border border-border cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 4. Transform & Filters (Rotate, Flip, Grayscale) */}
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-2">
                                {t.transformTools}
                            </label>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRotate(-90)}
                                    className="h-9 px-2.5 text-xs gap-1"
                                    title="چرخش ۹۰ درجه خلاف عقربه‌های ساعت"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    -90°
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRotate(90)}
                                    className="h-9 px-2.5 text-xs gap-1"
                                    title="چرخش ۹۰ درجه در جهت عقربه‌های ساعت"
                                >
                                    <RotateCw className="h-3.5 w-3.5" />
                                    +90°
                                </Button>
                                <Button
                                    variant={options.flipHorizontal ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleToggleFlip('h')}
                                    className="h-9 px-2 text-xs"
                                    title="معکوس‌سازی افقی"
                                >
                                    <FlipHorizontal className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant={options.flipVertical ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleToggleFlip('v')}
                                    className="h-9 px-2 text-xs"
                                    title="معکوس‌سازی عمودی"
                                >
                                    <FlipVertical className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <div className="mt-3">
                                <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={options.grayscale}
                                        onChange={handleToggleGrayscale}
                                        className="h-3.5 w-3.5 rounded border-border-strong text-action focus:ring-focus"
                                    />
                                    <span>{t.filterGrayscale}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Queue & Items List */}
                {items.length > 0 && (
                    <div className="mt-8 space-y-4">
                        {/* Summary Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                                <div>
                                    <span className="text-text-muted block text-xs">{t.totalOriginal}:</span>
                                    <strong className="font-bold text-text">{formatBytes(stats.origTotal, locale)}</strong>
                                </div>
                                <div className="border-r border-border h-6 hidden sm:block" />
                                <div>
                                    <span className="text-text-muted block text-xs">{t.totalConverted}:</span>
                                    <strong className="font-bold text-text">{formatBytes(stats.convTotal, locale)}</strong>
                                </div>
                                <div className="border-r border-border h-6 hidden sm:block" />
                                <div>
                                    <span className="text-text-muted block text-xs">{isFa ? 'تعداد فایل‌ها' : 'Files Count'}:</span>
                                    <span className="font-bold text-action">
                                        {stats.doneCount} / {stats.totalCount}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAll}
                                    className="text-xs text-danger hover:bg-danger-soft hover:text-danger gap-1.5"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t.btnClearAll}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleDownloadZip}
                                    disabled={stats.doneCount === 0}
                                    className="text-xs gap-1.5"
                                >
                                    <Archive className="h-3.5 w-3.5" />
                                    {t.btnDownloadZip}
                                </Button>
                            </div>
                        </div>

                        {/* Items Grid */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {items.map((item) => {
                                const origExt = item.name.split('.').pop()?.toUpperCase() || 'IMG';
                                const targetExt = item.convertedFormat ? item.convertedFormat.toUpperCase() : options.targetFormat.toUpperCase();

                                return (
                                    <Card
                                        key={item.id}
                                        className="relative overflow-hidden p-3 bg-surface hover:border-border-strong transition-all"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Thumbnail */}
                                            <div
                                                onClick={() => setPreviewingItemId(item.id)}
                                                className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-surface-inset border border-border flex items-center justify-center cursor-pointer group"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={item.convertedPreviewUrl || item.originalPreviewUrl}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                {item.status === 'converting' && (
                                                    <div className="absolute inset-0 bg-surface/70 backdrop-blur-xs flex items-center justify-center">
                                                        <RefreshCw className="h-4 w-4 text-action animate-spin" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <h4 className="text-xs font-bold text-text truncate" title={item.name}>
                                                        {item.name}
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="text-text-muted hover:text-danger p-0.5"
                                                        title={t.btnRemove}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted">
                                                    <Badge className="bg-surface-inset text-text-muted text-[10px] px-1 py-0 border-border">
                                                        {origExt}
                                                    </Badge>
                                                    <span>→</span>
                                                    <Badge className="bg-action-soft text-action text-[10px] px-1.5 py-0 border-action/20 font-bold">
                                                        {targetExt}
                                                    </Badge>
                                                    <span className="ms-auto font-semibold text-text text-xs">
                                                        {item.convertedSize ? formatBytes(item.convertedSize, locale) : '...'}
                                                    </span>
                                                </div>

                                                <div className="mt-1 text-[10px] text-text-subtle">
                                                    {item.convertedWidth && item.convertedHeight ? (
                                                        <span>
                                                            {item.convertedWidth}×{item.convertedHeight} px · {formatBytes(item.originalSize, locale)}
                                                        </span>
                                                    ) : (
                                                        <span>{item.originalWidth}×{item.originalHeight} px</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
                                            {/* Per item format override dropdown */}
                                            <select
                                                value={item.convertedFormat || options.targetFormat}
                                                onChange={async (e) => {
                                                    const newFmt = e.target.value as TargetImageFormat;
                                                    const updatedItem: ConverterFileItem = {
                                                        ...item,
                                                        status: 'converting',
                                                        customOptions: { ...(item.customOptions || {}), targetFormat: newFmt },
                                                    };
                                                    setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
                                                    const res = await runItemConversion(updatedItem, options);
                                                    setItems((prev) => prev.map((i) => (i.id === item.id ? res : i)));
                                                }}
                                                className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-text focus:outline-none"
                                            >
                                                {SUPPORTED_TARGET_FORMATS.map((fmt) => (
                                                    <option key={fmt.id} value={fmt.id}>
                                                        {fmt.label}
                                                    </option>
                                                ))}
                                            </select>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewingItemId(item.id)}
                                                    className="p-1 text-text-muted hover:text-action rounded hover:bg-action-soft"
                                                    title={t.btnPreview}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopySingle(item)}
                                                    className="p-1 text-text-muted hover:text-action rounded hover:bg-action-soft"
                                                    title={t.btnCopy}
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadSingle(item)}
                                                    className="p-1 text-text-muted hover:text-action rounded hover:bg-action-soft"
                                                    title={t.btnDownload}
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Single Image Preview Modal */}
                {activePreviewItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
                        <div className="relative max-h-[90vh] w-full max-w-2xl rounded-2xl bg-surface border border-border p-6 shadow-2xl flex flex-col">
                            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                                <h3 className="text-sm font-bold text-text truncate">
                                    {activePreviewItem.name} → {activePreviewItem.convertedFormat?.toUpperCase()}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setPreviewingItemId(null)}
                                    className="rounded-full p-1 text-text-muted hover:bg-surface-inset hover:text-text"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="relative flex-1 min-h-[300px] flex items-center justify-center overflow-hidden rounded-xl bg-surface-inset border border-border p-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={activePreviewItem.convertedPreviewUrl || activePreviewItem.originalPreviewUrl}
                                    alt="Converted Preview"
                                    className="max-h-[60vh] max-w-full object-contain"
                                />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
                                <div className="text-xs text-text-muted">
                                    <span>
                                        {activePreviewItem.convertedWidth} × {activePreviewItem.convertedHeight} px
                                    </span>
                                    <span className="mx-2">·</span>
                                    <strong>
                                        {activePreviewItem.convertedSize ? formatBytes(activePreviewItem.convertedSize, locale) : ''}
                                    </strong>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopySingle(activePreviewItem)}
                                        className="text-xs gap-1.5"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        {t.btnCopy}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleDownloadSingle(activePreviewItem)}
                                        className="text-xs gap-1.5"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        {t.btnDownload}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Features & Advantages Showcase */}
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

                {/* FAQ Accordion Section */}
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
