import ToolPageClient from '@/components/pages/ToolPageClient';
import { getDictionary } from '@/i18n/getDictionary';
import { AllToolsList } from '@/lib/registry/tools';

export function generateStaticParams() {
  return Object.values(AllToolsList).map((t) => {
    const toolSlug = t.href.split('/').filter(Boolean).pop();
    return { tool: toolSlug || '' };
  });
}

export default async function EnToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary('en');
  
  const foundEntry = Object.entries(AllToolsList).find(([key, t]) => {
    const slug = t.href.split('/').filter(Boolean).pop();
    return slug === resolvedParams.tool;
  });

  if (!foundEntry) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-xl font-bold">
        Tool not found
      </div>
    );
  }

  return <ToolPageClient toolType={foundEntry[0]} dict={dict} locale="en" />;
}