'use client';

import { useEffect, useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
    src: string;
    alt: string;
    caption?: string;
}

export default function ImageLightbox({ src, alt, caption }: ImageLightboxProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open]);

    return (
        <>
            <figure className="article-figure">
                <button
                    type="button"
                    className="article-figure-trigger"
                    onClick={() => setOpen(true)}
                    aria-label={`بزرگ‌نمایی تصویر: ${alt || 'تصویر مقاله'}`}
                >
                    <img src={src} alt={alt || ''} loading="lazy" />
                    <span className="article-figure-zoom" aria-hidden="true">
                        <ZoomIn size={16} />
                    </span>
                </button>
                {caption && <figcaption>{caption}</figcaption>}
            </figure>

            {open && (
                <div
                    className="article-lightbox-backdrop"
                    role="dialog"
                    aria-modal="true"
                    aria-label={alt || 'پیش‌نمایش تصویر'}
                    onClick={() => setOpen(false)}
                >
                    <button
                        type="button"
                        className="article-lightbox-close"
                        onClick={() => setOpen(false)}
                        aria-label="بستن پیش‌نمایش"
                    >
                        <X size={22} />
                    </button>
                    <div className="article-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={src} alt={alt || ''} />
                        {caption && <p className="article-lightbox-caption">{caption}</p>}
                    </div>
                </div>
            )}
        </>
    );
}
