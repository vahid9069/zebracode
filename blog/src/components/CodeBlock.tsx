'use client';

import { useId, useState } from 'react';

interface CodeBlockProps {
    language: string;
    code: string;
    caption?: string;
}

export default function CodeBlock({ language, code, caption }: CodeBlockProps) {
    const statusId = useId();
    const [status, setStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');

    async function copyCode() {
        setStatus('copying');
        try {
            if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(code);
            setStatus('success');
        } catch {
            setStatus('error');
        }
    }

    return (
        <figure className="article-code" dir="rtl">
            <div className="article-code-toolbar" aria-label={`ابزار کد ${language}`}>
                <bdi className="article-code-language">{language}</bdi>
                <button
                    type="button"
                    className="article-copy-button"
                    onClick={copyCode}
                    disabled={status === 'copying'}
                    aria-describedby={statusId}
                    aria-label={`کپی کد ${language}`}
                >
                    {status === 'success' ? 'کپی شد' : status === 'copying' ? 'در حال کپی…' : 'کپی کد'}
                </button>
            </div>
            <pre dir="ltr" tabIndex={0} role="region" aria-label={`نمونه کد ${language}${caption ? `؛ ${caption}` : ''}`}>
                <code>{code}</code>
            </pre>
            {caption && <figcaption>{caption}</figcaption>}
            <p id={statusId} className={`article-copy-status${status === 'error' ? ' article-copy-status-error' : ''}`} role="status" aria-live="polite" aria-atomic="true">
                {status === 'success' && 'کد در کلیپ‌بورد کپی شد.'}
                {status === 'error' && 'کپی انجام نشد. کد را انتخاب و به‌صورت دستی کپی کنید، یا دوباره تلاش کنید.'}
            </p>
        </figure>
    );
}
