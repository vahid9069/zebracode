import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TOOLS } from '@/lib/tools';
import { DynamicIcon } from '@/components/DynamicIcon';
import { CrossLinkBanner } from '@/components/CrossLinkBanner';
import { ToolAeoGuide } from '@/components/seo/ToolAeoGuide';
import { ArrowRight, ShieldCheck } from 'lucide-react';

// کامپوننت‌های ابزارها
import { AgeCalculator } from '@/components/tools/AgeCalculator';
import { DateConverter } from '@/components/tools/DateConverter';
import { DateDiff } from '@/components/tools/DateDiff';
import { PregnancyCalculator } from '@/components/tools/PregnancyCalculator';
import { TimerStopwatch } from '@/components/tools/TimerStopwatch';
import { WorldClock } from '@/components/tools/WorldClock';

import { LoanCalculator } from '@/components/tools/LoanCalculator';
import { GoldCalculator } from '@/components/tools/GoldCalculator';
import { PercentageCalculator } from '@/components/tools/PercentageCalculator';
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

interface Props {
  params: Promise<{
    toolSlug: string;
  }>;
}

export async function generateStaticParams() {
  return TOOLS.map((tool) => ({
    toolSlug: tool.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolSlug } = await params;
  const tool = TOOLS.find((t) => t.slug === toolSlug);

  if (!tool) {
    return {
      title: 'ابزار پیدا نشد | زبراکد کیت',
    };
  }

  return {
    title: `${tool.title} آنلاین | زبراکد کیت`,
    description: tool.shortDescription,
    openGraph: {
      title: `${tool.title} آنلاین و رایگان | زبراکد کیت`,
      description: tool.shortDescription,
      type: 'website',
      locale: 'fa_IR',
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const { toolSlug } = await params;
  const tool = TOOLS.find((t) => t.slug === toolSlug);

  if (!tool) {
    notFound();
  }

  const renderToolComponent = () => {
    switch (tool.slug) {
      // زمان و تاریخ
      case 'age-calculator':
        return <AgeCalculator />;
      case 'date-converter':
        return <DateConverter />;
      case 'date-diff':
        return <DateDiff />;
      case 'pregnancy-calculator':
        return <PregnancyCalculator />;
      case 'timer-stopwatch':
        return <TimerStopwatch />;
      case 'world-clock':
        return <WorldClock />;

      // مالی و محاسبات
      case 'loan-calculator':
        return <LoanCalculator />;
      case 'gold-calculator':
        return <GoldCalculator />;
      case 'number-to-words':
        return <NumberToWords />;
      case 'bank-deposit-interest':
        return <BankDepositInterest />;
      case 'severance-calculator':
        return <SeveranceCalculator />;
      case 'salary-tax-calculator':
        return <SalaryTaxCalculator />;
      case 'percentage-calculator':
        return <PercentageCalculator />;
      case 'unit-converter':
        return <UnitConverter />;
      case 'toman-rial-converter':
        return <TomanRialConverter />;
      case 'gharzolhasaneh-loan':
        return <GharzolhasanehLoan />;

      // تصویر و گرافیک
      case 'image-compressor':
        return <ImageCompressor />;
      case 'image-resizer':
        return <ImageResizer />;
      case 'circle-avatar':
        return <CircleAvatar />;
      case 'image-converter':
        return <ImageConverter />;
      case 'image-blur':
        return <ImageBlur />;
      case 'color-picker-image':
        return <ColorPickerImage />;

      // متن و نگارش
      case 'persian-editor':
        return <PersianEditor />;
      case 'word-counter':
        return <WordCounter />;
      case 'remove-duplicate-lines':
        return <RemoveDuplicateLines />;
      case 'alphabetical-sort':
        return <AlphabeticalSort />;
      case 'clean-text-lines':
        return <CleanTextLines />;
      case 'finglish-converter':
        return <FinglishConverter />;
      case 'lorem-generator':
        return <LoremGenerator />;
      case 'case-converter':
        return <CaseConverter />;

      // اسناد و PDF
      case 'pdf-merge':
        return <PdfMerge />;
      case 'images-to-pdf':
        return <ImagesToPdf />;

      // کاربردی و روزمره
      case 'qr-generator':
        return <QrGenerator />;
      case 'barcode-generator':
        return <BarcodeGenerator />;
      case 'whatsapp-link-generator':
        return <WhatsappLinkGenerator />;
      case 'social-counter':
        return <SocialCounter />;
      case 'bmi-calculator':
        return <BmiCalculator />;
      case 'calorie-calculator':
        return <CalorieCalculator />;
      case 'water-intake':
        return <WaterIntake />;
      case 'blood-type':
        return <BloodType />;
      case 'password-generator':
        return <PasswordGenerator />;
      case 'national-code':
        return <NationalCode />;
      case 'random-picker':
        return <RandomPicker />;
      case 'random-number':
        return <RandomNumber />;
      case 'coin-dice':
        return <CoinDice />;

      // جدول و داده
      case 'table-builder':
        return <TableBuilder />;
      case 'html-table-to-excel':
        return <HtmlTableToExcel />;
      case 'csv-viewer':
        return <CsvViewer />;
      case 'markdown-table':
        return <MarkdownTable />;
      case 'text-table':
        return <TextTable />;

      default:
        return (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <h3 className="text-lg font-bold">ابزار در حال تکمیل</h3>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* برِدکرامب و بازگشت */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5" />
          جعبه‌ابزار عمومی
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
          پردازش امن در مرورگر شما
        </div>
      </div>

      {/* کامپوننت تعاملی ابزار */}
      <div className="pt-2">
        {renderToolComponent()}
      </div>

      {/* بنر لینک هوشمند به ابزارهای برنامه‌نویسی */}
      <CrossLinkBanner slug={tool.slug} />

      {/* بخش بهینه‌سازی موتورهای پاسخگو (AEO / GEO / Schema.org FAQ & WebApp) */}
      <ToolAeoGuide tool={tool} />
    </div>
  );
}
