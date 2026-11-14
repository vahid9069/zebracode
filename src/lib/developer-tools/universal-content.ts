import { getDeveloperToolContent } from './content';
import type { DeveloperToolContent } from './content-types';
import { AllToolsList } from '@/lib/registry/tools';
import { getDefaultFaq } from '@/lib/seo';
import { getToolDefinition } from '@/config/tools';

export function getComprehensiveToolContent(
  toolKey: string,
  slug: string,
  locale: 'fa' | 'en',
  dict?: any
): DeveloperToolContent {
  // 1. If handcrafted developer content already exists (the 23 phase tools), use it directly
  const existing = getDeveloperToolContent(slug, locale);
  if (existing) {
    return existing;
  }

  // 2. Resolve tool meta from registry
  const tool = AllToolsList[toolKey] || Object.values(AllToolsList).find(t => t.href.split('/').filter(Boolean).pop() === slug);
  const localizedCopy = dict?.tools?.[toolKey] || {};
  const isEn = locale === 'en';

  const title = localizedCopy.title || tool?.title || slug;
  const shortDescription = localizedCopy.shortDescription || localizedCopy.description || tool?.shortDescription || tool?.description || '';
  const category = tool?.subCategory || tool?.category || 'developer';
  const inputLang = (tool?.inputLanguage || 'text').toUpperCase();
  const outputLang = (tool?.outputLanguage || 'code').toUpperCase();

  // Find 3-4 related tools in the same category
  const allEntries = Object.entries(AllToolsList);
  const relatedSlugs = allEntries
    .filter(([k, t]) => k !== toolKey && (t.subCategory === tool?.subCategory || t.category === tool?.category))
    .slice(0, 4)
    .map(([, t]) => t.href.split('/').filter(Boolean).pop() || '');

  // Extract sample code if defined in config
  const def = getToolDefinition(slug);
  const sampleInput = def?.input?.sampleCode || (inputLang === 'JSON' ? '{\n  "id": 101,\n  "name": "ZebraCode",\n  "active": true\n}' : '/* Sample code block */\nconst example = true;');
  const sampleOutput = def?.features?.[0] ? `// Generated from ${inputLang} to ${outputLang}\n// Supports ${def.features[0]}` : `// Result formatted for ${outputLang}`;

  // Get localized FAQs
  const defaultFaqs = getDefaultFaq(category, locale);
  const faqs = (defaultFaqs && defaultFaqs.length > 0)
    ? defaultFaqs
    : isEn
    ? [
        {
          question: `Is ${title} completely free to use?`,
          answer: `Yes, ${title} is 100% free with no registration, no subscription, and no hidden rate limits.`,
        },
        {
          question: `Are my code and data safe when using ${title}?`,
          answer: `Absolutely. All conversions run 100% locally in your browser (Client-Side). Your data is never transmitted to, logged on, or analyzed by any remote server.`,
        },
        {
          question: `Can I use ${title} offline?`,
          answer: `Yes. Once the web page is loaded in your browser, the transformation logic runs entirely within your device's JavaScript engine without requiring an ongoing internet connection.`,
        },
      ]
    : [
        {
          question: `آیا استفاده از ابزار ${title} رایگان است؟`,
          answer: `بله، ابزار ${title} در زبراکد کاملاً رایگان است و بدون نیاز به ثبت‌نام، پرداخت یا محدودیت در تعداد دفعات قابل استفاده می‌باشد.`,
        },
        {
          question: `آیا داده‌ها و کدهای من در ابزار ${title} امنیت دارند؟`,
          answer: `بله، تمامی فرآیند تبدیل و فرمت‌بندی به صورت ۱۰۰٪ محلی در مرورگر شما انجام می‌شود و هیچ اطلاعاتی به هیچ سرور خارجی ارسال یا ذخیره نمی‌گردد.`,
        },
        {
          question: `آیا امکان کار با ${title} به صورت آفلاین وجود دارد؟`,
          answer: `بله، پس از بارگذاری اولیه صفحه در مرورگر، کدهای پردازشی در مرورگر دستگاه شما فعال بوده و بدون نیاز به اینترنت کار می‌کنند.`,
        },
      ];

  if (isEn) {
    return {
      seoTitle: `${title} Online Free Developer Tool`,
      metaDescription: `${shortDescription} - Processed 100% in-browser with zero server uploads, privacy guaranteed for backend & frontend developers.`.slice(0, 165),
      answer: `${title} is a dedicated developer utility designed to streamline the transformation of ${inputLang} into ${outputLang}. Running entirely client-side, it enables software engineers, DevOps teams, and technical architects to format, validate, and convert data structures instantly without exposing sensitive configurations or API payloads to remote networks.`,
      steps: [
        `Paste or type your source ${inputLang} payload into the left input editor.`,
        `Configure any optional flags, target formats, or indentation rules in the options panel.`,
        `Inspect the automatically validated ${outputLang} output rendered in real time on the right editor.`,
        `Click Copy to clipboard or Download the resulting file directly into your local development workspace.`,
      ],
      useCases: [
        `Accelerating REST, GraphQL, and microservice payload transformations`,
        `Generating clean, strongly-typed boilerplate without syntax regressions`,
        `Debugging complex, minified, or unformatted production data structures`,
        `Maintaining strict SOC2, GDPR, and enterprise privacy standards by eliminating cloud-based processing`,
      ],
      limitations: [
        `Execution is limited by the local browser environment and available RAM, typically accommodating inputs up to several megabytes.`,
        `Requires modern browser JavaScript (ES2022+) execution enabled.`,
        `Syntactically malformed source inputs will halt transformation until errors are corrected.`,
      ],
      example: {
        input: sampleInput,
        output: sampleOutput,
      },
      faq: faqs.slice(0, 4),
      relatedSlugs,
    };
  }

  return {
    seoTitle: `${title} آنلاین و رایگان – ابزار تخصصی توسعه‌دهندگان`,
    metaDescription: `${shortDescription} - پردازش ۱۰۰٪ محلی در مرورگر بدون ارسال اطلاعات به سرور با امنیت تضمین‌شده برای برنامه‌نویسان.`.slice(0, 165),
    answer: `ابزار ${title} یکی از ابزارهای ضروری و پرکاربرد زبراکد برای مهندسین نرم‌افزار، توسعه‌دهندگان فرانت‌اند و بک‌اند است. این ابزار وظیفه پردازش، اعتبارسنجی و تبدیل دقیق ساختارهای ${inputLang} به ${outputLang} را به عهده دارد. تمامی محاسبات و تبدیل‌ها به صورت آنی (Real-Time) و بدون نیاز به نصب هیچ‌گونه پیش‌نیاز یا کتابخانه سنگین در محیط مرورگر شما انجام می‌شود.`,
    steps: [
      `کد یا ساختار اولیه داده‌های ${inputLang} خود را در کادر ویرایشگر سمت چپ قرار دهید.`,
      `در صورت وجود، گزینه‌های فرمت‌بندی، فشرده‌سازی یا نام‌گذاری متغیرها را بر اساس نیاز پروژه تنظیم کنید.`,
      `خروجی تمیز، بهینه‌سازی‌شده و استاندارد ${outputLang} را بلافاصله در پنل سمت راست تحویل بگیرید.`,
      `با کلیک روی دکمه «کپی» یا دانلود فایل، خروجی را مستقیماً در ویرایشگر کد (IDE) یا مخزن پروژه خود جای‌گذاری نمایید.`,
    ],
    useCases: [
      `تولید و نگهداری آسان مدل‌های داده در پروژه‌های بزرگ نرم‌افزاری`,
      `تبدیل سریع مستندات فنی و ساختارهای پایگاه داده بدون خطای انسانی`,
      `دیباگ و بازخوانی سریع لاگ‌ها و داده‌های فشرده‌شده و ناخوانا`,
      `حفظ امنیت اسرار تجاری و داده‌های محرمانه سازمانی با پردازش محلی`,
    ],
    limitations: [
      `پردازش متکی بر توان سخت‌افزاری و حافظه رم مرورگر کاربر است و فایل‌های تا چند مگابایت به راحتی پردازش می‌شوند.`,
      `اجرای ابزار نیازمند فعال بودن جاوااسکریپت در مرورگر است.`,
      `در صورت وجود خطای نحوی (Syntax Error) در ورودی، فرآیند تبدیل تا اصلاح خطا متوقف می‌شود.`,
    ],
    example: {
      input: sampleInput,
      output: sampleOutput,
    },
    faq: faqs.slice(0, 4),
    relatedSlugs,
  };
}
