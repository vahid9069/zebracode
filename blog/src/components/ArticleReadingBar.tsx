'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, MessageCircle, MessageSquare, Send, Share2, X } from 'lucide-react';

interface ArticleReadingBarProps {
    title: string;
}

export default function ArticleReadingBar({ title }: ArticleReadingBarProps) {
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }

        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (totalScroll > 0) {
                const currentProgress = (window.scrollY / totalScroll) * 100;
                setProgress(Math.min(100, Math.max(0, currentProgress)));
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowShareMenu(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowShareMenu(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        } catch {
            // fallback
        }
    };

    const handleShare = async () => {
        const url = currentUrl || (typeof window !== 'undefined' ? window.location.href : '');
        // Native Share API on Android, iOS, and supporting browsers
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title,
                    text: `${title}\nدر وبلاگ زبراکد بخوانید:`,
                    url,
                });
                return;
            } catch (err: unknown) {
                if ((err as Error)?.name === 'AbortError') {
                    return; // user cancelled native dialog
                }
            }
        }

        // Fallback for desktop/browsers without native share sheet
        setShowShareMenu((prev) => !prev);
    };

    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(title);
    const smsBody = encodeURIComponent(`${title}\n${currentUrl}`);

    return (
        <aside className="article-reading-bar" aria-label="نوار ابزار مطالعه">
            <div
                className="article-reading-progress"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
            />
            <div className="article-reading-bar-inner">
                <span className="article-reading-title" title={title}>{title}</span>
                <div className="article-reading-actions">
                    <button
                        type="button"
                        onClick={copyLink}
                        className="article-share-btn"
                        aria-label={copied ? 'پیوند کپی شد' : 'کپی پیوند مقاله'}
                    >
                        {copied ? <Check size={14} aria-hidden="true" className="text-emerald-500" /> : <Copy size={14} aria-hidden="true" />}
                        <span>{copied ? 'کپی شد!' : 'کپی لینک'}</span>
                    </button>

                    <div className="article-share-container" ref={menuRef}>
                        <button
                            type="button"
                            onClick={handleShare}
                            className={`article-share-btn ${showShareMenu ? 'active' : ''}`}
                            aria-label="اشتراک‌گذاری مقاله در شبکه‌های اجتماعی یا پیامک"
                            aria-expanded={showShareMenu}
                        >
                            <Share2 size={14} aria-hidden="true" />
                            <span>اشتراک‌گذاری</span>
                        </button>

                        {showShareMenu && (
                            <div className="article-share-menu" role="menu">
                                <a
                                    href={`sms:?body=${smsBody}`}
                                    className="article-share-item"
                                    role="menuitem"
                                    onClick={() => setShowShareMenu(false)}
                                >
                                    <MessageSquare size={16} aria-hidden="true" />
                                    <span>پیامک (SMS)</span>
                                </a>
                                <a
                                    href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="article-share-item"
                                    role="menuitem"
                                    onClick={() => setShowShareMenu(false)}
                                >
                                    <Send size={16} aria-hidden="true" />
                                    <span>تلگرام (Telegram)</span>
                                </a>
                                <a
                                    href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="article-share-item"
                                    role="menuitem"
                                    onClick={() => setShowShareMenu(false)}
                                >
                                    <MessageCircle size={16} aria-hidden="true" />
                                    <span>واتس‌اپ (WhatsApp)</span>
                                </a>
                                <a
                                    href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="article-share-item"
                                    role="menuitem"
                                    onClick={() => setShowShareMenu(false)}
                                >
                                    <span style={{ fontSize: 14, fontWeight: 700, width: 16, textAlign: 'center', display: 'inline-block' }}>𝕏</span>
                                    <span>توییتر / X</span>
                                </a>
                                <a
                                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="article-share-item"
                                    role="menuitem"
                                    onClick={() => setShowShareMenu(false)}
                                >
                                    <span style={{ fontSize: 12, fontWeight: 700, width: 16, textAlign: 'center', display: 'inline-block' }}>in</span>
                                    <span>لینکدین (LinkedIn)</span>
                                </a>
                                <button
                                    type="button"
                                    onClick={() => { copyLink(); setShowShareMenu(false); }}
                                    className="article-share-item"
                                    role="menuitem"
                                >
                                    <Copy size={16} aria-hidden="true" />
                                    <span>{copied ? 'پیوند کپی شد ✓' : 'کپی آدرس صفحه'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}
