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
  DollarSign,
  Percent,
  Check,
  Copy,
  Upload,
  RefreshCw,
  Save,
  FolderOpen,
  Eye,
  FileEdit,
  Sparkles,
  ShieldCheck,
  Layers
} from 'lucide-react';

interface InvoiceGeneratorProps {
  locale?: string;
  dict?: any;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number; // amount
  taxPercent: number; // e.g. 10%
}

interface InvoiceData {
  invoiceType: 'official' | 'simple' | 'proforma';
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: 'تومان' | 'ریال' | 'USD' | 'EUR';
  themeColor: 'blue' | 'emerald' | 'slate' | 'indigo';

  // Seller Info
  sellerLogo: string;
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

  // Terms & Footer
  shippingCost: number;
  notes: string;
  terms: string;
}

// Persian Number to Words Helper
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

export function InvoiceGenerator({ locale = 'fa' }: InvoiceGeneratorProps) {
  const isEn = locale === 'en';

  const getTodayJalali = () => {
    try {
      const parts = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      // Convert Persian numbers to English
      return parts.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    } catch {
      return '1404/01/01';
    }
  };

  const initialFaData: InvoiceData = {
    invoiceType: 'official',
    invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    issueDate: getTodayJalali(),
    dueDate: '',
    currency: 'تومان',
    themeColor: 'blue',

    sellerLogo: '',
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

    buyerName: 'شرکت فناوری اطلاعات آفرینش',
    buyerEconomicCode: '411987654321',
    buyerNationalId: '10103456789',
    buyerPhone: '021-22334455',
    buyerPostalCode: '1415678901',
    buyerAddress: 'تهران، بلوار سعادت‌آباد، خیابان یکم، پلاک ۲۴',

    items: [
      {
        id: '1',
        description: 'طراحی سیستم طراحی اختصاصی و رابط کاربری وب‌اپلیکیشن (UI/UX)',
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

  const initialEnData: InvoiceData = {
    invoiceType: 'official',
    invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    currency: 'USD',
    themeColor: 'blue',

    sellerLogo: '',
    sellerName: 'ZebraCode Software Solutions Inc.',
    sellerEconomicCode: 'US-98765432',
    sellerNationalId: 'EIN-12-3456789',
    sellerRegistrationNumber: 'REG-88990',
    sellerPhone: '+1 (555) 345-6789',
    sellerPostalCode: '94105',
    sellerAddress: '500 Howard Street, Suite 400, San Francisco, CA 94105',
    sellerBankName: 'Silicon Valley Bank',
    sellerIban: 'US89SVBK00001234567890',
    sellerCardNumber: '**** **** **** 4892',

    buyerName: 'Acme Digital Global Corp.',
    buyerEconomicCode: 'EU-11223344',
    buyerNationalId: 'VAT-GB99887766',
    buyerPhone: '+1 (555) 789-0123',
    buyerPostalCode: '10001',
    buyerAddress: '350 5th Avenue, New York, NY 10001',

    items: [
      {
        id: '1',
        description: 'Custom UI/UX Design System & Mobile App Prototype in Figma',
        quantity: 1,
        unit: 'Project',
        unitPrice: 1800,
        discount: 100,
        taxPercent: 10,
      },
      {
        id: '2',
        description: 'Next.js 15 Full-Stack Web Application Engineering & API Integration',
        quantity: 1,
        unit: 'Project',
        unitPrice: 3500,
        discount: 0,
        taxPercent: 10,
      },
      {
        id: '3',
        description: 'Monthly Cloud Infrastructure Maintenance & Performance Monitoring',
        quantity: 1,
        unit: 'Month',
        unitPrice: 450,
        discount: 50,
        taxPercent: 10,
      },
    ],

    shippingCost: 0,
    notes: 'Technical documentation and full repository access will be granted upon settlement.',
    terms: '1. Payment is due within 15 days of invoice date.\n2. Work includes 90 days of dedicated maintenance and defect resolution.',
  };

  const [invoice, setInvoice] = useState<InvoiceData>(isEn ? initialEnData : initialFaData);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zebracode_invoice_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.items) {
          setInvoice(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save to localStorage
  const handleSaveDraft = () => {
    try {
      localStorage.setItem('zebracode_invoice_draft', JSON.stringify(invoice));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {
      // Ignore
    }
  };

  // Reset to initial
  const handleReset = () => {
    if (confirm(isEn ? 'Reset invoice and create new?' : 'آیا مایلید تمام فیلدها بازنشانی شده و فاکتور جدید ایجاد شود؟')) {
      setInvoice(isEn ? initialEnData : initialFaData);
      localStorage.removeItem('zebracode_invoice_draft');
    }
  };

  // Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(isEn ? 'Logo image size must be under 2MB.' : 'حجم لوگو نباید بیشتر از ۲ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setInvoice((prev) => ({ ...prev, sellerLogo: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Item modifications
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: isEn ? 'Item' : 'عدد',
      unitPrice: 0,
      discount: 0,
      taxPercent: invoice.invoiceType === 'official' ? 10 : 0,
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

  // Theme Colors
  const themeClasses = {
    blue: {
      primary: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-600',
      light: 'bg-blue-50 dark:bg-blue-950/40',
      headerBg: 'bg-blue-600 text-white',
    },
    emerald: {
      primary: 'bg-emerald-600',
      text: 'text-emerald-600',
      border: 'border-emerald-600',
      light: 'bg-emerald-50 dark:bg-emerald-950/40',
      headerBg: 'bg-emerald-600 text-white',
    },
    slate: {
      primary: 'bg-slate-800',
      text: 'text-slate-800',
      border: 'border-slate-800',
      light: 'bg-slate-100 dark:bg-slate-800',
      headerBg: 'bg-slate-800 text-white',
    },
    indigo: {
      primary: 'bg-indigo-600',
      text: 'text-indigo-600',
      border: 'border-indigo-600',
      light: 'bg-indigo-50 dark:bg-indigo-950/40',
      headerBg: 'bg-indigo-600 text-white',
    },
  }[invoice.themeColor];

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString();
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Print Stylesheet overrides */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
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

      {/* Control & Action Toolbar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm print:hidden">
        {/* Tab Selector: Edit vs Preview */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'edit'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>{isEn ? 'Edit Invoice' : 'ویرایش مشخصات'}</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isEn ? 'Live A4 Preview' : 'پیش‌نمایش چاپ A4'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print / Save PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isEn ? 'Print / Export PDF' : 'چاپ و دانلود مستقیم PDF'}</span>
          </button>

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <Save className="w-4 h-4 text-slate-500" />}
            <span>{savedSuccess ? (isEn ? 'Saved!' : 'ذخیره شد') : (isEn ? 'Save Draft' : 'ذخیره پیش‌نویس')}</span>
          </button>

          {/* Download JSON */}
          <button
            onClick={handleDownloadJson}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition"
            title={isEn ? 'Backup to JSON' : 'دانلود فایل پشتیبان JSON'}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            title={isEn ? 'Reset and New Invoice' : 'ایجاد فاکتور جدید و پاک‌سازی'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- TAB 1: EDIT FORM --- */}
      {activeTab === 'edit' && (
        <div className="space-y-6 print:hidden">
          {/* Top Configuration Card: Type, Color & Currency */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isEn ? 'General Invoice Settings' : 'تنظیمات کلی فاکتور'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Type */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  {isEn ? 'Invoice Standard:' : 'نوع سند:'}
                </label>
                <select
                  value={invoice.invoiceType}
                  onChange={(e) => setInvoice({ ...invoice, invoiceType: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:outline-none"
                >
                  <option value="official">{isEn ? 'Official Tax Invoice (VAT)' : 'فاکتور رسمی (ماده ۱۶۹ مکرر / مالیاتی)'}</option>
                  <option value="simple">{isEn ? 'Standard Invoice' : 'فاکتور فروش عادی / فروشگاهی'}</option>
                  <option value="proforma">{isEn ? 'Proforma Invoice' : 'پیش‌فاکتور (Proforma)'}</option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  {isEn ? 'Currency:' : 'واحد پولی فاکتور:'}
                </label>
                <select
                  value={invoice.currency}
                  onChange={(e) => setInvoice({ ...invoice, currency: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:outline-none"
                >
                  <option value="تومان">تومان (Toman)</option>
                  <option value="ریال">ریال (Rial)</option>
                  <option value="USD">دلار آمریکا (USD $)</option>
                  <option value="EUR">یورو (EUR €)</option>
                </select>
              </div>

              {/* Theme Color */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  {isEn ? 'Color Accent:' : 'رنگ سازمانی فاکتور:'}
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {[
                    { id: 'blue', color: 'bg-blue-600' },
                    { id: 'emerald', color: 'bg-emerald-600' },
                    { id: 'slate', color: 'bg-slate-800' },
                    { id: 'indigo', color: 'bg-indigo-600' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setInvoice({ ...invoice, themeColor: t.id as any })}
                      className={`w-7 h-7 rounded-full ${t.color} flex items-center justify-center transition ${
                        invoice.themeColor === t.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'opacity-80'
                      }`}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span>{isEn ? 'Seller Details (Vendor):' : 'مشخصات فروشنده (کسب‌وکار شما):'}</span>
                </div>

                {/* Logo Upload button */}
                <label className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 cursor-pointer hover:underline">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{invoice.sellerLogo ? (isEn ? 'Change Logo' : 'تغییر لوگو') : (isEn ? 'Upload Logo' : 'آپلود لوگوی کسب‌وکار')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {invoice.sellerLogo && (
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={invoice.sellerLogo} alt="Logo" className="w-12 h-12 object-contain rounded" />
                  <span className="text-xs text-slate-500">{isEn ? 'Custom logo active' : 'لوگوی شما بارگذاری شد'}</span>
                  <button
                    onClick={() => setInvoice({ ...invoice, sellerLogo: '' })}
                    className="text-xs text-red-500 hover:underline ms-auto"
                  >
                    {isEn ? 'Remove' : 'حذف لوگو'}
                  </button>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">
                    {isEn ? 'Company / Business Name:' : 'نام شخص حقیقی یا حقوقی (فروشنده):'}
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
                      {isEn ? 'Phone Number:' : 'شماره تلفن تماس:'}
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
                    {isEn ? 'Full Address:' : 'نشانی کامل فروشنده:'}
                  </label>
                  <input
                    type="text"
                    value={invoice.sellerAddress}
                    onChange={(e) => setInvoice({ ...invoice, sellerAddress: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>

                {/* Bank account */}
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
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                <User className="w-4 h-4 text-emerald-500" />
                <span>{isEn ? 'Buyer Details (Customer):' : 'مشخصات خریدار (مشتری):'}</span>
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
                      {isEn ? 'Phone:' : 'شماره تماس:'}
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

                {/* Invoice Meta */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                    {isEn ? 'Invoice Number & Dates:' : 'شماره و تاریخ فاکتور:'}
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
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Invoice Line Items (Products & Services):' : 'اقلام فاکتور (کالاها و خدمات):'}
              </h3>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-bold text-xs hover:bg-blue-100 transition"
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
                    {invoice.invoiceType === 'official' && (
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
                            placeholder={isEn ? 'Service or Product name...' : 'نام کالا یا خدمات را بنویسید...'}
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
                        {invoice.invoiceType === 'official' && (
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

          {/* Notes & Terms Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isEn ? 'Terms & Warranty Conditions:' : 'شرایط، گارانتی و نحوه تسویه:'}
              </label>
              <textarea
                value={invoice.terms}
                onChange={(e) => setInvoice({ ...invoice, terms: e.target.value })}
                rows={4}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none resize-none"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isEn ? 'Notes & Additional Remarks:' : 'توضیحات تکمیلی فاکتور:'}
              </label>
              <textarea
                value={invoice.notes}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                rows={4}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: LIVE PRINTABLE PREVIEW (A4 DOCUMENT) --- */}
      <div
        className={`${activeTab === 'edit' ? 'hidden print:block' : 'block'} flex justify-center`}
      >
        <div
          id="printable-invoice"
          className="w-full max-w-[820px] bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-12 space-y-6"
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
                  alt="Seller Logo"
                  className="w-16 h-16 object-contain rounded"
                />
              ) : (
                <div
                  className={`w-14 h-14 rounded-2xl ${themeClasses.primary} text-white flex items-center justify-center font-black text-xl`}
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

            {/* Document Title & Meta */}
            <div className="text-end shrink-0">
              <div
                className={`inline-block px-4 py-1.5 rounded-lg ${themeClasses.primary} text-white font-black text-sm uppercase tracking-wide mb-2`}
              >
                {invoice.invoiceType === 'official'
                  ? (isEn ? 'TAX INVOICE' : 'صورت‌حساب فروش کالا و خدمات')
                  : invoice.invoiceType === 'proforma'
                  ? (isEn ? 'PROFORMA INVOICE' : 'پیش‌فاکتور رسمی')
                  : (isEn ? 'COMMERCIAL INVOICE' : 'فاکتور فروش')}
              </div>
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
              </div>
            </div>
          </div>

          {/* Seller / Buyer Legal Boxes */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Seller Info Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
              <span className={`text-[11px] font-bold ${themeClasses.text} block mb-1`}>
                {isEn ? 'VENDOR / SELLER' : 'مشخصات فروشنده:'}
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

            {/* Buyer Info Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
              <span className={`text-[11px] font-bold ${themeClasses.text} block mb-1`}>
                {isEn ? 'CUSTOMER / BUYER' : 'مشخصات خریدار:'}
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

          {/* Table of Items */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-xs text-slate-800 border-collapse">
              <thead className={`${themeClasses.headerBg} text-[11px]`}>
                <tr>
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5 text-start">{isEn ? 'Description' : 'شرح کالا یا خدمات'}</th>
                  <th className="p-2.5 text-center w-16">{isEn ? 'Qty' : 'تعداد'}</th>
                  <th className="p-2.5 text-center w-20">{isEn ? 'Unit' : 'واحد'}</th>
                  <th className="p-2.5 text-end w-32">{isEn ? `Price (${invoice.currency})` : `مبلغ واحد (${invoice.currency})`}</th>
                  <th className="p-2.5 text-end w-24">{isEn ? 'Discount' : 'تخفیف'}</th>
                  {invoice.invoiceType === 'official' && (
                    <th className="p-2.5 text-center w-20">{isEn ? 'VAT (10%)' : 'مالیات'}</th>
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
                      {invoice.invoiceType === 'official' && (
                        <td className="p-2.5 text-center font-mono text-slate-500">
                          {rowTax > 0 ? formatNumber(rowTax) : '-'}
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

          {/* Summary Calculation Box */}
          <div className="grid grid-cols-12 gap-6 pt-2">
            {/* Amount in words & Bank Account (7 Cols) */}
            <div className="col-span-7 space-y-4 text-xs">
              {/* Words */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 block">
                  {isEn ? 'Amount in Words:' : 'مبلغ کل به حروف:'}
                </span>
                <p className="font-bold text-slate-800 leading-relaxed">
                  {numberToPersianWords(grandTotal)} {invoice.currency} تمام
                </p>
              </div>

              {/* Bank Account */}
              {(invoice.sellerIban || invoice.sellerCardNumber) && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 block">
                    {isEn ? 'Bank Account Details for Payment:' : 'شماره حساب جهت واریز وجه:'}
                  </span>
                  {invoice.sellerBankName && <div>بانک: <strong>{invoice.sellerBankName}</strong></div>}
                  {invoice.sellerIban && <div>شماره شبا: <strong className="font-mono">{invoice.sellerIban}</strong></div>}
                  {invoice.sellerCardNumber && <div>شماره کارت: <strong className="font-mono">{invoice.sellerCardNumber}</strong></div>}
                </div>
              )}
            </div>

            {/* Calculations Breakdown (5 Cols) */}
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

              {invoice.invoiceType === 'official' && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'VAT Tax:' : 'مالیات بر ارزش افزوده:'}</span>
                  <span className="font-mono font-bold">+ {formatNumber(totalTax)} {invoice.currency}</span>
                </div>
              )}

              <div className={`flex justify-between items-center p-2.5 rounded-xl ${themeClasses.light} border ${themeClasses.border} mt-2`}>
                <span className="font-black text-sm text-slate-900">
                  {isEn ? 'Grand Total:' : 'مبلغ نهایی فاکتور:'}
                </span>
                <span className={`font-mono font-black text-base ${themeClasses.text}`}>
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

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-600">
              <div className="space-y-12">
                <span className="font-bold">{isEn ? 'Authorized Seller Signature & Stamp' : 'مهر و امضای فروشنده'}</span>
                <div className="border-b border-dashed border-slate-300 w-44 mx-auto" />
              </div>
              <div className="space-y-12">
                <span className="font-bold">{isEn ? 'Customer Acceptance Signature' : 'مهر و امضای تحویل‌گیرنده (خریدار)'}</span>
                <div className="border-b border-dashed border-slate-300 w-44 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
