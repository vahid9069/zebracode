import { createElement, useState, useEffect } from '@wordpress/element';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  TextControl,
  SelectControl,
  Notice,
  Spinner,
  CheckboxControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../utils/api';
import BulkGenerator from './BulkGenerator';
import ContentCalendar from './ContentCalendar';

const VISUAL_PRESETS = [
  {
    id: 'dark_slate_neon',
    title: 'Dark Slate & Electric Cyan',
    badge: '#0f172a + #38bdf8',
    desc: 'زمینه تیره (#0f172a)، خطوط نئونی فیروزه‌ای (#38bdf8)، رندر ۳ بعدی آکتان با فضای مینیمال دولوپری',
    promptSnippet: 'dark slate and electric cyan aesthetic, #0f172a deep background with glowing cyan #38bdf8 accents and crisp vector 3D elements, minimal developer dark mode theme, subtle grid lines, studio lighting, Octane 3D render',
  },
  {
    id: 'isometric_3d',
    title: '3D Isometric Tech',
    badge: '3D Isometric & Clay',
    desc: 'ماکت‌های ایزومتریک ۳ بعدی سرورها و بلوک‌های کد، نورپردازی ملایم استودیویی، متریال مات، رندر Octane',
    promptSnippet: 'clean miniature 3D isometric tech scene, miniature servers, floating code blocks, soft studio ambient lighting, smooth clay and glass materials, Octane render, vibrant modern tech palette',
  },
  {
    id: 'minimal_flat',
    title: 'Minimal Flat Vector',
    badge: 'Stripe / GitHub Style',
    desc: 'تصویرسازی فلت و مدرن مینیمال، خطوط هندسی دقیق با کنتراست بالا، متناسب با وبلاگ‌های فناوری',
    promptSnippet: 'modern minimal flat vector illustration, Stripe and GitHub blog style, clean geometric lines, high-contrast contemporary tech graphics, balanced white-space',
  },
  {
    id: 'blueprint',
    title: 'Technical Blueprint',
    badge: 'Engineering Blueprint',
    desc: 'بلوپرینت فنی مهندسی با شبکه‌بندی دقیق روی سرمه‌ای تیره (#0a0f1d)، خطوط ارتباطی وکتوری درخشان',
    promptSnippet: 'technical software architecture blueprint, schematic engineering grid on deep navy background #0a0f1d, glowing white and laser-blue vector connection lines, high detail flow diagram art',
  },
  {
    id: 'glassmorphism',
    title: 'Modern Glassmorphism',
    badge: 'Frosted Glass & Code',
    desc: 'کارت‌های شیشه‌ای تیره مات با گرادیان‌های نئونی، نمادهای کد معلق در فضا با عمق میدان فوکوس نرم',
    promptSnippet: 'modern glassmorphism UI concept, frosted translucent dark acrylic glass cards, subtle neon gradients, floating developer code symbols, soft blur depth of field',
  },
];

export default function ContentStudio({ initialSubView = 'json', onSubViewChange }) {
  const [activeMode, setActiveMode] = useState(initialSubView);

  useEffect(() => {
    if (initialSubView) {
      setActiveMode(initialSubView);
    }
  }, [initialSubView]);

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    if (onSubViewChange) {
      onSubViewChange(mode);
    }
    window.location.hash = mode === 'bulk' ? '#/bulk' : (mode === 'calendar' ? '#/calendar' : '#/studio');
  };

  const isFa = document.dir === 'rtl' || (window.omniAiData?.isRtl ?? true);

  // States for Prompt & JSON workflow
  const [topic, setTopic] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [articleDepth, setArticleDepth] = useState('comprehensive');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedCalendarItemId, setSelectedCalendarItemId] = useState(null);
  const [visualStyle, setVisualStyle] = useState('dark_slate_neon');
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [showStandaloneBox, setShowStandaloneBox] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [categories, setCategories] = useState(() => {
    return Array.isArray(window.omniAiData?.categories) ? window.omniAiData.categories : [];
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return Array.isArray(window.omniAiData?.categories) && window.omniAiData.categories.length > 0
      ? String(window.omniAiData.categories[0].id)
      : '';
  });
  const [postStatus, setPostStatus] = useState('draft');
  const [seoTarget, setSeoTarget] = useState('auto');
  const [disableAds, setDisableAds] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [result, setResult] = useState(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [standaloneCopied, setStandaloneCopied] = useState(false);
  const [copiedFeaturedPrompt, setCopiedFeaturedPrompt] = useState(false);
  const [copiedDiagramPrompt, setCopiedDiagramPrompt] = useState(false);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState(null);
  const [syncedTools, setSyncedTools] = useState([]);

  useEffect(() => {
    // Fetch live categories
    apiFetch('categories')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.log('Could not load categories in Studio:', err));

    // Fetch available developer tools for prompt internal linking
    apiFetch('tools')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.tools)) {
          setSyncedTools(data.tools);
        }
      })
      .catch((err) => console.log('Could not load tools for prompt:', err));
  }, []);

  const selectedPresetObj = VISUAL_PRESETS.find((p) => p.id === visualStyle) || VISUAL_PRESETS[0];

  // Dynamic Standalone Featured Image Prompt Generator
  const generateStandaloneFeaturedImagePrompt = () => {
    const cleanTopic = topic.trim() || 'Modern software engineering and developer tooling';
    const cleanKeyword = focusKeyword.trim() ? `, themed around ${focusKeyword.trim()}` : '';
    return `Modern conceptual illustration of ${cleanTopic}${cleanKeyword}, ${selectedPresetObj.promptSnippet}, 16:9 aspect ratio, 1200x675 resolution, wide angle landscape composition, --ar 16:9, --q 1, clean sharp vector styling, lightweight web asset, modern developer aesthetic, no text, no typography, no watermark, no logos, no blur`;
  };

  // Dynamic Full SEO, AEO, and GEO Prompt Generator for Master LLM
  const generatePromptWithTopic = () => {
    const cleanTopic = topic.trim() || '[موضوع یا عنوان اصلی مقاله خود را اینجا بگذارید]';
    const cleanFocusKeyword = focusKeyword.trim() || topic.trim() || '[کلمه کلیدی کانونی ۱ تا ۳ کلمه‌ای اصلی]';
    const notesPart = additionalNotes.trim()
      ? `\n**الزامات و نکات تکمیلی درخواستی کاربر:**\n${additionalNotes.trim()}\n`
      : '';

    let wordCountGuideline = 'حداقل ۱۰۰۰ تا ۱۵۰۰ کلمه تخصصی، جامع، با مثال و کاربردی';
    let minWords = 1000;
    if (articleDepth === 'standard') {
      wordCountGuideline = 'حداقل ۷۰۰ تا ۱۰۰۰ کلمه استاندارد و منسجم';
      minWords = 700;
    } else if (articleDepth === 'pillar') {
      wordCountGuideline = 'حداقل ۱۵۰۰ تا ۲۵۰۰ کلمه مرجع، بسیار عمیق و همه‌جانبه';
      minWords = 1500;
    }

    let toolsGuideline = '';
    let toolsJsonSample = '';
    if (syncedTools && syncedTools.length > 0) {
      const topicTerms = `${cleanTopic} ${cleanFocusKeyword} ${notesPart}`
        .toLowerCase()
        .split(/[\s,\-_،؛()/]+/)
        .filter((w) => w.length >= 2);

      const scored = syncedTools.map((t) => {
        let score = 0;
        const searchable = `${t.slug || ''} ${t.title || ''} ${t.description || ''} ${t.domain || ''}`.toLowerCase();
        for (const term of topicTerms) {
          if (searchable.includes(term)) score += 10;
          if ((t.slug || '').toLowerCase().includes(term)) score += 15;
        }
        return { tool: t, score };
      });

      scored.sort((a, b) => b.score - a.score);

      const toolListStr = scored.map(({ tool: t }) => {
        return `- ${t.title} (${t.domain}): ${t.url} [اسلاگ: "${t.slug}"]`;
      }).join('\n');

      toolsGuideline = `
- **🔗 لینک‌سازی داخلی هوشمند و معتبر (فقط از ابزارهای واقعی سایت):**
  قانون قطعی: فقط و فقط از میان لیست ابزارهای واقعی زیر (که بر اساس ارتباط موضوعی اولویت‌بندی شده‌اند)، ۳ تا ۵ مورد را که ارتباط ماهوی، فنی و مستقیم با موضوع مقاله دارند انتخاب کرده و در طول متن با فرمت استاندارد مارک‌داون \`[عنوان طبیعی و کاربردی ابزار](URL)\` لینک دهید. **هرگز هیچ ابزار، صفحه یا URL فرضی را اختراع نکنید:**
${toolListStr}
  نمونه لینک داخلی مارک‌داون: \`[فرمت و مرتب‌سازی JSON](https://zebracode.ir/json-format)\`
  اسلاگ دقیق این ابزارها را حتماً در فیلد \`"related_tools": ["slug-1", "slug-2"]\` در خروجی JSON قرار دهید.`;

      toolsJsonSample = `\n  "related_tools": ["slug-1", "slug-2", "slug-3"],`;
    } else {
      toolsGuideline = `
- **🔗 لینک‌سازی داخلی هوشمند و معتبر:**
  حداقل ۲ تا ۳ لینک داخلی ارگانیک با فرمت مارک‌داون (\`[ابزارهای آنلاین توسعه‌دهندگان](/tools)\` یا \`[صفحه اصلی زبراکد](/)\`) در بخش‌های متناسب متن قرار دهید.`;
    }

    return `You are an elite SEO/GEO/AEO content strategist, principal software architect, and senior Persian technical writer.
Write an authoritative, deeply researched, engaging, and comprehensive article in fluent Persian (Farsi) about the following topic:

**Topic / موضوع اصلی مقاله:** ${cleanTopic}
**Focus Keyword / کلیدواژه کانونی اصلی:** ${cleanFocusKeyword}
**حجم و عمق محتوا:** ${wordCountGuideline}
${notesPart}
### الزامات ۵ گانه برای تولید محتوای رتبه یک (SEO, AEO, GEO, Readability, Architecture - نسخه طلایی ۲.۲):

#### ۱. سئو ارگانیک و کلیدواژه معنایی (SEO & Semantic Search):
- **کلیدواژه کانونی («${cleanFocusKeyword}»):**
  ۱. عنوان سئو (\`seo_title\`): شامل «${cleanFocusKeyword}» در نیمه نخست عنوان همراه با قلاب جذاب کلیک (CTR Hook) مانند سناریوی کاربردی یا راهنمای جامع (طول ۴۰ تا ۶۰ کاراکتر؛ کوتاه و رسا تا در نتایج گوگل بریده نشود).
  ۲. عنوان درون صفحه (\`title\`): عنوان اصلی مقاله برای تگ H1 (جذاب، تحلیلی و معطوف به حل نیاز کاربر).
  ۳. متای توضیحات (\`seo_desc\`): شامل «${cleanFocusKeyword}» همراه با ارزش پیشنهادی ملموس برای کاربر و ترغیب به کلیک (طول ۱۳۰ تا ۱۵۵ کاراکتر).
  ۴. در اولین پاراگراف مقدمه (پاسخ صریح) کلمه کلیدی «${cleanFocusKeyword}» با \` **${cleanFocusKeyword}** \` بولد شود.
  ۵. حداقل در یکی از تیترهای سطح ۲ (\`## \`) عبارت «${cleanFocusKeyword}» به شکلی طبیعی و مرتبط حضور داشته باشد.
  ۶. اسلاگ انگلیسی (\`slug\`): معادل دقیق انگلیسی کلیدواژه با حروف کوچک و خط تیره (kebab-case) مانند \`database-optimization\` یا \`developer-tools\` (بدون تاریخ انقضا یا پسوندهای غیرضروری).
  ۷. **پوشش معنایی و سئو ارگانیک (Semantic SEO):** توزیع ارگانیک و روان کلیدواژه در سراسر متن متناسب با طول محتوا (بدون اصرار بر عددسازی یا چگالی مکانیکی). اولویت مطلق با موجودیت‌های مرتبط (Entities)، مترادف‌ها و ارتباط موضوعی عمیق است.
- **جداول داده‌ای و مقایسه‌ای:** فقط در صورت مقایسه‌ای یا لیستی بودن موضوع، یک جدول استاندارد **Markdown Table** با خط‌های عمودی (\`| ستون ۱ | ستون ۲ |\`) و خط جداکننده (\`| --- | --- |\`) ایجاد کنید. در موضوعات غیرمقایسه‌ای نیازی به جدول اجباری نیست.
- **لینک‌های معتبر و امن:**
  ۱. لینک‌های داخلی متنی: فقط و فقط از میان لیست ابزارهای واقعی ارائه‌شده در زیر، ۳ تا ۵ مورد واقعاً مرتبط را با انکر تکست توصیفی و فرمت مارک‌داون \`[نام ابزار](URL)\` لینک دهید. هرگز صفحه یا URL خیالی اختراع نکنید:
${toolsGuideline}
  ۲. حداقل ۱ لینک خارجی به دامنه اصلی مرجع معتبر جهانی متناسب با موضوع با فرمت مارک‌داون: \`[مستندات وب (MDN)](https://developer.mozilla.org/)\` یا W3C / RFC رسمی. هرگز URLهای فرعی و ناموجود حدس نزنید.

#### ۲. بهینه‌سازی موتورهای پاسخگو و هوش مصنوعی محاوره‌ای (AEO):
- **پاسخ مستقیم (Direct Answer Snippet):** اولین پاراگراف مقاله بین ۳۵ تا ۵۰ کلمه باشد و با تعریف صریح، دقیق و پاسخ قاطع به چیستی و چرایی «${cleanFocusKeyword}» آغاز گردد.
- **تیترهای سؤالی:** حداقل ۲ تیتر سطح ۲ (\`## \`) باید ساختار شفاف سؤالی با علامت سؤال (؟) داشته باشند تا دغدغه‌های پرتکرار کاربران را هدف قرار دهند.
- **پرسش و پاسخ (FAQ):** حداقل ۴ پرسش پرتکرار و فنی با پاسخ‌های مستقیم و شفاف (هر پاسخ بین ۴۰ تا ۶۰ کلمه) در فیلد \`faq\` در JSON.

#### ۳. استناد و بهینه‌سازی موتورهای هوش مصنوعی مولد (GEO & E-E-A-T):
- **باکس نکات کلیدی:** تیتر \`## نکات کلیدی\` به همراه یک لیست نشانه‌دار (\`- نکته...\`) شامل ۳ تا ۴ نکته محوری، کلیدی و برجسته درباره موضوع درج شود.
- **استدلال‌های فنی متناسب با موضوع (بدون کلیشه و توهم آماری):**
  * اگر موضوع به پردازش کلاینت/محلی مربوط است: از حذف رفت‌وبرگشت‌های شبکه (Zero Network Round-Trips) و عدم ارسال داده‌های حساس به سرور ثالث دفاع کنید.
  * اگر موضوع به دیتابیس یا سرور مربوط است: از تیونینگ منابع، ایندکس‌گذاری، کشینگ و کاهش مصرف I/O و CPU دفاع کنید.
  * از تولید آمار ساختگی، درصدهای جعلی و ادعای تست‌های خیالی سازمانی خودداری کنید.
  * در عوض، از **فکت‌های عددی واقعی و استانداردهای فنی** (مانند سال ۲۰۲۶، نسخه‌های استاندارد مثل \`SHA-256\`، \`TLS 1.3\`، \`HTTP/2\`، \`OWASP Top 10\`، بازه‌های زمانی واقعی مثل \`۷ تا ۱۴ روز\` یا \`۳۶۵ روز\` و نوشتن شمارش‌ها با رقم مثل \`۳ لایه\` یا \`۷ گام\`) در متن استفاده کنید.
- **بینش غیرکلیشه‌ای و تخصصی (Unique Insight):** حداقل یک زاویه دید تحلیلی نوآورانه یا راهکار متمایز ارائه کنید که فراتر از توضیحات رایج و بازنویسی‌های سطحی وب باشد.
- **چالش‌ها، محدودیت‌ها و عیب‌یابی عمیق (Trade-offs & Pitfalls):** برای اثبات نگاه مهندسی و متوازن، حداقل ۲ محدودیت فنی واقعی و حداقل ۱ سناریوی مشخص که «استفاده از این رویکرد نامناسب است یا نتیجه عکس می‌دهد» را صراحتاً بیان کنید.
- **استناد مستند (Blockquote):** استناد به یک اصل استاندارد مهندسی نرم‌افزار، مستندات رسمی معتبر یا یک بینش اصیل معماری با علامت نقل‌قول مارک‌داون (\`> نقل‌قول...\`) (از نسبت دادن جملات ساختگی به اشخاص خودداری شود).
- **بخش جمع‌بندی:** پایان مقاله با تیتر \`## جمع‌بندی\` و چکیده کاربردی به پایان برسد.

#### ۴. نگارش سلیس فارسی و خوانایی تحریریه‌ای (Readability):
- **لحن طبیعی و تحریریه‌ای:** متن باید لحن روان، سلیس، تخصصی و ساختاریافته داشته باشد و از ترجمه‌های خشک یا ماشینی پرهیز شود.
- **تنوع ریتمیک در طول جملات:** جملات کوتاه و صریح (۱۰ تا ۱۵ کلمه) را با جملات تحلیلی مرکب (۲۰ تا ۲۵ کلمه) ترکیب کنید تا جریان متن زنده و پویا بماند.
- **پیوستگی معنایی:** از کلمات پیوند فارسی (مانند بنابراین، همچنین، علاوه بر این، در نتیجه، با این حال، به عنوان مثال) به شکلی طبیعی در جریان متن استفاده کنید.

#### ۵. استاندارد تصاویر سبک و مدرن وب (۱۶:۹ - 1200x675):
- **تصویر شاخص (featured_image_prompt):** پرامپت انگلیسی برای تصویر سبک و کم‌حجم وب با نسبت ۱۶:۹ متناسب با موضوع:
  "${selectedPresetObj.promptSnippet}, 16:9 aspect ratio, 1200x675 resolution, wide angle landscape composition, clean modern dark tech vector styling with electric cyan accents, lightweight web asset, --ar 16:9, --q 1, no text, no typography, no watermark, no logos"
- **دیاگرام معماری (diagram_prompt):** در صورت ماهیت معماری یا گردشی موضوع، پرامپت انگلیسی معماری/فلوچارت مفهومی با ترکیب افقی ۱۶:۹ بدون متن، به همراه قرار دادن برچسب [DIAGRAM_PLACEHOLDER] در یک خط مجزا در بخش فنی متن مقاله.
- **تصاویر درون محتوا (image_prompts):** حداقل ۲ پرامپت انگلیسی برای عکس‌های سبک متن با نسبت ۱۶:۹ بدون متن، همراه با قرار دادن برچسب‌های [IMAGE_PLACEHOLDER_1] و [IMAGE_PLACEHOLDER_2] هر کدام در یک خط مجزا در بخش‌های متناسب متن.

### 📐 ساختار سکشن‌های فیلد content (Modular Adaptive Markdown Structure):
متن درون فیلد \`content\` باید یک ساختار ماژولار و تطبیقی با **فرمت خالص Markdown** داشته باشد (هرگز از تگ‌های HTML مانند \`<p>\`، \`<h2>\`، \`<a>\` یا \`<table>\` درون \`content\` استفاده نکنید؛ فقط Markdown بنویسید و بین هر بخش یک خط خالی \`\\n\\n\` بگذارید):
- **پاراگراف پاسخ صریح (Direct Answer):** پاراگراف اول که با \`**${cleanFocusKeyword}**\` آغاز شده، بین ۳۵ تا ۵۰ کلمه بوده و پاسخی دقیق و فنی بدهد.
- **باکس نکات کلیدی:** تیتر \`## نکات کلیدی\` به همراه لیست \`-\` با ۳ تا ۴ بولت‌پوینت تحلیلی و دست‌اول.
- **پلیس‌هولدر دیاگرام:** برچسب \`[DIAGRAM_PLACEHOLDER]\` در یک خط مجزا.
- **بخش تحلیل مفهومی و چرایی:** تیترهای \`## \` و \`### \` تحلیلی (شامل حداقل ۲ تیتر سؤالی با علامت ؟).
- **پلیس‌هولدرهای تصاویر:** برچسب‌های \`[IMAGE_PLACEHOLDER_1]\` و \`[IMAGE_PLACEHOLDER_2]\` در خطوط مجزا.
- **بخش پیاده‌سازی عملی / مقایسه تخصصی:** در صورت نیاز جدول مقایسه‌ای استاندارد Markdown (\`| ... |\`) یا نمونه کدهای فنی با بلوک کد مارک‌داون (\`\`\`language ... \`\`\`) یا لیست‌های ترتیبی (\`1. \`).
- **چالش‌ها، محدودیت‌ها و عیب‌یابی (Trade-offs & Pitfalls):** بررسی حداقل ۲ محدودیت فنی واقعی و سناریوهای منع استفاده.
- **واکاوی استانداردها، استناد و لینک‌سازی داخلی:** استناد مستند با \`> \` و درج طبیعی لینک‌های داخلی ابزارها و لینک خارجی MDN به شکل \`[متن](URL)\`.
- **جمع‌بندی تحلیلی:** تیتر \`## جمع‌بندی\` به همراه نتیجه‌گیری کاربردی و راهنمای گام بعدی.

#### ۶. قوانین خروجی و فرمت دقیق JSON (Strict JSON Validity):
- خروجی فقط و فقط باید یک آبجکت معتبر JSON باشد.
- ⚠️ **قانون قطعی برای فیلد content:** تمام متن مقاله در فیلد \`content\` را منحصراً با **Markdown استاندارد** (\`##\`، \`###\`، \`-\`، \`1.\`، \`| جدول |\`، \`> نقل‌قول\`، \`[متن](URL)\`) بنویسید و پاراگراف‌ها/بخش‌ها را با \`\\n\\n\` جدا کنید. **به هیچ عنوان تگ‌های HTML داخل \`content\` نگذارید تا هیچ چت‌باتی تگ‌ها را حذف یا خراب نکند.**
- **اکیداً ممنوع:** هیچ متن توضیحی، پیام احوال‌پرسی، تعارف، یا سؤال و پیشنهاد پیگیری قبل یا بعد از JSON ننویسید.
- پاسخ شما باید منحصراً با کاراکتر { آغاز شده و با علامت } به پایان برسد.

\`\`\`json
{
  "title": "راهنمای جامع ${cleanFocusKeyword}: تحلیل معماری، ابزارها و تکنیک‌های پیاده‌سازی",
  "focus_keyword": "${cleanFocusKeyword}",
  "slug": "web-security-guide",
  "seo_title": "${cleanFocusKeyword} چیست؟ راهنمای جامع و کاربردی",
  "seo_desc": "راهنمای کامل ${cleanFocusKeyword}؛ بررسی تکنیک‌های پیشگیری از نفوذ، پیکربندی هدرهای امنیتی و چک‌لیست ضروری برای توسعه‌دهندگان وب.",
  "featured_image_prompt": "English prompt for 16:9 featured image...",
  "diagram_prompt": "English prompt for technical architecture diagram...",
  "image_prompts": [
    "English prompt for in-content image 1...",
    "English prompt for in-content image 2..."
  ],
  "faq": [
    {"question": "${cleanFocusKeyword} چیست و چرا در وب مدرن حیاتی است؟", "answer": "پاسخ مستقیم و کوتاه بین ۴۰ تا ۶۰ کلمه..."},
    {"question": "مهم‌ترین محدودیت یا چالش در پیاده‌سازی ${cleanFocusKeyword} چیست؟", "answer": "پاسخ تحلیلی بین ۴۰ تا ۶۰ کلمه درباره محدودیت‌ها و راه‌حل..."}
  ],${toolsJsonSample}
  "content": "**${cleanFocusKeyword}** پاسخی ۳۵ تا ۵۰ کلمه‌ای...\\n\\n## نکات کلیدی\\n- نکته ۱\\n- نکته ۲\\n\\n[DIAGRAM_PLACEHOLDER]\\n\\n## چرا امنیت کاربردی وب حیاتی است؟\\nتوضیحات...\\n\\n[IMAGE_PLACEHOLDER_1]\\n\\n| عنوان | ویژگی |\\n| --- | --- |\\n| روش ۱ | توضیح |\\n\\n[IMAGE_PLACEHOLDER_2]\\n\\n> نقل‌قول مهندسی\\n\\n## جمع‌بندی\\nنتیجه‌گیری..."
}
\`\`\``;
  };

  const handleCopyPrompt = () => {
    const promptText = generatePromptWithTopic();
    navigator.clipboard.writeText(promptText);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2500);
  };

  const handleCopyStandalone = () => {
    const promptText = generateStandaloneFeaturedImagePrompt();
    navigator.clipboard.writeText(promptText);
    setStandaloneCopied(true);
    setTimeout(() => setStandaloneCopied(false), 2500);
  };

  const handleCopyFeaturedResult = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedFeaturedPrompt(true);
    setTimeout(() => setCopiedFeaturedPrompt(false), 2500);
  };

  const handleCopyDiagramResult = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedDiagramPrompt(true);
    setTimeout(() => setCopiedDiagramPrompt(false), 2500);
  };

  const handleCopySingleImagePrompt = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  const handleSubmitJson = async () => {
    let trimmedInput = (jsonInput || '').trim();
    if (!trimmedInput) {
      setNotice({
        type: 'error',
        text: __('لطفاً ابتدا خروجی JSON چت‌بات را در کادر زیر وارد کنید.', 'omni-ai-suite'),
      });
      return;
    }

    // Auto-clean markdown backticks (```json ... ```)
    trimmedInput = trimmedInput.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();
    // Auto-clean accidental nested markdown links: [text]([url](url)) -> [text](url)
    trimmedInput = trimmedInput.replace(/\[([^\]]+)\]\(\s*\[([^\]]+)\](?:\([^)]+\))?\s*\)/gi, '[$1]($2)');
    // Auto-clean accidental markdown link syntax inside HTML attributes: href="[url](url)" -> href='url'
    trimmedInput = trimmedInput.replace(/href\s*=\s*(["'])\s*\[([^\]]+)\](?:\([^)]+\))?\s*\1/gi, "href='$2'");

    setIsLoading(true);
    setNotice(null);
    setResult(null);

    try {
      const res = await apiFetch('import-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_json: trimmedInput,
          category_id: selectedCategory ? parseInt(selectedCategory, 10) : 0,
          status: postStatus,
          seo_target: seoTarget,
          calendar_item_id: selectedCalendarItemId || '',
          disable_ads: disableAds,
          focus_keyword: focusKeyword.trim(),
          topic: topic.trim(),
        }),
      });

      const data = await res.json();

      if (data && data.success) {
        setResult(data);
        setSelectedCalendarItemId(null);
        setNotice({
          type: 'success',
          text: data.message || __('مقاله با موفقیت ایجاد و ذخیره شد!', 'omni-ai-suite'),
        });
      } else {
        throw new Error(data?.message || __('خطا در پردازش JSON یا ذخیره مقاله.', 'omni-ai-suite'));
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err?.message || __('خطای غیرمنتظره هنگام ذخیره مقاله.', 'omni-ai-suite'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setJsonInput('');
    setResult(null);
    setNotice(null);
  };

  const handleCreateFromCalendarItem = (item) => {
    setTopic(item.title || '');
    if (item.focus_keyword) {
      setFocusKeyword(item.focus_keyword);
    }
    const notesArr = [];
    if (item.pillar) {
      notesArr.push(`رویکرد و پیلار محتوا: ${item.pillar}`);
    }
    if (item.notes) {
      notesArr.push(`نکات و زاویه دید: ${item.notes}`);
    }
    setAdditionalNotes(notesArr.join('\n'));
    setSelectedCalendarItemId(item.id || null);

    // Auto-match category
    if (item.category_slug && Array.isArray(categories)) {
      const slug = item.category_slug.toLowerCase();
      const matched = categories.find((c) =>
        c.slug === slug ||
        c.name?.toLowerCase().includes(slug) ||
        (slug === 'tools' && c.name?.includes('ابزار')) ||
        (slug === 'security' && c.name?.includes('امنیت')) ||
        (slug === 'tech-trends' && (c.name?.includes('ترند') || c.name?.includes('فناوری'))) ||
        (slug === 'development' && (c.name?.includes('توسعه') || c.name?.includes('برنامه'))) ||
        (slug === 'data' && (c.name?.includes('داده') || c.name?.includes('بهینه‌سازی'))) ||
        (slug === 'network' && (c.name?.includes('شبکه') || c.name?.includes('API')))
      );
      if (matched) {
        setSelectedCategory(String(matched.id));
      }
    }

    handleModeChange('json');
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', direction: 'rtl', boxSizing: 'border-box' }}>
      {/* Studio Sub-Navigation Switcher: Single Post vs Calendar vs Bulk */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div className="omni-segmented-control">
          <button
            type="button"
            className={`omni-segmented-btn ${activeMode === 'json' ? 'active' : ''}`}
            onClick={() => handleModeChange('json')}
          >
            <span className="dashicons dashicons-edit" style={{ fontSize: '15px', width: '15px', height: '15px' }} />
            <span>{isFa ? 'ایجاد مقاله (JSON)' : __('Create from JSON', 'omni-ai-suite')}</span>
          </button>
          <button
            type="button"
            className={`omni-segmented-btn ${activeMode === 'calendar' ? 'active' : ''}`}
            onClick={() => handleModeChange('calendar')}
          >
            <span className="dashicons dashicons-calendar-alt" style={{ fontSize: '15px', width: '15px', height: '15px' }} />
            <span>{isFa ? 'تقویم محتوایی (Planner)' : __('Content Calendar', 'omni-ai-suite')}</span>
          </button>
          <button
            type="button"
            className={`omni-segmented-btn ${activeMode === 'bulk' ? 'active' : ''}`}
            onClick={() => handleModeChange('bulk')}
          >
            <span className="dashicons dashicons-database-add" style={{ fontSize: '15px', width: '15px', height: '15px' }} />
            <span>{isFa ? 'تولید انبوه (Bulk)' : __('Bulk Generator', 'omni-ai-suite')}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.hash = '#/cicd';
          }}
          className="omni-segmented-btn"
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            fontWeight: 600,
          }}
          title={isFa ? 'مدیریت صف، وضعیت و اجرای بیلد وبلاگ در گیت‌هاب اکشنز' : 'Deploy Blog CI/CD'}
        >
          <span className="dashicons dashicons-cloud-upload" style={{ fontSize: '15px', width: '15px', height: '15px' }} />
          <span>{isFa ? '🚀 بیلد و انتشار وبلاگ' : 'Deploy Blog'}</span>
        </button>
      </div>

      {/* Render Sub-Views based on activeMode */}
      {activeMode === 'calendar' ? (
        <ContentCalendar
          categories={categories}
          onSelectTopic={handleCreateFromCalendarItem}
        />
      ) : activeMode === 'bulk' ? (
        <BulkGenerator />
      ) : (
        <>
          {/* Notice display */}
          {Boolean(notice) ? (
            <div key={notice?.type + (notice?.text || '')} style={{ marginBottom: '16px' }}>
              <Notice status={notice?.type || 'info'} isDismissible onDismiss={() => setNotice(null)}>
                {notice?.text || ''}
              </Notice>
            </div>
          ) : null}

          {/* Step 1: Compact Prompt Builder & Visual Style Preset */}
          <Card style={{ marginBottom: '20px' }}>
            <CardHeader style={{ padding: '12px 18px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                  ۱. آماده‌سازی پرامپت مقاله و سبک تصویر شاخص
                </strong>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button
                    variant="tertiary"
                    size="small"
                    onClick={() => setShowStandaloneBox((prev) => !prev)}
                    style={{ fontSize: '12px' }}
                  >
                    <span>{showStandaloneBox ? 'بستن پرامپت تصویر ▲' : 'پرامپت مستقل تصویر ▼'}</span>
                  </Button>
                  <Button
                    variant="tertiary"
                    size="small"
                    onClick={() => setShowPromptDetails((prev) => !prev)}
                    style={{ fontSize: '12px' }}
                  >
                    <span>{showPromptDetails ? 'بستن قالب متن ▲' : 'مشاهده قالب پرامپت ▼'}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardBody style={{ padding: '16px 18px' }}>
              {/* Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <TextControl
                  label="موضوع یا عنوان اصلی مقاله:"
                  placeholder="مثال: راهنمای جامع بهینه‌سازی دیتابیس در وردپرس و Next.js"
                  value={topic}
                  onChange={(val) => setTopic(val || '')}
                />
                <TextControl
                  label="کلمه کلیدی کانونی (Focus Keyword):"
                  help="عبارت ۱ تا ۳ کلمه‌ای اصلی مقاله برای سنجش دقیق سئو، AEO و Rank Math"
                  placeholder="مثال: بهینه‌سازی دیتابیس"
                  value={focusKeyword}
                  onChange={(val) => setFocusKeyword(val || '')}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <SelectControl
                  label="عمق محتوا و حداقل کلمات:"
                  value={articleDepth}
                  options={[
                    { label: 'مقاله جامع و تحلیلی (۱۰۰۰ تا ۱۵۰۰ کلمه) - پیشنهادی', value: 'comprehensive' },
                    { label: 'مقاله استاندارد (۷۰۰ تا ۱۰۰۰ کلمه)', value: 'standard' },
                    { label: 'راهنمای مرجع و پیلار (۱۵۰۰ تا ۲۵۰۰ کلمه)', value: 'pillar' },
                  ]}
                  onChange={(val) => setArticleDepth(val || 'comprehensive')}
                />
                <TextControl
                  label="نکات تکمیلی و الزامات (اختیاری):"
                  placeholder="مثال: تمرکز بر کشینگ با Redis و مقایسه متدهای ایندکس‌گذاری..."
                  value={additionalNotes}
                  onChange={(val) => setAdditionalNotes(val || '')}
                />
              </div>

              {/* Style Presets */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                  سبک بصری تصویر شاخص:
                </label>
                <div className="omni-style-presets-grid">
                  {VISUAL_PRESETS.map((preset) => {
                    const isSelected = visualStyle === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={`omni-style-preset-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => setVisualStyle(preset.id)}
                      >
                        <div className="omni-style-preset-card-title">
                          <span>{preset.title}</span>
                          <span className="omni-style-preset-card-badge">{preset.badge}</span>
                        </div>
                        <p className="omni-style-preset-card-desc">{preset.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Copy Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  onClick={handleCopyPrompt}
                  style={{ fontWeight: 600, height: '38px', padding: '0 18px', background: '#0284c7' }}
                >
                  <span>{promptCopied ? '✓ پرامپت با موفقیت کپی شد!' : '📋 کپی پرامپت جامع برای چت‌بات'}</span>
                </Button>

                {topic.trim().length > 0 ? (
                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                    ✓ موضوع «{topic.length > 30 ? topic.substring(0, 30) + '...' : topic}» با پالت «{selectedPresetObj.title}»
                  </span>
                ) : null}
              </div>

              {/* Collapsible Drawer 1: Standalone Image Prompt */}
              {Boolean(showStandaloneBox) && (
                <div className="omni-prompt-terminal" style={{ marginTop: '14px' }}>
                  <div className="omni-prompt-terminal-header">
                    <span className="omni-prompt-terminal-title">
                      پرامپت مستقل تصویر شاخص (۱۶:۹)
                      <span className="omni-prompt-terminal-badge">{selectedPresetObj.title}</span>
                    </span>
                    <button
                      type="button"
                      className={`omni-prompt-copy-btn ${standaloneCopied ? 'copied' : ''}`}
                      onClick={handleCopyStandalone}
                    >
                      {standaloneCopied ? '✓ کپی شد!' : '📋 کپی پرامپت تصویر'}
                    </button>
                  </div>
                  <div className="omni-prompt-terminal-body compact">
                    {generateStandaloneFeaturedImagePrompt()}
                  </div>
                </div>
              )}

              {/* Collapsible Drawer 2: Full Master Prompt Preview */}
              {Boolean(showPromptDetails) && (
                <div style={{ marginTop: '14px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>پیش‌نمایش پرامپت ارسالی به هوش مصنوعی:</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>شامل سئو، AEO، دیاگرام و پالت {selectedPresetObj.title}</span>
                  </div>
                  <textarea
                    readOnly
                    rows={8}
                    value={generatePromptWithTopic()}
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px', direction: 'ltr', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', boxSizing: 'border-box', color: '#0f172a' }}
                  />
                </div>
              )}
            </CardBody>
          </Card>

          {/* Step 2: 2-Column Grid (Left: JSON Editor, Right: Compact Settings) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 2fr) minmax(260px, 1fr)', gap: '18px', alignItems: 'start' }}>
            {/* Left: JSON Editor */}
            <Card>
              <CardHeader style={{ padding: '12px 18px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>۲. ورود خروجی JSON چت‌بات:</strong>
                  {jsonInput.trim().length > 0 ? (
                    <Button variant="link" isDestructive onClick={handleReset} size="small" style={{ fontSize: '12px' }}>
                      <span>پاک کردن کادر</span>
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardBody style={{ padding: '14px' }}>
                <textarea
                  className="large-text code"
                  placeholder='{\n  "title": "عنوان مقاله...",\n  "content": "بدنه مقاله با تگ‌های HTML...",\n  "seo_title": "عنوان سئو...",\n  "seo_desc": "توضیحات متا...",\n  "featured_image_prompt": "پرامپت انگلیسی تصویر ۱۶:۹...",\n  "diagram_prompt": "پرامپت اینفوگرافیک...",\n  "image_prompts": ["پرامپت عکس ۱...", "پرامپت عکس ۲..."],\n  "faq": [{"question": "...", "answer": "..."}]\n}'
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={12}
                  style={{
                    width: '100%',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '12.5px',
                    direction: 'ltr',
                    lineHeight: '1.55',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    color: '#0f172a',
                  }}
                />
              </CardBody>
            </Card>

            {/* Right: Publish Settings & Submit Button */}
            <Card>
              <CardHeader style={{ padding: '12px 18px', background: '#f8fafc' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>تنظیمات ذخیره و انتشار</strong>
              </CardHeader>
              <CardBody style={{ padding: '16px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <SelectControl
                    label="دسته‌بندی نوشته:"
                    value={selectedCategory}
                    options={[
                      { label: __('انتخاب دسته‌بندی...', 'omni-ai-suite'), value: '' },
                      ...categories.map((c) => ({
                        label: c.name || `دسته #${c.id}`,
                        value: String(c.id),
                      })),
                    ]}
                    onChange={(val) => setSelectedCategory(val || '')}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <SelectControl
                    label="وضعیت نوشته:"
                    value={postStatus}
                    options={[
                      { label: __('پیش‌نویس (Draft) - پیشنهادی', 'omni-ai-suite'), value: 'draft' },
                      { label: __('انتشار عمومی (Publish)', 'omni-ai-suite'), value: 'publish' },
                      { label: __('در انتظار بازبینی (Pending)', 'omni-ai-suite'), value: 'pending' },
                    ]}
                    onChange={(val) => setPostStatus(val || 'draft')}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <SelectControl
                    label="هدف ذخیره‌سازی سئو:"
                    value={seoTarget}
                    options={[
                      { label: __('تشخیص خودکار افزونه سئو', 'omni-ai-suite'), value: 'auto' },
                      { label: __('رنک مث (Rank Math)', 'omni-ai-suite'), value: 'rank_math' },
                      { label: __('یوآست سئو (Yoast SEO)', 'omni-ai-suite'), value: 'yoast' },
                      { label: __('همگام‌سازی هر دو (Universal)', 'omni-ai-suite'), value: 'both' },
                    ]}
                    onChange={(val) => setSeoTarget(val || 'auto')}
                  />
                </div>

                <div style={{ marginBottom: '16px', padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <CheckboxControl
                    label="🚫 غیرفعالسازی نمایش تبلیغات در این مقاله"
                    help="در صورت فعال بودن، هیچ تبلیغ بنری، اسکریپتی یا همسانی در این نوشته نمایش داده نمی‌شود."
                    checked={disableAds}
                    onChange={(val) => setDisableAds(Boolean(val))}
                  />
                </div>

                <Button
                  variant="primary"
                  onClick={handleSubmitJson}
                  disabled={isLoading || !jsonInput.trim()}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    height: '40px',
                    fontWeight: 700,
                    background: '#0284c7',
                    borderRadius: '6px',
                  }}
                >
                  {isLoading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <Spinner />
                      <span>در حال ثبت مقاله...</span>
                    </span>
                  ) : (
                    <span>🚀 ثبت و ایجاد مقاله در وردپرس</span>
                  )}
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Minimal Result View (Prompt-First Success Panel) */}
          {Boolean(result) && (
            <div key="result-success-container" style={{ marginTop: '20px' }}>
              <Card style={{ border: '1px solid #10b981' }}>
                <CardHeader style={{ background: '#f0fdf4', padding: '12px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🎉</span>
                      <strong style={{ color: '#166534', fontSize: '14px' }}>
                        مقاله با موفقیت ایجاد شد! (#{result.post_id})
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={result.edit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#0284c7', borderColor: '#0369a1' }}
                      >
                        ✏️ ویرایش در گوتنبرگ
                      </a>
                      {result.preview_url ? (
                        <a
                          href={result.preview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button-secondary"
                        >
                          👁️ مشاهده پیش‌نمایش
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = '#/cicd';
                        }}
                        className="button button-secondary"
                        style={{ color: '#0369a1', borderColor: '#38bdf8' }}
                        title="مشاهده وضعیت صف یا اجرای بیلد سرور اصلی/تست"
                      >
                        🚀 بیلد و انتشار وبلاگ
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardBody style={{ padding: '16px' }}>
                  {/* Summary Bar */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                    <div><strong>عنوان:</strong> <span style={{ color: '#0f172a' }}>{result.title}</span></div>
                    <div><strong>کلمه کلیدی:</strong> <span style={{ color: '#0284c7', fontWeight: 600 }}>{result.focus_keyword || '-'}</span></div>
                    <div><strong>نامک:</strong> <span style={{ color: '#0284c7', fontFamily: 'monospace' }}>{result.slug || '-'}</span></div>
                    <div><strong>عنوان سئو:</strong> <span style={{ color: '#475569' }}>{result.seo_title || '-'}</span></div>
                    <div><strong>FAQ:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>{result.faq_count} سوال با اسکیما</span></div>
                  </div>

                  {/* Instant Content Ranking & Scoring Card */}
                  {Boolean(result.ranking) && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>⚡</span>
                          <strong style={{ color: '#166534', fontSize: '13.5px' }}>
                            ارزیابی و امتیاز هوشمند مقاله (Omni AI Content Ranking):
                          </strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>میانگین امتیاز کل:</span>
                          <span style={{
                            background: result.ranking.avg_score >= 80 ? '#15803d' : (result.ranking.avg_score >= 50 ? '#d97706' : '#dc2626'),
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '13px',
                            padding: '2px 10px',
                            borderRadius: '12px',
                          }}>
                            {result.ranking.avg_score} / ۱۰۰
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '12px' }}>
                        <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>سئو ارگانیک (SEO)</span>
                          <strong style={{ color: result.ranking.seo?.score >= 80 ? '#15803d' : '#0f172a', fontSize: '13px' }}>
                            {result.ranking.seo?.score ?? '-'}/100
                          </strong>
                        </div>
                        <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>موتور پاسخگو (AEO)</span>
                          <strong style={{ color: result.ranking.aeo?.score >= 80 ? '#15803d' : '#0f172a', fontSize: '13px' }}>
                            {result.ranking.aeo?.score ?? '-'}/100
                          </strong>
                        </div>
                        <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>مدل‌های مولد (GEO)</span>
                          <strong style={{ color: result.ranking.geo?.score >= 80 ? '#15803d' : '#0f172a', fontSize: '13px' }}>
                            {result.ranking.geo?.score ?? '-'}/100
                          </strong>
                        </div>
                        <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>روانی و خوانایی</span>
                          <strong style={{ color: result.ranking.readability?.score >= 80 ? '#15803d' : '#0f172a', fontSize: '13px' }}>
                            {result.ranking.readability?.score ?? '-'}/100
                          </strong>
                        </div>
                        <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>تعداد کلمات متن</span>
                          <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                            {result.ranking.word_count ?? '-'} کلمه
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compact Terminal Boxes with max-height 90px */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Featured Image Prompt */}
                    {Boolean(result.featured_image_prompt) && (
                      <div className="omni-prompt-terminal" style={{ margin: 0 }}>
                        <div className="omni-prompt-terminal-header">
                          <span className="omni-prompt-terminal-title">
                            تصویر شاخص (۱۶:۹)
                            <span className="omni-prompt-terminal-badge">{selectedPresetObj.title}</span>
                          </span>
                          <button
                            type="button"
                            className={`omni-prompt-copy-btn ${copiedFeaturedPrompt ? 'copied' : ''}`}
                            onClick={() => handleCopyFeaturedResult(result.featured_image_prompt)}
                          >
                            {copiedFeaturedPrompt ? '✓ کپی شد!' : '📋 کپی پرامپت'}
                          </button>
                        </div>
                        <div className="omni-prompt-terminal-body compact">
                          {result.featured_image_prompt}
                        </div>
                      </div>
                    )}

                    {/* Diagram Prompt */}
                    {Boolean(result.diagram_prompt) && (
                      <div className="omni-prompt-terminal" style={{ margin: 0 }}>
                        <div className="omni-prompt-terminal-header">
                          <span className="omni-prompt-terminal-title" style={{ color: '#a78bfa' }}>
                            دیاگرام / اینفوگرافیک معماری
                            <span className="omni-prompt-terminal-badge" style={{ color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.3)' }}>Architecture</span>
                          </span>
                          <button
                            type="button"
                            className={`omni-prompt-copy-btn ${copiedDiagramPrompt ? 'copied' : ''}`}
                            style={{ background: '#7c3aed' }}
                            onClick={() => handleCopyDiagramResult(result.diagram_prompt)}
                          >
                            {copiedDiagramPrompt ? '✓ کپی شد!' : '📋 کپی پرامپت'}
                          </button>
                        </div>
                        <div className="omni-prompt-terminal-body compact">
                          {result.diagram_prompt}
                        </div>
                      </div>
                    )}

                    {/* In-Content Image Prompts */}
                    {Array.isArray(result.image_prompts) && result.image_prompts.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        {result.image_prompts.map((imgPrompt, idx) => (
                          <div key={idx} className="omni-prompt-terminal" style={{ margin: 0 }}>
                            <div className="omni-prompt-terminal-header">
                              <span className="omni-prompt-terminal-title">
                                تصویر درون متن #{idx + 1}
                                <span className="omni-prompt-terminal-badge">[IMAGE_PLACEHOLDER_{idx + 1}]</span>
                              </span>
                              <button
                                type="button"
                                className={`omni-prompt-copy-btn ${copiedPromptIndex === idx ? 'copied' : ''}`}
                                onClick={() => handleCopySingleImagePrompt(imgPrompt, idx)}
                              >
                                {copiedPromptIndex === idx ? '✓ کپی شد!' : '📋 کپی پرامپت'}
                              </button>
                            </div>
                            <div className="omni-prompt-terminal-body compact">
                              {imgPrompt}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
