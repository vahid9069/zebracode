'use client';

import { useEffect, useRef, useState } from 'react';
import type { AdCampaign, Post } from '@/lib/types';

interface AdBannerProps {
    placement: 'before_content' | 'middle_content' | 'after_paragraph' | 'after_content' | 'catalog_top' | 'catalog_bottom' | string;
    post?: Post;
    categorySlug?: string;
    paragraphIndex?: number;
    className?: string;
}

export function AdBanner({
    placement,
    post,
    categorySlug,
    paragraphIndex,
    className = '',
}: AdBannerProps) {
    const [fetchedAds, setFetchedAds] = useState<AdCampaign[] | null>(null);
    const [masterEnabled, setMasterEnabled] = useState(true);
    const [headScript, setHeadScript] = useState<string | null>(null);
    const scriptContainerRef = useRef<HTMLDivElement>(null);

    // Level 5: Post-level disable check
    if (post?.disableAds) {
        return null;
    }

    const effectiveCategory = categorySlug || post?.category;

    // If post already has pre-resolved ads from WordPress headless controller, use them;
    // otherwise fetch from public /wp-json/omni-ai/v1/ads
    useEffect(() => {
        if (post?.ads && post.ads.length > 0) {
            return;
        }

        let isMounted = true;
        const wpBase = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost/wordpress';
        const url = `${wpBase.replace(/\/+$/, '')}/wp-json/omni-ai/v1/ads${effectiveCategory ? `?category=${encodeURIComponent(effectiveCategory)}` : ''}`;

        fetch(url, { next: { revalidate: 60 } } as RequestInit)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch ads');
                return res.json();
            })
            .then((data) => {
                if (!isMounted) return;
                if (data && data.success) {
                    if (data.master_enabled === false) {
                        setMasterEnabled(false);
                    }
                    if (data.global_head_script) {
                        setHeadScript(data.global_head_script);
                    }
                    if (Array.isArray(data.ads)) {
                        setFetchedAds(data.ads);
                    }
                }
            })
            .catch(() => {
                // Silently fallback if endpoint is unreachable
            });

        return () => {
            isMounted = false;
        };
    }, [post?.ads, effectiveCategory]);

    // Inject global head script once if provided
    useEffect(() => {
        if (!headScript) return;
        const scriptId = 'omni-ai-global-head-script';
        if (document.getElementById(scriptId)) return;

        const scriptEl = document.createElement('div');
        scriptEl.id = scriptId;
        scriptEl.style.display = 'none';
        scriptEl.innerHTML = headScript;

        // Extract and run scripts inside
        const scripts = scriptEl.querySelectorAll('script');
        scripts.forEach((oldScript) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            document.head.appendChild(newScript);
        });
    }, [headScript]);

    if (!masterEnabled) {
        return null;
    }

    const availableAds = (post?.ads && post.ads.length > 0) ? post.ads : fetchedAds;
    if (!availableAds || availableAds.length === 0) {
        return null;
    }

    // Match candidate ads by placement and priority
    const matchingAds = availableAds.filter((ad) => {
        if (!ad.active) return false;
        if (ad.placement !== placement) return false;

        // If after_paragraph, match paragraph index if specified
        if (placement === 'after_paragraph' && typeof paragraphIndex === 'number' && typeof ad.paragraph_number === 'number') {
            if (ad.paragraph_number !== paragraphIndex) return false;
        }

        // Category filter if configured
        if (effectiveCategory && Array.isArray(ad.target_categories) && ad.target_categories.length > 0) {
            if (!ad.target_categories.includes(effectiveCategory)) return false;
        }

        return true;
    });

    if (matchingAds.length === 0) {
        return null;
    }

    // Pick top priority ad (sorted ascending by priority number)
    const selectedAd = matchingAds.sort((a, b) => (a.priority ?? 10) - (b.priority ?? 10))[0];
    if (!selectedAd) {
        return null;
    }

    // Prepare target link with UTM campaign tracking
    let targetHref = selectedAd.target_url || '#';
    if (selectedAd.utm_campaign && targetHref !== '#') {
        try {
            const parsedUrl = new URL(targetHref, 'https://zebracode.ir');
            parsedUrl.searchParams.set('utm_source', 'zebracode_blog');
            parsedUrl.searchParams.set('utm_medium', selectedAd.ad_type === 'native' ? 'native_cta' : 'banner');
            parsedUrl.searchParams.set('utm_campaign', selectedAd.utm_campaign);
            targetHref = parsedUrl.toString();
        } catch (_) {}
    }

    const targetAttr = selectedAd.open_new_tab !== false ? '_blank' : '_self';

    return (
        <div className={`omni-ad-slot omni-ad-${placement} my-8 w-full max-w-full overflow-hidden ${className}`}>
            {/* 1. Image Banner */}
            {selectedAd.ad_type === 'image' && selectedAd.image_url && (
                <div className="relative group block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shadow-sm transition hover:shadow-md">
                    <a
                        href={targetHref}
                        target={targetAttr}
                        rel="sponsored noopener noreferrer"
                        className="block w-full text-decoration-none"
                    >
                        <picture className="block w-full">
                            {selectedAd.mobile_image_url && (
                                <source media="(max-width: 640px)" srcSet={selectedAd.mobile_image_url} />
                            )}
                            <img
                                src={selectedAd.image_url}
                                alt={selectedAd.alt_text || selectedAd.title || 'تبلیغ'}
                                loading="lazy"
                                className="w-full h-auto object-cover block rounded-xl transition duration-200 group-hover:scale-[1.005]"
                            />
                        </picture>
                    </a>
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[10px] font-medium tracking-wider bg-slate-900/70 text-slate-200 backdrop-blur-sm rounded-md border border-slate-700/50 select-none">
                        {selectedAd.badge_text || 'تبلیغ'}
                    </span>
                </div>
            )}

            {/* 2. Script Network Banner (Najva, Yektanet, Tapsell, etc.) */}
            {selectedAd.ad_type === 'script' && selectedAd.script_code && (
                <ScriptAdBlock scriptCode={selectedAd.script_code} badgeText={selectedAd.badge_text} />
            )}

            {/* 3. Native CTA Card */}
            {selectedAd.ad_type === 'native' && (
                <div className="relative p-5 sm:p-6 rounded-xl border border-sky-200/70 dark:border-sky-900/50 bg-gradient-to-br from-sky-50/60 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 space-y-1.5">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                <span>📢</span>
                                <span>{selectedAd.badge_text || 'پیشنهاد ویژه'}</span>
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                {selectedAd.headline || selectedAd.title}
                            </h4>
                            {selectedAd.description && (
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                                    {selectedAd.description}
                                </p>
                            )}
                        </div>
                        {selectedAd.target_url && (
                            <a
                                href={targetHref}
                                target={targetAttr}
                                rel="sponsored noopener noreferrer"
                                className="inline-flex items-center justify-center shrink-0 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50 whitespace-nowrap"
                            >
                                {selectedAd.cta_text || 'مشاهده و اطلاعات بیشتر ←'}
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Subcomponent to reliably execute ad network scripts via DOM injection
function ScriptAdBlock({ scriptCode, badgeText }: { scriptCode: string; badgeText?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        container.innerHTML = '';

        // Create temporary holder to parse HTML and extract scripts
        const temp = document.createElement('div');
        temp.innerHTML = scriptCode;

        // Append non-script elements directly
        Array.from(temp.childNodes).forEach((node) => {
            if (node.nodeName.toLowerCase() !== 'script') {
                container.appendChild(node.cloneNode(true));
            }
        });

        // Create fresh script elements so browser executes them
        const scripts = temp.querySelectorAll('script');
        scripts.forEach((oldScript) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            container.appendChild(newScript);
        });
    }, [scriptCode]);

    return (
        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-2 sm:p-3 text-center overflow-hidden">
            <div className="absolute top-1.5 left-2 z-10 text-[9.5px] text-slate-400 font-medium select-none">
                {badgeText || 'تبلیغ'}
            </div>
            <div ref={containerRef} className="omni-script-ad-container min-h-[60px] flex items-center justify-center" />
        </div>
    );
}
