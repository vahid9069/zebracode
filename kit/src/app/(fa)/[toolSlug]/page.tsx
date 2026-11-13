import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TOOLS, getToolBySlug } from '@/lib/tools';
import { KitToolPageClient } from '@/components/pages/KitToolPageClient';
import { getDictionary } from '@/i18n/getDictionary';

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
  const dict = await getDictionary('fa');
  const tool = getToolBySlug(toolSlug, dict);

  if (!tool) {
    return {
      title: 'ابزار پیدا نشد | زبراکد کیت',
    };
  }

  const url = `https://kit.zebracode.ir/${tool.slug}/`;
  const enUrl = `https://kit.zebracode.ir/en/${tool.slug}/`;

  return {
    title: `${tool.title} آنلاین | زبراکد کیت`,
    description: tool.shortDescription,
    alternates: {
      canonical: url,
      languages: {
        'fa-IR': url,
        'en-US': enUrl,
      },
    },
    openGraph: {
      title: `${tool.title} آنلاین و رایگان | زبراکد کیت`,
      description: tool.shortDescription,
      url,
      type: 'website',
      locale: 'fa_IR',
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const { toolSlug } = await params;
  const dict = await getDictionary('fa');
  const tool = getToolBySlug(toolSlug, dict);

  if (!tool) {
    notFound();
  }

  return <KitToolPageClient toolSlug={toolSlug} locale="fa" dict={dict} />;
}
