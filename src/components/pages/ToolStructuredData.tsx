import { getToolConfig } from "@/components/utils/tools/helper";
import { getDefaultFaq, getLocalizedToolPath, getLocalizedUrl } from "@/lib/seo";

type FAQ = { question: string; answer: string };

type Props = {
    toolType: string;
    locale: 'fa' | 'en';
    faq?: FAQ[];
};

export default function ToolStructuredData({ toolType, locale, faq: localizedFaq }: Props) {
    const tool = getToolConfig(toolType);
    if (!tool) return null;

    const path = getLocalizedToolPath(toolType, locale) || '/';
    const url = getLocalizedUrl(path);
    const faq = localizedFaq && localizedFaq.length > 0
        ? localizedFaq
        : tool.extraContent?.faq?.length
            ? tool.extraContent.faq
            : getDefaultFaq(tool.subCategory || 'others', locale);
    const graph: Record<string, unknown>[] = [
        {
            "@type": "Organization",
            "@id": `${getLocalizedUrl('/')}#organization`,
            "name": "ZebraCode",
            "url": getLocalizedUrl('/'),
        },
        {
            "@type": "WebSite",
            "@id": `${getLocalizedUrl('/')}#website`,
            "url": getLocalizedUrl('/'),
            "name": "ZebraCode",
            "publisher": { "@id": `${getLocalizedUrl('/')}#organization` },
        },
        {
            "@type": "WebPage",
            "@id": `${url}#webpage`,
            "url": url,
            "name": tool.title,
            "inLanguage": locale === 'fa' ? 'fa-IR' : 'en-US',
            "isPartOf": { "@id": `${getLocalizedUrl('/')}#website` },
        },
        {
            ...(tool.structuredData || {}),
            "@type": "SoftwareApplication",
            "@id": `${url}#application`,
            "name": tool.title,
            "description": tool.shortDescription || tool.description,
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
                { "@type": "ListItem", "position": 2, "name": tool.title, "item": url },
            ],
        },
    ];
    if (faq.length > 0) {
        graph.push({
            "@type": "FAQPage",
            "@id": `${url}#faq`,
            "mainEntity": faq.map((item) => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": { "@type": "Answer", "text": item.answer },
            })),
        });
    }

    return (
        <script
            id={`structured-data-${toolType}-${locale}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
        />
    );
}
