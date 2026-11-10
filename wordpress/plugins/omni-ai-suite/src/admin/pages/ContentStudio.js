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
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../utils/api';

export default function ContentStudio() {
  const [topic, setTopic] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showPromptDetails, setShowPromptDetails] = useState(false);
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
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [result, setResult] = useState(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState(null);

  // Dynamic Full SEO, AEO, and GEO Prompt Generator
  const generatePromptWithTopic = () => {
    const cleanTopic = topic.trim() || '[موضوع یا کلمه کلیدی اصلی مقاله خود را اینجا بگذارید]';
    const notesPart = additionalNotes.trim()
      ? `\n**الزامات و نکات تکمیلی درخواستی کاربر:**\n${additionalNotes.trim()}\n`
      : '';

    return `You are an elite SEO/GEO/AEO content strategist, senior technical writer, and web researcher.
Write a deeply researched, comprehensive, engaging, and modern article in fluent Persian (Farsi) about the following topic:

**Topic / موضوع اصلی مقاله:** ${cleanTopic}
${notesPart}

### استراتژی محتوا و استانداردهای نگارش (Strict Guidelines):
1. بهینه‌سازی موتورهای جستجو و هوش‌های مولد (SEO & GEO Optimization):
   - مقاله باید عمیق، خواندنی و تخصصی باشد.
   - از تگ‌های ساختاریافته هدینگ (h2, h3)، استفاده ارگانیک از کلمات کلیدی، بولت‌پوینت‌های منظم و برجسته‌سازی کلمات کلیدی با <strong> استفاده کن.
2. بهینه‌سازی موتورهای پاسخگو (AEO - Answer Engine Optimization):
   - بلافاصله پس از پاراگراف مقدمه، یک بخش ویژه و برجسته با عنوان «پاسخ سریع در یک نگاه» قرار بده که در ۲ الی ۳ جمله شفاف، صریح و جامع پاسخ اصلی را ارائه دهد (برای نمایش در Google AI Overviews و Perplexity، بدون استفاده از اصطلاح انگلیسی TL;DR).
3. جدول مقایسه‌ای غنی (Comparison Table):
   - حداقل یک جدول تمیز HTML (شامل <table>, <thead>, <tbody>) برای مقایسه ابزارها، روش‌ها، مزایا و معایب یا داده‌های کلیدی بگنجان.
4. دیاگرام بصری مفهومی (Mermaid Diagram):
   - در مناسب‌ترین بخش مقاله برای نمایش فرآیند، معماری یا نقشه ذهنی، یک بلوک کد استاندارد (\`\`\`mermaid ... \`\`\`) با عناوین فارسی و ایموجی‌های زیبا قرار بده (مانند flowchart TD یا mindmap).
5. جایگاه‌های تصویر استراتژیک (Image Placeholders):
   - دقیقاً در ۳ بخش مناسب از متن، عبارت [IMAGE_PLACEHOLDER] را در یک خط مجزا قرار بده تا جایگاه تصاویر مشخص باشد.
6. بخش سوالات متداول (FAQ):
   - در انتهای متن، ۳ سوال پرجستجو با پاسخ‌های کوتاه، کاربردی و غنی ارائه بده.
7. لحن و نگارش: حرفه‌ای، لحن روان و امروزی به زبان فارسی سلیس و بدون ترجمه‌های ماشینی ناهمگون.
8. قانون فنی بسیار مهم برای HTML درون JSON:
   - در تمام تگ‌های HTML درون فیلد content، برای صفت‌ها (مانند style، class، border) حتماً و فقط از تک‌گیومه ' استفاده کن (مانند <div style='...'> یا <code class='language-mermaid'>) تا ساختار رشته JSON شکسته نشود.

---
### دستورالعمل ساختار خروجی (بسیار مهم و قطعی):
خروجی را **فقط و فقط** در قالب یک شیء استاندارد JSON بازگردان. هیچ کلمه، سلام، توضیح، متن مقدماتی یا پی‌نوشتی قبل و بعد از JSON ننویس.
ساختار JSON باید دقیقاً به شکل زیر باشد:
{
  "title": "عنوان اصلی و بسیار جذاب مقاله (H1 به فارسی)",
  "slug": "short-english-slug-with-hyphens (نامک کوتاه و تمام انگلیسی با خط تیره، مثال: software-engineering-guide)",
  "content": "متن کامل مقاله به صورت تگ‌های استاندارد HTML با اتریبیوت‌های دارای تک‌گیومه (شامل h2, h3, p, ul, ol, li, table, strong). عبارت [IMAGE_PLACEHOLDER] دقیقاً ۳ بار در جای مناسب قرار گیرد. بخش پاسخ سریع، جدول و دیاگرام مر‌مید نیز درون همین متن باشند.",
  "seo_title": "عنوان سئو بهینه و ترغیب‌کننده به همراه کلمه کلیدی (حداکثر ۶۰ کاراکتر)",
  "seo_desc": "توضیحات متای گیرا و استاندارد سئو حاوی کلمه کلیدی (بین ۱۳۰ الی ۱۵۰ کاراکتر)",
  "image_prompts": [
    "پرامپت انگلیسی فوق‌العاده باکیفیت و با جزئیات کامل برای تصویر اول (سبک سینماتیک یا ایزومتریک)",
    "پرامپت انگلیسی با جزئیات کامل برای تصویر دوم",
    "پرامپت انگلیسی با جزئیات کامل برای تصویر سوم"
  ],
  "faq": [
    {"question": "سوال اول؟", "answer": "پاسخ کوتاه و کاربردی اول."},
    {"question": "سوال دوم؟", "answer": "پاسخ کوتاه و کاربردی دوم."},
    {"question": "سوال سوم؟", "answer": "پاسخ کوتاه و کاربردی سوم."}
  ]
}`;
  };

  // Fetch categories on mount with multiple fallback layers
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      // 1. Initial check from localized data
      if (Array.isArray(window.omniAiData?.categories) && window.omniAiData.categories.length > 0) {
        if (isMounted) {
          setCategories(window.omniAiData.categories);
          setSelectedCategory((prev) => prev || String(window.omniAiData.categories[0].id));
        }
      }

      // 2. Fetch from plugin REST endpoint
      try {
        const res = await apiFetch('categories');
        const data = await res.json();
        const catList = Array.isArray(data)
          ? data
          : Array.isArray(data?.categories)
          ? data.categories
          : [];

        if (isMounted && catList.length > 0) {
          setCategories(catList);
          setSelectedCategory((prev) => prev || String(catList[0].id));
          return;
        }
      } catch (e) {
        // Continue to native WP endpoint fallback
      }

      // 3. Fallback to native WP REST API
      try {
        const wpRes = await apiFetch('wp/v2/categories', {}, { per_page: 100 });
        const wpData = await wpRes.json();
        if (isMounted && Array.isArray(wpData) && wpData.length > 0) {
          const formatted = wpData.map((c) => ({
            id: c.id,
            name: c.name ? c.name.replace(/&amp;/g, '&') : `Category #${c.id}`,
          }));
          setCategories(formatted);
          setSelectedCategory((prev) => prev || String(formatted[0].id));
        }
      } catch (_) {}
    };

    fetchCats();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyPrompt = () => {
    const fullPrompt = generatePromptWithTopic();
    navigator.clipboard.writeText(fullPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2500);
  };

  const handleCopySingleImagePrompt = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  const handleSubmitJson = async () => {
    const trimmedInput = (jsonInput || '').trim();
    if (!trimmedInput) {
      setNotice({
        type: 'error',
        text: __('لطفاً ابتدا خروجی JSON چت‌بات را در کادر زیر وارد کنید.', 'omni-ai-suite'),
      });
      return;
    }

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
        }),
      });

      const data = await res.json();

      if (data && data.success) {
        setResult(data);
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', direction: 'rtl' }}>
      {/* Notice display with safe unmounting */}
      {Boolean(notice) ? (
        <div key={notice?.type + (notice?.text || '')} style={{ marginBottom: '16px' }}>
          <Notice status={notice?.type || 'info'} isDismissible onDismiss={() => setNotice(null)}>
            {notice?.text || ''}
          </Notice>
        </div>
      ) : null}

      {/* Top Section: Prompt Generator with Topic Replacement */}
      <Card style={{ marginBottom: '20px', borderRight: '4px solid #2271b1' }}>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <strong style={{ fontSize: '15px', color: '#1d2327' }}>
              🎯 ۱. آماده‌سازی پرامپت فوق‌تخصصی مقاله (SEO / AEO / GEO)
            </strong>
            <Button
              variant="tertiary"
              size="small"
              onClick={() => setShowPromptDetails((prev) => !prev)}
            >
              <span>{showPromptDetails ? 'پنهان‌سازی پیش‌نمایش پرامپت ▲' : 'مشاهده قالب پرامپت ▼'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardBody style={{ padding: '16px 20px' }}>
          <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#50575e' }}>
            موضوع و توضیحات دلخواه مقاله را در فیلدهای زیر بنویسید؛ سیستم موضوع شما را به شکل هوشمند درون پرامپت قرار می‌دهد. سپس دکمه کپی را بزنید و متن را به چت‌بات (ChatGPT / Claude / Gemini) ارسال کنید.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <TextControl
              label="📌 موضوع یا کلمه کلیدی اصلی مقاله:"
              placeholder="مثال: آموزش سئو تکنیکال در سال 2026 با هوش مصنوعی"
              value={topic}
              onChange={(val) => setTopic(val || '')}
            />

            <TextControl
              label="💡 توضیحات تکمیلی یا الزامات خاص (اختیاری):"
              placeholder="مثال: به ابزارهای جدید و مقایسه RankMath با Yoast اشاره شود..."
              value={additionalNotes}
              onChange={(val) => setAdditionalNotes(val || '')}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              variant="primary"
              onClick={handleCopyPrompt}
              style={{ fontWeight: 600, height: '38px', padding: '0 18px' }}
            >
              <span>{promptCopied ? '✓ پرامپت با موضوع شما کپی شد!' : '📋 کپی پرامپت آماده برای ارسال به چت‌بات'}</span>
            </Button>

            {topic.trim().length > 0 ? (
              <span style={{ fontSize: '12px', color: '#008a20', fontWeight: 'bold' }}>
                ✓ موضوع «{topic.length > 35 ? topic.substring(0, 35) + '...' : topic}» در پرامپت جایگزین شد.
              </span>
            ) : null}
          </div>

          {/* Collapsible Preview of the Full Prompt */}
          {Boolean(showPromptDetails) ? (
            <div style={{ marginTop: '16px', background: '#f6f7f7', padding: '14px', borderRadius: '6px', border: '1px solid #dcdcde' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#2c3338' }}>پیش‌نمایش متن نهایی پرامپت:</span>
                <span style={{ fontSize: '11px', color: '#646970' }}>پشتیبانی کامل از SEO، دیاگرام Mermaid، جدول مقایسه‌ای و AEO</span>
              </div>
              <textarea
                readOnly
                rows={8}
                value={generatePromptWithTopic()}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px', direction: 'ltr', background: '#fff', border: '1px solid #c3c4c7', borderRadius: '4px', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* Main Grid: Input on Left/Center, Settings on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.8fr) minmax(280px, 1fr)', gap: '20px' }}>
        {/* Input Card */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <strong style={{ fontSize: '14px' }}>📝 ۲. خروجی JSON چت‌بات را اینجا پیست کنید:</strong>
              {jsonInput.trim().length > 0 ? (
                <Button variant="link" isDestructive onClick={handleReset} size="small">
                  <span>پاک کردن کادر</span>
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardBody>
            {/* Standard Robust Textarea without complex nested components */}
            <textarea
              className="large-text code"
              placeholder='{\n  "title": "عنوان مقاله...",\n  "content": "بدنه مقاله با تگ‌های HTML و [IMAGE_PLACEHOLDER]...",\n  "seo_title": "عنوان سئو...",\n  "seo_desc": "توضیحات متا...",\n  "image_prompts": ["پرامپت عکس ۱...", "پرامپت عکس ۲..."],\n  "faq": [{"question": "...", "answer": "..."}]\n}'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={16}
              style={{
                width: '100%',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '13px',
                direction: 'ltr',
                lineHeight: '1.6',
                border: '1px solid #8c8f94',
                borderRadius: '4px',
                padding: '10px 12px',
                boxSizing: 'border-box',
                background: '#fff',
              }}
            />

            <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Button
                variant="primary"
                onClick={handleSubmitJson}
                disabled={isLoading || !jsonInput.trim()}
                style={{ minWidth: '190px', height: '40px', fontSize: '14px', fontWeight: 600 }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  {isLoading ? (
                    <>
                      <Spinner />
                      <span>در حال ثبت در وردپرس...</span>
                    </>
                  ) : (
                    <span>🚀 ۳. ایجاد و ذخیره مقاله در وردپرس</span>
                  )}
                </span>
              </Button>
              {isLoading ? (
                <span style={{ fontSize: '12px', color: '#646970' }}>در حال اعتبارسنجی JSON و ساخت پست...</span>
              ) : null}
            </div>
          </CardBody>
        </Card>

        {/* Settings & Configuration Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <CardHeader>
              <strong style={{ fontSize: '14px' }}>⚙️ تنظیمات انتشار و سئو</strong>
            </CardHeader>
            <CardBody>
              <div style={{ marginBottom: '16px' }}>
                <SelectControl
                  label={__('دسته‌بندی نوشته:', 'omni-ai-suite')}
                  value={selectedCategory}
                  options={[
                    { label: __('انتخاب دسته‌بندی (اختیاری)...', 'omni-ai-suite'), value: '' },
                    ...categories.map((c) => ({
                      label: c.name || c.title || `دسته‌بندی #${c.id || c.term_id}`,
                      value: String(c.id || c.term_id),
                    })),
                  ]}
                  onChange={(val) => setSelectedCategory(val || '')}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <SelectControl
                  label={__('وضعیت نوشته:', 'omni-ai-suite')}
                  value={postStatus}
                  options={[
                    { label: __('پیش‌نویس (Draft) - پیشنهادی جهت قرار دادن عکس', 'omni-ai-suite'), value: 'draft' },
                    { label: __('انتشار عمومی (Publish)', 'omni-ai-suite'), value: 'publish' },
                    { label: __('در انتظار بازبینی (Pending Review)', 'omni-ai-suite'), value: 'pending' },
                  ]}
                  onChange={(val) => setPostStatus(val || 'draft')}
                  help={__('پیشنهاد می‌شود روی پیش‌نویس باشد تا تصاویر را دستی جایگزین کنید.', 'omni-ai-suite')}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <SelectControl
                  label={__('هدف ذخیره‌سازی متادیتای سئو:', 'omni-ai-suite')}
                  value={seoTarget}
                  options={[
                    { label: __('تشخیص خودکار افزونه فعال (Auto Detect)', 'omni-ai-suite'), value: 'auto' },
                    { label: __('رنک مث (Rank Math SEO)', 'omni-ai-suite'), value: 'rank_math' },
                    { label: __('یوآست سئو (Yoast SEO)', 'omni-ai-suite'), value: 'yoast' },
                    { label: __('هر دو افزونه هم‌زمان (Universal Sync)', 'omni-ai-suite'), value: 'both' },
                  ]}
                  onChange={(val) => setSeoTarget(val || 'auto')}
                  help={__('عنوان و توضیحات سئو در فیلدهای متای استاندارد ذخیره می‌شوند.', 'omni-ai-suite')}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <strong style={{ fontSize: '14px' }}>📌 روند کار (Workflow):</strong>
            </CardHeader>
            <CardBody style={{ fontSize: '12px', color: '#50575e', lineHeight: '1.8' }}>
              <ol style={{ paddingInlineStart: '18px', margin: 0 }}>
                <li>موضوع خود را در بخش ۱ وارد کرده و دکمه کپی پرامپت را بزنید.</li>
                <li>پرامپت را در ChatGPT یا کلود ارسال نمایید.</li>
                <li>خروجی JSON حاصل را در کادر ۲ پیست کرده و دکمه ثبت را بزنید.</li>
                <li>پرامپت‌های تصویر ظاهرشده را در Midjourney / DALL-E تولید کنید.</li>
                <li>وارد گوتنبرگ شده و با <code>Ctrl+F</code> کلمه <code>[IMAGE_PLACEHOLDER]</code> را با عکس پر کنید!</li>
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Result Section (Appears after successful post creation) */}
      {Boolean(result) ? (
        <div key="result-success-container" style={{ marginTop: '24px' }}>
          <Card style={{ border: '2px solid #00a32a' }}>
            <CardHeader style={{ background: '#f0fdf4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎉</span>
                <strong style={{ color: '#15803d', fontSize: '16px' }}>
                  مقاله با موفقیت در وردپرس ثبت شد! (شناسه نوشته: #{result.post_id})
                </strong>
              </div>
            </CardHeader>
            <CardBody>
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <a
                  href={result.edit_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary button-hero"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  ✏️ ویرایش نوشته در گوتنبرگ وردپرس
                </a>
                {result.preview_url ? (
                  <a
                    href={result.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-secondary button-hero"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    👁️ مشاهده پیش‌نمایش
                  </a>
                ) : null}
              </div>

              {/* Summary Stats */}
              <div style={{ background: '#f6f7f7', padding: '14px 18px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #dcdcde' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <strong>عنوان نوشته:</strong> <span style={{ color: '#1d2327' }}>{result.title}</span>
                  </div>
                  <div>
                    <strong>نامک انگلیسی (Slug):</strong> <span style={{ color: '#2271b1', fontFamily: 'monospace' }}>{result.slug || '-'}</span>
                  </div>
                  <div>
                    <strong>عنوان سئو:</strong> <span style={{ color: '#2271b1' }}>{result.seo_title || '-'}</span>
                  </div>
                  <div>
                    <strong>توضیحات سئو:</strong> <span style={{ color: '#50575e' }}>{result.seo_desc || '-'}</span>
                  </div>
                  <div>
                    <strong>تعداد سوالات متداول (FAQ):</strong> <span style={{ color: '#008a20', fontWeight: 'bold' }}>{result.faq_count} سوال همراه با اسکیما</span>
                  </div>
                </div>
              </div>

              {/* Image Prompts Section */}
              {Array.isArray(result.image_prompts) && result.image_prompts.length > 0 ? (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1d2327', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🖼️ پرامپت‌های استخراج‌شده برای ساخت تصاویر (کلید کپی سریع):
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.image_prompts.map((imgPrompt, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#fff',
                          border: '1px solid #c3c4c7',
                          borderRadius: '6px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1, direction: 'ltr', textAlign: 'left' }}>
                          <span style={{ display: 'inline-block', background: '#2271b1', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                            Image #{idx + 1}
                          </span>
                          <p style={{ margin: 0, fontSize: '13px', fontFamily: 'monospace', color: '#2c3338' }}>
                            {imgPrompt}
                          </p>
                        </div>
                        <Button
                          variant={copiedPromptIndex === idx ? 'primary' : 'secondary'}
                          size="small"
                          onClick={() => handleCopySingleImagePrompt(imgPrompt, idx)}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <span>{copiedPromptIndex === idx ? '✓ کپی شد!' : '📋 کپی پرامپت'}</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: '10px', fontSize: '12px', color: '#646970' }}>
                    💡 راهنما: پس از تولید تصاویر با این پرامپت‌ها در Midjourney یا ابزار دلخواهتان، در نوشته وردپرس با <code>Ctrl+F</code> کلمه <code>[IMAGE_PLACEHOLDER]</code> را بیابید و عکس‌ها را جایگزین کنید.
                  </p>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
