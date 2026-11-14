'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import {
    AlertCircle,
    Archive,
    ArrowDown,
    ArrowLeftRight,
    Check,
    ChevronDown,
    Clipboard,
    Copy,
    Download,
    Eye,
    FileImage,
    HelpCircle,
    Image as ImageIcon,
    Layers,
    Lock,
    Maximize2,
    Minimize2,
    RefreshCw,
    Sliders,
    Sparkles,
    Trash2,
    Unlock,
    UploadCloud,
    X,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
    CompressionPreset,
    CompressionSettings,
    ImageFileItem,
    ImageOutputFormat,
} from '@/lib/image-compressor/types';
import {
    calculateDimensions,
    compressImage,
    copyImageToClipboard,
    createSampleImage,
    createZipBundle,
    DEFAULT_COMPRESSION_SETTINGS,
    downloadBlob,
    formatBytes,
    formatSavingsPercent,
    getFileExtension,
    getImageMetadata,
} from '@/lib/image-compressor/compressor';

interface ImageCompressorProps {
    locale?: 'fa' | 'en';
    dict?: any;
}

export default function ImageCompressor({ locale = 'fa', dict }: ImageCompressorProps) {
    const isFa = locale === 'fa';

    // State: Settings
    const [settings, setSettings] = useState<CompressionSettings>(DEFAULT_COMPRESSION_SETTINGS);
    const [targetSizeKb, setTargetSizeKb] = useState<number>(250);
    const [customWidth, setCustomWidth] = useState<string>('');
    const [customHeight, setCustomHeight] = useState<string>('');
    const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

    // State: File Queue
    const [items, setItems] = useState<ImageFileItem[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);

    // State: Active Item for Comparison
    const [comparingItemId, setComparingItemId] = useState<string | null>(null);
    const [comparisonMode, setComparisonMode] = useState<'split' | 'side-by-side'>('split');
    const [splitPosition, setSplitPosition] = useState<number>(50); // 0 to 100%
    const [zoomLevel, setZoomLevel] = useState<number>(1);

    // Toast & Notification
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const sliderContainerRef = useRef<HTMLDivElement>(null);
    const isDraggingSplitRef = useRef<boolean>(false);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    // Translations Dictionary
    const t = useMemo(() => {
        return {
            title: isFa ? 'فشرده‌ساز و بهینه‌ساز عکس آنلاین' : 'Online Image Compressor & Optimizer',
            badgePrivate: isFa ? '۱۰۰٪ محلی و امن در مرورگر' : '100% Local & Private in Browser',
            badgeOffline: isFa ? 'بدون ارسال به سرور' : 'Zero Server Uploads',
            subtitle: isFa
                ? 'فشرده‌سازی هوشمند و تغییر فرمت تصاویر (JPG، PNG، WebP، AVIF) با بالاترین کیفیت بصری و بیشترین کاهش حجم'
                : 'Smart browser-side image compression & format conversion with maximum savings and crystal-clear visual quality.',
            dropTitle: isFa ? 'تصاویر خود را اینجا بکشید و رها کنید' : 'Drag & Drop your images here',
            dropSubtitle: isFa
                ? 'یا کلیک کنید برای انتخاب فایل‌ها · پشتیبانی از JPG, PNG, WebP, AVIF, SVG, GIF'
                : 'or click to browse files · Supports JPG, PNG, WebP, AVIF, SVG, GIF',
            pasteHint: isFa
                ? 'نکته: می‌توانید عکس را مستقیماً از کلیپ‌بورد با کلیدهای Ctrl+V پیست کنید'
                : 'Pro tip: You can paste images directly from clipboard with Ctrl+V',
            btnBrowse: isFa ? 'انتخاب تصاویر' : 'Browse Files',
            btnPaste: isFa ? 'پیست از کلیپ‌بورد' : 'Paste from Clipboard',
            btnSampleLandscape: isFa ? 'بارگذاری عکس نمونه' : 'Load Sample Photo',
            btnSampleBadge: isFa ? 'بارگذاری آیکون شفاف' : 'Load Transparent Badge',
            queueTitle: isFa ? 'لیست تصاویر' : 'Images Queue',
            btnClearAll: isFa ? 'پاک‌سازی همه' : 'Clear All',
            btnDownloadZip: isFa ? 'دانلود همه (ZIP)' : 'Download All (ZIP)',
            btnRecompressAll: isFa ? 'اعمال تنظیمات مجدد' : 'Re-compress All',
            settingsTitle: isFa ? 'تنظیمات فشرده‌سازی' : 'Compression Settings',
            presetBalanced: isFa ? 'متعادل (پیشنهادی)' : 'Balanced (Recommended)',
            presetHigh: isFa ? 'کیفیت بالا' : 'High Quality',
            presetMax: isFa ? 'بیشترین کاهش حجم' : 'Max Compression',
            presetTarget: isFa ? 'حجم هدف (KB)' : 'Target File Size',
            presetCustom: isFa ? 'سفارشی' : 'Custom',
            qualityLabel: isFa ? 'کیفیت خروجی' : 'Output Quality',
            formatLabel: isFa ? 'فرمت خروجی' : 'Output Format',
            formatAuto: isFa ? 'همانند تصویر اصلی (Auto)' : 'Same as Original (Auto)',
            resizeLabel: isFa ? 'تغییر اندازه و ابعاد' : 'Resize & Dimensions',
            scaleOriginal: isFa ? 'ابعاد اصلی (۱۰۰٪)' : 'Original (100%)',
            scale75: isFa ? '۷۵٪ اندازه اصلی' : '75% of original',
            scale50: isFa ? '۵۰٪ اندازه اصلی' : '50% of original',
            scale25: isFa ? '۲۵٪ اندازه اصلی' : '25% of original',
            scaleCustom: isFa ? 'ابعاد سفارشی' : 'Custom Dimensions',
            targetSizeLabel: isFa ? 'حداکثر حجم مجاز (کیلوبایت)' : 'Target Max Size (KB)',
            stripExif: isFa ? 'حذف متادیتا و EXIF (افزایش حریم خصوصی و کاهش حجم)' : 'Strip EXIF & Camera Metadata',
            bgFillLabel: isFa ? 'رنگ پس‌زمینه برای تبدیل PNG شفاف به JPG' : 'Background fill when converting transparent PNG to JPG',
            totalOriginal: isFa ? 'حجم اولیه کل' : 'Total Original',
            totalCompressed: isFa ? 'حجم بهینه‌شده کل' : 'Total Compressed',
            totalSaved: isFa ? 'مجموع صرفه‌جویی' : 'Total Saved',
            statusCompressing: isFa ? 'در حال بهینه‌سازی...' : 'Compressing...',
            statusDone: isFa ? 'بهینه‌سازی شد' : 'Optimized',
            statusError: isFa ? 'خطا در فشرده‌سازی' : 'Error',
            btnCompare: isFa ? 'مقایسه قبل/بعد' : 'Compare Before/After',
            btnDownload: isFa ? 'دانلود' : 'Download',
            btnCopy: isFa ? 'کپی در کلیپ‌بورد' : 'Copy to Clipboard',
            btnRemove: isFa ? 'حذف' : 'Remove',
            comparisonTitle: isFa ? 'مقایسه تصویری زنده (قبل و بعد)' : 'Interactive Before / After Visual Comparison',
            originalLabel: isFa ? 'تصویر اصلی' : 'Original',
            compressedLabel: isFa ? 'تصویر بهینه‌شده' : 'Compressed',
            splitView: isFa ? 'نمای پرده‌ای (اسلایدر)' : 'Curtain Slider',
            sideBySideView: isFa ? 'کنار هم' : 'Side by Side',
            dragInstruction: isFa ? 'خط وسط را بکشید تا تفاوت کیفیت را با دقت بالا ببینید' : 'Drag the divider to compare quality pixel by pixel',
            zoomIn: isFa ? 'بزرگ‌نمایی' : 'Zoom In',
            zoomOut: isFa ? 'کوچک‌نمایی' : 'Zoom Out',
            zoomReset: isFa ? 'اندازه اصلی' : 'Reset Zoom',
            close: isFa ? 'بستن' : 'Close',
            copiedSuccess: isFa ? 'تصویر با موفقیت در کلیپ‌بورد کپی شد!' : 'Image successfully copied to clipboard!',
            zipCreated: isFa ? 'فایل فشرده ZIP آماده دانلود شد!' : 'ZIP archive ready for download!',
            faqTitle: isFa ? 'پرسش‌های متداول درباره بهینه‌سازی تصاویر' : 'Frequently Asked Questions About Image Compression',
            featuresTitle: isFa ? 'چرا فشرده‌ساز زبراکد بهترین انتخاب است؟' : 'Why ZebraCode Image Compressor is the Best Choice?',
            faq: [
                {
                    q: isFa ? 'آیا فشرده‌سازی تصویر باعث افت کیفیت قابل مشاهده می‌شود؟' : 'Does image compression cause noticeable loss of quality?',
                    a: isFa
                        ? 'خیر؛ در حالت متعادل (Balanced)، الگوریتم‌های هوشمند ما داده‌های نامحسوس برای چشم انسان و اطلاعات اضافی متادیتا را حذف می‌کنند، به طوری که حجم فایل تا ۷۰ الی ۸۵ درصد کاهش می‌یابد در حالی که تصویر کاملاً شارپ و شفاف باقی می‌ماند.'
                        : 'No. In Balanced mode, intelligent algorithms strip invisible redundancies and metadata without compromising human-perceived visual fidelity, reducing file size by 70–85% while keeping sharpness intact.',
                },
                {
                    q: isFa ? 'کدام فرمت عکس برای وب‌سایت بهتر است (WebP یا JPEG یا PNG)؟' : 'Which image format is best for websites (WebP, JPEG, or PNG)?',
                    a: isFa
                        ? 'فرمت WebP در حال حاضر استاندارد طلایی وب است زیرا نسبت به JPEG تا ۳۰٪ و نسبت به PNG تا ۵۰٪ حجم کمتری تولید می‌کند و هم‌زمان از شفافیت (Transparency) پشتیبانی می‌کند. AVIF نیز نسل بعدی است که در مرورگرهای مدرن فشرده‌سازی خارق‌العاده‌تری ارائه می‌دهد.'
                        : 'WebP is currently the modern gold standard: it offers 30% smaller files than JPEG and 50% smaller than PNG while retaining alpha transparency. AVIF offers next-gen efficiency for modern browsers.',
                },
                {
                    q: isFa ? 'آیا تصاویر من به سرور ارسال یا ذخیره می‌شوند؟' : 'Are my photos uploaded to a server or stored?',
                    a: isFa
                        ? 'خیر! تمامی پردازش‌ها و فشرده‌سازی ۱۰۰٪ در مرورگر دستگاه شما با استفاده از HTML5 Canvas و Web APIها انجام می‌شود. هیچ عکسی حتی یک بایت هم به هیچ سروری ارسال نمی‌شود و محرمانگی شما کاملاً تضمین شده است.'
                        : 'Never! All compression happens 100% locally inside your browser via HTML5 Canvas and Web APIs. Not a single byte ever leaves your machine, ensuring full privacy.',
                },
                {
                    q: isFa ? 'فشرده‌سازی عکس چگونه بر سئو (SEO) و سرعت سایت اثر می‌گذارد؟' : 'How does image compression affect SEO and site speed?',
                    a: isFa
                        ? 'تصاویر سنگین بزرگ‌ترین عامل کندی لود صفحات وب و افت شاخص Largest Contentful Paint (LCP) در استانداردهای Core Web Vitals گوگل هستند. با کاهش حجم تصاویر، رتبه سئو سایت شما و نرخ تبدیل کاربران به شدت ارتقا می‌یابد.'
                        : 'Heavy images are the primary cause of slow page loads and poor Largest Contentful Paint (LCP) scores in Google Core Web Vitals. Optimizing images drastically improves search rankings and user retention.',
                },
                {
                    q: isFa ? 'آیا می‌توانم چندین عکس را به صورت همزمان فشرده کنم و فایل ZIP بگیرم؟' : 'Can I compress multiple images simultaneously and download a ZIP?',
                    a: isFa
                        ? 'بله! شما می‌توانید ده‌ها عکس را همزمان بکشید و رها کنید، تنظیمات دلخواه را برای همه اعمال کنید و تمام تصاویر بهینه‌شده را با یک کلیک در قالب یک فایل ZIP دریافت کنید.'
                        : 'Yes! You can drop dozens of images at once, apply batch settings, and download all compressed files in a single organized ZIP archive.',
                },
            ],
            features: [
                {
                    title: isFa ? 'حفظ کامل حریم خصوصی' : 'Zero Server Uploads',
                    desc: isFa ? 'تمام پردازش در مرورگر شما انجام می‌شود؛ عکس‌ها هرگز در اینترنت آپلود نمی‌شوند.' : 'Images stay on your machine. All encoding runs client-side.',
                    icon: '🔒',
                },
                {
                    title: isFa ? 'مقایسه پرده‌ای زنده' : 'Interactive Split Slider',
                    desc: isFa ? 'با اسلایدر خط‌کش دقیق، پیکسل به پیکسل کیفیت قبل و بعد را مقایسه کنید.' : 'Pixel-perfect curtain slider to inspect before and after quality.',
                },
                {
                    title: isFa ? 'پشتیبانی از فرمت‌های مدرن' : 'Modern Formats (WebP & AVIF)',
                    desc: isFa ? 'تبدیل سریع به WebP و AVIF با شفافیت کامل و کاهش حجم شگفت‌انگیز.' : 'Convert to next-gen formats with high savings & alpha transparency.',
                },
                {
                    title: isFa ? 'حالت حجم هدف هوشمند' : 'Smart Target Size Mode',
                    desc: isFa ? 'سقف حجم دلخواه (مثلاً ۲۰۰ کیلوبایت) را تعیین کنید تا سیستم خودکار تنظیم کند.' : 'Specify exact target KB and the engine automatically tunes quality.',
                },
                {
                    title: isFa ? 'دانلود دسته‌ای ZIP' : 'Batch ZIP Download',
                    desc: isFa ? 'فشرده‌سازی گروهی تصاویر و دانلود یکپارچه تمام خروجی‌ها در فایل ZIP.' : 'Compress dozens of images in batch and download with 1-click.',
                },
                {
                    title: isFa ? 'کپی مستقیم در کلیپ‌بورد' : 'Direct Clipboard Copy',
                    desc: isFa ? 'بدون نیاز به ذخیره روی دیسک، تصویر بهینه‌شده را مستقیماً کپی و در فتوشاپ یا فیگما پیست کنید.' : 'Copy compressed image directly to OS clipboard for Figma or apps.',
                },
            ],
        };
    }, [isFa]);

    // Compression worker runner for a single item
    const runCompression = useCallback(
        async (item: ImageFileItem, activeSettings: CompressionSettings): Promise<ImageFileItem> => {
            try {
                const effectiveSettings: CompressionSettings = {
                    ...activeSettings,
                    ...(item.customSettings || {}),
                };

                const res = await compressImage(item.file, effectiveSettings, item.originalType);

                return {
                    ...item,
                    status: 'done',
                    compressedBlob: res.blob,
                    compressedSize: res.size,
                    compressedWidth: res.width,
                    compressedHeight: res.height,
                    compressedType: res.mimeType,
                    compressedPreviewUrl: res.previewUrl,
                    processingTimeMs: res.durationMs,
                };
            } catch (err: any) {
                return {
                    ...item,
                    status: 'error',
                    errorMessage: err?.message || 'Error',
                };
            }
        },
        []
    );

    // Process new incoming files
    const handleFiles = useCallback(
        async (files: FileList | File[]) => {
            const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
            if (validFiles.length === 0) return;

            setIsProcessingBatch(true);

            const newItems: ImageFileItem[] = [];

            for (const file of validFiles) {
                const meta = await getImageMetadata(file);
                const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                const rawItem: ImageFileItem = {
                    id,
                    file,
                    name: file.name,
                    originalSize: file.size,
                    originalWidth: meta.width,
                    originalHeight: meta.height,
                    originalType: file.type || 'image/jpeg',
                    originalPreviewUrl: meta.url,
                    status: 'compressing',
                };

                newItems.push(rawItem);
            }

            // Append with compressing status
            setItems((prev) => [...prev, ...newItems]);

            // Run compression on all new items
            const activeSettings: CompressionSettings = {
                ...settings,
                targetSizeBytes: settings.preset === 'target-size' ? targetSizeKb * 1024 : undefined,
                maxWidth: customWidth ? parseInt(customWidth, 10) : undefined,
                maxHeight: customHeight ? parseInt(customHeight, 10) : undefined,
                maintainAspectRatio: maintainAspect,
            };

            const processedItems = await Promise.all(
                newItems.map((item) => runCompression(item, activeSettings))
            );

            setItems((prev) =>
                prev.map((existing) => {
                    const match = processedItems.find((p) => p.id === existing.id);
                    return match || existing;
                })
            );

            // If no item is currently being compared, select the first one
            setComparingItemId((prev) => prev || processedItems[0]?.id || null);
            setIsProcessingBatch(false);
        },
        [customHeight, customWidth, maintainAspect, runCompression, settings, targetSizeKb]
    );

    // Re-compress all items when global settings change
    const recompressAll = useCallback(
        async (newSettings?: CompressionSettings) => {
            if (items.length === 0) return;
            setIsProcessingBatch(true);

            const activeSettings = newSettings || {
                ...settings,
                targetSizeBytes: settings.preset === 'target-size' ? targetSizeKb * 1024 : undefined,
                maxWidth: customWidth ? parseInt(customWidth, 10) : undefined,
                maxHeight: customHeight ? parseInt(customHeight, 10) : undefined,
                maintainAspectRatio: maintainAspect,
            };

            setItems((prev) => prev.map((item) => ({ ...item, status: 'compressing' })));

            const updated = await Promise.all(items.map((item) => runCompression(item, activeSettings)));
            setItems(updated);
            setIsProcessingBatch(false);
        },
        [customHeight, customWidth, items, maintainAspect, runCompression, settings, targetSizeKb]
    );

    // Preset selection change handler
    const handlePresetChange = (preset: CompressionPreset) => {
        let quality = 0.8;
        if (preset === 'high') quality = 0.92;
        if (preset === 'max') quality = 0.52;
        if (preset === 'balanced') quality = 0.78;

        const updated: CompressionSettings = {
            ...settings,
            preset,
            quality: preset === 'custom' ? settings.quality : quality,
        };
        setSettings(updated);
        recompressAll(updated);
    };

    // Quality slider change
    const handleQualityChange = (val: number) => {
        const updated: CompressionSettings = {
            ...settings,
            preset: 'custom',
            quality: val / 100,
        };
        setSettings(updated);
    };

    // Global drag & drop listeners
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

    // Handle Split Slider Dragger
    const handleSplitMouseMove = useCallback((clientX: number) => {
        if (!sliderContainerRef.current) return;
        const rect = sliderContainerRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        let percentage = (offsetX / rect.width) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        setSplitPosition(percentage);
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (isDraggingSplitRef.current) {
                handleSplitMouseMove(e.clientX);
            }
        };
        const onTouchMove = (e: TouchEvent) => {
            if (isDraggingSplitRef.current && e.touches[0]) {
                handleSplitMouseMove(e.touches[0].clientX);
            }
        };
        const onMouseUp = () => {
            isDraggingSplitRef.current = false;
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchend', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchend', onMouseUp);
        };
    }, [handleSplitMouseMove]);

    // Load sample image
    const handleLoadSample = async (type: 'landscape' | 'badge') => {
        const sampleFile = await createSampleImage(type);
        handleFiles([sampleFile]);
    };

    // Download Single File
    const handleDownloadSingle = (item: ImageFileItem) => {
        if (!item.compressedBlob) return;
        const base = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
        const ext = getFileExtension(item.compressedType || 'image/jpeg');
        downloadBlob(item.compressedBlob, `${base}-compressed.${ext}`);
    };

    // Copy to clipboard
    const handleCopySingle = async (item: ImageFileItem) => {
        if (!item.compressedBlob) return;
        try {
            await copyImageToClipboard(item.compressedBlob);
            showToast(t.copiedSuccess);
        } catch {
            showToast(isFa ? 'مرورگر شما از کپی مستقیم تصویر پشتیبانی نمی‌کند' : 'Clipboard image copy not supported in this browser');
        }
    };

    // Download All as ZIP
    const handleDownloadZip = async () => {
        const doneItems = items.filter((i) => i.status === 'done' && i.compressedBlob);
        if (doneItems.length === 0) return;
        showToast(isFa ? 'در حال ایجاد فایل ZIP...' : 'Generating ZIP archive...');
        const zipBlob = await createZipBundle(doneItems);
        downloadBlob(zipBlob, 'zebracode-compressed-images.zip');
        showToast(t.zipCreated);
    };

    // Remove single item
    const handleRemoveItem = (id: string) => {
        setItems((prev) => {
            const next = prev.filter((i) => i.id !== id);
            if (comparingItemId === id) {
                setComparingItemId(next[0]?.id || null);
            }
            return next;
        });
    };

    // Clear all items
    const handleClearAll = () => {
        setItems([]);
        setComparingItemId(null);
    };

    // Metrics calculations for batch
    const batchStats = useMemo(() => {
        const doneItems = items.filter((i) => i.status === 'done' && i.compressedSize);
        const originalTotal = doneItems.reduce((acc, i) => acc + i.originalSize, 0);
        const compressedTotal = doneItems.reduce((acc, i) => acc + (i.compressedSize || 0), 0);
        const savedBytes = Math.max(0, originalTotal - compressedTotal);
        const savedPercent = formatSavingsPercent(originalTotal, compressedTotal);
        return {
            count: items.length,
            doneCount: doneItems.length,
            originalTotal,
            compressedTotal,
            savedBytes,
            savedPercent,
        };
    }, [items]);

    // Current item being visually compared
    const comparingItem = useMemo(() => {
        return items.find((i) => i.id === comparingItemId) || items[0] || null;
    }, [comparingItemId, items]);

    return (
        <div className="relative min-h-screen bg-canvas text-text pb-20 selection:bg-action selection:text-action-foreground" dir={isFa ? 'rtl' : 'ltr'}>
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform rounded-full bg-text px-5 py-2.5 text-sm font-medium text-surface shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4">
                    {toastMessage}
                </div>
            )}

            {/* Hidden native file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                    e.target.value = '';
                }}
            />

            <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
                {/* Header Section */}
                <header className="mb-8 text-center sm:text-start flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
                    <div>
                        <div className="inline-flex items-center gap-2 mb-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-action-soft text-action">
                                <ImageIcon className="h-5 w-5" />
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

                    {/* Quick Sample Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadSample('landscape')}
                            className="text-xs gap-1.5"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-action" />
                            {t.btnSampleLandscape}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadSample('badge')}
                            className="text-xs gap-1.5"
                        >
                            <Layers className="h-3.5 w-3.5 text-action" />
                            {t.btnSampleBadge}
                        </Button>
                    </div>
                </header>

                {/* Upload & Drag-and-Drop Area */}
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
                                    showToast(isFa ? 'دسترسی کلیپ‌بورد در مرورگر مسدود است، لطفاً از Ctrl+V استفاده کنید' : 'Clipboard access denied, please press Ctrl+V directly');
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

                {/* Settings & Parameters Bar */}
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
                                onClick={() => recompressAll()}
                                disabled={isProcessingBatch}
                                className="text-xs gap-1.5 h-8 text-action hover:text-action-hover hover:bg-action-soft"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
                                {t.btnRecompressAll}
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* 1. Presets */}
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-2">
                                {isFa ? 'حالت بهینه‌سازی' : 'Preset Mode'}
                            </label>
                            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                                {[
                                    { id: 'balanced', label: t.presetBalanced },
                                    { id: 'high', label: t.presetHigh },
                                    { id: 'max', label: t.presetMax },
                                    { id: 'target-size', label: t.presetTarget },
                                    { id: 'custom', label: t.presetCustom },
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handlePresetChange(p.id as CompressionPreset)}
                                        className={`px-2 py-1.5 rounded-md text-xs font-medium border text-center transition-all ${
                                            settings.preset === p.id
                                                ? 'bg-action text-action-foreground border-action shadow-xs'
                                                : 'border-border bg-surface-inset hover:bg-action-soft hover:text-action text-text'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Format selector */}
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-2">
                                {t.formatLabel}
                            </label>
                            <select
                                value={settings.outputFormat}
                                onChange={(e) => {
                                    const updated = {
                                        ...settings,
                                        outputFormat: e.target.value as ImageOutputFormat,
                                    };
                                    setSettings(updated);
                                    recompressAll(updated);
                                }}
                                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-focus"
                            >
                                <option value="original">{t.formatAuto}</option>
                                <option value="image/webp">WebP ({isFa ? 'بهترین فشرده‌سازی و مدرن' : 'Modern & Compact'})</option>
                                <option value="image/jpeg">JPEG ({isFa ? 'سازگاری همگانی' : 'Universal Compatibility'})</option>
                                <option value="image/png">PNG ({isFa ? 'بدون افت کیفیت با شفافیت' : 'Lossless Transparency'})</option>
                                <option value="image/avif">AVIF ({isFa ? 'فوق فشرده نسل بعد' : 'Next-Gen High Efficiency'})</option>
                            </select>
                            {settings.outputFormat === 'image/jpeg' && (
                                <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                                    <span>{t.bgFillLabel}:</span>
                                    <input
                                        type="color"
                                        value={settings.jpegBackgroundColor || '#ffffff'}
                                        onChange={(e) => {
                                            const updated = { ...settings, jpegBackgroundColor: e.target.value };
                                            setSettings(updated);
                                            recompressAll(updated);
                                        }}
                                        className="h-6 w-8 rounded border border-border cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 3. Quality or Target Size */}
                        <div>
                            {settings.preset === 'target-size' ? (
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-2">
                                        {t.targetSizeLabel}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={10}
                                            max={20000}
                                            step={10}
                                            value={targetSizeKb}
                                            onChange={(e) => setTargetSizeKb(Number(e.target.value))}
                                            onBlur={() => recompressAll()}
                                            className="w-full rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-focus"
                                        />
                                        <span className="text-xs font-medium text-text-muted">KB</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold text-text-muted">
                                            {t.qualityLabel}
                                        </label>
                                        <span className="text-xs font-bold text-action">
                                            {Math.round(settings.quality * 100)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={5}
                                        max={100}
                                        value={Math.round(settings.quality * 100)}
                                        onChange={(e) => handleQualityChange(Number(e.target.value))}
                                        onMouseUp={() => recompressAll()}
                                        onTouchEnd={() => recompressAll()}
                                        className="w-full accent-action cursor-pointer h-1.5 bg-surface-inset rounded-lg"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-subtle mt-1">
                                        <span>{isFa ? 'کم‌حجم' : 'Low size'}</span>
                                        <span>{isFa ? 'متعادل' : 'Balanced'}</span>
                                        <span>{isFa ? 'حداکثر کیفیت' : 'Max quality'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Resizing & Dimensions */}
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-2">
                                {t.resizeLabel}
                            </label>
                            <select
                                value={settings.scalePercent}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    const updated = { ...settings, scalePercent: val };
                                    setSettings(updated);
                                    recompressAll(updated);
                                }}
                                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-focus"
                            >
                                <option value={100}>{t.scaleOriginal}</option>
                                <option value={75}>{t.scale75}</option>
                                <option value={50}>{t.scale50}</option>
                                <option value={25}>{t.scale25}</option>
                            </select>

                            <div className="mt-2.5 flex items-center gap-2">
                                <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={settings.stripMetadata}
                                        onChange={(e) => {
                                            const updated = { ...settings, stripMetadata: e.target.checked };
                                            setSettings(updated);
                                            recompressAll(updated);
                                        }}
                                        className="h-3.5 w-3.5 rounded border-border-strong text-action focus:ring-focus"
                                    />
                                    <span>{t.stripExif}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Batch Queue & Stats bar */}
                {items.length > 0 && (
                    <div className="mt-8 space-y-4">
                        {/* Summary Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                                <div>
                                    <span className="text-text-muted block text-xs">{t.totalOriginal}:</span>
                                    <strong className="font-bold text-text">{formatBytes(batchStats.originalTotal, locale)}</strong>
                                </div>
                                <div className="border-r border-border h-6 hidden sm:block" />
                                <div>
                                    <span className="text-text-muted block text-xs">{t.totalCompressed}:</span>
                                    <strong className="font-bold text-text">{formatBytes(batchStats.compressedTotal, locale)}</strong>
                                </div>
                                <div className="border-r border-border h-6 hidden sm:block" />
                                <div>
                                    <span className="text-text-muted block text-xs">{t.totalSaved}:</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-success">
                                        <ArrowDown className="h-3.5 w-3.5" />
                                        {formatBytes(batchStats.savedBytes, locale)} ({batchStats.savedPercent}%)
                                    </span>
                                </div>
                            </div>

                            {/* Batch Actions */}
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
                                    disabled={batchStats.doneCount === 0}
                                    className="text-xs gap-1.5"
                                >
                                    <Archive className="h-3.5 w-3.5" />
                                    {t.btnDownloadZip}
                                </Button>
                            </div>
                        </div>

                        {/* Queue Items List */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {items.map((item) => {
                                const savings = item.compressedSize
                                    ? formatSavingsPercent(item.originalSize, item.compressedSize)
                                    : 0;
                                const isComparing = comparingItemId === item.id;

                                return (
                                    <Card
                                        key={item.id}
                                        onClick={() => setComparingItemId(item.id)}
                                        className={`relative cursor-pointer overflow-hidden p-3 transition-all ${
                                            isComparing
                                                ? 'ring-2 ring-action border-action bg-surface-raised shadow-md'
                                                : 'hover:border-border-strong bg-surface'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Thumbnail */}
                                            <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-surface-inset border border-border flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={item.compressedPreviewUrl || item.originalPreviewUrl}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                                {item.status === 'compressing' && (
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveItem(item.id);
                                                        }}
                                                        className="text-text-muted hover:text-danger p-0.5"
                                                        title={t.btnRemove}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted">
                                                    <span>{formatBytes(item.originalSize, locale)}</span>
                                                    <span>→</span>
                                                    <span className="font-semibold text-text">
                                                        {item.compressedSize ? formatBytes(item.compressedSize, locale) : '...'}
                                                    </span>
                                                    {savings > 0 && (
                                                        <Badge className="bg-success-soft text-success text-[10px] px-1 py-0 border-success/20">
                                                            -{savings}%
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="mt-1 text-[10px] text-text-subtle">
                                                    {item.compressedWidth && item.compressedHeight ? (
                                                        <span>
                                                            {item.originalWidth}×{item.originalHeight} → {item.compressedWidth}×{item.compressedHeight} px
                                                        </span>
                                                    ) : (
                                                        <span>{item.originalWidth}×{item.originalHeight} px</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
                                            <span className="text-[10px] font-medium text-text-subtle uppercase">
                                                {item.compressedType ? getFileExtension(item.compressedType) : '...'}
                                                {item.processingTimeMs ? ` · ${item.processingTimeMs}ms` : ''}
                                            </span>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setComparingItemId(item.id);
                                                    }}
                                                    className="p-1 text-text-muted hover:text-action rounded hover:bg-action-soft"
                                                    title={t.btnCompare}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopySingle(item);
                                                    }}
                                                    className="p-1 text-text-muted hover:text-action rounded hover:bg-action-soft"
                                                    title={t.btnCopy}
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadSingle(item);
                                                    }}
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

                {/* Interactive Visual Comparison Section (Before / After Curtain Slider) */}
                {comparingItem && (
                    <section className="mt-10 rounded-2xl border border-border bg-surface p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-text flex items-center gap-2">
                                    <ArrowLeftRight className="h-4 w-4 text-action" />
                                    {t.comparisonTitle}
                                </h3>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {t.dragInstruction}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="inline-flex rounded-lg border border-border p-0.5 bg-surface-inset text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setComparisonMode('split')}
                                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                            comparisonMode === 'split' ? 'bg-surface text-text shadow-xs' : 'text-text-muted hover:text-text'
                                        }`}
                                    >
                                        {t.splitView}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setComparisonMode('side-by-side')}
                                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                            comparisonMode === 'side-by-side' ? 'bg-surface text-text shadow-xs' : 'text-text-muted hover:text-text'
                                        }`}
                                    >
                                        {t.sideBySideView}
                                    </button>
                                </div>

                                <div className="flex items-center gap-1 border-s border-border ps-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setZoomLevel((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
                                        className="h-8 px-2 text-xs"
                                        title={t.zoomOut}
                                    >
                                        -
                                    </Button>
                                    <span className="text-xs font-medium text-text-muted w-10 text-center">
                                        {Math.round(zoomLevel * 100)}%
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setZoomLevel((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))))}
                                        className="h-8 px-2 text-xs"
                                        title={t.zoomIn}
                                    >
                                        +
                                    </Button>
                                    {zoomLevel !== 1 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setZoomLevel(1)}
                                            className="h-8 text-xs text-text-subtle"
                                        >
                                            {t.zoomReset}
                                        </Button>
                                    )}
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => handleDownloadSingle(comparingItem)}
                                    className="gap-1.5 h-8 text-xs ms-2"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    {t.btnDownload}
                                </Button>
                            </div>
                        </div>

                        {/* Interactive Viewer */}
                        {comparisonMode === 'split' ? (
                            <div
                                ref={sliderContainerRef}
                                onMouseDown={() => {
                                    isDraggingSplitRef.current = true;
                                }}
                                onTouchStart={() => {
                                    isDraggingSplitRef.current = true;
                                }}
                                className="relative h-[480px] w-full overflow-hidden rounded-xl border border-border bg-surface-inset select-none cursor-ew-resize"
                            >
                                {/* Left Side: Original Image */}
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={comparingItem.originalPreviewUrl}
                                        alt="Original"
                                        style={{ transform: `scale(${zoomLevel})` }}
                                        className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-75"
                                    />
                                    <div className="absolute top-3 left-3 rounded-md bg-surface/90 px-2.5 py-1 text-xs font-bold text-text backdrop-blur-xs border border-border shadow-xs">
                                        {t.originalLabel} · {formatBytes(comparingItem.originalSize, locale)}
                                    </div>
                                </div>

                                {/* Right Side: Compressed Image (Clipped) */}
                                <div
                                    className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                                    style={{
                                        clipPath: isFa
                                            ? `polygon(0 0, ${100 - splitPosition}% 0, ${100 - splitPosition}% 100%, 0 100%)`
                                            : `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition}% 100%)`,
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={comparingItem.compressedPreviewUrl || comparingItem.originalPreviewUrl}
                                        alt="Compressed"
                                        style={{ transform: `scale(${zoomLevel})` }}
                                        className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-75"
                                    />
                                    <div className="absolute top-3 right-3 rounded-md bg-action/90 text-action-foreground px-2.5 py-1 text-xs font-bold backdrop-blur-xs shadow-xs">
                                        {t.compressedLabel} ·{' '}
                                        {comparingItem.compressedSize ? formatBytes(comparingItem.compressedSize, locale) : '...'}
                                        {comparingItem.compressedSize && (
                                            <span className="ms-1 font-semibold text-white/90">
                                                (-{formatSavingsPercent(comparingItem.originalSize, comparingItem.compressedSize)}%)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Draggable Divider Line & Knob */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-action z-20 pointer-events-none"
                                    style={{
                                        left: isFa ? `${100 - splitPosition}%` : `${splitPosition}%`,
                                    }}
                                >
                                    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-action text-action-foreground shadow-lg border-2 border-surface">
                                        <ArrowLeftRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Side by Side View */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-border bg-surface-inset p-3 flex flex-col items-center">
                                    <div className="mb-2 flex w-full items-center justify-between text-xs font-bold text-text">
                                        <span>{t.originalLabel}</span>
                                        <Badge className="bg-surface text-text-muted border-border">
                                            {formatBytes(comparingItem.originalSize, locale)}
                                        </Badge>
                                    </div>
                                    <div className="relative h-72 w-full flex items-center justify-center overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={comparingItem.originalPreviewUrl}
                                            alt="Original"
                                            style={{ transform: `scale(${zoomLevel})` }}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                    <div className="mt-2 text-center text-xs text-text-muted">
                                        {comparingItem.originalWidth} × {comparingItem.originalHeight} px · {comparingItem.originalType}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-action/30 bg-action-soft/20 p-3 flex flex-col items-center">
                                    <div className="mb-2 flex w-full items-center justify-between text-xs font-bold text-action">
                                        <span>{t.compressedLabel}</span>
                                        <Badge className="bg-action text-action-foreground">
                                            {comparingItem.compressedSize ? formatBytes(comparingItem.compressedSize, locale) : '...'}
                                            {comparingItem.compressedSize && (
                                                <span className="ms-1">
                                                    (-{formatSavingsPercent(comparingItem.originalSize, comparingItem.compressedSize)}%)
                                                </span>
                                            )}
                                        </Badge>
                                    </div>
                                    <div className="relative h-72 w-full flex items-center justify-center overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={comparingItem.compressedPreviewUrl || comparingItem.originalPreviewUrl}
                                            alt="Compressed"
                                            style={{ transform: `scale(${zoomLevel})` }}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                    <div className="mt-2 text-center text-xs text-text-muted">
                                        {comparingItem.compressedWidth} × {comparingItem.compressedHeight} px ·{' '}
                                        {comparingItem.compressedType || comparingItem.originalType}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Features & Best Practices Showcase */}
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
