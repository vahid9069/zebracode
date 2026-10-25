import ToolPageClient from '@/components/pages/ToolPageClient';
import ToolStructuredData from '@/components/pages/ToolStructuredData';
import DeveloperToolGuide from '@/components/pages/DeveloperToolGuide';
import { getDeveloperToolContent } from '@/lib/developer-tools/content';
import { getDictionary } from '@/i18n/getDictionary';
import { AllToolsList } from '@/lib/registry/tools';
import { generateToolMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// این تابع به Next.js می‌گوید چه صفحاتی را باید بسازد
export function generateStaticParams() {
  return Object.values(AllToolsList).map((t) => {
    const toolSlug = t.href.split('/').filter(Boolean).pop();
    return { toolSlug: toolSlug || '' };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ toolSlug: string }> }): Promise<Metadata> {
  const { toolSlug } = await params;
  const foundEntry = Object.entries(AllToolsList).find(([, t]) => t.href.split('/').filter(Boolean).pop() === toolSlug);
  if (!foundEntry) return { title: 'ابزار پیدا نشد', robots: { index: false, follow: false } };
  const dict = await getDictionary('fa');
  const localizedCopy = (dict.tools as Record<string, { title?: string; shortDescription?: string; description?: string }>)[foundEntry[0]];
  const content = getDeveloperToolContent(toolSlug, 'fa');
  return generateToolMetadata(foundEntry[0], 'fa', { ...localizedCopy, seoTitle: content?.seoTitle, metaDescription: content?.metaDescription });
}

export default async function FaToolPage({ params }: { params: Promise<{ toolSlug: string }> }) {
  // ۱. منتظر ماندن برای دریافت پارامتر آدرس
  const resolvedParams = await params;
  
  // ۲. دریافت فایل‌های ترجمه فارسی
  const dict = await getDictionary('fa');
  
  // ۳. پیدا کردن ابزار در دیتابیس بر اساس آدرس
  const foundEntry = Object.entries(AllToolsList).find(([, t]) => {
    const slug = t.href.split('/').filter(Boolean).pop();
    return slug === resolvedParams.toolSlug;
  });

  // ۴. اگر ابزار در لیست نبود، پیام خطا نشان بده
  if (!foundEntry) {
    notFound();
  }

  const localizedTool = (dict.tools as Record<string, { title?: string; shortDescription?: string; description?: string }>)[foundEntry[0]];
  const content = getDeveloperToolContent(resolvedParams.toolSlug, 'fa');
  return <>
    <ToolStructuredData
      toolType={foundEntry[0]}
      locale="fa"
      title={localizedTool?.title}
      description={content?.metaDescription || localizedTool?.shortDescription || localizedTool?.description}
      content={content}
    />
    <ToolPageClient toolType={foundEntry[0]} dict={dict} locale="fa" />
    {content && <DeveloperToolGuide slug={resolvedParams.toolSlug} title={localizedTool?.title || foundEntry[1].title} locale="fa" content={content} toolTitles={dict.tools} />}
  </>;
}
