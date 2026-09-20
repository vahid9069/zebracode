import ToolPageClient from '@/components/pages/ToolPageClient';
import ToolStructuredData from '@/components/pages/ToolStructuredData';
import { getDictionary } from '@/i18n/getDictionary';
import { AllToolsList } from '@/lib/registry/tools';
import { generateToolMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// این تابع به Next.js می‌گوید چه صفحاتی را باید بسازد
export function generateStaticParams() {
  return Object.values(AllToolsList).map((t) => {
    const toolSlug = t.href.split('/').filter(Boolean).pop();
    return { tool: toolSlug || '' };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const { tool } = await params;
  const foundEntry = Object.entries(AllToolsList).find(([, t]) => t.href.split('/').filter(Boolean).pop() === tool);
  return foundEntry ? generateToolMetadata(foundEntry[0], 'fa') : { title: 'ابزار پیدا نشد', robots: { index: false, follow: false } };
}

export default async function FaToolPage({ params }: { params: Promise<{ tool: string }> }) {
  // ۱. منتظر ماندن برای دریافت پارامتر آدرس
  const resolvedParams = await params;
  
  // ۲. دریافت فایل‌های ترجمه فارسی
  const dict = await getDictionary('fa');
  
  // ۳. پیدا کردن ابزار در دیتابیس بر اساس آدرس
  const foundEntry = Object.entries(AllToolsList).find(([, t]) => {
    const slug = t.href.split('/').filter(Boolean).pop();
    return slug === resolvedParams.tool;
  });

  // ۴. اگر ابزار در لیست نبود، پیام خطا نشان بده
  if (!foundEntry) {
    notFound();
  }

  const faqByTool = dict.common.faqByTool as Record<string, { question: string; answer: string }[]>;
  const faqByCategory = dict.common.faq as Record<string, { question: string; answer: string }[]>;
  const faq = faqByTool?.[foundEntry[0]] || faqByCategory[AllToolsList[foundEntry[0]].subCategory];
  return <>
    <ToolStructuredData toolType={foundEntry[0]} locale="fa" faq={faq} />
    <ToolPageClient toolType={foundEntry[0]} dict={dict} locale="fa" />
  </>;
}