// src/app/page.tsx
import { Metadata } from 'next';
import HomePageClient from '@/components/pages/HomePageClient';

const SITE_NAME = 'ZebraCode';
const BASE_URL = 'https://zebracode.ir'; // دامنهٔ خود را جایگزین کنید

export const metadata: Metadata = {
    title: `${SITE_NAME} – Free Online Developer Tools`,
    description:
        'Free online developer tools: JSON, CSS, GraphQL, Timestamp, converters and formatters. All tools run locally in your browser — no sign‑up required.',
    alternates: {
        canonical: BASE_URL,
    },
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: `${SITE_NAME} – Free Online Developer Tools`,
        description:
            'Free online developer tools: JSON, CSS, GraphQL, Timestamp, converters and formatters. All tools run locally in your browser — no sign‑up required.',
        url: BASE_URL,
        siteName: SITE_NAME,
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: `${SITE_NAME} – Free Online Developer Tools`,
        description:
            'Free online developer tools: JSON, CSS, GraphQL, Timestamp, converters and formatters. All tools run locally in your browser — no sign‑up required.',
    },
};

export default function Page() {
    return <HomePageClient />;
}