import { getAllPosts } from '@/lib/repository';
import { absoluteUrl, getToolUrl, postPath } from '@/lib/site';

export const dynamic = 'force-static';

export async function GET() {
    const posts = await getAllPosts();

    const sections: string[] = [];
    sections.push('# وبلاگ زبراکد (ZebraCode Blog) - متن کامل مقالات');
    sections.push('> مجموعه کامل راهنماهای فنی، معماری نرم‌افزار، امنیت وب و ابزارهای آنلاین توسعه‌دهندگان.\n');

    for (const post of posts) {
        const doc: string[] = [];
        doc.push(`## ${post.title}`);
        doc.push(`- **نشانی:** ${absoluteUrl(postPath(post.slug))}`);
        doc.push(`- **دسته‌بندی:** ${post.category}`);
        doc.push(`- **نویسنده:** ${post.author.name} (${post.author.role})`);
        doc.push(`- **تاریخ انتشار:** ${post.publishedAt}`);
        doc.push(`- **خلاصه:** ${post.excerpt}\n`);

        for (const block of post.blocks) {
            switch (block.type) {
                case 'paragraph':
                    doc.push(block.text);
                    doc.push('');
                    break;
                case 'heading':
                    doc.push(`${block.level === 3 ? '####' : '###'} ${block.title}\n`);
                    break;
                case 'list':
                    for (const item of block.items) {
                        doc.push(`- ${item}`);
                    }
                    doc.push('');
                    break;
                case 'code':
                    doc.push(`\`\`\`${block.language || ''}\n${block.code}\n\`\`\`\n`);
                    break;
                case 'callout':
                    doc.push(`> **${block.title}**\n> ${block.text}\n`);
                    break;
                case 'table':
                    doc.push(`| ${block.headers.join(' | ')} |`);
                    doc.push(`| ${block.headers.map(() => '---').join(' | ')} |`);
                    for (const row of block.rows) {
                        doc.push(`| ${row.join(' | ')} |`);
                    }
                    doc.push('');
                    break;
                case 'image':
                    doc.push(`![${block.alt || post.title}](${block.url})`);
                    if (block.caption) doc.push(`*${block.caption}*`);
                    doc.push('');
                    break;
            }
        }

        if (post.faq.length > 0) {
            doc.push('### پرسش‌های متداول');
            for (const item of post.faq) {
                doc.push(`**پرسش:** ${item.question}`);
                doc.push(`${item.answer}\n`);
            }
        }

        if (post.tools.length > 0) {
            doc.push('### ابزارهای مرتبط در زبراکد');
            for (const tool of post.tools) {
                doc.push(`- [${tool.title}](${tool.url || getToolUrl(tool.slug)}): ${tool.description}`);
            }
            doc.push('');
        }

        if (post.references.length > 0) {
            doc.push('### منابع و ارجاعات');
            for (const ref of post.references) {
                doc.push(`- [${ref.label}](${ref.url})`);
            }
            doc.push('');
        }

        sections.push(doc.join('\n'));
        sections.push('---\n');
    }

    return new Response(sections.join('\n'), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
