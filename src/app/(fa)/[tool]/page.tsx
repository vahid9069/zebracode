import ToolPageClient from '@/components/pages/ToolPageClient';
import { getDictionary } from '@/i18n/getDictionary';
import { AllToolsList } from '@/lib/registry/tools';

// این تابع به Next.js می‌گوید چه صفحاتی را باید بسازد
export function generateStaticParams() {
  return Object.values(AllToolsList).map((t) => {
    const toolSlug = t.href.split('/').filter(Boolean).pop();
    return { tool: toolSlug || '' };
  });
}

export default async function FaToolPage({ params }: { params: Promise<{ tool: string }> }) {
  // ۱. منتظر ماندن برای دریافت پارامتر آدرس
  const resolvedParams = await params;
  
  // ۲. دریافت فایل‌های ترجمه فارسی
  const dict = await getDictionary('fa');
  
  // ۳. پیدا کردن ابزار در دیتابیس بر اساس آدرس
  const foundEntry = Object.entries(AllToolsList).find(([key, t]) => {
    const slug = t.href.split('/').filter(Boolean).pop();
    return slug === resolvedParams.tool;
  });

  // ۴. اگر ابزار در لیست نبود، پیام خطا نشان بده
  if (!foundEntry) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-xl font-bold">
        ابزار پیدا نشد
      </div>
    );
  }

  // ۵. ارسال اطلاعات به کلاینت کامپوننت برای نمایش
  return <ToolPageClient toolType={foundEntry[0]} dict={dict} locale="fa" />;
}