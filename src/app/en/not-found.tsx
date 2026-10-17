// src/app/en/not-found.tsx
import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { getDictionary } from '@/i18n/getDictionary';

export default async function NotFoundPage() {
    const dict = await getDictionary('en');
    const common = dict.common;

    return (
        <div className="flex min-h-[80vh] items-center justify-center bg-canvas px-4 text-text">
            <div className="text-center max-w-md">
                <div className="mb-4 text-8xl font-black text-action">404</div>
                <h1 className="mb-3 text-2xl font-bold text-text">
                    {common.notFoundTitle}
                </h1>
                <p className="mb-8 text-text-muted">
                    {common.notFoundDescription}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/en"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-action px-5 py-3 font-medium text-action-foreground transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                        <Home size={18} />
                        {common.backHome}
                    </Link>
                    <Link
                        href="/en"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-raised px-5 py-3 font-medium text-text-muted transition-colors hover:bg-action-soft hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                        <Search size={18} />
                        {common.browseTools}
                    </Link>
                </div>
            </div>
        </div>
    );
}
