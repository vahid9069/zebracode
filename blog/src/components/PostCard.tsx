import Link from 'next/link';
import { ArrowUpLeft, Clock3 } from 'lucide-react';
import type { Category, PostSummary } from '@/lib/types';
import { formatDate, formatNumber, postPath } from '@/lib/site';
import PostArtwork from '@/components/PostArtwork';

const kinds = { guide: 'راهنمای کاربردی', concept: 'مفهوم به زبان ساده', comparison: 'مقایسه و انتخاب' };

export default function PostCard({ post, category }: { post: PostSummary; category?: Category }) {
    return <article className="zc-post-card">
        <Link href={postPath(post.slug)} className="zc-post-cover" tabIndex={-1} aria-hidden="true"><PostArtwork variant={post.cover} className="zc-post-artwork" /></Link>
        <div className="zc-post-body">
            <div className="zc-post-labels"><span className="zc-category-pill">{category?.name || kinds[post.kind]}</span><span>{post.level === 'beginner' ? 'مقدماتی' : 'سطح متوسط'}</span></div>
            <h3><Link href={postPath(post.slug)}>{post.title}<ArrowUpLeft size={18} aria-hidden="true" /></Link></h3>
            <p>{post.excerpt}</p>
            <div className="zc-post-meta"><span className="zc-post-author"><span className="zc-author-avatar" aria-hidden="true">{post.author.initials}</span>{post.author.name}</span><time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></div>
            <span className="zc-post-reading"><Clock3 size={13} aria-hidden="true" />{formatNumber(post.readingMinutes)} دقیقه مطالعه</span>
        </div>
    </article>;
}
