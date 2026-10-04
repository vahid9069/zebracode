// src/app/(fa)/not-found.tsx
import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { getDictionary } from '@/i18n/getDictionary';

export default async function NotFoundPage() {
    const dict = await getDictionary('fa');
    const common = dict.common;

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="text-8xl font-black text-blue-600 dark:text-blue-400 mb-4">404</div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {common.notFoundTitle}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    {common.notFoundDescription}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    >
                        <Home size={18} />
                        {common.backHome}
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
                    >
                        <Search size={18} />
                        {common.browseTools}
                    </Link>
                </div>
            </div>
        </div>
    );
}