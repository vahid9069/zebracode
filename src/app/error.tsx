'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useOptionalI18n } from '@/i18n/I18nProvider';

type Props = {
    error: Error;
    reset(): void;
};

export default function Error({ error, reset }: Props) {
    const i18n = useOptionalI18n();
    const common = i18n?.dict.common;

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 px-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {common?.errorTitle || 'Oops! Something went wrong'}
                </h1>

                <p className="text-gray-600 dark:text-gray-400">
                    {error?.message || common?.errorFallback || 'An unexpected error occurred. Please try again later.'}
                </p>

                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
                >
                    <RotateCcw size={18} />
                    {common?.tryAgain || 'Try Again'}
                </button>
            </div>
        </div>
    );
}