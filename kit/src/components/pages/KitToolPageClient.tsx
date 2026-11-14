'use client';

import React from 'react';
import Link from 'next/link';
import { getToolBySlug } from '@/lib/tools';
import { DynamicIcon } from '@/components/DynamicIcon';
import { CrossLinkBanner } from '@/components/CrossLinkBanner';
import { ToolAeoGuide } from '@/components/seo/ToolAeoGuide';
import { ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

// Tool components
import { AgeCalculator } from '@/components/tools/AgeCalculator';
import { DateConverter } from '@/components/tools/DateConverter';
import { DateDiff } from '@/components/tools/DateDiff';
import { PregnancyCalculator } from '@/components/tools/PregnancyCalculator';
import { TimerStopwatch } from '@/components/tools/TimerStopwatch';
import { WorldClock } from '@/components/tools/WorldClock';

import { LoanCalculator } from '@/components/tools/LoanCalculator';
import { GoldCalculator } from '@/components/tools/GoldCalculator';
import { PercentageCalculator } from '@/components/tools/PercentageCalculator';
import { InvoiceGenerator } from '@/components/tools/InvoiceGenerator';
import { NumberToWords } from '@/components/tools/NumberToWords';
import { BankDepositInterest } from '@/components/tools/BankDepositInterest';
import { SeveranceCalculator } from '@/components/tools/SeveranceCalculator';
import { SalaryTaxCalculator } from '@/components/tools/SalaryTaxCalculator';
import { UnitConverter } from '@/components/tools/UnitConverter';
import { TomanRialConverter } from '@/components/tools/TomanRialConverter';
import { GharzolhasanehLoan } from '@/components/tools/GharzolhasanehLoan';

import { ImageCompressor } from '@/components/tools/ImageCompressor';
import { ImageResizer } from '@/components/tools/ImageResizer';
import { CircleAvatar } from '@/components/tools/CircleAvatar';
import { ImageConverter } from '@/components/tools/ImageConverter';
import { ImageBlur } from '@/components/tools/ImageBlur';
import { ColorPickerImage } from '@/components/tools/ColorPickerImage';

import { PersianEditor } from '@/components/tools/PersianEditor';
import { WordCounter } from '@/components/tools/WordCounter';
import { RemoveDuplicateLines } from '@/components/tools/RemoveDuplicateLines';
import { AlphabeticalSort } from '@/components/tools/AlphabeticalSort';
import { CleanTextLines } from '@/components/tools/CleanTextLines';
import { FinglishConverter } from '@/components/tools/FinglishConverter';
import { LoremGenerator } from '@/components/tools/LoremGenerator';
import { CaseConverter } from '@/components/tools/CaseConverter';

import { PdfMerge } from '@/components/tools/PdfMerge';
import { ImagesToPdf } from '@/components/tools/ImagesToPdf';

import { QrGenerator } from '@/components/tools/QrGenerator';
import { BarcodeGenerator } from '@/components/tools/BarcodeGenerator';
import { WhatsappLinkGenerator } from '@/components/tools/WhatsappLinkGenerator';
import { SocialCounter } from '@/components/tools/SocialCounter';
import { BmiCalculator } from '@/components/tools/BmiCalculator';
import { CalorieCalculator } from '@/components/tools/CalorieCalculator';
import { WaterIntake } from '@/components/tools/WaterIntake';
import { BloodType } from '@/components/tools/BloodType';
import { PasswordGenerator } from '@/components/tools/PasswordGenerator';
import { NationalCode } from '@/components/tools/NationalCode';
import { RandomPicker } from '@/components/tools/RandomPicker';
import { RandomNumber } from '@/components/tools/RandomNumber';
import { CoinDice } from '@/components/tools/CoinDice';

import { TableBuilder } from '@/components/tools/TableBuilder';
import { HtmlTableToExcel } from '@/components/tools/HtmlTableToExcel';
import { CsvViewer } from '@/components/tools/CsvViewer';
import { MarkdownTable } from '@/components/tools/MarkdownTable';
import { TextTable } from '@/components/tools/TextTable';

interface KitToolPageClientProps {
  toolSlug: string;
  locale?: 'fa' | 'en';
  dict?: any;
}

export function KitToolPageClient({ toolSlug, locale = 'fa', dict }: KitToolPageClientProps) {
  const isEn = locale === 'en';
  const tool = getToolBySlug(toolSlug, dict);

  if (!tool) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          {isEn ? 'Tool Not Found' : 'ابزار مورد نظر پیدا نشد'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isEn ? 'The requested utility does not exist or may have been moved.' : 'ابزار درخواستی وجود ندارد یا ممکن است آدرس آن تغییر کرده باشد.'}
        </p>
        <Link
          href={isEn ? '/en/' : '/'}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          {isEn ? 'Back to Home' : 'بازگشت به صفحه اصلی'}
        </Link>
      </div>
    );
  }

  const renderToolComponent = () => {
    switch (tool.slug) {
      // زمان و تاریخ
      case 'age-calculator':
        return <AgeCalculator locale={locale} dict={dict} />;
      case 'date-converter':
        return <DateConverter locale={locale} dict={dict} />;
      case 'date-diff':
        return <DateDiff locale={locale} dict={dict} />;
      case 'pregnancy-calculator':
        return <PregnancyCalculator locale={locale} dict={dict} />;
      case 'timer-stopwatch':
        return <TimerStopwatch locale={locale} dict={dict} />;
      case 'world-clock':
        return <WorldClock locale={locale} dict={dict} />;

      // مالی و محاسبات
      case 'loan-calculator':
        return <LoanCalculator locale={locale} dict={dict} />;
      case 'gold-calculator':
        return <GoldCalculator locale={locale} dict={dict} />;
      case 'number-to-words':
        return <NumberToWords locale={locale} dict={dict} />;
      case 'bank-deposit-interest':
        return <BankDepositInterest locale={locale} dict={dict} />;
      case 'severance-calculator':
        return <SeveranceCalculator locale={locale} dict={dict} />;
      case 'salary-tax-calculator':
        return <SalaryTaxCalculator locale={locale} dict={dict} />;
      case 'percentage-calculator':
        return <PercentageCalculator locale={locale} dict={dict} />;
      case 'invoice-generator':
        return <InvoiceGenerator locale={locale} dict={dict} />;
      case 'unit-converter':
        return <UnitConverter locale={locale} dict={dict} />;
      case 'toman-rial-converter':
        return <TomanRialConverter locale={locale} dict={dict} />;
      case 'gharzolhasaneh-loan':
        return <GharzolhasanehLoan locale={locale} dict={dict} />;

      // تصویر و گرافیک
      case 'image-compressor':
        return <ImageCompressor locale={locale} dict={dict} />;
      case 'image-resizer':
        return <ImageResizer locale={locale} dict={dict} />;
      case 'circle-avatar':
        return <CircleAvatar locale={locale} dict={dict} />;
      case 'image-converter':
        return <ImageConverter locale={locale} dict={dict} />;
      case 'image-blur':
        return <ImageBlur locale={locale} dict={dict} />;
      case 'color-picker-image':
        return <ColorPickerImage locale={locale} dict={dict} />;

      // متن و نگارش
      case 'persian-editor':
        return <PersianEditor locale={locale} dict={dict} />;
      case 'word-counter':
        return <WordCounter locale={locale} dict={dict} />;
      case 'remove-duplicate-lines':
        return <RemoveDuplicateLines locale={locale} dict={dict} />;
      case 'alphabetical-sort':
        return <AlphabeticalSort locale={locale} dict={dict} />;
      case 'clean-text-lines':
        return <CleanTextLines locale={locale} dict={dict} />;
      case 'finglish-converter':
        return <FinglishConverter locale={locale} dict={dict} />;
      case 'lorem-generator':
        return <LoremGenerator locale={locale} dict={dict} />;
      case 'case-converter':
        return <CaseConverter locale={locale} dict={dict} />;

      // اسناد و PDF
      case 'pdf-merge':
        return <PdfMerge locale={locale} dict={dict} />;
      case 'images-to-pdf':
        return <ImagesToPdf locale={locale} dict={dict} />;

      // کاربردی و روزمره
      case 'qr-generator':
        return <QrGenerator locale={locale} dict={dict} />;
      case 'barcode-generator':
        return <BarcodeGenerator locale={locale} dict={dict} />;
      case 'whatsapp-link-generator':
        return <WhatsappLinkGenerator locale={locale} dict={dict} />;
      case 'social-counter':
        return <SocialCounter locale={locale} dict={dict} />;
      case 'bmi-calculator':
        return <BmiCalculator locale={locale} dict={dict} />;
      case 'calorie-calculator':
        return <CalorieCalculator locale={locale} dict={dict} />;
      case 'water-intake':
        return <WaterIntake locale={locale} dict={dict} />;
      case 'blood-type':
        return <BloodType locale={locale} dict={dict} />;
      case 'password-generator':
        return <PasswordGenerator locale={locale} dict={dict} />;
      case 'national-code':
        return <NationalCode locale={locale} dict={dict} />;
      case 'random-picker':
        return <RandomPicker locale={locale} dict={dict} />;
      case 'random-number':
        return <RandomNumber locale={locale} dict={dict} />;
      case 'coin-dice':
        return <CoinDice locale={locale} dict={dict} />;

      // جدول و داده
      case 'table-builder':
        return <TableBuilder locale={locale} dict={dict} />;
      case 'html-table-to-excel':
        return <HtmlTableToExcel locale={locale} dict={dict} />;
      case 'csv-viewer':
        return <CsvViewer locale={locale} dict={dict} />;
      case 'markdown-table':
        return <MarkdownTable locale={locale} dict={dict} />;
      case 'text-table':
        return <TextTable locale={locale} dict={dict} />;

      default:
        return (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <h3 className="text-lg font-bold">{isEn ? 'Tool Under Development' : 'ابزار در حال تکمیل'}</h3>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* برِدکرامب و بازگشت */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href={isEn ? '/en/' : '/'} className="hover:text-blue-600 transition-colors flex items-center gap-1">
          {isEn ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          {dict?.common?.siteName || (isEn ? 'ZebraCode Kit' : 'جعبه‌ابزار عمومی')}
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">{tool.title}</span>
      </div>

      {/* هدر ابزار */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/30">
            <DynamicIcon name={tool.icon} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {tool.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {tool.shortDescription}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-medium self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4" />
          {isEn ? '100% Client-Side Private Processing' : 'پردازش امن در مرورگر شما'}
        </div>
      </div>

      {/* کامپوننت تعاملی ابزار */}
      <div className="pt-2">
        {renderToolComponent()}
      </div>

      {/* بنر لینک هوشمند به ابزارهای برنامه‌نویسی */}
      <CrossLinkBanner slug={tool.slug} locale={locale} />

      {/* بخش بهینه‌سازی موتورهای پاسخگو (AEO / GEO / Schema.org FAQ & WebApp) */}
      <ToolAeoGuide tool={tool} locale={locale} />
    </div>
  );
}
