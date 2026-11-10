'use client';

import { useEffect, useState } from 'react';
import type { Post } from '@/lib/types';

interface TableOfContentsProps {
    post: Post;
}

export default function TableOfContents({ post }: TableOfContentsProps) {
    const headings = post.blocks.filter((block) => block.type === 'heading');
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const itemIds = [
            ...headings.map((h) => h.id),
            ...(post.faq.length > 0 ? ['reading-faq'] : []),
            ...(post.references.length > 0 ? ['reading-references'] : []),
        ];

        const handleScroll = () => {
            const scrollPos = window.scrollY + 160;
            let current = '';

            for (const id of itemIds) {
                const element = document.getElementById(id);
                if (element) {
                    const top = element.offsetTop;
                    if (scrollPos >= top) {
                        current = id;
                    }
                }
            }

            if (current) {
                setActiveId(current);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [headings, post.faq.length, post.references.length]);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -90;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            history.pushState(null, '', `#${id}`);
            setActiveId(id);
        }
    };

    return (
        <ol className="reading-toc-list">
            {headings.map((heading) => {
                const isActive = activeId === heading.id;
                return (
                    <li key={heading.id} className={isActive ? 'toc-item-active' : ''}>
                        <a
                            href={`#${heading.id}`}
                            className={isActive ? 'active' : ''}
                            onClick={(e) => scrollToSection(e, heading.id)}
                            aria-current={isActive ? 'location' : undefined}
                        >
                            <span className="toc-dot" aria-hidden="true" />
                            <span>{heading.title}</span>
                        </a>
                    </li>
                );
            })}
            {post.faq.length > 0 && (
                <li className={activeId === 'reading-faq' ? 'toc-item-active' : ''}>
                    <a
                        href="#reading-faq"
                        className={activeId === 'reading-faq' ? 'active' : ''}
                        onClick={(e) => scrollToSection(e, 'reading-faq')}
                        aria-current={activeId === 'reading-faq' ? 'location' : undefined}
                    >
                        <span className="toc-dot" aria-hidden="true" />
                        <span>پرسش‌های متداول</span>
                    </a>
                </li>
            )}
            {post.references.length > 0 && (
                <li className={activeId === 'reading-references' ? 'toc-item-active' : ''}>
                    <a
                        href="#reading-references"
                        className={activeId === 'reading-references' ? 'active' : ''}
                        onClick={(e) => scrollToSection(e, 'reading-references')}
                        aria-current={activeId === 'reading-references' ? 'location' : undefined}
                    >
                        <span className="toc-dot" aria-hidden="true" />
                        <span>منابع و مطالعه بیشتر</span>
                    </a>
                </li>
            )}
        </ol>
    );
}
