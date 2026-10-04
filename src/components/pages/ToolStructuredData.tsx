import { getToolConfig } from "@/components/utils/tools/helper";
import { getLocalizedToolPath, getLocalizedUrl } from "@/lib/seo";

type Props = {
    toolType: string;
    locale: 'fa' | 'en';
    title?: string;
    description?: string;
};

export default function ToolStructuredData({ toolType, locale, title, description }: Props) {
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
            "inLanguage": locale === 'fa' ? 'fa-IR' : 'en-US',
            "isPartOf": { "@id": `${websiteUrl}#website` },
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

    return (
        <script
            id={`structured-data-${toolType}-${locale}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
        />
    );
}
