import ToolPageClient from '@/components/pages/ToolPageClient';
import ToolStructuredData from '@/components/pages/ToolStructuredData';
import { getDictionary } from '@/i18n/getDictionary';
import { AllToolsList } from '@/lib/registry/tools';
import { generateToolMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return Object.values(AllToolsList).map((t) => {
    const toolSlug = t.href.split('/').filter(Boolean).pop();
    return { toolSlug: toolSlug || '' };
  });
}

export async function generateMetadata({ params }: { params: Promise<{ toolSlug: string }> }): Promise<Metadata> {
  const { toolSlug } = await params;
  const foundEntry = Object.entries(AllToolsList).find(([, t]) => t.href.split('/').filter(Boolean).pop() === toolSlug);
  if (!foundEntry) return { title: 'Tool not found', robots: { index: false, follow: false } };
  const dict = await getDictionary('en');
  const localizedCopy = (dict.tools as Record<string, { title?: string; shortDescription?: string; description?: string }>)[foundEntry[0]];
  return generateToolMetadata(foundEntry[0], 'en', localizedCopy);
}

export default async function EnToolPage({ params }: { params: Promise<{ toolSlug: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary('en');
  
  const foundEntry = Object.entries(AllToolsList).find(([, t]) => {
    const slug = t.href.split('/').filter(Boolean).pop();
    return slug === resolvedParams.toolSlug;
  });

  if (!foundEntry) {
    notFound();
  }

  const localizedTool = (dict.tools as Record<string, { title?: string; shortDescription?: string; description?: string }>)[foundEntry[0]];
  return <>
    <ToolStructuredData
      toolType={foundEntry[0]}
      locale="en"
      title={localizedTool?.title}
      description={localizedTool?.shortDescription || localizedTool?.description}
    />
    <ToolPageClient toolType={foundEntry[0]} dict={dict} locale="en" />
  </>;
}