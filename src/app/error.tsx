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
        <div className="flex min-h-[80vh] items-center justify-center bg-canvas px-4 text-text">
            <div className="max-w-md space-y-6 rounded-2xl border border-border-strong bg-surface p-8 text-center shadow-xl">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft">
                    <AlertTriangle className="h-8 w-8 text-danger" />
                </div>

                <h1 className="text-2xl font-bold text-text">
                    {common?.errorTitle || 'Oops! Something went wrong'}
                </h1>

                <p className="text-text-muted">
                    {error?.message || common?.errorFallback || 'An unexpected error occurred. Please try again later.'}
                </p>

                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-xl bg-action px-6 py-3 font-semibold text-action-foreground shadow-md transition-colors hover:bg-action-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                    <RotateCcw size={18} />
                    {common?.tryAgain || 'Try Again'}
                </button>
            </div>
        </div>
    );
}
