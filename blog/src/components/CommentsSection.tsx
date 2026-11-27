'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/site';
import type { PostComment } from '@/lib/types';

interface CommentsSectionProps {
    slug: string;
    initialComments: PostComment[];
    apiBaseUrl: string;
}

export default function CommentsSection({ slug, initialComments, apiBaseUrl }: CommentsSectionProps) {
    const [comments, setComments] = useState<PostComment[]>(initialComments);
    const [authorName, setAuthorName] = useState('');
    const [authorEmail, setAuthorEmail] = useState('');
    const [content, setContent] = useState('');
    const [websiteHp, setWebsiteHp] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!apiBaseUrl || !slug) return;
        const controller = new AbortController();
        fetch(`${apiBaseUrl.replace(/\/$/, '')}/comments?slug=${encodeURIComponent(slug)}`, {
            cache: 'no-store',
            signal: controller.signal,
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { success?: boolean; comments?: Array<Record<string, unknown>> } | null) => {
                if (data?.success && Array.isArray(data.comments)) {
                    const parsed = data.comments
                        .map((c) => ({
                            id: Number(c.id) || 0,
                            parentId: Number(c.parent_id) || 0,
                            authorName: typeof c.author_name === 'string' ? c.author_name : 'کاربر',
                            content: typeof c.content === 'string' ? c.content : '',
                            date: typeof c.date === 'string' ? c.date : new Date().toISOString(),
                            isAdmin: Boolean(c.is_admin),
                        }))
                        .filter((c) => c.id > 0 && c.content.length > 0);
                    setComments(parsed);
                }
            })
            .catch(() => {});

        return () => controller.abort();
    }, [apiBaseUrl, slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        if (authorName.trim().length < 2) {
            setFeedback({ type: 'error', text: 'نام باید حداقل ۲ کاراکتر باشد.' });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail.trim())) {
            setFeedback({ type: 'error', text: 'لطفاً یک ایمیل معتبر وارد کنید.' });
            return;
        }
        if (content.trim().length < 5) {
            setFeedback({ type: 'error', text: 'متن دیدگاه باید حداقل ۵ کاراکتر باشد.' });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    author_name: authorName.trim(),
                    author_email: authorEmail.trim(),
                    content: content.trim(),
                    website_hp: websiteHp,
                }),
            });
            const data = (await res.json()) as { success?: boolean; message?: string };
            if (res.ok && data?.success) {
                setFeedback({
                    type: 'success',
                    text: data.message || 'دیدگاه شما ثبت شد و پس از تایید مدیر نمایش داده می‌شود.',
                });
                setAuthorName('');
                setAuthorEmail('');
                setContent('');
            } else {
                setFeedback({ type: 'error', text: data?.message || 'خطا در ثبت دیدگاه.' });
            }
        } catch {
            setFeedback({ type: 'error', text: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="mx-auto mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/60" aria-labelledby="comments-heading">
            <h2 id="comments-heading" className="mb-2 text-xl font-bold">
                دیدگاه‌ها ({comments.length})
            </h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                دیدگاه‌ها پیش از انتشار بررسی می‌شوند و ایمیل شما منتشر نخواهد شد.
            </p>

            {comments.length > 0 ? (
                <ul className="mb-8 space-y-4">
                    {comments.map((comment) => (
                        <li
                            key={comment.id}
                            className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                        >
                            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                    {comment.authorName}
                                    {comment.isAdmin && (
                                        <span className="mr-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700 dark:bg-sky-900/60 dark:text-sky-200">
                                            نویسنده
                                        </span>
                                    )}
                                </span>
                                <time dateTime={comment.date} className="text-slate-500 dark:text-slate-400">
                                    {formatDate(comment.date)}
                                </time>
                            </div>
                            <p className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
                                {comment.content}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                    هنوز دیدگاهی ثبت نشده است. اولین نفری باشید که نظر می‌دهید.
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                <h3 className="text-base font-semibold">ثبت دیدگاه جدید</h3>

                {/* Honeypot anti-spam field */}
                <div className="hidden" aria-hidden="true">
                    <label htmlFor="comment-website-hp">Website</label>
                    <input
                        id="comment-website-hp"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={websiteHp}
                        onChange={(e) => setWebsiteHp(e.target.value)}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="comment-author-name" className="mb-1 block text-xs font-medium">
                            نام و نام خانوادگی
                        </label>
                        <input
                            id="comment-author-name"
                            type="text"
                            required
                            minLength={2}
                            maxLength={60}
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>
                    <div>
                        <label htmlFor="comment-author-email" className="mb-1 block text-xs font-medium">
                            ایمیل (محرمانه می‌ماند)
                        </label>
                        <input
                            id="comment-author-email"
                            type="email"
                            required
                            dir="ltr"
                            value={authorEmail}
                            onChange={(e) => setAuthorEmail(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="comment-content" className="mb-1 block text-xs font-medium">
                        متن دیدگاه
                    </label>
                    <textarea
                        id="comment-content"
                        rows={4}
                        required
                        minLength={5}
                        maxLength={2000}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                </div>

                {feedback && (
                    <div
                        className={`rounded-lg px-4 py-2.5 text-sm ${
                            feedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                                : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200'
                        }`}
                    >
                        {feedback.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                    {submitting ? 'در حال ارسال...' : 'ارسال دیدگاه'}
                </button>
            </form>
        </section>
    );
}
