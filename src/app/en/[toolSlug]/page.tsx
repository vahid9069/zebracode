import ToolPageClient from '@/components/pages/ToolPageClient';
import ToolStructuredData from '@/components/pages/ToolStructuredData';
import { getDictionary } from '@/i18n/getDictionary';
import { AllToolsList } from '@/lib/registry/tools';
import { generateToolMetadata } from '@/lib/seo';
import { getToolDefinition } from '@/config/tools';
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
  const metadata = generateToolMetadata(foundEntry[0], 'en');
  const definition = getToolDefinition(toolSlug);
  return definition ? { ...metadata, title: `${definition.title} | ZebraCode` } : metadata;
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

  return <>
    <ToolStructuredData toolType={foundEntry[0]} locale="en" faq={(dict.common.faqByTool as Record<string, { question: string; answer: string }[]> | undefined)?.[foundEntry[0]]} />
    <ToolPageClient toolType={foundEntry[0]} dict={dict} locale="en" />
  </>;
}