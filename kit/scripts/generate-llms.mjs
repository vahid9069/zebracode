import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const toolsModule = await import('../src/lib/tools.ts');
const { TOOLS, CATEGORIES } = toolsModule;

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kit.zebracode.ir';

// ۱. تولید فایل استاندارد llms.txt
const llmsContent = [
  '# ZebraCode Kit — جعبه ابزار آنلاین عمومی زبراکد',
  '> مجموعه‌ای از ۵۰ ابزار کاربردی و روزمره آنلاین با پردازش ۱۰۰٪ محلی در مرورگر (Local-First) بدون نیاز به ارسال داده‌ها به سرور.',
  '',
  '## راهنمای تفصیلی ابزارها',
  `- [مستندات کامل ابزارهای عمومی](${baseUrl}/llms-full.txt): توضیحات جامع، کاربردها، پرسش و پاسخ‌های متداول (FAQ) و روش استفاده از تمامی ۵۰ ابزار.`,
  '',
  '## دسته‌بندی‌ها و ابزارها',
  ...CATEGORIES.flatMap((cat) => {
    const catTools = TOOLS.filter((t) => t.category === cat.id);
    return [
      `### ${cat.title}`,
      `> ${cat.description}`,
      ...catTools.map((t) => `- [${t.title}](${baseUrl}/${t.slug}): ${t.shortDescription}`),
      '',
    ];
  }),
].join('\n');

// ۲. تولید فایل جامع llms-full.txt
const fullContent = [
  '# ZebraCode Kit — مستندات جامع ابزارهای عمومی برای هوش مصنوعی (LLMs)',
  '> این فایل منبع رسمی و کامل مشخصات فنی، سناریوهای کاربری و سوالات متداول ۵۰ ابزار آنلاین زبراکد کیت است.',
  '',
  ...TOOLS.flatMap((tool) => [
    `## ${tool.title}`,
    `- آدرس دسترسی آنلاین: ${baseUrl}/${tool.slug}`,
    `- شناسه ابزار: \`${tool.slug}\``,
    `- دسته‌بندی: ${tool.category}`,
    `- خلاصه: ${tool.shortDescription}`,
    '',
    '### راهنما و ویژگی‌ها:',
    `- پردازش امن و ۱۰۰٪ سمت کلاینت (Client-side) در مرورگر بدون ذخیره‌سازی داده.`,
    `- بدون نیاز به ثبت‌نام و کاملاً رایگان.`,
    `- سازگار با مرورگرهای موبایل و دسکتاپ.`,
    '',
    '### سوالات متداول (FAQ):',
    ...(tool.faq && tool.faq.length > 0
      ? tool.faq.flatMap((f) => [`**س: ${f.question}**`, `پ: ${f.answer}`, ''])
      : [
          `**س: آیا استفاده از ابزار ${tool.title} رایگان است؟**`,
          `پ: بله، این ابزار به‌صورت کاملاً رایگان و نامحدود در دسترس است.`,
          '',
          `**س: آیا داده‌های من به سرور ارسال می‌شود؟**`,
          `پ: خیر، تمام پردازش‌ها در مرورگر دستگاه کاربر انجام می‌شود و هیچ اطلاعاتی ارسال نمی‌شود.`,
          '',
        ]),
    '---',
    '',
  ]),
].join('\n');

const outPublicDir = join(__dirname, '../public');
mkdirSync(outPublicDir, { recursive: true });
writeFileSync(join(outPublicDir, 'llms.txt'), llmsContent, 'utf8');
writeFileSync(join(outPublicDir, 'llms-full.txt'), fullContent, 'utf8');

try {
  const outBuildDir = join(__dirname, '../out');
  mkdirSync(outBuildDir, { recursive: true });
  writeFileSync(join(outBuildDir, 'llms.txt'), llmsContent, 'utf8');
  writeFileSync(join(outBuildDir, 'llms-full.txt'), fullContent, 'utf8');
} catch {
  // out directory might not exist yet before build
}

console.log('✓ kit/public/llms.txt and kit/public/llms-full.txt generated successfully.');
