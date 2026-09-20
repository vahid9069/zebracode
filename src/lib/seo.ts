// src/lib/seo.ts
import { Metadata } from 'next';
import { getToolConfig } from "@/components/utils/tools/helper";
import { BASE_URL } from "@/lib/env";

export function getLocalizedToolPath(toolType: string, locale: 'fa' | 'en'): string | undefined {
    const tool = getToolConfig(toolType);
    if (!tool) return undefined;
    const slug = tool.href.split('/').filter(Boolean).pop();
    if (!slug) return undefined;
    return locale === 'en' ? `/en/${slug}` : `/${slug}`;
}

export function getLocalizedUrl(path: string): string {
    return `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function generateToolMetadata(toolType: string, locale: 'fa' | 'en' = 'en'): Metadata {
    const tool = getToolConfig(toolType);
    if (!tool) {
        return {
            title: 'Tool Not Found',
            description: 'The requested converter was not found.',
        };
    }

    const title = `${tool.title} – ${locale === 'fa' ? 'ابزار آنلاین رایگان' : 'Free Online Tool'} | ZebraCode`;
    const description = tool.shortDescription || tool.description;
    const path = getLocalizedToolPath(toolType, locale) || '/';
    const url = getLocalizedUrl(path);
    const alternateLocale = locale === 'fa' ? 'en' : 'fa';
    const alternatePath = getLocalizedToolPath(toolType, alternateLocale) || '/';

    return {
        title,
        description,
        alternates: {
            canonical: url,
            languages: {
                'fa-IR': locale === 'fa' ? url : getLocalizedUrl(alternatePath),
                en: locale === 'en' ? url : getLocalizedUrl(alternatePath),
                'x-default': getLocalizedUrl(alternatePath),
            },
        },
        robots: { index: true, follow: true },
        openGraph: {
            title,
            description,
            url,
            siteName: 'ZebraCode',
            type: 'website',
            locale: locale === 'fa' ? 'fa_IR' : 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

export function getDefaultFaq(subCategory: string, locale: string = 'en'): { question: string; answer: string }[] {
    const faqs: Record<string, { question: string; answer: string }[]> = {
        // ---------- دسته‌های قبلی (converters) ----------
        json: [
            { question: "Is this JSON tool free to use?", answer: "Yes, all JSON tools on ZebraCode are completely free. You can use them without any registration or limitations." },
            { question: "Is my JSON data secure?", answer: "Absolutely. All processing happens directly in your browser. Your data is never uploaded to any server, ensuring complete privacy." },
            { question: "Can I process large JSON files?", answer: "Yes, our tools are optimized for performance and can handle files up to several megabytes, depending on your browser's capabilities." }
        ],
        css: [
            { question: "Is this CSS tool free to use?", answer: "Yes, all CSS tools on ZebraCode are completely free. No registration or sign-up is required." },
            { question: "Does the tool support modern CSS features?", answer: "Yes, our CSS tools support modern CSS features including custom properties, flexbox, grid, and more." },
            { question: "Is my CSS code processed securely?", answer: "Yes, all processing is done locally in your browser. Your code never leaves your device." }
        ],
        graphql: [
            { question: "Is this GraphQL tool free?", answer: "Yes, all GraphQL tools on ZebraCode are completely free to use with no limitations." },
            { question: "Does the tool support the latest GraphQL spec?", answer: "Yes, our tools are built on the official GraphQL.js library and support the latest specification." },
            { question: "Is my GraphQL schema secure?", answer: "Yes, all processing happens locally in your browser. Your schema is never sent to any server." }
        ],
        html: [
            { question: "Is this HTML tool free?", answer: "Yes, all HTML tools on ZebraCode are completely free and require no registration." },
            { question: "Does the tool handle complex HTML structures?", answer: "Yes, our HTML tools are designed to handle complex nested structures and large documents." },
            { question: "Is my HTML code processed securely?", answer: "Yes, all processing happens in your browser. Your code never leaves your device." }
        ],
        javascript: [
            { question: "Is this JavaScript tool free?", answer: "Yes, all JavaScript tools on ZebraCode are completely free to use." },
            { question: "Does the tool support modern JavaScript (ES6+)?", answer: "Yes, our JavaScript tools support modern syntax including arrow functions, template literals, and more." },
            { question: "Is my JavaScript code secure?", answer: "Yes, all processing is done locally in your browser. Your code is never uploaded anywhere." }
        ],
        typescript: [
            { question: "Is this TypeScript tool free?", answer: "Yes, all TypeScript tools on ZebraCode are completely free to use without restrictions." },
            { question: "Does the tool support the latest TypeScript features?", answer: "Yes, our TypeScript tools are built on the official TypeScript compiler and support the latest features." },
            { question: "Is my TypeScript code processed securely?", answer: "Yes, all processing happens locally in your browser. Your code never leaves your device." }
        ],
        svg: [
            { question: "Is this SVG tool free?", answer: "Yes, all SVG tools on ZebraCode are completely free to use." },
            { question: "Does the tool handle complex SVG graphics?", answer: "Yes, our SVG tools can process complex vector graphics with multiple elements and attributes." },
            { question: "Is my SVG code secure?", answer: "Yes, all processing is done locally in your browser. Your SVG code is never uploaded." }
        ],
        jsonld: [
            { question: "Is this JSON-LD tool free?", answer: "Yes, all JSON-LD tools on ZebraCode are completely free to use." },
            { question: "Does the tool support all JSON-LD contexts?", answer: "Yes, our JSON-LD tools support custom contexts and standard schema.org vocabularies." },
            { question: "Is my JSON-LD data processed securely?", answer: "Yes, all processing happens locally in your browser. Your data is never uploaded." }
        ],
        'json-schema': [
            { question: "Is this JSON Schema tool free?", answer: "Yes, all JSON Schema tools on ZebraCode are completely free to use." },
            { question: "Does the tool support the latest JSON Schema drafts?", answer: "Yes, our tools support JSON Schema drafts up to 2020-12." },
            { question: "Is my JSON Schema processed securely?", answer: "Yes, all processing happens locally in your browser. Your schema is never uploaded." }
        ],
        flow: [
            { question: "Is this Flow tool free?", answer: "Yes, all Flow tools on ZebraCode are completely free to use." },
            { question: "Does the tool accurately strip Flow types?", answer: "Yes, our Flow tools use Babel with the Flow preset to ensure accurate type removal." },
            { question: "Is my Flow code processed securely?", answer: "Yes, all processing happens locally in your browser." }
        ],
        encoders: [
            { question: "Is this encoding tool free?", answer: "Yes, all encoding/decoding tools on ZebraCode are completely free to use." },
            { question: "Is my data processed securely?", answer: "Yes, all processing happens locally in your browser. Your data is never uploaded." },
            { question: "What types of encoding are supported?", answer: "We support Base64 encoding/decoding and JWT decoding. More formats are coming soon." }
        ],

        // ---------- دسته‌های جدید ----------
        'date-time': [
            { question: "Is this date/time tool free?", answer: "Yes, all date/time tools on ZebraCode are completely free to use." },
            { question: "Does the tool support different calendars?", answer: "Yes, our date/time tools support both Gregorian and Persian (Jalali/Shamsi) calendars." },
            { question: "How accurate are the calculations?", answer: "All calculations are performed using JavaScript's built-in Date API and the jalaali-js library, ensuring high accuracy." },
            { question: "Is my timestamp data processed securely?", answer: "Yes, all processing happens locally in your browser. Your data is never uploaded to any server." }
        ],
        generators: [
            { question: "Is this generator tool free?", answer: "Yes, all generator tools on ZebraCode are completely free to use." },
            { question: "How are the generated values created?", answer: "All generators use cryptographically secure randomization (for passwords) or proper text generation algorithms (for Lorem Ipsum)." },
            { question: "Are the generated values stored anywhere?", answer: "No, everything is generated locally in your browser. No data is stored, transmitted, or logged." }
        ],
        text: [
            { question: "Is this text tool free?", answer: "Yes, all text tools on ZebraCode are completely free to use." },
            { question: "How does the text comparison work?", answer: "The text comparison uses a line-by-line diff algorithm to show exactly what has changed between two texts." },
            { question: "Is my text data secure?", answer: "Yes, all processing happens locally in your browser. Your text never leaves your device." }
        ],
        password: [
            { question: "Are the generated passwords secure?", answer: "Yes, passwords are generated using the Web Crypto API (Crypto.getRandomValues), which provides cryptographically strong random numbers." },
            { question: "Can I customize the password length?", answer: "Yes, you can generate passwords from 8 to 64 characters long and choose which character types to include." },
            { question: "Are my passwords stored or logged?", answer: "No. Passwords are generated entirely in your browser and are never transmitted, stored, or logged anywhere." }
        ],
        others: [
            { question: "Is this tool free to use?", answer: "Yes, all tools on ZebraCode are completely free and require no registration." },
            { question: "How does this tool work?", answer: "All processing happens directly in your browser. Your data is never sent to any server." },
            { question: "Can I use this tool offline?", answer: "Yes, once the page is loaded, the tool works completely offline in your browser." }
        ]
    };

    if (locale === 'fa') {
        const faqsFa: Record<string, { question: string; answer: string }[]> = {
            json: [
                { question: "آیا استفاده از این ابزار JSON رایگان است؟", answer: "بله، تمام ابزارهای JSON در ZebraCode کاملاً رایگان هستند و بدون ثبت‌نام یا محدودیت قابل استفاده‌اند." },
                { question: "آیا داده‌های JSON من امن هستند؟", answer: "بله. تمام پردازش‌ها مستقیماً در مرورگر شما انجام می‌شود و داده‌ها برای حفظ حریم خصوصی به هیچ سروری ارسال نمی‌شوند." },
                { question: "آیا می‌توانم فایل‌های JSON بزرگ را پردازش کنم؟", answer: "بله، ابزارهای ما برای عملکرد مناسب بهینه شده‌اند و بسته به توانایی مرورگر شما می‌توانند فایل‌هایی تا چند مگابایت را پردازش کنند." }
            ],
            css: [
                { question: "آیا استفاده از این ابزار CSS رایگان است؟", answer: "بله، تمام ابزارهای CSS در ZebraCode کاملاً رایگان و بدون نیاز به ثبت‌نام هستند." },
                { question: "آیا ابزار از قابلیت‌های جدید CSS پشتیبانی می‌کند؟", answer: "بله، ابزارهای CSS از قابلیت‌هایی مانند custom properties، flexbox و grid پشتیبانی می‌کنند." },
                { question: "آیا کد CSS من به‌صورت امن پردازش می‌شود؟", answer: "بله، تمام پردازش‌ها به‌صورت محلی در مرورگر انجام می‌شوند و کد شما از دستگاه خارج نمی‌شود." }
            ],
            graphql: [
                { question: "آیا استفاده از این ابزار GraphQL رایگان است؟", answer: "بله، تمام ابزارهای GraphQL در ZebraCode کاملاً رایگان و بدون محدودیت هستند." },
                { question: "آیا ابزار از آخرین مشخصات GraphQL پشتیبانی می‌کند؟", answer: "بله، ابزارهای ما بر پایه کتابخانه رسمی GraphQL.js ساخته شده‌اند و از آخرین مشخصات پشتیبانی می‌کنند." },
                { question: "آیا اسکیمای GraphQL من امن است؟", answer: "بله، تمام پردازش‌ها به‌صورت محلی در مرورگر انجام می‌شوند و اسکیمای شما به سروری ارسال نمی‌شود." }
            ],
            jsonld: [
                { question: "آیا استفاده از این ابزار JSON-LD رایگان است؟", answer: "بله، تمام ابزارهای JSON-LD در ZebraCode کاملاً رایگان هستند." },
                { question: "آیا ابزار از تمام contextهای JSON-LD پشتیبانی می‌کند؟", answer: "بله، ابزارهای JSON-LD از contextهای سفارشی و واژگان استاندارد schema.org پشتیبانی می‌کنند." },
                { question: "آیا داده‌های JSON-LD من امن هستند؟", answer: "بله، تمام پردازش‌ها در مرورگر انجام می‌شوند و داده‌های شما ارسال نمی‌شوند." }
            ],
            'json-schema': [
                { question: "آیا استفاده از این ابزار JSON Schema رایگان است؟", answer: "بله، تمام ابزارهای JSON Schema در ZebraCode کاملاً رایگان هستند." },
                { question: "آیا ابزار از نسخه‌های جدید JSON Schema پشتیبانی می‌کند؟", answer: "بله، ابزارهای ما از نسخه‌های JSON Schema تا draft 2020-12 پشتیبانی می‌کنند." },
                { question: "آیا JSON Schema من به‌صورت امن پردازش می‌شود؟", answer: "بله، تمام پردازش‌ها در مرورگر انجام می‌شوند و اسکیمای شما ارسال نمی‌شود." }
            ],
            flow: [
                { question: "آیا استفاده از این ابزار Flow رایگان است؟", answer: "بله، تمام ابزارهای Flow در ZebraCode کاملاً رایگان هستند." },
                { question: "آیا حذف typeهای Flow با دقت انجام می‌شود؟", answer: "بله، ابزارهای Flow از Babel و preset رسمی Flow برای حذف دقیق typeها استفاده می‌کنند." },
                { question: "آیا کد Flow من امن است؟", answer: "بله، تمام پردازش‌ها در مرورگر انجام می‌شوند و کد شما از دستگاه خارج نمی‌شود." }
            ],
            html: [
                { question: "آیا استفاده از این ابزار HTML رایگان است؟", answer: "بله، تمام ابزارهای HTML در ZebraCode رایگان هستند و به ثبت‌نام نیاز ندارند." },
                { question: "آیا ابزار ساختارهای پیچیده HTML را پردازش می‌کند؟", answer: "بله، ابزارهای HTML برای پردازش ساختارهای تو‌در‌تو و اسناد بزرگ طراحی شده‌اند." },
                { question: "آیا کد HTML من به‌صورت امن پردازش می‌شود؟", answer: "بله، تمام پردازش‌ها در مرورگر انجام می‌شوند و کد شما از دستگاه خارج نمی‌شود." }
            ],
            javascript: [
                { question: "آیا استفاده از این ابزار JavaScript رایگان است؟", answer: "بله، تمام ابزارهای JavaScript در ZebraCode کاملاً رایگان هستند." },
                { question: "آیا ابزار از JavaScript مدرن (ES6+) پشتیبانی می‌کند؟", answer: "بله، ابزارهای ما از سینتکس مدرن مانند arrow function و template literal پشتیبانی می‌کنند." },
                { question: "آیا کد JavaScript من امن است؟", answer: "بله، تمام پردازش‌ها در مرورگر انجام می‌شوند و کد شما در هیچ سروری بارگذاری نمی‌شود." }
            ],
            typescript: [
                { question: "آیا استفاده از این ابزار TypeScript رایگان است؟", answer: "بله، تمام ابزارهای TypeScript در ZebraCode کاملاً رایگان و بدون محدودیت هستند." },
                { question: "آیا ابزار از قابلیت‌های جدید TypeScript پشتیبانی می‌کند؟", answer: "بله، ابزارهای ما بر پایه کامپایلر رسمی TypeScript ساخته شده‌اند و از قابلیت‌های جدید پشتیبانی می‌کنند." },
                { question: "آیا کد TypeScript من به‌صورت امن پردازش می‌شود؟", answer: "بله، تمام پردازش‌ها در مرورگر انجام می‌شوند و کد شما از دستگاه خارج نمی‌شود." }
            ],
            svg: [
                { question: "آیا استفاده از این ابزار SVG رایگان است؟", answer: "بله، تمام ابزارهای SVG در ZebraCode کاملاً رایگان هستند." },
                { question: "آیا ابزار گرافیک‌های پیچیده SVG را پردازش می‌کند؟", answer: "بله، ابزارهای ما گرافیک‌های برداری پیچیده با عناصر و ویژگی‌های متعدد را پردازش می‌کنند." },
                { question: "آیا کد SVG من امن است؟", answer: "بله، کد SVG شما به سروری ارسال نمی‌شود و تمام پردازش‌ها در مرورگر انجام می‌شوند." }
            ],
            encoders: [
                { question: "آیا استفاده از ابزارهای رمزگذاری رایگان است؟", answer: "بله، تمام ابزارهای رمزگذاری و رمزگشایی در ZebraCode کاملاً رایگان هستند." },
                { question: "آیا داده‌های من به‌صورت امن پردازش می‌شوند؟", answer: "بله، تمام پردازش‌ها در مرورگر انجام می‌شوند و داده‌های شما ارسال نمی‌شوند." },
                { question: "چه نوع رمزگذاری‌هایی پشتیبانی می‌شوند؟", answer: "در حال حاضر رمزگذاری و رمزگشایی Base64 و رمزگشایی JWT پشتیبانی می‌شوند و فرمت‌های بیشتری در آینده اضافه خواهند شد." }
            ],
            'date-time': [
                { question: "آیا استفاده از این ابزار تاریخ و زمان رایگان است؟", answer: "بله، تمام ابزارهای تاریخ و زمان در ZebraCode کاملاً رایگان هستند." },
                { question: "آیا ابزار از تقویم‌های مختلف پشتیبانی می‌کند؟", answer: "بله، ابزارهای تاریخ و زمان از تقویم میلادی و فارسی (جلالی/شمسی) پشتیبانی می‌کنند." },
                { question: "محاسبات ابزار چقدر دقیق هستند؟", answer: "تمام محاسبات با استفاده از Date در JavaScript و کتابخانه jalaali-js انجام می‌شوند و دقت بالایی دارند." },
                { question: "آیا داده‌های timestamp من امن هستند؟", answer: "بله، تمام پردازش‌ها در مرورگر انجام می‌شوند و داده‌ها به هیچ سروری ارسال نمی‌شوند." }
            ],
            generators: [
                { question: "آیا استفاده از ابزارهای تولیدکننده رایگان است؟", answer: "بله، تمام ابزارهای تولیدکننده در ZebraCode کاملاً رایگان هستند." },
                { question: "مقادیر تولیدشده چگونه ایجاد می‌شوند؟", answer: "تولیدکننده‌ها برای رمزعبور از تصادفی‌سازی امن رمزنگاری و برای متن از الگوریتم‌های مناسب تولید متن استفاده می‌کنند." },
                { question: "آیا مقادیر تولیدشده جایی ذخیره می‌شوند؟", answer: "خیر، همه‌چیز در مرورگر شما تولید می‌شود و هیچ داده‌ای ذخیره، ارسال یا ثبت نمی‌شود." }
            ],
            text: [
                { question: "آیا استفاده از این ابزار متنی رایگان است؟", answer: "بله، تمام ابزارهای متنی در ZebraCode کاملاً رایگان هستند." },
                { question: "مقایسه متن چگونه انجام می‌شود؟", answer: "مقایسه متن با الگوریتم تفاوت‌سنجی خط‌به‌خط انجام می‌شود تا دقیقاً تغییرات بین دو متن نمایش داده شوند." },
                { question: "آیا داده‌های متنی من امن هستند؟", answer: "بله، تمام پردازش‌ها در مرورگر انجام می‌شوند و متن شما از دستگاه خارج نمی‌شود." }
            ],
            password: [
                { question: "آیا رمزعبورهای تولیدشده امن هستند؟", answer: "بله، رمزعبورها با Web Crypto API و اعداد تصادفی رمزنگاری‌شده تولید می‌شوند." },
                { question: "آیا می‌توانم طول رمزعبور را شخصی‌سازی کنم؟", answer: "بله، می‌توانید رمزعبورهایی بین ۸ تا ۶۴ کاراکتر تولید کنید و نوع کاراکترها را انتخاب کنید." },
                { question: "آیا رمزعبورهای من ذخیره یا ثبت می‌شوند؟", answer: "خیر، رمزعبورها کاملاً در مرورگر شما تولید می‌شوند و هرگز ارسال، ذخیره یا ثبت نمی‌شوند." }
            ],
            others: [
                { question: "آیا استفاده از این ابزار رایگان است؟", answer: "بله، تمام ابزارهای ZebraCode کاملاً رایگان هستند و به ثبت‌نام نیاز ندارند." },
                { question: "این ابزار چگونه کار می‌کند؟", answer: "تمام پردازش‌ها مستقیماً در مرورگر شما انجام می‌شوند و داده‌ها به هیچ سروری ارسال نمی‌شوند." },
                { question: "آیا می‌توانم از این ابزار به‌صورت آفلاین استفاده کنم؟", answer: "بله، پس از بارگذاری صفحه، ابزار کاملاً به‌صورت آفلاین در مرورگر شما کار می‌کند." }
            ]
        };
        return faqsFa[subCategory] || faqsFa.others;
    }

    return faqs[subCategory] || faqs['others'] || [];
}