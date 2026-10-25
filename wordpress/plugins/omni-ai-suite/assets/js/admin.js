/**
 * Omni AI Suite - Bilingual (Persian / English) Admin React SPA Bundle
 * Built exclusively using @wordpress/element and @wordpress/components
 * With ErrorBoundary and Native WordPress Tabs to prevent blank white screens.
 */
(function (wp) {
  'use strict';

  if (!wp || !wp.element || !wp.components) {
    console.error('[Omni AI Suite] Required WordPress core assets (wp.element, wp.components) are missing.');
    return;
  }

  const {
    createElement: h,
    Component,
    useState,
    useEffect,
    useRef,
    createRoot,
    render,
  } = wp.element;

  const {
    Button,
    Card,
    CardBody,
    CardHeader,
    TextareaControl,
    TextControl,
    SelectControl,
    RangeControl,
    ToggleControl,
    Notice,
    Modal,
    Spinner,
  } = wp.components;

  // --- React Error Boundary to prevent Blank White Screen crashes ---
  class ErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('[Omni AI Suite UI Error]:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return h(
          'div',
          {
            style: {
              padding: '24px',
              background: '#ffffff',
              border: '2px solid #d63638',
              borderRadius: '6px',
              margin: '20px 0',
              fontFamily: 'sans-serif',
            },
          },
          [
            h('h3', { key: 'h', style: { color: '#d63638', margin: '0 0 10px' } }, '⚠️ خطایی در اجرای بخش مدیریت رخ داد'),
            h('p', { key: 'p', style: { color: '#50575e', fontSize: '13px' } }, 'جزئیات خطا برای بررسی:'),
            h(
              'pre',
              {
                key: 'pre',
                style: {
                  background: '#f0f0f1',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflowX: 'auto',
                },
              },
              String(this.state.error?.message || this.state.error)
            ),
            h(
              Button,
              {
                key: 'btn',
                variant: 'primary',
                onClick: () => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = '#/dashboard';
                },
                style: { marginTop: '12px' },
              },
              'بازگشت به پیشخوان'
            ),
          ]
        );
      }
      return this.props.children;
    }
  }

  // --- Bilingual Dictionary (Persian & English) ---
  const DICTIONARY = {
    en: {
      pluginTitle: 'Omni AI Suite',
      pluginSubtitle: 'Modular, High-Performance WordPress AI Engine',
      activeProvider: 'Active Provider:',
      ready: '● Ready',
      keyNeeded: '● Key Needed',
      tabDashboard: 'Dashboard',
      tabStudio: 'AI Content Studio',
      tabBulk: 'Bulk Generator',
      tabLogs: 'History & Logs',
      tabModules: 'Modules',
      tabSettings: 'Settings (BYOK)',
      totalGenerations: 'Total Generations',
      tokensUsed: 'Estimated Tokens Used',
      generationsToday: 'Generations Today',
      studioCardTitle: '✍️ AI Content Studio',
      studioCardDesc: 'Generate blog posts, headlines, meta descriptions with instant SSE streaming.',
      openStudio: 'Open Content Studio',
      bulkCardTitle: '⚡ Bulk Post Generator',
      bulkCardDesc: 'Generate articles safely in the background with Action Scheduler without 504 timeouts.',
      launchBulk: 'Launch Bulk Generator',
      modulesCardTitle: '🧩 Modular Architecture',
      modulesCardDesc: 'Enable or disable Gutenberg, Elementor, WooCommerce, and Chatbot modules. Inactive modules load 0 assets.',
      manageModules: 'Manage Modules',
      recentGenerations: 'Recent Generations (Custom Table - No CPT Bloat)',
      viewAllHistory: 'View All History →',
      noHistory: 'No generation history yet. Head over to the Content Studio to generate content!',
      date: 'Date',
      provider: 'Provider',
      model: 'Model',
      promptPreview: 'Prompt Preview',
      quickTemplates: 'Quick Templates:',
      tplOutline: 'Article Outline',
      tplOutlinePrompt: 'Write a comprehensive, engaging article outline with H2 and H3 subheadings for: [Topic]',
      tplOutlineSys: 'Organize logically with compelling headings.',
      tplMeta: 'SEO Meta Description',
      tplMetaPrompt: 'Write 3 compelling SEO meta descriptions under 160 characters with call-to-actions for: [Topic/URL]',
      tplMetaSys: 'Strictly under 160 characters per meta description.',
      tplDraft: 'Blog Post Full Draft',
      tplDraftPrompt: 'Write an informative, well-researched 800-word blog post about: [Topic]. Include intro, tips, and conclusion.',
      tplDraftSys: 'Use conversational tone and clear markdown formatting.',
      promptAndModelSettings: 'Prompt & Model Settings',
      userPrompt: 'User Prompt',
      userPromptPlaceholder: 'What would you like the AI to generate?',
      systemInstructions: 'System Instructions (Optional)',
      systemPlaceholder: 'Tone of voice, formatting guidelines...',
      temperature: 'Creativity (Temperature)',
      streamGenerate: '⚡ Stream Generate (SSE)',
      stopStreaming: '⏹ Stop Streaming',
      liveOutput: 'Live Output',
      streamingChunks: '● Streaming chunks...',
      copyText: 'Copy Text',
      copied: 'Copied! ✓',
      clear: 'Clear',
      saveDraftPost: 'Save As Draft Post',
      waitingStream: 'Generated text will stream here in real-time chunk-by-chunk...',
      draftSuccess: 'Draft post created successfully! Check your Posts menu.',
      draftFail: 'Failed to save draft post.',
      editPost: 'Edit Post in WordPress →',
      emptyResponse: 'No content received from AI provider. Please verify your API key or server connection.',
      bulkTitle: '⚡ Asynchronous Bulk Content Generation',
      bulkDesc: 'Background processing via Action Scheduler prevents HTTP 504 timeouts completely.',
      bulkInputLabel: 'Article Titles / Topics (One per line)',
      bulkInputHelp: '%d articles detected to generate.',
      bulkPostStatus: 'Post Status',
      statusDraft: 'Draft (Recommended)',
      statusPending: 'Pending Review',
      enqueueBulk: '🚀 Enqueue %d Articles to Background Queue',
      queueingJobs: 'Queueing jobs...',
      logsTitle: 'Generation History (Custom Table)',
      clearAllLogs: 'Clear All Logs',
      filter: 'Filter',
      searchKeywords: 'Search keywords...',
      allProviders: 'All Providers',
      delete: 'Delete',
      view: 'View',
      close: 'Close',
      prompt: 'Prompt:',
      response: 'Response:',
      copyResponse: 'Copy Response',
      modulesTitle: '100% Modular Architecture',
      modulesDesc: 'Performance first: Inactive modules register ZERO hooks, scripts, or stylesheets in WordPress.',
      moduleEnabled: 'Module "%s" enabled.',
      moduleDisabled: 'Module "%s" disabled. Inactive modules register 0 hooks or assets.',
      defaultEngineSettings: 'Default AI Engine Settings',
      defaultActiveProvider: 'Default Active Provider',
      byokTitle: 'Bring Your Own Key (BYOK) Credentials',
      byokDesc: 'Keys are safely stored on the server and NEVER sent to the client browser.',
      saveSettings: 'Save Settings',
      saving: 'Saving...',
      settingsSaved: 'Settings saved successfully.',
      configured: '● Configured',
      notSet: '○ Not Set',
      apiKey: 'API Key',
      connectedCore: '● Connected via WP Connectors',
      inheritedHelp: '✓ Key automatically inherited from WordPress Connectors (options-connectors.php).',
      errorPrefix: 'AI Provider Error:',
      postTitleLabel: 'Article / Post Title',
      postTitlePlaceholder: 'Custom post title (auto-extracted from heading if empty)...',
      postStatusLabel: 'Publication Status',
      statusDraft: 'Draft (Default)',
      statusPublish: 'Publish Immediately',
      statusFuture: 'Schedule for Future Date/Time',
      scheduledDateLabel: 'Scheduled Date & Time',
      featuredImageSection: 'AI Featured Image',
      generateFeaturedImage: 'Generate & attach AI featured image to post',
      imageProviderLabel: 'Featured Image Model',
      providerPollinations: 'Pollinations AI (Free, Fast, Unlimited)',
      providerDalle: 'OpenAI DALL-E 3 (High Quality, Requires OpenAI Key)',
      publishPost: 'Publish Post to Site',
      schedulePost: 'Schedule Post Publication',
      providerPriorityTitle: 'Provider Priority & Failover',
      providerPriorityDesc: 'Configure which AI provider executes first, and which acts as an automatic backup if the first fails.',
      primaryProvider: 'Primary Provider (1st Priority)',
      fallbackProvider: 'Fallback Provider (Automatic Failover)',
      noneOption: 'None (No Failover)',
      defaultImageModel: 'Default Featured Image Model',
      failoverNotice: '⚠️ Notice: Primary provider failed; generated successfully via fallback provider (%s).',
      savingWithImage: 'Saving & generating featured image...',
      imageStyleLabel: 'Visual Style & Template',
      styleIsometric: 'Modern 3D Isometric (Recommended)',
      styleFlat: 'Modern Flat Vector Illustration',
      stylePhotoreal: 'Photorealistic Studio Quality',
      styleCyber: 'Cyber & High-Tech Digital Art',
      styleCorporate: 'Corporate Business Clean',
      customImagePromptLabel: 'Custom Visual Prompt (Optional)',
      customImagePromptPlaceholder: 'e.g. Glowing JSON cube on modern desk, high detail...',
    },
    fa: {
      pluginTitle: 'امنی ای‌آی سوئیت (Omni AI Suite)',
      pluginSubtitle: 'موتور ماژولار و پرسرعت هوش مصنوعی برای وردپرس',
      activeProvider: 'سرویس‌دهنده فعال:',
      ready: '● آماده به کار',
      keyNeeded: '● نیازمند کلید API',
      tabDashboard: 'پیشخوان',
      tabStudio: 'استودیو تولید محتوا',
      tabBulk: 'تولید انبوه پست',
      tabLogs: 'تاریخچه و لاگ‌ها',
      tabModules: 'مدیریت ماژول‌ها',
      tabSettings: 'تنظیمات (BYOK)',
      totalGenerations: 'مجموع تولیدات محتوا',
      tokensUsed: 'تخمین توکن‌های مصرفی',
      generationsToday: 'تولیدات امروز',
      studioCardTitle: '✍️ استودیو تولید محتوا با هوش مصنوعی',
      studioCardDesc: 'تولید مقالات، تیترها و توضیحات متا با استریم زنده بلادرنگ (SSE).',
      openStudio: 'باز کردن استودیو محتوا',
      bulkCardTitle: '⚡ تولید انبوه پست',
      bulkCardDesc: 'تولید دسته‌ای مقالات در پس‌زمینه با Action Scheduler بدون خطای تایم‌اوت ۵۰۴.',
      launchBulk: 'ورود به تولید انبوه',
      modulesCardTitle: '🧩 سیستم ماژولار',
      modulesCardDesc: 'امکان فعال/غیرفعال‌سازی ماژول‌های گوتنبرگ، المنتور، ووکامرس و چت‌بات بدون افزونگی.',
      manageModules: 'مدیریت ماژول‌ها',
      recentGenerations: 'تولیدات اخیر (جدول اختصاصی - بدون افزونگی دیتابیس)',
      viewAllHistory: 'مشاهده تمام تاریخچه ←',
      noHistory: 'هنوز سابقه‌ای ثبت نشده است. برای نوشتن مقاله به استودیو محتوا بروید!',
      date: 'تاریخ',
      provider: 'سرویس‌دهنده',
      model: 'مدل',
      promptPreview: 'پیش‌نمایش پرامپت',
      quickTemplates: 'قالب‌های سریع آماده:',
      tplOutline: 'طرح کلی مقاله',
      tplOutlinePrompt: 'یک طرح کلی ساختاریافته و جامع همراه با تیترهای H2 و H3 بنویس درباره: [موضوع]',
      tplOutlineSys: 'شما یک استراتژیست محتوا هستید. مطالب را با ساختار منطقی دسته‌بندی کنید.',
      tplMeta: 'توضیحات متا سئو',
      tplMetaPrompt: '۳ متن توضیحات متای سئو با دکمه اقدام (CTA) زیر ۱۶۰ کاراکتر بنویس برای: [موضوع]',
      tplMetaSys: 'طول هر متن توضیحات متا باید دقیقاً کمتر از ۱۶۰ کاراکتر باشد.',
      tplDraft: 'پیش‌نویس کامل پست وبلاگ',
      tplDraftPrompt: 'یک مقاله وبلاگی جذاب و ۸۰۰ کلمه‌ای همراه با مقدمه، راهکارهای عملی و نتیجه‌گیری بنویس درباره: [موضوع]',
      tplDraftSys: 'با لحن صمیمی و حرفه‌ای همراه با فرمت‌بندی هدینگ‌ها و بولت‌پوینت بنویس.',
      promptAndModelSettings: 'تنظیمات پرامپت و مدل هوش مصنوعی',
      userPrompt: 'دستور یا عنوان درخواستی (پرامپت)',
      userPromptPlaceholder: 'می‌خواهید هوش مصنوعی چه متنی برای شما تولید کند؟',
      systemInstructions: 'دستورالعمل‌های سیستمی (اختیاری)',
      systemPlaceholder: 'لحن نگارش، فرمت‌بندی، نکات مد نظر...',
      temperature: 'میزان خلاقیت (Temperature)',
      streamGenerate: '⚡ تولید زنده محتوا (استریم SSE)',
      stopStreaming: '⏹ توقف استریم',
      liveOutput: 'خروجی زنده هوش مصنوعی',
      streamingChunks: '● در حال استریم زنده کلمات...',
      copyText: 'کپی متن',
      copied: 'کپی شد! ✓',
      clear: 'پاک کردن',
      saveDraftPost: 'ذخیره به عنوان پست پیش‌نویس وردپرس',
      waitingStream: 'متن تولید شده به صورت زنده و کلمه به کلمه در این قسمت نمایش داده خواهد شد...',
      draftSuccess: 'پست پیش‌نویس با موفقیت در وردپرس ایجاد شد!',
      draftFail: 'خطا در ذخیره‌سازی پیش‌نویس پست.',
      editPost: 'ویرایش نوشته در وردپرس ←',
      emptyResponse: 'هیچ متنی از سرویس هوش مصنوعی دریافت نشد. لطفاً پرامپت یا کلید API را بررسی کنید.',
      bulkTitle: '⚡ تولید انبوه پست به صورت ناهمگام (Async)',
      bulkDesc: 'پردازش در پس‌زمینه با Action Scheduler انجام شده و خطای ۵۰۴ گیت‌وی به طور کامل حذف می‌شود.',
      bulkInputLabel: 'عناوین یا موضوعات مقالات (هر عنوان در یک خط)',
      bulkInputHelp: '%d مقاله جهت تولید شناسایی شد.',
      bulkPostStatus: 'وضعیت انتشار پست‌های جدید',
      statusDraft: 'پیش‌نویس (پیشنهادی)',
      statusPending: 'در انتظار بررسی',
      enqueueBulk: '🚀 ارسال %d مقاله به صف پردازش پس‌زمینه',
      queueingJobs: 'در حال ارسال به صف...',
      logsTitle: 'تاریخچه لاگ‌های تولید (جدول اختصاصی)',
      clearAllLogs: 'پاک‌سازی تمام لاگ‌ها',
      filter: 'فیلتر',
      searchKeywords: 'جستجوی کلمات کلیدی...',
      allProviders: 'همه سرویس‌دهنده‌ها',
      delete: 'حذف',
      view: 'مشاهده',
      close: 'بستن',
      prompt: 'پرامپت:',
      response: 'پاسخ تولید شده:',
      copyResponse: 'کپی متن پاسخ',
      modulesTitle: 'معماری ۱۰۰٪ ماژولار',
      modulesDesc: 'اولویت عملکرد: ماژول‌های غیرفعال هیچ هوک، فیلتر، استایل یا اسکریپتی در وردپرس لود نمی‌کنند.',
      moduleEnabled: 'ماژول "%s" با موفقیت فعال شد.',
      moduleDisabled: 'ماژول "%s" غیرفعال شد. ماژول‌های خاموش صفر هوک و اسکریپت لود می‌کنند.',
      defaultEngineSettings: 'تنظیمات پیش‌فرض موتور هوش مصنوعی',
      defaultActiveProvider: 'سرویس‌دهنده پیش‌فرض فعال',
      byokTitle: 'مدیریت کلیدهای اختصاصی (BYOK)',
      byokDesc: 'کلیدهای شما به صورت امن روی سرور نگهداری شده و هرگز به مرورگر کلاینت ارسال نمی‌شوند.',
      saveSettings: 'ذخیره تنظیمات',
      saving: 'در حال ذخیره...',
      settingsSaved: 'تنظیمات با موفقیت ذخیره شد.',
      configured: '● تنظیم شده',
      notSet: '○ تنظیم نشده',
      apiKey: 'کلید API',
      connectedCore: '● متصل از اتصال‌دهنده‌های هسته وردپرس',
      inheritedHelp: '✓ کلید به صورت خودکار از صفحه اتصال‌دهنده‌ها (options-connectors.php) دریافت شد.',
      errorPrefix: 'خطا در ارتباط با هوش مصنوعی:',
      postTitleLabel: 'عنوان نوشته / مقاله',
      postTitlePlaceholder: 'عنوان اختصاصی مقاله (در صورت خالی بودن خودکار از هدینگ متن استخراج می‌شود)...',
      postStatusLabel: 'وضعیت انتشار نوشته',
      statusDraft: 'پیش‌نویس (پیش‌فرض)',
      statusPublish: 'انتشار فوری در سایت',
      statusFuture: 'زمان‌بندی انتشار (آینده)',
      scheduledDateLabel: 'تاریخ و ساعت انتشار',
      featuredImageSection: 'تصویر شاخص هوش مصنوعی',
      generateFeaturedImage: 'تولید خودکار تصویر شاخص و الصاق به نوشته',
      imageProviderLabel: 'مدل تولید تصویر شاخص',
      providerPollinations: 'Pollinations AI (رایگان، بسیار سریع و نامحدود)',
      providerDalle: 'OpenAI DALL-E 3 (کیفیت بسیار بالا - نیازمند کلید OpenAI)',
      publishPost: 'انتشار مستقیم در سایت',
      schedulePost: 'زمان‌بندی انتشار نوشته',
      providerPriorityTitle: 'اولویت اجرای هوش مصنوعی و سرویس پشتیبان (Failover)',
      providerPriorityDesc: 'مشخص کنید کدام سرویس هوش مصنوعی اولویت اول اجرا باشد و در صورت بروز خطا کدام مدل به عنوان پشتیبان عمل کند.',
      primaryProvider: 'سرویس‌دهنده اصلی (اولویت اول)',
      fallbackProvider: 'سرویس‌دهنده پشتیبان (Failover در صورت خطا)',
      noneOption: 'هیچ‌کدام (بدون پشتیبان)',
      defaultImageModel: 'مدل پیش‌فرض تصویر شاخص',
      failoverNotice: '⚠️ توجه: سرویس اصلی با خطا مواجه شد؛ پاسخ توسط مدل پشتیبان (%s) تولید گردید.',
      savingWithImage: 'در حال ذخیره و ساخت تصویر شاخص...',
      imageStyleLabel: 'قالب و سبک تصویر شاخص',
      styleIsometric: 'سه بعدی مدرن ایزومتریک (3D Isometric - پیشنهادی)',
      styleFlat: 'تصویرسازی وکتور تخت (Modern Flat Vector)',
      stylePhotoreal: 'عکس استودیویی باکیفیت و زنده (Photoreal)',
      styleCyber: 'دیجیتال آرت تکنولوژی و سایبر (Cyber & Tech)',
      styleCorporate: 'مینیمال و تمیز شرکتی (Corporate Clean)',
      customImagePromptLabel: 'دستور یا پرامپت اختصاصی تصویر (اختیاری)',
      customImagePromptPlaceholder: 'مثال: مکعب سه‌بعدی و درخشان JSON روی میز کار برنامه‌نویسی...',
    },
  };

  function useTranslation(lang) {
    const safeLang = lang === 'fa' ? 'fa' : 'en';
    const t = (key) => DICTIONARY[safeLang]?.[key] || DICTIONARY['en']?.[key] || key;
    return { t, isRtl: safeLang === 'fa' };
  }

  // --- Header Component ---
  function Header({ configured = true, activeProvider = 'gemini', lang, onLangChange, t }) {
    const providerNames = {
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      claude: 'Anthropic Claude',
    };

    return h('header', { className: 'omni-ai-header' }, [
      h('div', { key: 'l', className: 'omni-ai-header-left' }, [
        h('div', { key: 'i', className: 'omni-ai-header-icon' }, '⚡'),
        h('div', { key: 't' }, [
          h('h1', { key: 'h', className: 'omni-ai-header-title' }, t('pluginTitle')),
          h('div', { key: 'st', style: { fontSize: '12px', color: '#646970' } }, [
            t('pluginSubtitle'),
            ' • v',
            window.omniAiData?.version || '1.0.0',
          ]),
        ]),
      ]),
      h('div', { key: 'r', style: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
        h('div', { key: 'langSwitch', className: 'omni-ai-lang-switch' }, [
          h(
            'button',
            {
              key: 'en',
              type: 'button',
              className: `omni-ai-lang-btn ${lang === 'en' ? 'active' : ''}`,
              onClick: () => onLangChange('en'),
            },
            'English'
          ),
          h(
            'button',
            {
              key: 'fa',
              type: 'button',
              className: `omni-ai-lang-btn ${lang === 'fa' ? 'active' : ''}`,
              onClick: () => onLangChange('fa'),
            },
            'فارسی'
          ),
        ]),
        h('span', { key: 'p', style: { fontSize: '13px', color: '#50575e' } }, [
          t('activeProvider'),
          ' ',
          h('strong', { key: 's' }, providerNames[activeProvider] || activeProvider),
        ]),
        h(
          'span',
          {
            key: 'b',
            className: `omni-ai-header-badge ${configured ? 'configured' : 'unconfigured'}`,
          },
          configured ? t('ready') : t('keyNeeded')
        ),
      ]),
    ]);
  }

  // --- Dashboard Page ---
  function Dashboard({ onNavigate, t, lang }) {
    const [stats, setStats] = useState({ total_generations: 0, total_tokens: 0, generations_today: 0 });
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      fetch(`${restUrl}logs?limit=5&_t=${Date.now()}`, {
        headers: { 'X-WP-Nonce': nonce, 'Cache-Control': 'no-cache' },
        cache: 'no-store',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.stats) setStats(data.stats);
          if (data && data.logs) setRecentLogs(data.logs);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, []);

    if (loading) {
      return h('div', { style: { textAlign: 'center', padding: '40px' } }, h(Spinner));
    }

    return h('div', null, [
      h('div', { key: 'stats', className: 'omni-ai-stats-grid' }, [
        h('div', { key: 's1', className: 'omni-ai-stat-card' }, [
          h('div', { key: 'l', className: 'omni-ai-stat-label' }, t('totalGenerations')),
          h('div', { key: 'v', className: 'omni-ai-stat-val' }, stats.total_generations.toLocaleString()),
        ]),
        h('div', { key: 's2', className: 'omni-ai-stat-card' }, [
          h('div', { key: 'l', className: 'omni-ai-stat-label' }, t('tokensUsed')),
          h('div', { key: 'v', className: 'omni-ai-stat-val' }, stats.total_tokens.toLocaleString()),
        ]),
        h('div', { key: 's3', className: 'omni-ai-stat-card' }, [
          h('div', { key: 'l', className: 'omni-ai-stat-label' }, t('generationsToday')),
          h('div', { key: 'v', className: 'omni-ai-stat-val', style: { color: '#2271b1' } }, stats.generations_today.toLocaleString()),
        ]),
      ]),

      h(
        'div',
        {
          key: 'cards',
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '28px',
          },
        },
        [
          h(Card, { key: 'c1' }, [
            h(CardHeader, { key: 'h' }, h('strong', null, t('studioCardTitle'))),
            h(CardBody, { key: 'b' }, [
              h('p', { key: 'p', style: { color: '#646970', fontSize: '13px' } }, t('studioCardDesc')),
              h(
                Button,
                { key: 'btn', variant: 'primary', onClick: () => onNavigate('studio'), style: { marginTop: '10px' } },
                t('openStudio')
              ),
            ]),
          ]),
          h(Card, { key: 'c2' }, [
            h(CardHeader, { key: 'h' }, h('strong', null, t('bulkCardTitle'))),
            h(CardBody, { key: 'b' }, [
              h('p', { key: 'p', style: { color: '#646970', fontSize: '13px' } }, t('bulkCardDesc')),
              h(
                Button,
                { key: 'btn', variant: 'secondary', onClick: () => onNavigate('bulk'), style: { marginTop: '10px' } },
                t('launchBulk')
              ),
            ]),
          ]),
          h(Card, { key: 'c3' }, [
            h(CardHeader, { key: 'h' }, h('strong', null, t('modulesCardTitle'))),
            h(CardBody, { key: 'b' }, [
              h('p', { key: 'p', style: { color: '#646970', fontSize: '13px' } }, t('modulesCardDesc')),
              h(
                Button,
                { key: 'btn', variant: 'secondary', onClick: () => onNavigate('modules'), style: { marginTop: '10px' } },
                t('manageModules')
              ),
            ]),
          ]),
        ]
      ),

      h(Card, { key: 'recent' }, [
        h(
          CardHeader,
          {
            key: 'rh',
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
          },
          [
            h('strong', { key: 't' }, t('recentGenerations')),
            h(Button, { key: 'a', variant: 'link', onClick: () => onNavigate('logs') }, t('viewAllHistory')),
          ]
        ),
        h(CardBody, { key: 'rb' }, [
          recentLogs.length === 0
            ? h('p', { style: { color: '#646970', margin: '10px 0' } }, t('noHistory'))
            : h('div', { style: { overflowX: 'auto' } }, [
                h('table', { className: 'widefat striped', style: { border: 'none' } }, [
                  h('thead', null, [
                    h('tr', null, [
                      h('th', null, t('date')),
                      h('th', null, t('provider')),
                      h('th', null, t('model')),
                      h('th', null, t('promptPreview')),
                    ]),
                  ]),
                  h(
                    'tbody',
                    null,
                    recentLogs.map((log) =>
                      h('tr', { key: log.id }, [
                        h('td', { style: { whiteSpace: 'nowrap', fontSize: '12px' } }, log.created_at),
                        h('td', null, h('span', { style: { textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold' } }, log.provider)),
                        h('td', { style: { fontSize: '12px', color: '#50575e' } }, log.model),
                        h('td', { style: { fontSize: '13px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, log.prompt),
                      ])
                    )
                  ),
                ]),
              ]),
        ]),
      ]),
    ]);
  }

  // --- Content Studio Page ---
  function ContentStudio({ t, lang }) {
    const [prompt, setPrompt] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [provider, setProvider] = useState('gemini');
    const [model, setModel] = useState('gemini-1.5-flash');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(4000);
    const [streaming, setStreaming] = useState(false);
    const [output, setOutput] = useState('');
    const [error, setError] = useState(null);
    const [postDraftNotice, setPostDraftNotice] = useState(null);
    const [draftResult, setDraftResult] = useState(null);
    const [isCreatingDraft, setIsCreatingDraft] = useState(false);
    const [copied, setCopied] = useState(false);
    const [customTitle, setCustomTitle] = useState('');
    const [postStatus, setPostStatus] = useState('draft');
    const [scheduledDate, setScheduledDate] = useState('');
    const [generateImage, setGenerateImage] = useState(false);
    const [imageProvider, setImageProvider] = useState('pollinations');
    const [imageStyle, setImageStyle] = useState('isometric_3d');
    const [imagePromptCustom, setImagePromptCustom] = useState('');
    const previewRef = useRef(null);
    const abortRef = useRef(null);

    const templates = [
      {
        label: t('tplOutline'),
        prompt: t('tplOutlinePrompt'),
        sys: t('tplOutlineSys'),
      },
      {
        label: t('tplMeta'),
        prompt: t('tplMetaPrompt'),
        sys: t('tplMetaSys'),
      },
      {
        label: t('tplDraft'),
        prompt: t('tplDraftPrompt'),
        sys: t('tplDraftSys'),
      },
    ];

    const handleGenerate = async () => {
      if (!prompt.trim()) return;
      setStreaming(true);
      setOutput('');
      setError(null);
      setPostDraftNotice(null);

      const abortController = new AbortController();
      abortRef.current = abortController;

      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      let accumulated = '';
      let hasError = false;

      try {
        const response = await fetch(`${restUrl}stream-ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce,
          },
          body: JSON.stringify({
            prompt,
            provider,
            model,
            system_prompt: systemPrompt,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errText = await response.text();
          let errJson = null;
          try { errJson = JSON.parse(errText); } catch(e) {}
          throw new Error(errJson?.message || errJson?.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (!dataStr) continue;

              let parsed = null;
              try {
                parsed = JSON.parse(dataStr);
              } catch (e) {
                continue;
              }

              if (parsed && parsed.error) {
                setError(parsed.error);
                hasError = true;
                break;
              }
              if (parsed && parsed.text) {
                accumulated += parsed.text;
                setOutput((prev) => prev + parsed.text);
                if (previewRef.current) {
                  previewRef.current.scrollTop = previewRef.current.scrollHeight;
                }
              }
              if (parsed && parsed.done) break;
            }
          }
          if (hasError) break;
        }

        if (!hasError && accumulated.trim().length === 0 && !abortController.signal.aborted) {
          setError(t('emptyResponse'));
        }

        if (!hasError && accumulated.trim().length > 0) {
          // Auto-extract article title from generated markdown if user hasn't set custom title
          try {
            const h1Match = accumulated.match(/^#\s+(.+)$/m);
            const faTitleMatch = accumulated.match(/^\*\*عنوان[:\s]*\*\*\s*(.+)$/mu);
            if (h1Match && h1Match[1]) {
              setCustomTitle(h1Match[1].replace(/[*#]/g, '').trim());
            } else if (faTitleMatch && faTitleMatch[1]) {
              setCustomTitle(faTitleMatch[1].replace(/[*#]/g, '').trim());
            }
          } catch (e) {}

          try {
            await fetch(`${restUrl}save-log`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce,
              },
              body: JSON.stringify({
                prompt,
                response: accumulated,
                model,
                provider,
                tokens: Math.round(accumulated.split(/\s+/).length * 1.3),
              }),
            });
          } catch (e) {}
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Stream error occurred.');
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    };

    const handleCreateDraft = async () => {
      if (!output || isCreatingDraft) return;
      setIsCreatingDraft(true);
      setPostDraftNotice(null);
      setDraftResult(null);

      try {
        const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
        const nonce = window.omniAiData?.nonce || '';
        const title = customTitle.trim() || prompt.slice(0, 60);

        const res = await fetch(`${restUrl}create-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
          body: JSON.stringify({
            content: output,
            prompt,
            title,
            status: postStatus,
            scheduled_date: scheduledDate,
            generate_image: generateImage,
            image_provider: imageProvider,
            image_style: imageStyle,
            image_prompt_custom: imagePromptCustom,
            provider,
            model,
            tokens: Math.round(output.split(/\s+/).length * 1.3),
            post_type: 'post',
          }),
        });

        const data = await res.json();
        if (data && data.success) {
          setPostDraftNotice(data.message || t('draftSuccess'));
          setDraftResult(data);
        } else {
          throw new Error(data?.message || t('draftFail'));
        }
      } catch (err) {
        setPostDraftNotice(err.message || t('draftFail'));
      } finally {
        setIsCreatingDraft(false);
      }
    };

    return h('div', null, [
      h('div', { key: 'tpl', style: { marginBottom: '16px' } }, [
        h('span', { key: 'l', style: { fontSize: '13px', fontWeight: 600, color: '#1d2327', marginInlineEnd: '8px' } }, t('quickTemplates')),
        h(
          'div',
          { key: 'btns', style: { display: 'inline-flex', flexWrap: 'wrap', gap: '6px' } },
          templates.map((tpl, i) =>
            h(
              'button',
              {
                key: i,
                type: 'button',
                className: 'button button-small',
                style: { borderRadius: '12px', fontSize: '12px' },
                onClick: () => {
                  setPrompt(tpl.prompt);
                  setSystemPrompt(tpl.sys);
                },
              },
              tpl.label
            )
          )
        ),
      ]),

      h(
        'div',
        {
          key: 'grid',
          style: {
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.2fr)',
            gap: '24px',
          },
        },
        [
          // Left card: Controls
          h(Card, { key: 'ctrl' }, [
            h(CardHeader, { key: 'h' }, h('strong', null, t('promptAndModelSettings'))),
            h(CardBody, { key: 'b' }, [
              h(TextareaControl, {
                key: 'p',
                label: t('userPrompt'),
                value: prompt,
                onChange: setPrompt,
                rows: 6,
                disabled: streaming,
                placeholder: t('userPromptPlaceholder'),
              }),
              h(TextareaControl, {
                key: 'sys',
                label: t('systemInstructions'),
                value: systemPrompt,
                onChange: setSystemPrompt,
                rows: 2,
                disabled: streaming,
                placeholder: t('systemPlaceholder'),
              }),
              h('div', { key: 'prow', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } }, [
                h(SelectControl, {
                  key: 'prov',
                  label: t('provider'),
                  value: provider,
                  options: [
                    { label: 'Google Gemini', value: 'gemini' },
                    { label: 'OpenAI', value: 'openai' },
                    { label: 'Anthropic Claude', value: 'claude' },
                  ],
                  onChange: (val) => {
                    setProvider(val);
                    if (val === 'gemini') setModel('gemini-1.5-flash');
                    if (val === 'openai') setModel('gpt-4o-mini');
                    if (val === 'claude') setModel('claude-3-5-sonnet-20241022');
                  },
                  disabled: streaming,
                }),
                h(SelectControl, {
                  key: 'mod',
                  label: t('model'),
                  value: model,
                  options:
                    provider === 'gemini'
                      ? [
                          { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                          { label: 'Gemini 1.5 Flash (Latest)', value: 'gemini-1.5-flash-latest' },
                          { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
                          { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                        ]
                      : provider === 'openai'
                      ? [
                          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                          { label: 'GPT-4o', value: 'gpt-4o' },
                        ]
                      : [
                          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
                          { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
                        ],
                  onChange: setModel,
                  disabled: streaming,
                }),
              ]),
              h(RangeControl, {
                key: 'temp',
                label: t('temperature'),
                value: temperature,
                onChange: setTemperature,
                min: 0,
                max: 1,
                step: 0.1,
                disabled: streaming,
              }),
              h('div', { key: 'act', style: { marginTop: '20px' } }, [
                !streaming
                  ? h(
                      Button,
                      {
                        key: 'gen',
                        variant: 'primary',
                        onClick: handleGenerate,
                        disabled: !prompt.trim(),
                        style: { width: '100%', justifyContent: 'center' },
                      },
                      t('streamGenerate')
                    )
                  : h(
                      Button,
                      {
                        key: 'stp',
                        variant: 'secondary',
                        isDestructive: true,
                        onClick: () => {
                          if (abortRef.current) abortRef.current.abort();
                        },
                        style: { width: '100%', justifyContent: 'center' },
                      },
                      t('stopStreaming')
                    ),
              ]),
            ]),
          ]),

          // Right card: Output
          h(Card, { key: 'out' }, [
            h(
              CardHeader,
              {
                key: 'oh',
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
              },
              [
                h('div', { key: 'title' }, [
                  h('strong', null, t('liveOutput')),
                  streaming &&
                    h('span', { style: { marginInlineStart: '8px', fontSize: '11px', color: '#2271b1', fontWeight: 600 } }, t('streamingChunks')),
                ]),
                h('div', { key: 'btns', style: { display: 'flex', gap: '8px' } }, [
                  h(
                    Button,
                    {
                      key: 'copy',
                      variant: 'tertiary',
                      size: 'small',
                      disabled: !output,
                      onClick: () => {
                        navigator.clipboard.writeText(output);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      },
                    },
                    copied ? t('copied') : t('copyText')
                  ),
                  h(
                    Button,
                    {
                      key: 'clr',
                      variant: 'tertiary',
                      size: 'small',
                      disabled: !output || streaming,
                      onClick: () => setOutput(''),
                    },
                    t('clear')
                  ),
                ]),
              ]
            ),
            h(CardBody, { key: 'ob' }, [
              error &&
                h(
                  Notice,
                  {
                    key: 'err',
                    status: 'error',
                    isDismissible: true,
                    onDismiss: () => setError(null),
                  },
                  error
                ),
              postDraftNotice &&
                h(
                  Notice,
                  {
                    key: 'pnotice',
                    status: draftResult ? 'success' : 'error',
                    isDismissible: true,
                    onDismiss: () => {
                      setPostDraftNotice(null);
                      setDraftResult(null);
                    },
                  },
                  [
                    h('span', { key: 'msg' }, postDraftNotice),
                    draftResult && draftResult.edit_url &&
                      h(
                        'a',
                        {
                          key: 'lnk',
                          href: draftResult.edit_url,
                          target: '_blank',
                          rel: 'noreferrer',
                          style: {
                            marginInlineStart: '12px',
                            fontWeight: 600,
                            textDecoration: 'underline',
                          },
                        },
                        t('editPost')
                      ),
                  ]
                ),
              h(
                'div',
                {
                  key: 'preview',
                  ref: previewRef,
                  className: 'omni-ai-stream-preview',
                },
                output
                  ? [output, streaming && h('span', { key: 'cur', className: 'omni-ai-stream-cursor' })]
                  : error
                  ? h(
                      'div',
                      {
                        style: {
                          color: '#d63638',
                          padding: '12px 14px',
                          background: '#fcf0f1',
                          border: '1px solid #f5c6cb',
                          borderRadius: '4px',
                          fontSize: '13px',
                          lineHeight: '1.5',
                        },
                      },
                      [
                        h(
                          'strong',
                          { key: 'lbl', style: { display: 'block', marginBottom: '6px' } },
                          '⚠️ ' + t('errorPrefix')
                        ),
                        h('span', { key: 'msg' }, error),
                      ]
                    )
                  : h(
                      'span',
                      { style: { color: '#8c8f94', fontStyle: 'italic' } },
                      t('waitingStream')
                    )
              ),
              output &&
                !streaming &&
                h(
                  'div',
                  {
                    key: 'botacts',
                    style: {
                      marginTop: '20px',
                      padding: '16px',
                      background: '#f6f7f7',
                      border: '1px solid #c3c4c7',
                      borderRadius: '6px',
                    },
                  },
                  [
                    h('div', { key: 'posttitle', style: { marginBottom: '12px' } }, [
                      h(TextControl, {
                        label: t('postTitleLabel'),
                        value: customTitle,
                        onChange: setCustomTitle,
                        placeholder: t('postTitlePlaceholder'),
                      }),
                    ]),
                    h(
                      'div',
                      {
                        key: 'statusrow',
                        style: {
                          display: 'grid',
                          gridTemplateColumns: postStatus === 'future' ? '1fr 1fr' : '1fr',
                          gap: '12px',
                          marginBottom: '12px',
                        },
                      },
                      [
                        h(SelectControl, {
                          key: 'statusctrl',
                          label: t('postStatusLabel'),
                          value: postStatus,
                          options: [
                            { label: t('statusDraft'), value: 'draft' },
                            { label: t('statusPublish'), value: 'publish' },
                            { label: t('statusFuture'), value: 'future' },
                          ],
                          onChange: setPostStatus,
                        }),
                        postStatus === 'future' &&
                          h('div', { key: 'futuredatediv' }, [
                            h(
                              'label',
                              {
                                style: {
                                  display: 'block',
                                  marginBottom: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#1d2327',
                                },
                              },
                              t('scheduledDateLabel')
                            ),
                            h('input', {
                              type: 'datetime-local',
                              value: scheduledDate,
                              onChange: (e) => setScheduledDate(e.target.value),
                              style: {
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #8c8f94',
                                borderRadius: '4px',
                                fontSize: '13px',
                                background: '#fff',
                              },
                            }),
                          ]),
                      ]
                    ),
                    h(
                      'div',
                      {
                        key: 'featimgbox',
                        style: {
                          marginBottom: '14px',
                          padding: '10px 12px',
                          background: '#ffffff',
                          border: '1px solid #dcdcde',
                          borderRadius: '4px',
                        },
                      },
                      [
                        h(ToggleControl, {
                          key: 'imgtoggle',
                          label: t('generateFeaturedImage'),
                          checked: generateImage,
                          onChange: setGenerateImage,
                        }),
                        generateImage &&
                          h('div', { key: 'imgopts', style: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' } }, [
                            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } }, [
                              h(SelectControl, {
                                key: 'imgprovctrl',
                                label: t('imageProviderLabel'),
                                value: imageProvider,
                                options: [
                                  { label: t('providerPollinations'), value: 'pollinations' },
                                  { label: t('providerDalle'), value: 'dall-e' },
                                ],
                                onChange: setImageProvider,
                              }),
                              h(SelectControl, {
                                key: 'imgstylectrl',
                                label: t('imageStyleLabel'),
                                value: imageStyle,
                                options: [
                                  { label: t('styleIsometric'), value: 'isometric_3d' },
                                  { label: t('styleFlat'), value: 'flat_vector' },
                                  { label: t('stylePhotoreal'), value: 'photoreal' },
                                  { label: t('styleCyber'), value: 'cyber_tech' },
                                  { label: t('styleCorporate'), value: 'corporate' },
                                ],
                                onChange: setImageStyle,
                              }),
                            ]),
                            h(TextControl, {
                              key: 'customprompt',
                              label: t('customImagePromptLabel'),
                              value: imagePromptCustom,
                              onChange: setImagePromptCustom,
                              placeholder: t('customImagePromptPlaceholder'),
                              help: 'در صورت خالی بودن، پرامپت هوشمند انگلیسی به صورت خودکار بر اساس موضوع مقاله تولید می‌شود.',
                            }),
                          ]),
                      ]
                    ),
                    h(
                      Button,
                      {
                        key: 'submitbtn',
                        variant: postStatus === 'publish' ? 'primary' : 'secondary',
                        onClick: handleCreateDraft,
                        disabled: isCreatingDraft,
                        style: {
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          height: 'auto',
                        },
                      },
                      [
                        isCreatingDraft
                          ? h(Spinner, { key: 'sp' })
                          : h('span', {
                              key: 'icon',
                              className:
                                postStatus === 'publish'
                                  ? 'dashicons dashicons-yes'
                                  : postStatus === 'future'
                                  ? 'dashicons dashicons-calendar-alt'
                                  : 'dashicons dashicons-admin-post',
                            }),
                        isCreatingDraft
                          ? (generateImage ? t('savingWithImage') : t('saving'))
                          : postStatus === 'publish'
                          ? t('publishPost')
                          : postStatus === 'future'
                          ? t('schedulePost')
                          : t('saveDraftPost'),
                      ]
                    ),
                  ]
                ),
            ]),
          ]),
        ]
      ),
    ]);
  }

  // --- Bulk Generator Page ---
  function BulkGenerator({ t, lang }) {
    const [promptsInput, setPromptsInput] = useState('');
    const [provider, setProvider] = useState('gemini');
    const [model, setModel] = useState('gemini-1.5-flash');
    const [postStatus, setPostStatus] = useState('draft');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const lines = promptsInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (lines.length === 0) return;

      setLoading(true);
      setFeedback(null);

      try {
        const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
        const nonce = window.omniAiData?.nonce || '';

        const prompts = lines.map((l) => ({
          title: l,
          prompt: `Write a high quality, comprehensive blog post about: ${l}`,
        }));

        const res = await fetch(`${restUrl}bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
          body: JSON.stringify({ prompts, provider, model, post_status: postStatus, post_type: 'post' }),
        });

        const data = await res.json();
        if (data && data.success) {
          setFeedback({
            type: 'success',
            message: data.message || `Successfully enqueued ${lines.length} articles!`,
          });
          setPromptsInput('');
        } else {
          throw new Error(data?.message || 'Failed to enqueue bulk tasks.');
        }
      } catch (err) {
        setFeedback({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };

    return h('div', { style: { maxWidth: '800px' } }, [
      h(Card, null, [
        h(CardHeader, null, [
          h('strong', null, t('bulkTitle')),
          h('p', { style: { margin: '4px 0 0', fontSize: '13px', color: '#646970' } }, t('bulkDesc')),
        ]),
        h(CardBody, null, [
          feedback && h(Notice, { status: feedback.type, onDismiss: () => setFeedback(null) }, feedback.message),
          h('form', { onSubmit: handleSubmit }, [
            h(TextareaControl, {
              label: t('bulkInputLabel'),
              value: promptsInput,
              onChange: setPromptsInput,
              rows: 8,
              placeholder: "Future of Artificial Intelligence in 2026\nGetting Started with Tailwind CSS in WordPress\nBest Practices for Next.js 15 SEO",
              help: lines.length > 0 ? t('bulkInputHelp').replace('%d', lines.length) : '',
            }),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' } }, [
              h(SelectControl, {
                label: t('provider'),
                value: provider,
                options: [
                  { label: 'Google Gemini', value: 'gemini' },
                  { label: 'OpenAI', value: 'openai' },
                  { label: 'Anthropic Claude', value: 'claude' },
                ],
                onChange: (val) => {
                  setProvider(val);
                  if (val === 'gemini') setModel('gemini-1.5-flash');
                  if (val === 'openai') setModel('gpt-4o-mini');
                  if (val === 'claude') setModel('claude-3-5-sonnet-20241022');
                },
              }),
              h(SelectControl, {
                label: t('model'),
                value: model,
                options:
                  provider === 'gemini'
                    ? [
                        { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                        { label: 'Gemini 1.5 Flash (Latest)', value: 'gemini-1.5-flash-latest' },
                        { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
                        { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                      ]
                    : provider === 'openai'
                    ? [
                        { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                        { label: 'GPT-4o', value: 'gpt-4o' },
                      ]
                    : [
                        { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
                        { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
                      ],
                onChange: setModel,
              }),
              h(SelectControl, {
                label: t('bulkPostStatus'),
                value: postStatus,
                options: [
                  { label: t('statusDraft'), value: 'draft' },
                  { label: t('statusPending'), value: 'pending' },
                ],
                onChange: setPostStatus,
              }),
            ]),
            h(
              Button,
              {
                variant: 'primary',
                type: 'submit',
                disabled: loading || lines.length === 0,
              },
              loading ? [h(Spinner, { key: 'sp' }), t('queueingJobs')] : t('enqueueBulk').replace('%d', Math.max(1, lines.length))
            ),
          ]),
        ]),
      ]),
    ]);
  }

  // --- Logs History Page ---
  function LogsHistory({ t, lang }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [activeLog, setActiveLog] = useState(null);
    const [notice, setNotice] = useState(null);

    const loadLogs = async () => {
      setLoading(true);
      try {
        const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
        const nonce = window.omniAiData?.nonce || '';
        const res = await fetch(`${restUrl}logs?limit=50&_t=${Date.now()}`, {
          headers: { 'X-WP-Nonce': nonce, 'Cache-Control': 'no-cache' },
          cache: 'no-store',
        });
        const data = await res.json();
        setLogs(data?.logs || []);
        setTotalCount(data?.total || 0);
      } catch (e) {
        setNotice({ type: 'error', message: 'Failed to fetch logs.' });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadLogs();
    }, []);

    const handleDelete = async (id) => {
      if (!confirm('Delete this log?')) return;
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      await fetch(`${restUrl}logs/${id}`, { method: 'DELETE', headers: { 'X-WP-Nonce': nonce } });
      setLogs((prev) => prev.filter((l) => l.id !== id));
    };

    const handleClearAll = async () => {
      if (!confirm('Permanently delete ALL generation logs from custom table?')) return;
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      await fetch(`${restUrl}logs/clear`, { method: 'POST', headers: { 'X-WP-Nonce': nonce } });
      setLogs([]);
      setTotalCount(0);
    };

    return h('div', null, [
      notice && h(Notice, { status: notice.type, onDismiss: () => setNotice(null) }, notice.message),
      h(Card, null, [
        h(CardHeader, { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          h('strong', null, t('logsTitle') + ` (${totalCount})`),
          logs.length > 0 &&
            h(Button, { variant: 'tertiary', isDestructive: true, size: 'small', onClick: handleClearAll }, t('clearAllLogs')),
        ]),
        h(CardBody, null, [
          loading
            ? h('div', { style: { textAlign: 'center', padding: '30px' } }, h(Spinner))
            : logs.length === 0
            ? h('p', { style: { color: '#646970' } }, 'No logs found.')
            : h('div', { style: { overflowX: 'auto' } }, [
                h('table', { className: 'widefat striped', style: { border: 'none' } }, [
                  h('thead', null, [
                    h('tr', null, [
                      h('th', null, t('date')),
                      h('th', null, t('provider')),
                      h('th', null, t('model')),
                      h('th', null, t('promptPreview')),
                      h('th', { style: { textAlign: 'right' } }, 'Actions'),
                    ]),
                  ]),
                  h(
                    'tbody',
                    null,
                    logs.map((row) =>
                      h('tr', { key: row.id }, [
                        h('td', { style: { fontSize: '12px', whiteSpace: 'nowrap' } }, row.created_at),
                        h('td', null, h('strong', { style: { fontSize: '11px', textTransform: 'uppercase' } }, row.provider)),
                        h('td', { style: { fontSize: '12px' } }, row.model),
                        h('td', { style: { maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' } }, row.prompt),
                        h('td', { style: { textAlign: 'right', whiteSpace: 'nowrap' } }, [
                          h(Button, { variant: 'tertiary', size: 'small', onClick: () => setActiveLog(row), style: { marginInlineEnd: '6px' } }, t('view')),
                          h(Button, { variant: 'tertiary', isDestructive: true, size: 'small', onClick: () => handleDelete(row.id) }, t('delete')),
                        ]),
                      ])
                    )
                  ),
                ]),
              ]),
        ]),
      ]),

      activeLog &&
        h(
          Modal,
          {
            title: t('logsTitle'),
            onRequestClose: () => setActiveLog(null),
          },
          [
            h('p', { style: { fontSize: '12px', color: '#646970' } }, `${activeLog.provider} / ${activeLog.model} • ${activeLog.created_at}`),
            h('label', { style: { fontWeight: 600, display: 'block', margin: '8px 0 4px' } }, t('prompt')),
            h('div', { style: { background: '#f0f0f1', padding: '10px', borderRadius: '4px', fontSize: '13px' } }, activeLog.prompt),
            h('label', { style: { fontWeight: 600, display: 'block', margin: '14px 0 4px' } }, t('response')),
            h(
              'div',
              {
                style: {
                  background: '#f6f7f7',
                  border: '1px solid #dcdcde',
                  padding: '12px',
                  borderRadius: '4px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontSize: '13px',
                },
              },
              activeLog.response
            ),
            h('div', { style: { marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' } }, [
              h(
                Button,
                {
                  variant: 'secondary',
                  onClick: () => navigator.clipboard.writeText(activeLog.response),
                },
                t('copyResponse')
              ),
              h(Button, { variant: 'primary', onClick: () => setActiveLog(null) }, t('close')),
            ]),
          ]
        ),
    ]);
  }

  // --- Modules Manager Page ---
  function ModulesManager({ t, lang }) {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [notice, setNotice] = useState(null);

    const loadModules = async () => {
      try {
        const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
        const nonce = window.omniAiData?.nonce || '';
        const res = await fetch(`${restUrl}modules`, { headers: { 'X-WP-Nonce': nonce } });
        const data = await res.json();
        setModules(data?.modules || []);
      } catch (e) {
        setNotice({ type: 'error', message: 'Failed to load modules.' });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadModules();
    }, []);

    const handleToggle = async (id, currentState) => {
      setUpdatingId(id);
      setNotice(null);
      const newState = !currentState;
      try {
        const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
        const nonce = window.omniAiData?.nonce || '';
        const res = await fetch(`${restUrl}modules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
          body: JSON.stringify({ module_id: id, active: newState }),
        });
        const data = await res.json();
        if (data?.success) {
          setModules(data.modules || []);
          setNotice({
            type: 'success',
            message: newState
              ? t('moduleEnabled').replace('%s', id)
              : t('moduleDisabled').replace('%s', id),
          });
        }
      } catch (e) {
        setNotice({ type: 'error', message: e.message });
      } finally {
        setUpdatingId(null);
      }
    };

    return h('div', { style: { maxWidth: '850px' } }, [
      notice && h(Notice, { status: notice.type, onDismiss: () => setNotice(null) }, notice.message),
      h(Card, null, [
        h(CardHeader, null, [
          h('strong', null, t('modulesTitle')),
          h('p', { style: { margin: '4px 0 0', fontSize: '13px', color: '#646970' } }, t('modulesDesc')),
        ]),
        h(CardBody, null, [
          loading
            ? h('div', { style: { textAlign: 'center', padding: '30px' } }, h(Spinner))
            : h(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
                modules.map((m) => {
                  const faMap = {
                    content_generator: {
                      title: 'استودیو تولید محتوا (هسته اصلی)',
                      desc: 'تولید زنده مقالات، تیترها و توضیحات متا با استریم آنی SSE.',
                    },
                    gutenberg: {
                      title: 'ادغام با ویرایشگر گوتنبرگ (Gutenberg)',
                      desc: 'بلوک اختصاصی هوش مصنوعی داخل ویرایشگر گوتنبرگ وردپرس.',
                    },
                    elementor: {
                      title: 'ویجت اختصاصی المنتور (Elementor)',
                      desc: 'ابزارک هوشمند تولید محتوا مستقیماً در پنل طراحی المنتور.',
                    },
                    woocommerce: {
                      title: 'تولید محتوای فروشگاهی ووکامرس',
                      desc: 'تولید هوشمند توضیحات محصول، چکیده و ویژگی‌های سئو ووکامرس.',
                    },
                    chatbot: {
                      title: 'چت‌بات هوشمند تعاملی',
                      desc: 'دستیار شناور هوش مصنوعی برای پاسخ‌گویی به سوالات کاربران بر اساس سایت.',
                    },
                    bulk_generator: {
                      title: 'تولید انبوه مقالات (Bulk Generator)',
                      desc: 'تولید دسته‌ای نوشته‌ها در صف پس‌زمینه با Action Scheduler بدون تایم‌اوت.',
                    },
                  };
                  const displayTitle = (lang === 'fa' && faMap[m.id]?.title) ? faMap[m.id].title : m.title;
                  const displayDesc = (lang === 'fa' && faMap[m.id]?.desc) ? faMap[m.id].desc : m.description;

                  return h('div', { key: m.id, className: 'omni-ai-module-card' }, [
                    h('div', { key: 'i', className: 'omni-ai-module-info' }, [
                      h('h4', null, displayTitle),
                      h('p', null, displayDesc),
                      h('span', { style: { fontSize: '11px', color: '#8c8f94', fontFamily: 'monospace' } }, `ID: ${m.id}`),
                    ]),
                    h('div', { key: 't', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
                      updatingId === m.id && h(Spinner, { key: 'sp' }),
                      h(ToggleControl, {
                        key: 'tg',
                        checked: m.active,
                        onChange: () => handleToggle(m.id, m.active),
                        disabled: updatingId === m.id,
                      }),
                    ]),
                  ]);
                })
              ),
        ]),
      ]),
    ]);
  }

  // --- API Settings Page (BYOK) ---
  function ApiSettings({ onSettingsUpdated, t, lang }) {
    const [settings, setSettings] = useState({
      default_provider: 'gemini',
      fallback_provider: 'none',
      default_image_provider: 'pollinations',
      gemini_api_key: '',
      gemini_model: 'gemini-1.5-flash',
      openai_api_key: '',
      openai_model: 'gpt-4o-mini',
      claude_api_key: '',
      claude_model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      max_tokens: 2000,
    });
    const [masked, setMasked] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);

    const loadSettings = async () => {
      try {
        const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
        const nonce = window.omniAiData?.nonce || '';
        const res = await fetch(`${restUrl}settings`, { headers: { 'X-WP-Nonce': nonce } });
        const data = await res.json();
        if (data && data.settings) {
          setSettings((prev) => ({
            ...prev,
            default_provider: data.settings.default_provider || 'gemini',
            fallback_provider: data.settings.fallback_provider || 'none',
            default_image_provider: data.settings.default_image_provider || 'pollinations',
            gemini_model: data.settings.gemini_model || 'gemini-1.5-flash',
            openai_model: data.settings.openai_model || 'gpt-4o-mini',
            claude_model: data.settings.claude_model || 'claude-3-5-sonnet-20241022',
            temperature: parseFloat(data.settings.temperature) || 0.7,
            max_tokens: parseInt(data.settings.max_tokens, 10) || 2000,
          }));
          setMasked({
            gemini_configured: !!data.settings.gemini_api_key_configured,
            gemini_masked: data.settings.gemini_api_key_masked || '',
            gemini_source: data.settings.gemini_source || 'none',
            openai_configured: !!data.settings.openai_api_key_configured,
            openai_masked: data.settings.openai_api_key_masked || '',
            openai_source: data.settings.openai_source || 'none',
            claude_configured: !!data.settings.claude_api_key_configured,
            claude_masked: data.settings.claude_api_key_masked || '',
            claude_source: data.settings.claude_source || 'none',
          });
        }
      } catch (e) {
        setNotice({ type: 'error', message: 'Failed to load settings.' });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadSettings();
    }, []);

    const handleSave = async (e) => {
      e.preventDefault();
      setSaving(true);
      setNotice(null);

      try {
        const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
        const nonce = window.omniAiData?.nonce || '';
        const payload = { ...settings };
        if (!payload.gemini_api_key.trim()) delete payload.gemini_api_key;
        if (!payload.openai_api_key.trim()) delete payload.openai_api_key;
        if (!payload.claude_api_key.trim()) delete payload.claude_api_key;

        const res = await fetch(`${restUrl}settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data && data.success) {
          setNotice({ type: 'success', message: t('settingsSaved') });
          loadSettings();
          if (onSettingsUpdated) onSettingsUpdated(payload);
        }
      } catch (err) {
        setNotice({ type: 'error', message: err.message });
      } finally {
        setSaving(false);
      }
    };

    if (loading) {
      return h('div', { style: { textAlign: 'center', padding: '30px' } }, h(Spinner));
    }

    return h('div', { style: { maxWidth: '850px' } }, [
      notice && h(Notice, { status: notice.type, onDismiss: () => setNotice(null) }, notice.message),
      h('form', { onSubmit: handleSave }, [
        h(Card, { style: { marginBottom: '20px' } }, [
          h(CardHeader, null, [
            h('strong', null, t('providerPriorityTitle')),
            h('p', { style: { margin: '4px 0 0', fontSize: '13px', color: '#646970' } }, t('providerPriorityDesc')),
          ]),
          h(CardBody, null, [
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' } }, [
              h(SelectControl, {
                label: t('primaryProvider'),
                value: settings.default_provider,
                options: [
                  { label: 'Google Gemini', value: 'gemini' },
                  { label: 'OpenAI (GPT-4o)', value: 'openai' },
                  { label: 'Anthropic Claude', value: 'claude' },
                ],
                onChange: (v) => setSettings({ ...settings, default_provider: v }),
              }),
              h(SelectControl, {
                label: t('fallbackProvider'),
                value: settings.fallback_provider,
                options: [
                  { label: t('noneOption'), value: 'none' },
                  { label: 'Google Gemini', value: 'gemini' },
                  { label: 'OpenAI (GPT-4o)', value: 'openai' },
                  { label: 'Anthropic Claude', value: 'claude' },
                ],
                onChange: (v) => setSettings({ ...settings, fallback_provider: v }),
              }),
            ]),
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } }, [
              h(SelectControl, {
                label: t('defaultImageModel'),
                value: settings.default_image_provider,
                options: [
                  { label: t('providerPollinations'), value: 'pollinations' },
                  { label: t('providerDalle'), value: 'dall-e' },
                ],
                onChange: (v) => setSettings({ ...settings, default_image_provider: v }),
              }),
              h(RangeControl, {
                label: t('temperature'),
                value: settings.temperature,
                onChange: (v) => setSettings({ ...settings, temperature: v }),
                min: 0,
                max: 1,
                step: 0.1,
              }),
            ]),
          ]),
        ]),

        h(Card, { style: { marginBottom: '20px' } }, [
          h(CardHeader, null, [
            h('strong', null, t('byokTitle')),
            h('p', { style: { margin: '4px 0 0', fontSize: '13px', color: '#646970' } }, t('byokDesc')),
          ]),
          h(CardBody, null, [
            // Gemini
            h('div', { style: { paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid #f0f0f1' } }, [
              h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' } }, [
                h('strong', null, 'Google Gemini'),
                h(
                  'span',
                  {
                    style: {
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: masked.gemini_configured ? '#e7f5ec' : '#fff8e5',
                      color: masked.gemini_configured ? '#1a7f37' : '#9a6700',
                    },
                  },
                  masked.gemini_source === 'connector'
                    ? t('connectedCore')
                    : masked.gemini_configured
                    ? t('configured')
                    : t('notSet')
                ),
              ]),
              h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px' } }, [
                h(TextControl, {
                  label: t('apiKey'),
                  type: 'password',
                  value: settings.gemini_api_key,
                  onChange: (v) => setSettings({ ...settings, gemini_api_key: v }),
                  placeholder: masked.gemini_masked || 'AIzaSy...',
                  help:
                    masked.gemini_source === 'connector'
                      ? t('inheritedHelp')
                      : 'Google AI Studio (aistudio.google.com)',
                }),
                h(SelectControl, {
                  label: t('model'),
                  value: settings.gemini_model,
                  options: [
                    { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                    { label: 'Gemini 1.5 Flash (Latest)', value: 'gemini-1.5-flash-latest' },
                    { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
                    { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                  ],
                  onChange: (v) => setSettings({ ...settings, gemini_model: v }),
                }),
              ]),
            ]),

            // OpenAI
            h('div', { style: { paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid #f0f0f1' } }, [
              h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' } }, [
                h('strong', null, 'OpenAI'),
                h('span', { style: { fontSize: '11px', color: masked.openai_configured ? '#1a7f37' : '#9a6700' } }, masked.openai_configured ? t('configured') : t('notSet')),
              ]),
              h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px' } }, [
                h(TextControl, {
                  label: t('apiKey'),
                  type: 'password',
                  value: settings.openai_api_key,
                  onChange: (v) => setSettings({ ...settings, openai_api_key: v }),
                  placeholder: masked.openai_masked || 'sk-proj-...',
                  help: 'platform.openai.com',
                }),
                h(SelectControl, {
                  label: t('model'),
                  value: settings.openai_model,
                  options: [
                    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                    { label: 'GPT-4o', value: 'gpt-4o' },
                  ],
                  onChange: (v) => setSettings({ ...settings, openai_model: v }),
                }),
              ]),
            ]),

            // Claude
            h('div', null, [
              h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' } }, [
                h('strong', null, 'Anthropic Claude'),
                h('span', { style: { fontSize: '11px', color: masked.claude_configured ? '#1a7f37' : '#9a6700' } }, masked.claude_configured ? t('configured') : t('notSet')),
              ]),
              h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px' } }, [
                h(TextControl, {
                  label: t('apiKey'),
                  type: 'password',
                  value: settings.claude_api_key,
                  onChange: (v) => setSettings({ ...settings, claude_api_key: v }),
                  placeholder: masked.claude_masked || 'sk-ant-...',
                  help: 'console.anthropic.com',
                }),
                h(SelectControl, {
                  label: t('model'),
                  value: settings.claude_model,
                  options: [
                    { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
                    { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
                  ],
                  onChange: (v) => setSettings({ ...settings, claude_model: v }),
                }),
              ]),
            ]),
          ]),
        ]),

        h(Button, { variant: 'primary', type: 'submit', disabled: saving }, saving ? [h(Spinner, { key: 'sp' }), t('saving')] : t('saveSettings')),
      ]),
    ]);
  }

  // --- Main App Container with Native Tabs ---
  function App() {
    const defaultLang = window.omniAiData?.defaultLang || 'fa';
    const [lang, setLang] = useState(() => {
      return localStorage.getItem('omni_ai_lang') || defaultLang;
    });

    const { t, isRtl } = useTranslation(lang);

    const getTabFromHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const valid = ['dashboard', 'studio', 'bulk', 'logs', 'modules', 'settings'];
      return valid.includes(hash) ? hash : 'dashboard';
    };

    const [activeTab, setActiveTab] = useState(getTabFromHash);
    const [activeProvider, setActiveProvider] = useState('gemini');
    const [isConfigured, setIsConfigured] = useState(true);

    useEffect(() => {
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      fetch(`${restUrl}settings`, { headers: { 'X-WP-Nonce': nonce } })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.settings) {
            if (data.settings.default_provider) {
              setActiveProvider(data.settings.default_provider);
            }
            const hasKey =
              !!data.settings.gemini_api_key_configured ||
              !!data.settings.openai_api_key_configured ||
              !!data.settings.claude_api_key_configured;
            setIsConfigured(hasKey);
          }
        })
        .catch(() => {});
    }, []);

    // Listen to hash changes (e.g. browser back/forward or sidebar links)
    useEffect(() => {
      const handleHash = () => {
        const next = getTabFromHash();
        setActiveTab(next);
      };
      window.addEventListener('hashchange', handleHash);
      return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    useEffect(() => {
      const wrap = document.querySelector('.omni-ai-admin-wrap');
      if (wrap) {
        if (isRtl) {
          wrap.classList.add('is-rtl');
          wrap.setAttribute('dir', 'rtl');
        } else {
          wrap.classList.remove('is-rtl');
          wrap.setAttribute('dir', 'ltr');
        }
      }
    }, [isRtl]);

    const handleLangChange = (newLang) => {
      setLang(newLang);
      localStorage.setItem('omni_ai_lang', newLang);
    };

    const handleSelectTab = (tabName) => {
      const cleanName = typeof tabName === 'string' ? tabName : (tabName?.name || 'dashboard');
      setActiveTab(cleanName);
      window.location.hash = `#/${cleanName}`;
    };

    const tabs = [
      { id: 'dashboard', label: t('tabDashboard') },
      { id: 'studio', label: t('tabStudio') },
      { id: 'bulk', label: t('tabBulk') },
      { id: 'logs', label: t('tabLogs') },
      { id: 'modules', label: t('tabModules') },
      { id: 'settings', label: t('tabSettings') },
    ];

    return h('div', null, [
      h(Header, {
        key: 'hdr',
        configured: isConfigured,
        activeProvider,
        lang,
        onLangChange: handleLangChange,
        t,
      }),

      // Native, 100% Reliable WordPress Nav Tabs (Eliminates TabPanel runtime crashes)
      h(
        'nav',
        {
          key: 'nav-tabs',
          className: 'nav-tab-wrapper wp-clearfix',
          style: { marginBottom: '20px', borderBottom: '1px solid #c3c4c7' },
        },
        tabs.map((tab) =>
          h(
            'a',
            {
              key: tab.id,
              href: `#/${tab.id}`,
              className: `nav-tab ${activeTab === tab.id ? 'nav-tab-active' : ''}`,
              onClick: (e) => {
                e.preventDefault();
                handleSelectTab(tab.id);
              },
              style: {
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '400',
              },
            },
            tab.label
          )
        )
      ),

      // Controlled Tab Content Rendering protected by ErrorBoundary
      h(
        'div',
        {
          key: 'tab-content-wrap',
          style: {
            background: '#ffffff',
            border: '1px solid #c3c4c7',
            borderRadius: '4px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          },
        },
        [
          activeTab === 'dashboard' && h(Dashboard, { key: 't-dash', onNavigate: handleSelectTab, t, lang }),
          activeTab === 'studio' && h(ContentStudio, { key: 't-studio', t, lang }),
          activeTab === 'bulk' && h(BulkGenerator, { key: 't-bulk', t, lang }),
          activeTab === 'logs' && h(LogsHistory, { key: 't-logs', t, lang }),
          activeTab === 'modules' && h(ModulesManager, { key: 't-modules', t, lang }),
          activeTab === 'settings' &&
            h(ApiSettings, {
              key: 't-settings',
              t,
              lang,
              onSettingsUpdated: (s) => {
                if (s && s.default_provider) setActiveProvider(s.default_provider);
              },
            }),
        ]
      ),
    ]);
  }

  // --- Mounting with ErrorBoundary ---
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('omni-ai-admin-root');
    if (!container) return;

    const rootElement = h(ErrorBoundary, null, h(App));

    if (createRoot) {
      const root = createRoot(container);
      root.render(rootElement);
    } else if (render) {
      render(rootElement, container);
    }
  });
})(window.wp);
