'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Plus,
  Trash2,
  Building2,
  User,
  Calendar,
  Check,
  Upload,
  RefreshCw,
  Save,
  Eye,
  FileEdit,
  Sparkles,
  ShieldCheck,
  Layers,
  Image as ImageIcon,
  DollarSign,
  CreditCard,
  Sliders,
  Award,
  Stamp
} from 'lucide-react';

interface InvoiceGeneratorProps {
  locale?: string;
  dict?: any;
}

export type InvoiceBusinessType = 'official' | 'commercial' | 'services' | 'proforma' | 'receipt';
export type InvoiceLayoutTheme = 'classic' | 'modern' | 'minimal';
export type InvoiceColor = 'blue' | 'emerald' | 'slate' | 'indigo' | 'amber';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxPercent: number;
}

export interface InvoiceData {
  businessType: InvoiceBusinessType;
  layoutTheme: InvoiceLayoutTheme;
  themeColor: InvoiceColor;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  validityDays?: string; // For proforma
  paymentMethod?: string; // For receipt
  trackingCode?: string; // For receipt
  currency: string;

  // Seller Info
  sellerLogo: string;
  sellerLogoWidth: number; // in pixels (e.g. 100)
  sellerStamp: string; // digital stamp & signature image
  sellerName: string;
  sellerEconomicCode: string;
  sellerNationalId: string;
  sellerRegistrationNumber: string;
  sellerPhone: string;
  sellerPostalCode: string;
  sellerAddress: string;
  sellerBankName: string;
  sellerIban: string;
  sellerCardNumber: string;

  // Buyer Info
  buyerName: string;
  buyerEconomicCode: string;
  buyerNationalId: string;
  buyerPhone: string;
  buyerPostalCode: string;
  buyerAddress: string;

  // Items
  items: InvoiceItem[];

  // Extras
  shippingCost: number;
  notes: string;
  terms: string;
}

// --- Numbers to Words Helpers ---
const FA_ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const FA_TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const FA_TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const FA_HUNDREDS = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const FA_THOUSANDS = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function convertThreeDigitsFA(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];
  const h = Math.floor(num / 100);
  const remainder = num % 100;
  if (h > 0) parts.push(FA_HUNDREDS[h]);

  if (remainder >= 10 && remainder <= 19) {
    parts.push(FA_TEENS[remainder - 10]);
  } else {
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    if (t > 0) parts.push(FA_TENS[t]);
    if (o > 0) parts.push(FA_ONES[o]);
  }
  return parts.join(' و ');
}

function numberToPersianWords(num: number): string {
  if (!num || num === 0) return 'صفر';
  const clean = Math.floor(Math.abs(num)).toString();
  const chunks: number[] = [];
  let s = clean;
  while (s.length > 0) {
    chunks.push(parseInt(s.slice(-3), 10));
    s = s.slice(0, -3);
  }

  const resultWords: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunkVal = chunks[i];
    if (chunkVal > 0) {
      const words = convertThreeDigitsFA(chunkVal);
      const unit = FA_THOUSANDS[i];
      resultWords.push(unit ? `${words} ${unit}` : words);
    }
  }

  return resultWords.join(' و ');
}

const EN_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const EN_TEENS = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const EN_THOUSANDS = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

function convertThreeDigitsEN(num: number): string {
  let str = '';
  const h = Math.floor(num / 100);
  const rem = num % 100;
  if (h > 0) str += EN_ONES[h] + ' Hundred ';
  if (rem >= 10 && rem <= 19) {
    str += EN_TEENS[rem - 10] + ' ';
  } else {
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (t > 0) str += EN_TENS[t] + ' ';
    if (o > 0) str += EN_ONES[o] + ' ';
  }
  return str.trim();
}

function numberToEnglishWords(num: number): string {
  if (!num || num === 0) return 'Zero';
  const clean = Math.floor(Math.abs(num)).toString();
  const chunks: number[] = [];
  let s = clean;
  while (s.length > 0) {
    chunks.push(parseInt(s.slice(-3), 10));
    s = s.slice(0, -3);
  }

  const resultWords: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunkVal = chunks[i];
    if (chunkVal > 0) {
      const words = convertThreeDigitsEN(chunkVal);
      const unit = EN_THOUSANDS[i];
      resultWords.push(unit ? `${words} ${unit}` : words);
    }
  }

  return resultWords.join(' ');
}

export function InvoiceGenerator({ locale = 'fa' }: InvoiceGeneratorProps) {
  const isEn = locale === 'en';
  const STORAGE_KEY = `zebracode_invoice_draft_${locale}`;

  const getTodayJalali = () => {
    try {
      const parts = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      return parts.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    } catch {
      return '1404/01/01';
    }
  };

  const getInitialData = (): InvoiceData => {
    if (isEn) {
      return {
        businessType: 'official',
        layoutTheme: 'modern',
        themeColor: 'blue',
        invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        validityDays: '15 Days',
        paymentMethod: 'Wire Transfer / Credit Card',
        trackingCode: 'TRX-984210',
        currency: 'USD',

        sellerLogo: '',
        sellerLogoWidth: 100,
        sellerStamp: '',
        sellerName: 'ZebraCode Software Technologies Inc.',
        sellerEconomicCode: 'US-98765432',
        sellerNationalId: 'EIN-12-3456789',
        sellerRegistrationNumber: 'REG-88990',
        sellerPhone: '+1 (555) 345-6789',
        sellerPostalCode: '94105',
        sellerAddress: '500 Howard Street, Suite 400, San Francisco, CA 94105',
        sellerBankName: 'Silicon Valley Bank',
        sellerIban: 'US89SVBK00001234567890',
        sellerCardNumber: '**** **** **** 4892',

        buyerName: 'Acme Global Enterprise Corp.',
        buyerEconomicCode: 'EU-11223344',
        buyerNationalId: 'VAT-GB99887766',
        buyerPhone: '+1 (555) 789-0123',
        buyerPostalCode: '10001',
        buyerAddress: '350 5th Avenue, New York, NY 10001',

        items: [
          {
            id: '1',
            description: 'Custom UI/UX Design System & Mobile Prototype in Figma',
            quantity: 1,
            unit: 'Project',
            unitPrice: 1800,
            discount: 100,
            taxPercent: 10,
          },
          {
            id: '2',
            description: 'Full-Stack Next.js 15 Web Application Engineering & REST API Integration',
            quantity: 1,
            unit: 'Project',
            unitPrice: 3500,
            discount: 0,
            taxPercent: 10,
          },
          {
            id: '3',
            description: 'Cloud Infrastructure & High-Availability Server Setup',
            quantity: 1,
            unit: 'Service',
            unitPrice: 650,
            discount: 50,
            taxPercent: 10,
          },
        ],

        shippingCost: 0,
        notes: 'Full repository access and production deployment credentials will be provided upon settlement.',
        terms: '1. Payment is due within 14 days of invoice date.\n2. Work includes 90 days of dedicated maintenance and defect resolution.',
      };
    }

    return {
      businessType: 'official',
      layoutTheme: 'classic',
      themeColor: 'blue',
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: getTodayJalali(),
      dueDate: '',
      validityDays: '۷ روز کاری',
      paymentMethod: 'انتقال شبا / پایا',
      trackingCode: 'TRX-549102',
      currency: 'تومان',

      sellerLogo: '',
      sellerLogoWidth: 100,
      sellerStamp: '',
      sellerName: 'شرکت نوآوران داده‌ورز زبرا (سهامی خاص)',
      sellerEconomicCode: '411456789123',
      sellerNationalId: '14008954123',
      sellerRegistrationNumber: '568912',
      sellerPhone: '021-88776655',
      sellerPostalCode: '1998765432',
      sellerAddress: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، برج نگین، طبقه ۵، واحد ۱۲',
      sellerBankName: 'بانک ملت',
      sellerIban: 'IR050120000000001234567890',
      sellerCardNumber: '6104-3378-1234-5678',

      buyerName: 'شرکت فناوری اطلاعات و ارتباطات آفرینش',
      buyerEconomicCode: '411987654321',
      buyerNationalId: '10103456789',
      buyerPhone: '021-22334455',
      buyerPostalCode: '1415678901',
      buyerAddress: 'تهران، بلوار سعادت‌آباد، خیابان یکم، پلاک ۲۴',

      items: [
        {
          id: '1',
          description: 'طراحی سیستم طراحی اختصاصی و رابط کاربری وب‌اپلیکیشن (UI/UX در فیگما)',
          quantity: 1,
          unit: 'پروژه',
          unitPrice: 28000000,
          discount: 2000000,
          taxPercent: 10,
        },
        {
          id: '2',
          description: 'توسعه فرانت‌اند با فریم‌ورک Next.js 15 و اتصال به وب‌سرویس‌های REST',
          quantity: 1,
          unit: 'پروژه',
          unitPrice: 45000000,
          discount: 0,
          taxPercent: 10,
        },
        {
          id: '3',
          description: 'پشتیبانی فنی و مانیتورینگ عملکرد ۲۴/۷ سرور (ماهه اول)',
          quantity: 1,
          unit: 'ماه',
          unitPrice: 6500000,
          discount: 500000,
          taxPercent: 10,
        },
      ],

      shippingCost: 0,
      notes: 'تحویل نهایی مستندات فنی و سورس‌کد پس از تسویه فاکتور انجام خواهد شد.',
      terms: '۱. مهلت پرداخت فاکتور حداکثر تا ۷ روز کاری پس از تاریخ صدور می‌باشد.\n۲. کلیه خدمات شامل ۳ ماه گارانتی رفع باگ اختصاصی رایگان می‌باشند.',
    };
  };

  const [invoice, setInvoice] = useState<InvoiceData>(getInitialData);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  // Load draft safely with language isolation
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.items && parsed.items.length > 0) {
          setInvoice(parsed);
          return;
        }
      }
      setInvoice(getInitialData());
    } catch {
      setInvoice(getInitialData());
    }
  }, [locale]);

  // Save to locale-specific localStorage
  const handleSaveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {
      // Ignore
    }
  };

  // Reset to initial
  const handleReset = () => {
    if (confirm(isEn ? 'Reset invoice and create new?' : 'آیا مایلید تمام فیلدها بازنشانی شده و فاکتور جدید ایجاد شود؟')) {
      const fresh = getInitialData();
      setInvoice(fresh);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  };

  // Logo Upload with Image Preview
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert(isEn ? 'Logo file must be under 3MB.' : 'حجم لوگو نباید بیشتر از ۳ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setInvoice((prev) => ({ ...prev, sellerLogo: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Stamp / Signature Upload
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert(isEn ? 'Stamp/Signature file must be under 3MB.' : 'حجم تصویر مهر یا امضا نباید بیشتر از ۳ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setInvoice((prev) => ({ ...prev, sellerStamp: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Preset Template Switcher
  const applyBusinessTypePreset = (type: InvoiceBusinessType) => {
    setInvoice((prev) => {
      let tax = 10;
      let theme: InvoiceLayoutTheme = 'modern';
      if (type === 'official') {
        tax = 10;
        theme = 'classic';
      } else if (type === 'services') {
        tax = 0;
        theme = 'modern';
      } else if (type === 'commercial') {
        tax = 10;
        theme = 'modern';
      } else if (type === 'receipt') {
        tax = 0;
        theme = 'minimal';
      } else if (type === 'proforma') {
        tax = 10;
        theme = 'classic';
      }

      return {
        ...prev,
        businessType: type,
        layoutTheme: theme,
        items: prev.items.map((it) => ({ ...it, taxPercent: tax })),
      };
    });
  };

  // Item management
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: isEn ? 'Item' : 'عدد',
      unitPrice: 0,
      discount: 0,
      taxPercent: invoice.businessType === 'services' || invoice.businessType === 'receipt' ? 0 : 10,
    };
    setInvoice((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (id: string) => {
    if (invoice.items.length <= 1) return;
    setInvoice((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  // Calculations
  const subtotalBeforeDiscount = invoice.items.reduce(
    (acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  const totalDiscount = invoice.items.reduce((acc, item) => acc + (item.discount || 0), 0);
  const subtotalAfterDiscount = subtotalBeforeDiscount - totalDiscount;

  const totalTax = invoice.items.reduce((acc, item) => {
    const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0) - (item.discount || 0);
    const taxable = Math.max(0, itemSubtotal);
    return acc + taxable * ((item.taxPercent || 0) / 100);
  }, 0);

  const grandTotal = Math.max(0, subtotalAfterDiscount + totalTax + (invoice.shippingCost || 0));

  // Print Action
  const handlePrint = () => {
    setActiveTab('preview');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Download JSON backup
  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(invoice, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `invoice-${invoice.invoiceNumber}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Theme styling map
  const colorStyles = {
    blue: {
      primary: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-600',
      light: 'bg-blue-50 dark:bg-blue-950/40',
      badge: 'bg-blue-600 text-white',
      accentBorder: 'border-blue-500',
    },
    emerald: {
      primary: 'bg-emerald-600',
      text: 'text-emerald-600',
      border: 'border-emerald-600',
      light: 'bg-emerald-50 dark:bg-emerald-950/40',
      badge: 'bg-emerald-600 text-white',
      accentBorder: 'border-emerald-500',
    },
    slate: {
      primary: 'bg-slate-800',
      text: 'text-slate-800',
      border: 'border-slate-800',
      light: 'bg-slate-100 dark:bg-slate-800',
      badge: 'bg-slate-800 text-white',
      accentBorder: 'border-slate-700',
    },
    indigo: {
      primary: 'bg-indigo-600',
      text: 'text-indigo-600',
      border: 'border-indigo-600',
      light: 'bg-indigo-50 dark:bg-indigo-950/40',
      badge: 'bg-indigo-600 text-white',
      accentBorder: 'border-indigo-500',
    },
    amber: {
      primary: 'bg-amber-600',
      text: 'text-amber-600',
      border: 'border-amber-600',
      light: 'bg-amber-50 dark:bg-amber-950/40',
      badge: 'bg-amber-600 text-white',
      accentBorder: 'border-amber-500',
    },
  }[invoice.themeColor];

  const formatNumber = (num: number) => (num || 0).toLocaleString();

  // Document Title by businessType
  const getDocumentTitle = () => {
    switch (invoice.businessType) {
      case 'official':
        return isEn ? 'TAX INVOICE' : 'صورت‌حساب فروش کالا و خدمات (فاکتور رسمی)';
      case 'commercial':
        return isEn ? 'COMMERCIAL INVOICE' : 'فاکتور فروش کالا و خدمات';
      case 'services':
        return isEn ? 'SERVICE INVOICE' : 'صورت‌حساب ارائه خدمات و فریلنسری';
      case 'proforma':
        return isEn ? 'PROFORMA INVOICE' : 'پیش‌فاکتور (Proforma)';
      case 'receipt':
        return isEn ? 'PAYMENT RECEIPT' : 'رسید پرداخت و تسویه حساب';
      default:
        return isEn ? 'INVOICE' : 'فاکتور فروش';
    }
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Print isolation stylesheet */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, nav, .print\\:hidden, #feedback-pill, #theme-toggle {
            display: none !important;
          }
          #printable-invoice {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      {/* Main Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm print:hidden">
        {/* Tab Selector: Edit vs Preview */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
              activeTab === 'edit'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>{isEn ? 'Edit Invoice' : 'ویرایش مشخصات فاکتور'}</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isEn ? 'Printable A4 Preview' : 'پیش‌نمایش چاپ A4'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isEn ? 'Print / Export PDF' : 'چاپ مستقیم و ذخیره PDF'}</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <Save className="w-4 h-4 text-slate-500" />}
            <span>{savedSuccess ? (isEn ? 'Saved!' : 'ذخیره شد') : (isEn ? 'Save Draft' : 'ذخیره پیش‌نویس')}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition"
            title={isEn ? 'Backup to JSON' : 'دانلود پشتیبان JSON'}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            title={isEn ? 'Reset and New Invoice' : 'ایجاد فاکتور جدید'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- TAB 1: EDIT FORM --- */}
      {activeTab === 'edit' && (
        <div className="space-y-6 print:hidden">
          {/* Invoice Type Selection Pills (For Multiple Business Types) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>{isEn ? 'Select Invoice Type (Business Model):' : 'انتخاب نوع فاکتور (متناسب با کسب‌وکار شما):'}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {isEn ? 'Customized fields and rules' : 'تنظیم خودکار ستون‌ها و استانداردهای مالی'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              {[
                { id: 'official', fa: 'فاکتور رسمی مالیاتی', en: 'Official Tax Invoice', descFa: 'ماده ۱۶۹ مکرر با ارزش افزوده', descEn: 'Compliant with VAT & Tax codes' },
                { id: 'commercial', fa: 'فاکتور فروش کالا', en: 'Retail & Commercial', descFa: 'فروشگاه‌ها، اصناف و انبارداری', descEn: 'Stores, e-commerce & inventory' },
                { id: 'services', fa: 'فاکتور خدمات و فریلنسری', en: 'Freelance & Services', descFa: 'برنامه‌نویسان، پروژه‌ای و مشاوره‌ای', descEn: 'Engineers, consulting & hourly' },
                { id: 'proforma', fa: 'پیش‌فاکتور (Proforma)', en: 'Proforma Invoice', descFa: 'اعلام قیمت رسمی و مهلت اعتبار', descEn: 'Quotation with validity period' },
                { id: 'receipt', fa: 'رسید و فیش پرداخت', en: 'Payment Receipt', descFa: 'ثبت تسویه و کد رهگیری بانکی', descEn: 'Voucher with settlement tracking' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => applyBusinessTypePreset(btn.id as InvoiceBusinessType)}
                  className={`p-3 rounded-xl border text-start transition-all ${
                    invoice.businessType === btn.id
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <strong className="block text-xs font-bold">{isEn ? btn.en : btn.fa}</strong>
                  <span className="block text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {isEn ? btn.descEn : btn.descFa}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Business Logo & Theme Customization Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Logo Upload Box (7 Cols) */}
            <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  <span>{isEn ? 'Business Logo & Digital Stamp:' : 'لوگوی اختصاصی و مهر شرکت:'}</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {isEn ? 'PNG, JPG, SVG (Max 3MB)' : 'فرمت‌های تصویری تا سقف ۳ مگابایت'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Logo Box */}
                <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center space-y-2">
                  {invoice.sellerLogo ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs max-h-20 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={invoice.sellerLogo}
                          alt="Company Logo"
                          style={{ maxWidth: `${invoice.sellerLogoWidth}px`, maxHeight: '60px' }}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">
                          <span>{isEn ? 'Change Logo' : 'تغییر لوگو'}</span>
                          <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => setInvoice({ ...invoice, sellerLogo: '' })}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          {isEn ? 'Remove' : 'حذف'}
                        </button>
                      </div>

                      {/* Width slider */}
                      <div className="w-full pt-1 flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{isEn ? 'Size:' : 'سایز:'}</span>
                        <input
                          type="range"
                          min={50}
                          max={220}
                          value={invoice.sellerLogoWidth}
                          onChange={(e) => setInvoice({ ...invoice, sellerLogoWidth: Number(e.target.value) })}
                          className="w-full accent-blue-600"
                        />
                        <span className="font-mono">{invoice.sellerLogoWidth}px</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                          <span>{isEn ? 'Upload Company Logo' : 'بارگذاری لوگوی اختصاصی'}</span>
                          <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isEn ? 'Appears on the top header' : 'در بالای سربرگ فاکتور نمایش می‌یابد'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Stamp & Signature Box */}
                <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center space-y-2">
                  {invoice.sellerStamp ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs max-h-20 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={invoice.sellerStamp}
                          alt="Official Stamp"
                          className="max-h-16 object-contain"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">
                          <span>{isEn ? 'Change Stamp' : 'تغییر مهر'}</span>
                          <input type="file" accept="image/*" ref={stampInputRef} onChange={handleStampUpload} className="hidden" />
                        </label>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => setInvoice({ ...invoice, sellerStamp: '' })}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          {isEn ? 'Remove' : 'حذف'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                        <Stamp className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-amber-600 hover:underline cursor-pointer">
                          <span>{isEn ? 'Upload Stamp / Signature' : 'آپلود مهر و امضای دیجیتال'}</span>
                          <input type="file" accept="image/*" ref={stampInputRef} onChange={handleStampUpload} className="hidden" />
                        </label>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isEn ? 'Placed in seller signature section' : 'در بخش مهر و امضای فاکتور درج می‌شود'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Styling, Theme & Currency (5 Cols) */}
            <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {isEn ? 'Design Theme & Currency:' : 'قالب چیدمان و واحد پول:'}
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Layout Theme */}
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    {isEn ? 'Layout Template:' : 'طرح چیدمان:'}
                  </label>
                  <select
                    value={invoice.layoutTheme}
                    onChange={(e) => setInvoice({ ...invoice, layoutTheme: e.target.value as InvoiceLayoutTheme })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:outline-none"
                  >
                    <option value="classic">{isEn ? 'Classic Official' : 'رسمی و اداری (کلاسیک)'}</option>
                    <option value="modern">{isEn ? 'Modern Clean' : 'مدرن و شرکتی'}</option>
                    <option value="minimal">{isEn ? 'Minimal (Paper-saver)' : 'ساده و فشرده'}</option>
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    {isEn ? 'Currency:' : 'واحد پولی:'}
                  </label>
                  <select
                    value={invoice.currency}
                    onChange={(e) => setInvoice({ ...invoice, currency: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:outline-none"
                  >
                    <option value="تومان">تومان (Toman)</option>
                    <option value="ریال">ریال (Rial)</option>
                    <option value="USD">دلار آمریکا ($ USD)</option>
                    <option value="EUR">یورو (€ EUR)</option>
                    <option value="GBP">پوند (£ GBP)</option>
                    <option value="درهم">درهم امارات (AED)</option>
                  </select>
                </div>
              </div>

              {/* Color Accents */}
              <div>
                <label className="text-[11px] text-slate-500 block mb-1.5">
                  {isEn ? 'Color Accent:' : 'رنگ سازمانی فاکتور:'}
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'blue', color: 'bg-blue-600', name: 'آبی' },
                    { id: 'emerald', color: 'bg-emerald-600', name: 'سبز' },
                    { id: 'slate', color: 'bg-slate-800', name: 'ذغالی' },
                    { id: 'indigo', color: 'bg-indigo-600', name: 'بنفش' },
                    { id: 'amber', color: 'bg-amber-600', name: 'طلایی' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setInvoice({ ...invoice, themeColor: t.id as InvoiceColor })}
                      className={`w-7 h-7 rounded-full ${t.color} flex items-center justify-center transition-all ${
                        invoice.themeColor === t.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={t.name}
                    >
                      {invoice.themeColor === t.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seller & Buyer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SELLER CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>{isEn ? 'Seller Details (Vendor / Your Business):' : 'مشخصات فروشنده (کسب‌وکار شما):'}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    {isEn ? 'Business / Company / Individual Name:' : 'نام فروشگاه، شرکت یا شخص حقیقی:'}
                  </label>
                  <input
                    type="text"
                    value={invoice.sellerName}
                    onChange={(e) => setInvoice({ ...invoice, sellerName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      {isEn ? 'National ID / Tax ID:' : 'شناسه ملی / کد ملی:'}
                    </label>
                    <input
                      type="text"
                      value={invoice.sellerNationalId}
                      onChange={(e) => setInvoice({ ...invoice, sellerNationalId: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      {isEn ? 'Economic Code:' : 'شماره اقتصادی:'}
                    </label>
                    <input
                      type="text"
                      value={invoice.sellerEconomicCode}
                      onChange={(e) => setInvoice({ ...invoice, sellerEconomicCode: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      {isEn ? 'Phone Number:' : 'شماره تماس:'}
                    </label>
                    <input
                      type="text"
                      value={invoice.sellerPhone}
                      onChange={(e) => setInvoice({ ...invoice, sellerPhone: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      {isEn ? 'Postal Code:' : 'کد پستی:'}
                    </label>
                    <input
                      type="text"
                      value={invoice.sellerPostalCode}
                      onChange={(e) => setInvoice({ ...invoice, sellerPostalCode: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    {isEn ? 'Full Address:' : 'نشانی کامل:'}
                  </label>
                  <input
                    type="text"
                    value={invoice.sellerAddress}
                    onChange={(e) => setInvoice({ ...invoice, sellerAddress: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>

                {/* Bank account details */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                    {isEn ? 'Bank Settlement Details:' : 'اطلاعات بانکی جهت واریز وجه:'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={isEn ? 'Bank Name' : 'نام بانک'}
                      value={invoice.sellerBankName}
                      onChange={(e) => setInvoice({ ...invoice, sellerBankName: e.target.value })}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                    <input
                      type="text"
                      placeholder={isEn ? 'Card Number' : 'شماره کارت'}
                      value={invoice.sellerCardNumber}
                      onChange={(e) => setInvoice({ ...invoice, sellerCardNumber: e.target.value })}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder={isEn ? 'IBAN (e.g. IR...)' : 'شماره شبا (با IR)'}
                    value={invoice.sellerIban}
                    onChange={(e) => setInvoice({ ...invoice, sellerIban: e.target.value })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* BUYER CARD & INVOICE META */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
                <User className="w-4 h-4 text-emerald-500" />
                <span>{isEn ? 'Buyer Details (Customer / Client):' : 'مشخصات خریدار (مشتری):'}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    {isEn ? 'Customer / Company Name:' : 'نام خریدار (شخص یا شرکت):'}
                  </label>
                  <input
                    type="text"
                    value={invoice.buyerName}
                    onChange={(e) => setInvoice({ ...invoice, buyerName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      {isEn ? 'National ID / Tax ID:' : 'شناسه ملی / کد ملی خریدار:'}
                    </label>
                    <input
                      type="text"
                      value={invoice.buyerNationalId}
                      onChange={(e) => setInvoice({ ...invoice, buyerNationalId: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      {isEn ? 'Economic Code:' : 'شماره اقتصادی:'}
                    </label>
                    <input
                      type="text"
                      value={invoice.buyerEconomicCode}
                      onChange={(e) => setInvoice({ ...invoice, buyerEconomicCode: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      {isEn ? 'Phone:' : 'شماره تماس خریدار:'}
                    </label>
                    <input
                      type="text"
                      value={invoice.buyerPhone}
                      onChange={(e) => setInvoice({ ...invoice, buyerPhone: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      {isEn ? 'Postal Code:' : 'کد پستی:'}
                    </label>
                    <input
                      type="text"
                      value={invoice.buyerPostalCode}
                      onChange={(e) => setInvoice({ ...invoice, buyerPostalCode: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    {isEn ? 'Address:' : 'نشانی کامل خریدار:'}
                  </label>
                  <input
                    type="text"
                    value={invoice.buyerAddress}
                    onChange={(e) => setInvoice({ ...invoice, buyerAddress: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>

                {/* Invoice Meta Grid */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                    {isEn ? 'Invoice Number & Dates:' : 'مشخصات سند و تاریخ‌ها:'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">{isEn ? 'Invoice #' : 'شماره فاکتور:'}</span>
                      <input
                        type="text"
                        value={invoice.invoiceNumber}
                        onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                        className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">{isEn ? 'Issue Date:' : 'تاریخ صدور:'}</span>
                      <input
                        type="text"
                        value={invoice.issueDate}
                        onChange={(e) => setInvoice({ ...invoice, issueDate: e.target.value })}
                        className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {invoice.businessType === 'proforma' && (
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">{isEn ? 'Quotation Validity:' : 'مهلت اعتبار پیش‌فاکتور:'}</span>
                      <input
                        type="text"
                        value={invoice.validityDays}
                        onChange={(e) => setInvoice({ ...invoice, validityDays: e.target.value })}
                        placeholder={isEn ? 'e.g. 7 Days' : 'مثال: ۷ روز کاری'}
                        className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  )}

                  {invoice.businessType === 'receipt' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">{isEn ? 'Payment Method:' : 'روش تسویه:'}</span>
                        <input
                          type="text"
                          value={invoice.paymentMethod}
                          onChange={(e) => setInvoice({ ...invoice, paymentMethod: e.target.value })}
                          placeholder={isEn ? 'Cash / POS / Wire' : 'کارتخوان / پایا / چک'}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">{isEn ? 'Tracking / Ref #:' : 'شماره پیگیری:'}</span>
                        <input
                          type="text"
                          value={invoice.trackingCode}
                          onChange={(e) => setInvoice({ ...invoice, trackingCode: e.target.value })}
                          className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isEn ? 'Invoice Line Items (Products & Services):' : 'اقلام فاکتور (کالاها و خدمات):'}
              </h3>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isEn ? 'Add Item' : 'افزودن سطر جدید'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-700 dark:text-slate-200 border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px]">
                  <tr>
                    <th className="p-2 w-10 text-center">#</th>
                    <th className="p-2 text-start min-w-[220px]">{isEn ? 'Description' : 'شرح کالا یا خدمات'}</th>
                    <th className="p-2 w-20 text-center">{isEn ? 'Qty' : 'تعداد'}</th>
                    <th className="p-2 w-24 text-center">{isEn ? 'Unit' : 'واحد'}</th>
                    <th className="p-2 w-36 text-start">{isEn ? 'Unit Price' : 'قیمت واحد'}</th>
                    <th className="p-2 w-28 text-start">{isEn ? 'Discount' : 'تخفیف'}</th>
                    {invoice.businessType !== 'services' && invoice.businessType !== 'receipt' && (
                      <th className="p-2 w-20 text-center">{isEn ? 'Tax %' : 'ارزش‌افزوده %'}</th>
                    )}
                    <th className="p-2 w-36 text-end">{isEn ? 'Total' : 'مبلغ کل'}</th>
                    <th className="p-2 w-10 text-center"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoice.items.map((item, idx) => {
                    const rowSubtotal = item.quantity * item.unitPrice - item.discount;
                    const rowTax = Math.max(0, rowSubtotal) * ((item.taxPercent || 0) / 100);
                    const rowTotal = Math.max(0, rowSubtotal + rowTax);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                            placeholder={isEn ? 'Item or service name...' : 'شرح خدمت یا نام کالا...'}
                            className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                            className="w-full p-2 text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                            placeholder={isEn ? 'Unit' : 'عدد / ساعت'}
                            className="w-full p-2 text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                            className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:outline-none"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleUpdateItem(item.id, 'discount', Number(e.target.value))}
                            className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:outline-none"
                          />
                        </td>
                        {invoice.businessType !== 'services' && invoice.businessType !== 'receipt' && (
                          <td className="p-1">
                            <input
                              type="number"
                              value={item.taxPercent}
                              onChange={(e) => handleUpdateItem(item.id, 'taxPercent', Number(e.target.value))}
                              className="w-full p-2 text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:outline-none"
                            />
                          </td>
                        )}
                        <td className="p-2 text-end font-mono font-bold text-slate-800 dark:text-slate-100">
                          {formatNumber(rowTotal)}
                        </td>
                        <td className="p-1 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={invoice.items.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shipping, Notes & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isEn ? 'Shipping / Delivery Cost:' : 'هزینه ارسال و بسته‌بندی:'}
              </label>
              <input
                type="number"
                value={invoice.shippingCost}
                onChange={(e) => setInvoice({ ...invoice, shippingCost: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold focus:outline-none"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isEn ? 'Terms & Payment Conditions:' : 'شرایط پرداخت و تسویه:'}
              </label>
              <textarea
                value={invoice.terms}
                onChange={(e) => setInvoice({ ...invoice, terms: e.target.value })}
                rows={3}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none resize-none"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isEn ? 'Notes & Remarks:' : 'توضیحات و یادداشت تکمیلی:'}
              </label>
              <textarea
                value={invoice.notes}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                rows={3}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: LIVE A4 PRINTABLE DOCUMENT --- */}
      <div className={`${activeTab === 'edit' ? 'hidden print:block' : 'block'} flex justify-center`}>
        <div
          id="printable-invoice"
          className="w-full max-w-[840px] bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-12 space-y-6"
          style={{ minHeight: '1100px' }}
        >
          {/* Top Document Header */}
          <div className="flex items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            {/* Logo and Company Name */}
            <div className="flex items-center gap-4">
              {invoice.sellerLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={invoice.sellerLogo}
                  alt="Company Logo"
                  style={{ maxWidth: `${invoice.sellerLogoWidth}px`, maxHeight: '80px' }}
                  className="object-contain"
                />
              ) : (
                <div
                  className={`w-14 h-14 rounded-2xl ${colorStyles.primary} text-white flex items-center justify-center font-black text-xl shadow-sm`}
                >
                  {invoice.sellerName.slice(0, 1) || 'Z'}
                </div>
              )}
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  {invoice.sellerName}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {invoice.sellerAddress}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                  {invoice.sellerPhone && <span>تلفن: {invoice.sellerPhone}</span>}
                  {invoice.sellerPostalCode && <span>کد پستی: {invoice.sellerPostalCode}</span>}
                </div>
              </div>
            </div>

            {/* Document Title & Meta Box */}
            <div className="text-end shrink-0">
              <div
                className={`inline-block px-4 py-1.5 rounded-lg ${colorStyles.badge} font-black text-xs sm:text-sm uppercase tracking-wide mb-2`}
              >
                {getDocumentTitle()}
              </div>

              {invoice.businessType === 'receipt' && (
                <div className="inline-block ms-2 px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                  {isEn ? 'PAID' : 'تسویه شد'}
                </div>
              )}

              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-slate-400 me-1">{isEn ? 'Invoice No:' : 'شماره:'}</span>
                  <strong className="font-mono text-slate-800">{invoice.invoiceNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 me-1">{isEn ? 'Date:' : 'تاریخ:'}</span>
                  <span className="font-mono text-slate-800">{invoice.issueDate}</span>
                </div>
                {invoice.dueDate && (
                  <div>
                    <span className="text-slate-400 me-1">{isEn ? 'Due Date:' : 'سررسید:'}</span>
                    <span className="font-mono text-slate-800">{invoice.dueDate}</span>
                  </div>
                )}
                {invoice.validityDays && invoice.businessType === 'proforma' && (
                  <div>
                    <span className="text-slate-400 me-1">{isEn ? 'Validity:' : 'مهلت اعتبار:'}</span>
                    <span className="font-bold text-slate-700">{invoice.validityDays}</span>
                  </div>
                )}
                {invoice.trackingCode && invoice.businessType === 'receipt' && (
                  <div>
                    <span className="text-slate-400 me-1">{isEn ? 'Ref #:' : 'کد رهگیری:'}</span>
                    <span className="font-mono font-bold text-emerald-700">{invoice.trackingCode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seller / Buyer Boxes */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Seller Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
              <span className={`text-[11px] font-bold ${colorStyles.text} block mb-1`}>
                {isEn ? 'SELLER / VENDOR' : 'مشخصات فروشنده:'}
              </span>
              <p className="font-bold text-slate-900">{invoice.sellerName}</p>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                {invoice.sellerEconomicCode && (
                  <span>شماره اقتصادی: <strong className="font-mono">{invoice.sellerEconomicCode}</strong></span>
                )}
                {invoice.sellerNationalId && (
                  <span>شناسه ملی: <strong className="font-mono">{invoice.sellerNationalId}</strong></span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                نشانی: {invoice.sellerAddress}
              </p>
            </div>

            {/* Buyer Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
              <span className={`text-[11px] font-bold ${colorStyles.text} block mb-1`}>
                {isEn ? 'BUYER / CLIENT' : 'مشخصات خریدار:'}
              </span>
              <p className="font-bold text-slate-900">{invoice.buyerName}</p>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                {invoice.buyerEconomicCode && (
                  <span>شماره اقتصادی: <strong className="font-mono">{invoice.buyerEconomicCode}</strong></span>
                )}
                {invoice.buyerNationalId && (
                  <span>شناسه / کد ملی: <strong className="font-mono">{invoice.buyerNationalId}</strong></span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                نشانی: {invoice.buyerAddress || '---'} {invoice.buyerPhone && `(تلفن: ${invoice.buyerPhone})`}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-xs text-slate-800 border-collapse">
              <thead className={`${colorStyles.badge} text-[11px]`}>
                <tr>
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5 text-start">{isEn ? 'Description' : 'شرح کالا یا خدمات'}</th>
                  <th className="p-2.5 text-center w-16">{isEn ? 'Qty' : 'تعداد'}</th>
                  <th className="p-2.5 text-center w-20">{isEn ? 'Unit' : 'واحد'}</th>
                  <th className="p-2.5 text-end w-32">{isEn ? `Price (${invoice.currency})` : `مبلغ واحد (${invoice.currency})`}</th>
                  <th className="p-2.5 text-end w-24">{isEn ? 'Discount' : 'تخفیف'}</th>
                  {invoice.businessType !== 'services' && invoice.businessType !== 'receipt' && (
                    <th className="p-2.5 text-center w-20">{isEn ? 'VAT %' : 'ارزش‌افزوده'}</th>
                  )}
                  <th className="p-2.5 text-end w-36">{isEn ? `Total (${invoice.currency})` : `مبلغ کل (${invoice.currency})`}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, idx) => {
                  const rowSubtotal = item.quantity * item.unitPrice - item.discount;
                  const rowTax = Math.max(0, rowSubtotal) * ((item.taxPercent || 0) / 100);
                  const rowTotal = Math.max(0, rowSubtotal + rowTax);

                  return (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-medium">{item.description}</td>
                      <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                      <td className="p-2.5 text-center text-slate-600">{item.unit}</td>
                      <td className="p-2.5 text-end font-mono">{formatNumber(item.unitPrice)}</td>
                      <td className="p-2.5 text-end font-mono text-slate-500">
                        {item.discount > 0 ? formatNumber(item.discount) : '-'}
                      </td>
                      {invoice.businessType !== 'services' && invoice.businessType !== 'receipt' && (
                        <td className="p-2.5 text-center font-mono text-slate-500">
                          {rowTax > 0 ? `${item.taxPercent}%` : '-'}
                        </td>
                      )}
                      <td className="p-2.5 text-end font-mono font-bold text-slate-900">
                        {formatNumber(rowTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Calculations Breakdown */}
          <div className="grid grid-cols-12 gap-6 pt-2">
            {/* Amount in words & Bank Account (7 Cols) */}
            <div className="col-span-7 space-y-4 text-xs">
              {/* Words */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 block">
                  {isEn ? 'Total Amount in Words:' : 'مبلغ کل به حروف:'}
                </span>
                <p className="font-bold text-slate-800 leading-relaxed">
                  {isEn ? (
                    `${numberToEnglishWords(grandTotal)} ${invoice.currency} Only`
                  ) : (
                    `${numberToPersianWords(grandTotal)} ${invoice.currency} تمام`
                  )}
                </p>
              </div>

              {/* Bank Account */}
              {(invoice.sellerIban || invoice.sellerCardNumber) && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 block">
                    {isEn ? 'Bank Account Details for Payment:' : 'شماره حساب جهت واریز وجه:'}
                  </span>
                  {invoice.sellerBankName && <div>بانک: <strong>{invoice.sellerBankName}</strong></div>}
                  {invoice.sellerIban && <div>شماره شبا: <strong className="font-mono">{invoice.sellerIban}</strong></div>}
                  {invoice.sellerCardNumber && <div>شماره کارت: <strong className="font-mono">{invoice.sellerCardNumber}</strong></div>}
                </div>
              )}
            </div>

            {/* Calculations Table (5 Cols) */}
            <div className="col-span-5 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{isEn ? 'Subtotal:' : 'جمع اقلام:'}</span>
                <span className="font-mono font-bold">{formatNumber(subtotalBeforeDiscount)} {invoice.currency}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-red-600">
                  <span>{isEn ? 'Total Discount:' : 'مجموع تخفیف:'}</span>
                  <span className="font-mono font-bold">- {formatNumber(totalDiscount)} {invoice.currency}</span>
                </div>
              )}

              {invoice.businessType !== 'services' && invoice.businessType !== 'receipt' && totalTax > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'VAT Tax:' : 'مالیات بر ارزش افزوده:'}</span>
                  <span className="font-mono font-bold">+ {formatNumber(totalTax)} {invoice.currency}</span>
                </div>
              )}

              {invoice.shippingCost > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Shipping Fee:' : 'هزینه ارسال:'}</span>
                  <span className="font-mono font-bold">+ {formatNumber(invoice.shippingCost)} {invoice.currency}</span>
                </div>
              )}

              <div className={`flex justify-between items-center p-3 rounded-xl ${colorStyles.light} border ${colorStyles.border} mt-2`}>
                <span className="font-black text-sm text-slate-900">
                  {isEn ? 'Grand Total:' : 'مبلغ نهایی فاکتور:'}
                </span>
                <span className={`font-mono font-black text-base ${colorStyles.text}`}>
                  {formatNumber(grandTotal)} {invoice.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Signatures */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            {invoice.terms && (
              <div className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                <strong className="text-slate-700 block mb-0.5">{isEn ? 'Terms & Notes:' : 'شرایط فاکتور:'}</strong>
                {invoice.terms}
              </div>
            )}

            {invoice.notes && (
              <div className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                <strong className="text-slate-700 block mb-0.5">{isEn ? 'Additional Remarks:' : 'یادداشت‌های پیوست:'}</strong>
                {invoice.notes}
              </div>
            )}

            {/* Stamp & Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs text-slate-600">
              <div className="space-y-4 flex flex-col items-center justify-between min-h-[90px]">
                <span className="font-bold">{isEn ? 'Authorized Seller Signature & Stamp' : 'مهر و امضای فروشنده'}</span>
                {invoice.sellerStamp ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={invoice.sellerStamp} alt="Stamp" className="max-h-20 object-contain mx-auto" />
                ) : (
                  <div className="border-b border-dashed border-slate-300 w-44 mt-12" />
                )}
              </div>
              <div className="space-y-4 flex flex-col items-center justify-between min-h-[90px]">
                <span className="font-bold">{isEn ? 'Customer Acceptance Signature' : 'مهر و امضای تحویل‌گیرنده (خریدار)'}</span>
                <div className="border-b border-dashed border-slate-300 w-44 mt-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
