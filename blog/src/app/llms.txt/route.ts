import { getAllPosts, getCategories } from '@/lib/repository';
import { absoluteUrl, categoryPath, postPath } from '@/lib/site';

export const dynamic = 'force-static';

export async function GET() {
    const [posts, categories] = await Promise.all([getAllPosts(), getCategories()]);

    const lines: string[] = [];
    lines.push('# وبلاگ زبراکد (ZebraCode Blog)');
    lines.push('> پایگاه دانش تخصصی برنامه‌نویسی، امنیت وب، معماری نرم‌افزار، شبکه و ابزارهای آنلاین توسعه‌دهندگان.');
    lines.push('');
    lines.push('## موضوعات و دسته‌بندی‌ها');
    for (const cat of categories) {
        lines.push(`- [${cat.name}](${absoluteUrl(categoryPath(cat.slug))}): ${cat.description}`);
    }
    lines.push('');
    lines.push('## مقاله‌های راهنما و فنی');
    for (const post of posts) {
        lines.push(`- [${post.title}](${absoluteUrl(postPath(post.slug))}): ${post.excerpt}`);
    }
    lines.push('');
    lines.push('## مستندات متنی کامل');
    lines.push(`- [متن کامل همه مقالات برای هوش مصنوعی (llms-full.txt)](${absoluteUrl('/llms-full.txt')})`);

    return new Response(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
