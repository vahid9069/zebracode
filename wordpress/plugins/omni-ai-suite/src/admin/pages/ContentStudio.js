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
    return `Modern conceptual illustration of ${cleanTopic}, ${selectedPresetObj.promptSnippet}, 16:9 aspect ratio, 8k resolution, professional tech graphic, masterpiece, trending on ArtStation, no text, no typography, no watermark, no logos, no blur`;
  };

  // Dynamic Full SEO, AEO, and GEO Prompt Generator for Master LLM
  const generatePromptWithTopic = () => {
    const cleanTopic = topic.trim() || '[موضوع یا کلمه کلیدی اصلی مقاله خود را اینجا بگذارید]';
    const notesPart = additionalNotes.trim()
      ? `\n**الزامات و نکات تکمیلی درخواستی کاربر:**\n${additionalNotes.trim()}\n`
      : '';

    let toolsGuideline = '';
    let toolsJsonSample = '';
    if (syncedTools && syncedTools.length > 0) {
      const toolListStr = syncedTools.slice(0, 35).map((t) => {
        return `- ${t.title} (${t.domain}): ${t.url} [اسلاگ: "${t.slug}"]`;
      }).join('\n');

      toolsGuideline = `
5. **🔗 لینک‌سازی داخلی و ابزارهای مرتبط (Internal Tool Links & Related Tools):**
   - در سایت ما ابزارهای آنلاین توسعه‌دهندگان زیر فعال هستند:
${toolListStr}
   - **الزام اکید:** در صورت ارتباط موضوع مقاله با هرکدام از این ابزارها:
     ۱. در بدنه محتوا (\`content\`) حداقل ۱ تا ۲ لینک مستقیم و طبیعی با تگ HTML (\`<a href="URL">عنوان ابزار</a>\`) به این ابزارها ایجاد کن.
     ۲. اسلاگ‌های ابزارهای مرتبط را در فیلد \`"related_tools": ["slug-1", "slug-2"]\` در JSON قرار بده.`;

      toolsJsonSample = `\n  "related_tools": ["slug-1", "slug-2"],`;
    }

    return `You are an elite SEO/GEO/AEO content strategist, senior technical writer, and web researcher.
Write a deeply researched, comprehensive, engaging, and modern article in fluent Persian (Farsi) about the following topic:

**Topic / موضوع اصلی مقاله:** ${cleanTopic}
${notesPart}

### استراتژی محتوا و استانداردهای نگارش (Strict Guidelines):
1. **جامعیت و عمق علمی:** پوشش کامل مفاهیم از مقدماتی تا پیشرفته با تکیه بر استانداردهای 2026.
2. **سئو و بهینه‌سازی موتورهای هوش مصنوعی (AEO & GEO):**
   - عنوان سئو جذاب، ترغیب‌کننده و دارای کلمه کلیدی اصلی (حداکثر ۶۰ کاراکتر).
   - توضیحات متا متقاعدکننده (۱۴۰ تا ۱۶۰ کاراکتر).
   - حداقل ۴ تا ۶ سوال و جواب کوتاه، شفاف و مستقیم برای بخش FAQ (مناسب برای AI Overview و Featured Snippets).
3. **ساختار بصری و پرامپت‌های تصویری هوشمند:**
   - **تصویر شاخص (Featured Image - ۱۶:۹):** تولید یک پرامپت انگلیسی بسیار دقیق برای هوش مصنوعی (Ideogram / Midjourney / DALL-E) با سبک زیر:
     "${selectedPresetObj.promptSnippet}"
     تأکید اکید: هیچ متنی نباید در عکس باشد (no typography, no text, no logos).
   - **دیاگرام یا اینفوگرافیک مفهومی:** تولید یک پرامپت مفهومی دیاگرام و قرار دادن برچسب [DIAGRAM_PLACEHOLDER] در متن.
   - **تصاویر تکمیلی درون متن:** قرار دادن تگ‌های [IMAGE_PLACEHOLDER_1] و [IMAGE_PLACEHOLDER_2] در بخش‌های مناسب به همراه آرایه image_prompts به انگلیسی.
4. **نامک انگلیسی (Slug):** یک اسلاگ انگلیسی کوتاه و استاندارد سئو (۲ تا ۴ کلمه).${toolsGuideline}
6. **خروجی الزامی:** پاسخ شما باید **فقط و فقط یک آبجکت JSON معتبر** بدون هیچ متن اضافی قبل یا بعد از آن با ساختار زیر باشد:

\`\`\`json
{
  "title": "عنوان جذاب و استاندارد مقاله به زبان فارسی",
  "slug": "english-seo-friendly-slug",
  "seo_title": "عنوان سئو کمتر از ۶۰ کاراکتر",
  "seo_desc": "توضیحات متا جذاب بین ۱۴۰ تا ۱۶۰ کاراکتر",
  "featured_image_prompt": "Prompt for 16:9 featured image in English...",
  "diagram_prompt": "Detailed architecture/flowchart prompt for infographic...",
  "image_prompts": [
    "English prompt for in-content image 1...",
    "English prompt for in-content image 2..."
  ],
  "faq": [
    {"question": "سوال اول؟", "answer": "پاسخ مستقیم و کوتاه..."},
    {"question": "سوال دوم؟", "answer": "پاسخ مستقیم و کوتاه..."}
  ],${toolsJsonSample}
  "content": "متن کامل مقاله به فرمت HTML معتبر با هدینگ‌های h2, h3، پاراگراف‌ها، لیست‌ها، جداول، لینک‌های داخلی ابزارها و برچسب‌های [DIAGRAM_PLACEHOLDER] و [IMAGE_PLACEHOLDER_1]..."
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
          calendar_item_id: selectedCalendarItemId || '',
          disable_ads: disableAds,
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
    const notesArr = [];
    if (item.focus_keyword) {
      notesArr.push(`کلمه کلیدی کانونی: ${item.focus_keyword}`);
    }
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
                  label="موضوع یا کلمه کلیدی اصلی:"
                  placeholder="مثال: راهنمای بهینه‌سازی دیتابیس در وردپرس و Next.js"
                  value={topic}
                  onChange={(val) => setTopic(val || '')}
                />
                <TextControl
                  label="نکات تکمیلی و الزامات (اختیاری):"
                  placeholder="مثال: مقایسه روش‌های کشینگ با Redis..."
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
                    <div><strong>نامک:</strong> <span style={{ color: '#0284c7', fontFamily: 'monospace' }}>{result.slug || '-'}</span></div>
                    <div><strong>عنوان سئو:</strong> <span style={{ color: '#475569' }}>{result.seo_title || '-'}</span></div>
                    <div><strong>FAQ:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>{result.faq_count} سوال با اسکیما</span></div>
                  </div>

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
