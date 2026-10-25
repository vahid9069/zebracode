import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
    // Crawlers can read the preview's noindex metadata. Enable indexing only with real content.
    return { rules: { userAgent: '*', allow: '/blog/' }, sitemap: absoluteUrl('/sitemap.xml') };
}
