import { Suspense } from 'react';
import type { Metadata } from 'next';
import PreviewClient from './PreviewClient';
import { getCategories } from '@/lib/repository';

export const metadata: Metadata = {
    title: 'پیش‌نمایش مقاله',
    robots: {
        index: false,
        follow: false,
    },
};

export default async function PreviewPage() {
    const categories = await getCategories();
    const apiBaseUrl =
        process.env.NEXT_PUBLIC_WORDPRESS_BLOG_API_URL?.trim() ||
        process.env.WORDPRESS_BLOG_API_URL?.trim() ||
        'https://test.zebracode.ir/blog-admin/wp-json/omni-ai/v1';

    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm opacity-75">
                    در حال آماده‌سازی پیش‌نمایش مقاله...
                </div>
            }
        >
            <PreviewClient apiBaseUrl={apiBaseUrl} categories={categories} />
        </Suspense>
    );
}
