import { getToolConfig } from "@/components/utils/tools/helper";
import { getLocalizedToolPath, getLocalizedUrl } from "@/lib/seo";
import type { DeveloperToolContent } from '@/lib/developer-tools/content-types';

type Props = {
    toolType: string;
    locale: 'fa' | 'en';
    title?: string;
    description?: string;
    content?: DeveloperToolContent;
};

export default function ToolStructuredData({ toolType, locale, title, description, content }: Props) {
    const tool = getToolConfig(toolType);
    if (!tool) return null;

    const path = getLocalizedToolPath(toolType, locale) || '/';
    const url = getLocalizedUrl(path);
    const websiteUrl = getLocalizedUrl(locale === 'en' ? '/en' : '/');
    const graph: Record<string, unknown>[] = [
        {
            "@type": "Organization",
            "@id": `${getLocalizedUrl('/')}#organization`,
            "name": "ZebraCode",
            "url": getLocalizedUrl('/'),
        },
        {
            "@type": "WebSite",
            "@id": `${websiteUrl}#website`,
            "url": websiteUrl,
            "name": "ZebraCode",
            "publisher": { "@id": `${getLocalizedUrl('/')}#organization` },
            "inLanguage": locale === 'fa' ? 'fa-IR' : 'en-US',
        },
        {
            "@type": "WebPage",
            "@id": `${url}#webpage`,
            "url": url,
            "name": title || tool.title,
            "description": description || tool.shortDescription,
            "inLanguage": locale === 'fa' ? 'fa-IR' : 'en-US',
            "isPartOf": { "@id": `${websiteUrl}#website` },
            "mainEntity": { "@id": `${url}#application` },
            "breadcrumb": { "@id": `${url}#breadcrumb` },
            ...(content ? {
                "abstract": content.answer,
                "hasPart": { "@id": `${url}#${toolType}-faq` },
                "citation": content.references?.map(reference => ({ "@type": "CreativeWork", "name": reference.label, "url": reference.url })),
            } : {}),
        },
        {
            ...(tool.structuredData || {}),
            "@type": "SoftwareApplication",
            "@id": `${url}#application`,
            "name": title || tool.title,
            "description": description || tool.shortDescription || tool.description,
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "Any",
            "url": url,
            "inLanguage": locale === 'fa' ? 'fa-IR' : 'en-US',
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        },
        {
            "@type": "BreadcrumbList",
            "@id": `${url}#breadcrumb`,
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ZebraCode", "item": getLocalizedUrl(locale === 'en' ? '/en' : '/') },
                { "@type": "ListItem", "position": 2, "name": title || tool.title, "item": url },
            ],
        },
    ];

    // Exactly the same public questions/answers rendered in DeveloperToolGuide.
    // No FAQ fallback is emitted for tools without this visible content.
    if (content?.faq.length) graph.push({
        "@type": "FAQPage",
        "@id": `${url}#${toolType}-faq`,
        "url": `${url}#${toolType}-faq`,
        "inLanguage": locale === 'fa' ? 'fa-IR' : 'en-US',
        "isPartOf": { "@id": `${url}#webpage` },
        "mainEntity": content.faq.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": { "@type": "Answer", "text": item.answer },
        })),
    });

    return (
        <script
            id={`structured-data-${toolType}-${locale}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') }}
        />
    );
}
