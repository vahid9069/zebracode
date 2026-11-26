'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleReader from '@/components/ArticleReader';
import { toPost } from '@/lib/repository';
import type { Category, Post } from '@/lib/types';

interface PreviewClientProps {
    apiBaseUrl: string;
    categories: Category[];
}

interface PreviewApiResponse {
    success?: boolean;
    message?: string;
    status?: string;
    is_autosave?: boolean;
    post?: unknown;
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'پیش‌نویس (Draft)',
    pending: 'در انتظار بازبینی',
    publish: 'منتشرشده',
    future: 'زمان‌بندی‌شده',
    private: 'خصوصی',
};

export default function PreviewClient({ apiBaseUrl, categories }: PreviewClientProps) {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const exp = searchParams.get('exp');
    const token = searchParams.get('token');

    const [post, setPost] = useState<Post | null>(null);
    const [wpStatus, setWpStatus] = useState<string>('');
    const [isAutosave, setIsAutosave] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPreview = useCallback(async (signal?: AbortSignal) => {
        if (!id || !exp || !token) {
            setError('پارامترهای پیش‌نمایش (id، exp یا token) در آدرس یافت نشد.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/preview?id=${encodeURIComponent(id)}&exp=${encodeURIComponent(exp)}&token=${encodeURIComponent(token)}`;
            const response = await fetch(endpoint, {
                cache: 'no-store',
                signal,
            });

            const payload = (await response.json()) as PreviewApiResponse;
            if (!response.ok || !payload.success || !payload.post) {
                throw new Error(payload.message || 'خطا در دریافت اطلاعات پیش‌نمایش از وردپرس');
            }

            const parsed = toPost(payload.post);
            if (!parsed) {
                throw new Error('ساختار مقاله دریافت‌شده معتبر نیست (عنوان یا نامک خالی است).');
            }

            setPost(parsed);
            setWpStatus(payload.status || '');
            setIsAutosave(Boolean(payload.is_autosave));
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setError((err as Error).message || 'خطا در برقراری ارتباط با وردپرس');
            }
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl, id, exp, token]);

    useEffect(() => {
        const controller = new AbortController();
        void loadPreview(controller.signal);
        return () => controller.abort();
    }, [loadPreview]);

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm opacity-80">
                در حال دریافت آخرین نسخه مقاله از وردپرس...
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    <p className="mb-4 font-semibold">{error || 'مقاله‌ای برای پیش‌نمایش یافت نشد.'}</p>
                    <button
                        type="button"
                        onClick={() => void loadPreview()}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                        تلاش مجدد
                    </button>
                </div>
            </div>
        );
    }

    const statusLabel = STATUS_LABELS[wpStatus] || wpStatus || 'پیش‌نویس';

    return (
        <div>
            <div className="border-b border-amber-300 bg-amber-50/90 px-4 py-2.5 text-sm text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/60 dark:text-amber-100">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-xs font-semibold text-amber-950 dark:bg-amber-800 dark:text-amber-100">
                            پیش‌نمایش زنده وردپرس
                        </span>
                        <span>وضعیت: {statusLabel}</span>
                        {isAutosave && (
                            <span className="text-xs opacity-80">(نمایش آخرین ذخیره خودکار / Autosave)</span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadPreview()}
                        className="rounded-md border border-amber-400 bg-white/80 px-3 py-1 text-xs font-medium text-amber-950 transition hover:bg-white dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-100 dark:hover:bg-amber-900"
                    >
                        بروزرسانی پیش‌نمایش
                    </button>
                </div>
            </div>

            <ArticleReader post={post} categories={categories} related={[]} />
        </div>
    );
}
