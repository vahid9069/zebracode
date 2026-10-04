import { getLocalizedUrl } from "@/lib/seo";

type Props = {
  locale: 'fa' | 'en';
  path?: string;
  name?: string;
  description?: string;
};

export default function SiteStructuredData({ locale, path, name, description }: Props) {
  const pageUrl = getLocalizedUrl(path || (locale === 'en' ? '/en' : '/'));
  const websiteUrl = getLocalizedUrl(locale === 'en' ? '/en' : '/');
  return (
    <script
      id={`site-structured-data-${locale}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${getLocalizedUrl('/')}#organization`,
              "name": "ZebraCode",
              "url": getLocalizedUrl('/'),
              "description": "Free browser-based developer tools for data conversion and processing.",
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
              "@id": `${pageUrl}#webpage`,
              "url": pageUrl,
              ...(name ? { "name": name } : {}),
              ...(description ? { "description": description } : {}),
              "isPartOf": { "@id": `${websiteUrl}#website` },
              "inLanguage": locale === 'fa' ? 'fa-IR' : 'en-US',
            },
          ],
        }),
      }}
    />
  );
}
