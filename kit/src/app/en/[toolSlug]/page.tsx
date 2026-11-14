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
  const dict = await getDictionary('en');
  const tool = getToolBySlug(toolSlug, dict);

  if (!tool) {
    return {
      title: 'Tool Not Found | ZebraCode Kit',
    };
  }

  const url = `https://kit.zebracode.ir/en/${tool.slug}/`;
  const faUrl = `https://kit.zebracode.ir/${tool.slug}/`;

  return {
    title: `${tool.title} Online | ZebraCode Kit`,
    description: tool.shortDescription,
    alternates: {
      canonical: url,
      languages: {
        'fa-IR': faUrl,
        'en-US': url,
        'x-default': faUrl,
      },
    },
    openGraph: {
      title: `${tool.title} Online & Free | ZebraCode Kit`,
      description: tool.shortDescription,
      url,
      type: 'website',
      locale: 'en_US',
    },
  };
}

export default async function EnToolPage({ params }: Props) {
  const { toolSlug } = await params;
  const dict = await getDictionary('en');
  const tool = getToolBySlug(toolSlug, dict);

  if (!tool) {
    notFound();
  }

  return <KitToolPageClient toolSlug={toolSlug} locale="en" dict={dict} />;
}
