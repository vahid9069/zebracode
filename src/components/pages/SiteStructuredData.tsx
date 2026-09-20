import { getLocalizedUrl } from "@/lib/seo";

export default function SiteStructuredData({ locale }: { locale: 'fa' | 'en' }) {
  const homeUrl = getLocalizedUrl(locale === 'en' ? '/en' : '/');
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
            },
            {
              "@type": "WebSite",
              "@id": `${getLocalizedUrl('/')}#website`,
              "url": getLocalizedUrl('/'),
              "name": "ZebraCode",
              "publisher": { "@id": `${getLocalizedUrl('/')}#organization` },
              "inLanguage": locale === 'fa' ? 'fa-IR' : 'en-US',
            },
            {
              "@type": "WebPage",
              "@id": `${homeUrl}#webpage`,
              "url": homeUrl,
              "isPartOf": { "@id": `${getLocalizedUrl('/')}#website` },
              "inLanguage": locale === 'fa' ? 'fa-IR' : 'en-US',
            },
          ],
        }),
      }}
    />
  );
}
