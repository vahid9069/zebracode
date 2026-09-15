// src/components/NotFoundPage.tsx
import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="text-8xl font-black text-blue-600 dark:text-blue-400 mb-4">404</div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Page not found
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    The tool or page you are looking for doesn’t exist or has been moved.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    >
                        <Home size={18} />
                        Back to Home
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
                    >
                        <Search size={18} />
                        Browse Tools
                    </Link>
                </div>
            </div>
        </div>
    );
}