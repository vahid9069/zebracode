'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquareReply, Send, X } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/site';
import type { PostComment } from '@/lib/types';

interface CommentsSectionProps {
    slug: string;
    initialComments: PostComment[];
    apiBaseUrl: string;
}

interface CommentNode extends PostComment {
    replies: CommentNode[];
}

function buildCommentTree(list: PostComment[]): CommentNode[] {
    const byId = new Map<number, CommentNode>();
    for (const item of list) {
        byId.set(item.id, { ...item, replies: [] });
    }
    const roots: CommentNode[] = [];
    for (const node of byId.values()) {
        if (node.parentId > 0 && byId.has(node.parentId)) {
            byId.get(node.parentId)!.replies.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots;
}

function CommentAvatar({ name, avatarUrl, isAdmin }: { name: string; avatarUrl?: string; isAdmin?: boolean }) {
    const [imgFailed, setImgFailed] = useState(false);
    const initial = name.trim().charAt(0) || 'ک';

    if (avatarUrl && !imgFailed) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                loading="lazy"
                onError={() => setImgFailed(true)}
                className="h-8 w-8 shrink-0 rounded-full border border-[var(--line)] object-cover"
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                isAdmin ? 'bg-[var(--brand)] text-white' : 'bg-[var(--line)] text-[var(--ink)]'
            }`}
        >
            {initial}
        </span>
    );
}

export default function CommentsSection({ slug, initialComments, apiBaseUrl }: CommentsSectionProps) {
    const [comments, setComments] = useState<PostComment[]>(initialComments);
    const [authorName, setAuthorName] = useState('');
    const [authorEmail, setAuthorEmail] = useState('');
    const [content, setContent] = useState('');
    const [websiteHp, setWebsiteHp] = useState('');
    const [challenge, setChallenge] = useState<{ question: string; exp: number; sig: string } | null>(null);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: number; authorName: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!apiBaseUrl || !slug) return;
        const controller = new AbortController();
        fetch(`${apiBaseUrl.replace(/\/$/, '')}/comments?slug=${encodeURIComponent(slug)}`, {
            cache: 'no-store',
            signal: controller.signal,
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data: { success?: boolean; comments?: Array<Record<string, unknown>>; challenge?: { question: string; exp: number; sig: string } } | null) => {
                if (data?.challenge?.question) {
                    setChallenge(data.challenge);
                }
                if (data?.success && Array.isArray(data.comments)) {
                    const parsed = data.comments
                        .map((c) => ({
                            id: Number(c.id) || 0,
                            parentId: Number(c.parent_id) || 0,
                            authorName: typeof c.author_name === 'string' ? c.author_name : 'کاربر',
                            ...(typeof c.avatar_url === 'string' && /^https?:\/\//i.test(c.avatar_url.trim()) ? { avatarUrl: c.avatar_url.trim() } : {}),
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

    const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

    const handleReplyClick = (comment: PostComment) => {
        setReplyTo({ id: comment.id, authorName: comment.authorName });
        setFeedback(null);
        textareaRef.current?.focus();
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

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
        if (challenge && !captchaAnswer.trim()) {
            setFeedback({ type: 'error', text: 'لطفاً پاسخ سوال امنیتی را وارد کنید.' });
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
                    parent_id: replyTo?.id ?? 0,
                    website_hp: websiteHp,
                    captcha_answer: captchaAnswer.trim(),
                    captcha_exp: challenge?.exp ?? 0,
                    captcha_sig: challenge?.sig ?? '',
                }),
            });
            const data = (await res.json()) as { success?: boolean; message?: string; challenge?: { question: string; exp: number; sig: string } };
            if (data?.challenge?.question) {
                setChallenge(data.challenge);
                setCaptchaAnswer('');
            }
            if (res.ok && data?.success) {
                setFeedback({
                    type: 'success',
                    text: data.message || 'دیدگاه شما ثبت شد و پس از تایید مدیر نمایش داده می‌شود.',
                });
                setAuthorName('');
                setAuthorEmail('');
                setContent('');
                setReplyTo(null);
            } else {
                setFeedback({ type: 'error', text: data?.message || 'خطا در ثبت دیدگاه.' });
            }
        } catch {
            setFeedback({ type: 'error', text: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.' });
        } finally {
            setSubmitting(false);
        }
    };

    const renderCommentItem = (node: CommentNode, depth = 0, parentAuthor?: string) => {
        return (
            <li key={node.id} className={depth > 0 ? 'mt-3' : ''}>
                <div
                    className={`rounded-xl border p-4 transition ${
                        node.isAdmin
                            ? 'border-[var(--brand)]/35 bg-[var(--brand-soft)]'
                            : 'border-[var(--line)] bg-[var(--soft)]'
                    }`}
                >
                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <CommentAvatar name={node.authorName} avatarUrl={node.avatarUrl} isAdmin={node.isAdmin} />
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-[var(--ink)]">{node.authorName}</span>
                                {node.isAdmin && (
                                    <span className="rounded-md bg-[var(--brand)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--brand)]">
                                        نویسنده
                                    </span>
                                )}
                                {parentAuthor && (
                                    <span className="text-[11px] text-[var(--muted)]">
                                        در پاسخ به {parentAuthor}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                            <time dateTime={node.date}>{formatDate(node.date)}</time>
                            <button
                                type="button"
                                onClick={() => handleReplyClick(node)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--brand)] transition hover:bg-[var(--brand-soft)]"
                            >
                                <MessageSquareReply size={13} aria-hidden="true" />
                                <span>پاسخ</span>
                            </button>
                        </div>
                    </div>

                    <p className="whitespace-pre-line pr-10 text-sm leading-7 text-[var(--ink)]/90">
                        {node.content}
                    </p>
                </div>

                {node.replies.length > 0 && (
                    <ul className="mt-3 mr-4 border-r-2 border-[var(--brand)]/30 pr-4 sm:mr-6 sm:pr-5">
                        {node.replies.map((reply) => renderCommentItem(reply, depth + 1, node.authorName))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <section
            className="mt-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7"
            aria-labelledby="comments-heading"
        >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line-subtle)] pb-4">
                <div>
                    <h2 id="comments-heading" className="text-lg font-bold text-[var(--ink)] sm:text-xl">
                        دیدگاه‌ها ({formatNumber(comments.length)})
                    </h2>
                    <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
                        دیدگاه‌ها پیش از انتشار بررسی می‌شوند و ایمیل شما منتشر نخواهد شد.
                    </p>
                </div>
            </div>

            {commentTree.length > 0 ? (
                <ul className="mb-8 space-y-4">
                    {commentTree.map((node) => renderCommentItem(node))}
                </ul>
            ) : (
                <div className="mb-8 rounded-xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-5 text-center text-sm text-[var(--muted)]">
                    هنوز دیدگاهی ثبت نشده است. اولین نفری باشید که سوال یا نظر خود را می‌نویسید.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 border-t border-[var(--line)] pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-[var(--ink)]">
                        {replyTo ? `پاسخ به ${replyTo.authorName}` : 'ثبت دیدگاه جدید'}
                    </h3>
                    {replyTo && (
                        <button
                            type="button"
                            onClick={() => setReplyTo(null)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--muted)] transition hover:text-[var(--ink)]"
                        >
                            <X size={13} aria-hidden="true" />
                            <span>لغو پاسخ</span>
                        </button>
                    )}
                </div>

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
                        <label htmlFor="comment-author-name" className="mb-1.5 block text-xs font-semibold text-[var(--ink)]">
                            نام و نام خانوادگی
                        </label>
                        <input
                            id="comment-author-name"
                            type="text"
                            required
                            minLength={2}
                            maxLength={60}
                            placeholder="مثلاً: علی محمدی"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                        />
                    </div>
                    <div>
                        <label htmlFor="comment-author-email" className="mb-1.5 block text-xs font-semibold text-[var(--ink)]">
                            ایمیل (محرمانه می‌ماند)
                        </label>
                        <input
                            id="comment-author-email"
                            type="email"
                            required
                            dir="ltr"
                            placeholder="name@example.com"
                            value={authorEmail}
                            onChange={(e) => setAuthorEmail(e.target.value)}
                            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                        />
                    </div>
                </div>

                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="comment-content" className="block text-xs font-semibold text-[var(--ink)]">
                            متن دیدگاه
                        </label>
                        <span className="text-[11px] text-[var(--muted)]">
                            {formatNumber(content.length)} / {formatNumber(2000)}
                        </span>
                    </div>
                    <textarea
                        ref={textareaRef}
                        id="comment-content"
                        rows={4}
                        required
                        minLength={5}
                        maxLength={2000}
                        placeholder="سوال، تجربه یا نظر خود را درباره این مقاله بنویسید..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                    />
                </div>

                {challenge && (
                    <div className="max-w-xs">
                        <label htmlFor="comment-captcha" className="mb-1.5 block text-xs font-semibold text-[var(--ink)]">
                            سوال امنیتی: <span dir="ltr" className="font-bold text-[var(--brand)]">{challenge.question}</span>
                        </label>
                        <input
                            id="comment-captcha"
                            type="text"
                            inputMode="numeric"
                            required
                            dir="ltr"
                            placeholder="پاسخ عددی"
                            value={captchaAnswer}
                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                        />
                    </div>
                )}

                {feedback && (
                    <div
                        role="status"
                        className={`rounded-xl px-4 py-3 text-sm font-medium ${
                            feedback.type === 'success'
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200'
                                : 'border border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200'
                        }`}
                    >
                        {feedback.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-60"
                >
                    <Send size={15} aria-hidden="true" />
                    <span>{submitting ? 'در حال ارسال...' : replyTo ? 'ارسال پاسخ' : 'ارسال دیدگاه'}</span>
                </button>
            </form>
        </section>
    );
}
