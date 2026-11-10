import type { Author, Post } from '@/lib/types';

const author: Author = {
    name: 'تحریریه زبراکد',
    role: 'یادداشت‌های کاربردی توسعه',
    bio: 'در تحریریه زبراکد، مسئله‌های روزمره توسعه را با مثال‌های کوچک و توضیح روشن بررسی می‌کنیم؛ این نوشته‌ها محتوای نمونه برای آشنایی با ابزارها هستند.',
    initials: 'ZC',
};

export function definePost(input: Omit<Post, 'author' | 'readingMinutes'>): Post {
    const prose = input.blocks.flatMap(block => {
        switch (block.type) {
            case 'paragraph': return [block.text];
            case 'heading': return [block.title];
            case 'list': return block.items;
            case 'callout': return [block.title, block.text];
            case 'table': return [...block.headers, ...block.rows.flat()];
            case 'code': return block.caption ? [block.caption] : [];
        }
    });
    const words = [...prose, ...input.faq.flatMap(item => [item.question, item.answer])]
        .join(' ').trim().split(/\s+/u).filter(Boolean).length;

    return { ...input, author: { ...author }, readingMinutes: Math.max(2, Math.ceil(words / 180)) };
}
