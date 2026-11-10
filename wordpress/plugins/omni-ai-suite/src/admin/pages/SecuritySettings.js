import { createElement, useState, useEffect } from '@wordpress/element';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  ToggleControl,
  TextareaControl,
  TextControl,
  SelectControl,
  Notice,
  Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../utils/api';

// Intelligent Knowledge Base for Namespaces & Recommendations
const NAMESPACE_INFO = {
  'omni-ai/v1': {
    title: 'افزونه Omni AI Suite',
    desc: 'اندپوینت‌های ارتباطی همین افزونه جهت ایجاد مقاله، سئو و تنظیمات.',
    badgeText: '🟢 ضروری (هرگز مسدود نکنید)',
    badgeBg: '#def7ec',
    badgeColor: '#03543f',
  },
  'wp-block-editor/v1': {
    title: 'ویرایشگر بلوک گوتنبرگ',
    desc: 'ارتباطات پیشخوان وردپرس برای ویرایشگر گوتنبرگ (نیاز برای نوشتن مقالات).',
    badgeText: '🟢 ضروری برای پیشخوان',
    badgeBg: '#def7ec',
    badgeColor: '#03543f',
  },
  'wp-site-health/v1': {
    title: 'ابزار سلامت سایت وردپرس',
    desc: 'بررسی وضعیت سرور و سلامت افزونه‌ها در مدیریت وردپرس.',
    badgeText: '🟢 ضروری برای پیشخوان',
    badgeBg: '#def7ec',
    badgeColor: '#03543f',
  },
  'rankmath/v1': {
    title: 'افزونه سئو Rank Math',
    desc: 'تحلیل‌های سئو، متادیتا و اسکیما که توسط رنک‌مث استفاده می‌شود.',
    badgeText: '🟡 افزونه سئو (پیشنهاد: فقط اعضا)',
    badgeBg: '#fef08a',
    badgeColor: '#854d0e',
  },
  'wp/v2': {
    title: 'هسته محتوایی وردپرس',
    desc: 'پست‌ها، برگه ها، رسانه‌ها و کاربران. (بخش کاربران حساس است).',
    badgeText: '⚡ هسته وردپرس (روابط عمومی/حساس)',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
  },
  'oembed/1.0': {
    title: 'جاسازی رسانه‌ها (oEmbed)',
    desc: 'جاسازی خودکار ویدیوها، صوت‌ها و لینک‌ها از سایت‌های دیگر.',
    badgeText: '⚪ عمومی (اختیاری)',
    badgeBg: '#f3f4f6',
    badgeColor: '#374151',
  },
  'batch/v1': {
    title: 'درخواست‌های دسته‌ای وردپرس',
    desc: 'پردازش هم‌زمان چند درخواست در یک فراخوانی شبکه.',
    badgeText: '⚪ عمومی (اختیاری)',
    badgeBg: '#f3f4f6',
    badgeColor: '#374151',
  },
  'core-root': {
    title: 'ریشه اصلی REST API (ایندکس کل اندپوینت‌ها)',
    desc: 'مسیر ریشه اصلی REST API که در مرورگر باز می‌شود و کل اندپوینت‌ها را لیست می‌کند.',
    badgeText: '🛡️ ایندکس اصلی REST API',
    badgeBg: '#fef3c7',
    badgeColor: '#92400e',
  },
  'wp-abilities/v1': {
    title: 'امکانات افزونه‌های نصب‌شده',
    desc: 'اندپوینت‌های مربوط به قابلیت‌های افزونه‌های روی سایت شما.',
    badgeText: '⚪ افزونه‌های جانبی (اختیاری)',
    badgeBg: '#f3f4f6',
    badgeColor: '#374151',
  },
  'ai/v1': {
    title: 'سرویس‌های هوش مصنوعی متفرقه',
    desc: 'اندپوینت‌های مربوط به قابلیت‌های AI روی سایت.',
    badgeText: '⚪ اختیاری',
    badgeBg: '#f3f4f6',
    badgeColor: '#374151',
  },
};

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [clientIp, setClientIp] = useState('');
  const [urlPrefix, setUrlPrefix] = useState('wp-json');
  const [siteUrl, setSiteUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // General Security Settings
  const [settings, setSettings] = useState({
    disable_xmlrpc: true,
    block_user_enumeration: true,
    hide_wp_version: true,
    disable_file_edit: false,
    security_headers: true,
    require_rest_auth: false,
    global_ip_whitelist: '',
    enable_hide_login: false,
    custom_login_slug: '',
    hide_login_redirect_slug: '404',
    hide_login_recovery_key: '',
    routes_config: {},
  });

  // REST API Routes List
  const [routes, setRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('all');

  // Load settings & routes on mount
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [settingsRes, routesRes] = await Promise.all([
          apiFetch('security/settings'),
          apiFetch('security/routes'),
        ]);

        const settingsData = await settingsRes.json();
        const routesData = await routesRes.json();

        if (isMounted) {
          if (settingsData && settingsData.settings) {
            setSettings(settingsData.settings);
            if (settingsData.client_ip) setClientIp(settingsData.client_ip);
            if (settingsData.site_url) setSiteUrl(settingsData.site_url);
          }
          if (routesData && Array.isArray(routesData.routes)) {
            setRoutes(routesData.routes);
            if (routesData.client_ip) setClientIp(routesData.client_ip);
            if (routesData.url_prefix) setUrlPrefix(routesData.url_prefix);
          }
        }
      } catch (err) {
        if (isMounted) {
          setNotice({
            type: 'error',
            text: __('خطا در دریافت اطلاعات امنیتی و لیست اندپوینت‌ها.', 'omni-ai-suite'),
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await apiFetch('security/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();
      if (data && data.success) {
        setNotice({
          type: 'success',
          text: data.message || __('تنظیمات امنیتی و REST API با موفقیت ذخیره شد.', 'omni-ai-suite'),
        });
      } else {
        throw new Error(data?.message || __('خطا در ذخیره تنظیمات.', 'omni-ai-suite'));
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err?.message || __('خطای غیرمنتظره هنگام ذخیره تنظیمات.', 'omni-ai-suite'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRouteDisabled = (route) => {
    const prevCfg = settings.routes_config?.[route] || {};
    const updated = {
      ...settings,
      routes_config: {
        ...(settings.routes_config || {}),
        [route]: {
          ...prevCfg,
          disabled: !prevCfg.disabled,
        },
      },
    };
    setSettings(updated);
  };

  const handleToggleRouteAuth = (route) => {
    const prevCfg = settings.routes_config?.[route] || {};
    const updated = {
      ...settings,
      routes_config: {
        ...(settings.routes_config || {}),
        [route]: {
          ...prevCfg,
          require_auth: !prevCfg.require_auth,
        },
      },
    };
    setSettings(updated);
  };

  const handleRouteChangeIp = (route, val) => {
    const prevCfg = settings.routes_config?.[route] || {};
    const updated = {
      ...settings,
      routes_config: {
        ...(settings.routes_config || {}),
        [route]: {
          ...prevCfg,
          ip_whitelist: val,
        },
      },
    };
    setSettings(updated);
  };

  // Group / Batch Actions for currently filtered routes
  const handleBatchAction = (action) => {
    const updatedRoutesConfig = { ...(settings.routes_config || {}) };
    let changedCount = 0;

    filteredRoutes.forEach((r) => {
      // Protect omni-ai from accidental mass disabling
      if (action === 'disable' && r.namespace === 'omni-ai/v1') {
        return;
      }

      const prev = updatedRoutesConfig[r.route] || {};
      if (action === 'disable') {
        updatedRoutesConfig[r.route] = { ...prev, disabled: true };
        changedCount++;
      } else if (action === 'enable') {
        updatedRoutesConfig[r.route] = { ...prev, disabled: false };
        changedCount++;
      } else if (action === 'require_auth') {
        updatedRoutesConfig[r.route] = { ...prev, require_auth: true };
        changedCount++;
      } else if (action === 'public') {
        updatedRoutesConfig[r.route] = { ...prev, require_auth: false };
        changedCount++;
      }
    });

    setSettings({
      ...settings,
      routes_config: updatedRoutesConfig,
    });

    setNotice({
      type: 'info',
      text: `عملیات گروهی روی ${changedCount} اندپوینت اعمال شد. جهت نهایی‌سازی دکمه «ذخیره تغییرات» را بزنید.`,
    });
  };

  // Extract unique namespaces for filtering
  const namespaces = ['all', ...new Set(routes.map((r) => r.namespace))];

  // Filtered routes list
  const filteredRoutes = routes.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.route.toLowerCase().includes(q) ||
      (r.display_route && r.display_route.toLowerCase().includes(q)) ||
      r.namespace.toLowerCase().includes(q) ||
      (r.is_root && (q.includes('wp-json') || q.includes('json') || q.includes('root')));
    const matchesNs = selectedNamespace === 'all' || r.namespace === selectedNamespace;
    return matchesSearch && matchesNs;
  });

  // Helper to determine route security badge and advice
  const getRouteAdvice = (r) => {
    if (r.is_root || r.route === '/') {
      return {
        badgeText: `🛡️ ایندکس اصلی (/${urlPrefix})`,
        badgeBg: '#fef3c7',
        badgeColor: '#92400e',
        advice: `ریشه اصلی REST API (همان /${urlPrefix} یا wp-json). بستن آن مانع اسکن و مشاهده لیست کامل اندپوینت‌های سایت می‌شود.`,
      };
    }
    if (r.route.startsWith('/omni-ai/v1/')) {
      return {
        badgeText: '🟢 ضروری (افزونه فعلی)',
        badgeBg: '#def7ec',
        badgeColor: '#03543f',
        advice: 'برای ایجاد مقاله و کارکرد این پنل الزامی است.',
      };
    }
    if (r.route.includes('/users')) {
      return {
        badgeText: '🔴 بسیار حساس (اطلاعات کاربران)',
        badgeBg: '#fee2e2',
        badgeColor: '#991b1b',
        advice: 'پیشنهاد: حتماً مسدود یا روی (فقط کاربران) تنظیم شود.',
      };
    }
    if (r.route.includes('/settings')) {
      return {
        badgeText: '🔴 حساس (تنظیمات سایت)',
        badgeBg: '#fee2e2',
        badgeColor: '#991b1b',
        advice: 'پیشنهاد: فقط برای اعضای سایت باز باشد.',
      };
    }
    if (r.namespace === 'wp-block-editor/v1' || r.namespace === 'wp-site-health/v1') {
      return {
        badgeText: '🟢 ضروری برای پیشخوان',
        badgeBg: '#def7ec',
        badgeColor: '#03543f',
        advice: 'برای ابزارهای مدیریت وردپرس مورد نیاز است.',
      };
    }
    if (r.namespace === 'rankmath/v1') {
      return {
        badgeText: '🟡 سئو (اختیاری برای عموم)',
        badgeBg: '#fef08a',
        badgeColor: '#854d0e',
        advice: 'می‌توانید برای کاربران عادی ببندید و برای اعضا باز بگذارید.',
      };
    }

    const nsInfo = NAMESPACE_INFO[r.namespace];
    if (nsInfo) {
      return {
        badgeText: nsInfo.badgeText,
        badgeBg: nsInfo.badgeBg,
        badgeColor: nsInfo.badgeColor,
        advice: nsInfo.desc,
      };
    }

    return {
      badgeText: '⚪ عمومی / افزونه',
      badgeBg: '#f3f4f6',
      badgeColor: '#4b5563',
      advice: 'در صورت عدم استفاده، مسدودسازی آن مشکلی ایجاد نمی‌کند.',
    };
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spinner />
        <p style={{ marginTop: '10px', color: '#50575e' }}>{__('در حال بارگذاری لیست REST API و تنظیمات امنیتی...', 'omni-ai-suite')}</p>
      </div>
    );
  }

  const currentNsInfo = selectedNamespace !== 'all' ? NAMESPACE_INFO[selectedNamespace] : null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', direction: 'rtl' }}>
      {/* Top Banner Notice */}
      {Boolean(notice) ? (
        <div style={{ marginBottom: '16px' }}>
          <Notice status={notice?.type || 'info'} isDismissible onDismiss={() => setNotice(null)}>
            {notice?.text}
          </Notice>
        </div>
      ) : null}

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 600, color: '#1d2327' }}>
            🛡️ امنیت پیشرفته وردپرس و کنترل REST API
          </h2>
          <span style={{ fontSize: '13px', color: '#646970' }}>
            آی‌پی فعلی شما: <strong style={{ color: '#2271b1', fontFamily: 'monospace' }}>{clientIp || '127.0.0.1'}</strong>
          </span>
        </div>

        <Button
          variant="primary"
          onClick={handleSaveAll}
          disabled={saving}
          style={{ minWidth: '170px', height: '40px', fontWeight: 600, fontSize: '14px' }}
        >
          {saving ? 'در حال ذخیره...' : '💾 ذخیره تمامی تنظیمات'}
        </Button>
      </div>

      {/* Section 1: WordPress Hardening (General Security) */}
      <Card style={{ marginBottom: '24px', borderRight: '4px solid #2271b1' }}>
        <CardHeader>
          <strong style={{ fontSize: '15px' }}>🔒 ۱. امن‌سازی هسته وردپرس (WordPress Hardening)</strong>
        </CardHeader>
        <CardBody style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div>
              <ToggleControl
                label={__('مسدودسازی نشت نام‌های کاربری (Anti-Username Enumeration)', 'omni-ai-suite')}
                help={__('مسدود کردن دسترسی کاربران مهمان به /wp/v2/users و ریدایرکت درخواست‌های author=1 جهت جلوگیری از کشف نام کاربری ادمین.', 'omni-ai-suite')}
                checked={settings.block_user_enumeration}
                onChange={(val) => setSettings({ ...settings, block_user_enumeration: val })}
              />
            </div>

            <div>
              <ToggleControl
                label={__('غیرفعال‌سازی کامل XML-RPC (xmlrpc.php)', 'omni-ai-suite')}
                help={__('جلوگیری از حملات بروت‌فورس و DDoS از طریق پروتکل قدیمی XML-RPC.', 'omni-ai-suite')}
                checked={settings.disable_xmlrpc}
                onChange={(val) => setSettings({ ...settings, disable_xmlrpc: val })}
              />
            </div>

            <div>
              <ToggleControl
                label={__('مخفی‌سازی نسخه وردپرس (Hide WP Version)', 'omni-ai-suite')}
                help={__('حذف تگ ورژن وردپرس از سورس HTML، فید RSS و فایل‌های CSS/JS.', 'omni-ai-suite')}
                checked={settings.hide_wp_version}
                onChange={(val) => setSettings({ ...settings, hide_wp_version: val })}
              />
            </div>

            <div>
              <ToggleControl
                label={__('غیرفعال‌سازی ویرایشگر فایل در پیشخوان (DISALLOW_FILE_EDIT)', 'omni-ai-suite')}
                help={__('بستن ویرایشگر فایل‌های پوسته و افزونه در پنل ادمین وردپرس جهت جلوگیری از تزریق کد در صورت هک پیشخوان.', 'omni-ai-suite')}
                checked={settings.disable_file_edit}
                onChange={(val) => setSettings({ ...settings, disable_file_edit: val })}
              />
            </div>

            <div>
              <ToggleControl
                label={__('فعال‌سازی هدرهای امنیتی (Security Headers)', 'omni-ai-suite')}
                help={__('افزودن خودکار هدرهای X-Frame-Options (ضد کلیک‌دزدی)، X-Content-Type-Options و X-XSS-Protection.', 'omni-ai-suite')}
                checked={settings.security_headers}
                onChange={(val) => setSettings({ ...settings, security_headers: val })}
              />
            </div>

            <div>
              <ToggleControl
                label={__('قفل کردن عمومی REST API برای کاربران ناشناس', 'omni-ai-suite')}
                help={__('الزام ورود به حساب برای دسترسی به تمامی اندپوینت‌های REST API سایت.', 'omni-ai-suite')}
                checked={settings.require_rest_auth}
                onChange={(val) => setSettings({ ...settings, require_rest_auth: val })}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid #dcdcde', paddingTop: '16px' }}>
            <TextareaControl
              label={__('🌐 لیست سفید آی‌پی سراسری (Global IP Whitelist):', 'omni-ai-suite')}
              help={__('آی‌پی‌های مجاز را با کاما یا خط جدید جدا کنید. این آی‌پی‌ها از تمامی محدودیت‌های REST معاف خواهند بود. (آی‌پی فعلی شما: ' + (clientIp || '127.0.0.1') + ')', 'omni-ai-suite')}
              placeholder={'192.168.1.1\n10.0.0.0/24'}
              value={settings.global_ip_whitelist || ''}
              onChange={(val) => setSettings({ ...settings, global_ip_whitelist: val })}
              rows={3}
              style={{ fontFamily: 'monospace', direction: 'ltr' }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Section 2: Hide & Customize WordPress Login URL */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong style={{ fontSize: '15px' }}>
                🔐 ۲. مخفی‌سازی و تغییر آدرس ورود به وردپرس (Hide Login URL)
              </strong>
              {settings.enable_hide_login && (
                <span style={{ fontSize: '12px', color: '#008a20', marginInlineStart: '10px', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  فعال - ورود امن فعال است
                </span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: '#646970' }}>
              مسدودسازی کامل حملات Brute Force با تغییر آدرس wp-login.php به مسیر دلخواه
            </span>
          </div>
        </CardHeader>
        <CardBody style={{ padding: '20px' }}>
          <ToggleControl
            label={__('فعال‌سازی تغییر آدرس پیش‌فرض صفحه ورود (wp-login.php)', 'omni-ai-suite')}
            help={__('با فعال‌سازی این قابلیت، دسترسی مستقیم به wp-login.php و wp-admin برای کاربران غیروارد مسدود می‌شود و تنها از طریق آدرس دلخواه زیر قابل دسترس خواهد بود.', 'omni-ai-suite')}
            checked={!!settings.enable_hide_login}
            onChange={(val) => setSettings({ ...settings, enable_hide_login: val })}
          />

          {settings.enable_hide_login && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <TextControl
                    label={__('نامک ورود اختصاصی (Login Slug):', 'omni-ai-suite')}
                    help={__('تنها از حروف انگلیسی، اعداد و خط تیره (-) استفاده کنید. (مثال: secret-entrance یا my-panel)', 'omni-ai-suite')}
                    placeholder="my-secret-login"
                    value={settings.custom_login_slug || ''}
                    onChange={(val) => {
                      const clean = val.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                      setSettings({ ...settings, custom_login_slug: clean });
                    }}
                  />
                </div>

                <div>
                  <SelectControl
                    label={__('رفتار در برابر تلاش برای باز کردن wp-login.php:', 'omni-ai-suite')}
                    help={__('در صورت تلاش هکرها یا ربات‌ها برای ورود از آدرس پیش‌فرض چه پاسخی داده شود؟', 'omni-ai-suite')}
                    value={settings.hide_login_redirect_slug || '404'}
                    options={[
                      { label: __('نمایش خطای ۴۰۴ (صفحه پیدا نشد - بالاترین امنیت)', 'omni-ai-suite'), value: '404' },
                      { label: __('هدایت خودکار به صفحه اصلی سایت (Redirect to Home)', 'omni-ai-suite'), value: 'home' },
                    ]}
                    onChange={(val) => setSettings({ ...settings, hide_login_redirect_slug: val })}
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  🔗 آدرس ورود جدید شما:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', direction: 'ltr', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#0369a1', fontFamily: 'monospace', fontSize: '13px', flex: 1, wordBreak: 'break-all' }}>
                    {(siteUrl || '').replace(/\/$/, '')}/{settings.custom_login_slug || 'my-secret-login'}
                  </span>
                  <Button
                    isSecondary
                    isSmall
                    onClick={() => handleCopy(`${(siteUrl || '').replace(/\/$/, '')}/${settings.custom_login_slug || 'my-secret-login'}`, 'custom_login')}
                  >
                    {copiedKey === 'custom_login' ? 'کپی شد! ✓' : 'کپی آدرس ورود'}
                  </Button>
                </div>
              </div>

              {/* Anti-Lockout Safeguards */}
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px' }}>🛡️</span>
                  <strong style={{ fontSize: '13px', color: '#92400e' }}>
                    روش‌های پیشگیری از قفل شدن دسترسی مدیر (Fail-safe Safeguards)
                  </strong>
                </div>
                <p style={{ fontSize: '12px', color: '#78350f', margin: '0 0 12px 0', lineHeight: 1.6 }}>
                  نگران فراموشی آدرس ورود نباشید! دو راهکار قطعی برای بازگردانی دسترسی اضطراری تعبیه شده است:
                </p>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                    ۱. لینک بازیابی اضطراری بدون نیاز به کد (Emergency Recovery Token):
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', direction: 'ltr', background: '#fff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #fed7aa' }}>
                    <span style={{ color: '#b45309', fontFamily: 'monospace', fontSize: '12px', flex: 1, wordBreak: 'break-all' }}>
                      {(siteUrl || '').replace(/\/$/, '')}/wp-login.php?omni_recovery={settings.hide_login_recovery_key || 'TOKEN'}
                    </span>
                    <Button
                      isSmall
                      variant="secondary"
                      onClick={() => handleCopy(`${(siteUrl || '').replace(/\/$/, '')}/wp-login.php?omni_recovery=${settings.hide_login_recovery_key || ''}`, 'recovery_url')}
                    >
                      {copiedKey === 'recovery_url' ? 'کپی شد! ✓' : 'کپی لینک اضطراری'}
                    </Button>
                  </div>
                  <span style={{ fontSize: '11px', color: '#a16207', display: 'block', marginTop: '4px' }}>
                    این لینک را در مرورگر خود بوکمارک کنید. حتی با فعال بودن تغییر آدرس، این لینک فرم استاندارد ورود را باز می‌کند.
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                    ۲. غیرفعال‌سازی از طریق wp-config.php (برای مواقعی که دسترسی به دیتابیس یا فایل دارید):
                  </div>
                  <code style={{ display: 'block', direction: 'ltr', background: '#fff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #fed7aa', color: '#c2410c', fontFamily: 'monospace', fontSize: '12px' }}>
                    define(&#39;OMNI_DISABLE_HIDE_LOGIN&#39;, true);
                  </code>
                  <span style={{ fontSize: '11px', color: '#a16207', display: 'block', marginTop: '4px' }}>
                    قرار دادن این خط در فایل wp-config.php بلافاصله تمامی تغییرات آدرس ورود را موقتاً بای‌پس می‌کند.
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Section 3: REST API Endpoints Management & Group Actions */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong style={{ fontSize: '15px' }}>
                🔌 ۳. مدیریت هوشمند اندپوینت‌های REST API ({routes.length} مسیر فعال)
              </strong>
              <span style={{ fontSize: '12px', color: '#2271b1', marginInlineStart: '10px', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                پیشوند فعال در سایت: /{urlPrefix}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#646970' }}>
              به همراه راهنمای فارسی، برچسب‌های توصیه‌شده و امکان اعمال تغییرات گروهی.
            </span>
          </div>
        </CardHeader>
        <CardBody style={{ padding: '20px' }}>
          {/* Filter Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <TextControl
                placeholder="🔍 جستجو در مسیرها (مثلاً users, rankmath, settings...)"
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            <div>
              <SelectControl
                label="📁 فیلتر بر اساس فضای نام (گروه):"
                value={selectedNamespace}
                options={namespaces.map((ns) => {
                  const info = NAMESPACE_INFO[ns];
                  const label = ns === 'all'
                    ? 'همه گروه‌ها (All Namespaces)'
                    : `${ns} ${info ? `— (${info.title})` : ''}`;
                  return { label, value: ns };
                })}
                onChange={setSelectedNamespace}
              />
            </div>
          </div>

          {/* Group Information Box (If namespace selected) */}
          {currentNsInfo && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>درباره گروه {selectedNamespace}:</strong>
                <span style={{ fontSize: '12px', background: currentNsInfo.badgeBg, color: currentNsInfo.badgeColor, padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {currentNsInfo.badgeText}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                {currentNsInfo.desc}
              </p>
            </div>
          )}

          {/* Group Actions Bar (Batch Buttons) */}
          <div style={{ background: '#f0f4f8', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px 16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              ⚡ عملیات سریع گروهی روی تمامی {filteredRoutes.length} روت نمایش‌داده‌شده:
            </span>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button button-small"
                onClick={() => handleBatchAction('disable')}
                style={{ background: '#fee2e2', borderColor: '#ef4444', color: '#991b1b', fontWeight: 600 }}
              >
                ⛔ مسدودسازی همه این گروه
              </button>
              <button
                type="button"
                className="button button-small"
                onClick={() => handleBatchAction('enable')}
                style={{ background: '#dcfce7', borderColor: '#22c55e', color: '#15803d', fontWeight: 600 }}
              >
                ✓ فعال‌سازی همه این گروه
              </button>
              <button
                type="button"
                className="button button-small"
                onClick={() => handleBatchAction('require_auth')}
                style={{ background: '#e0f2fe', borderColor: '#38bdf8', color: '#0369a1', fontWeight: 600 }}
              >
                🔒 تنظیم همه روی (فقط اعضا)
              </button>
              <button
                type="button"
                className="button button-small"
                onClick={() => handleBatchAction('public')}
                style={{ background: '#fff', borderColor: '#cbd5e1', color: '#475569' }}
              >
                🌐 تنظیم همه روی (عمومی)
              </button>
            </div>
          </div>

          {/* Routes Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #c3c4c7', borderRadius: '4px' }}>
            <table className="widefat striped" style={{ border: 'none', minWidth: '780px' }}>
              <thead>
                <tr style={{ background: '#f0f0f1' }}>
                  <th style={{ width: '38%', padding: '10px' }}>مسیر اندپوینت (Route) و کاربرد</th>
                  <th style={{ width: '14%', padding: '10px' }}>متدها</th>
                  <th style={{ width: '13%', padding: '10px', textAlign: 'center' }}>وضعیت روت</th>
                  <th style={{ width: '13%', padding: '10px', textAlign: 'center' }}>سطح دسترسی</th>
                  <th style={{ width: '22%', padding: '10px' }}>لیست سفید IP اختصاصی</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#646970' }}>
                      هیچ اندپوینتی با این عبارت یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map((r) => {
                    const cfg = settings.routes_config?.[r.route] || {};
                    const isDisabled = Boolean(cfg.disabled);
                    const requiresAuth = Boolean(cfg.require_auth);
                    const ipWhite = cfg.ip_whitelist || '';
                    const advice = getRouteAdvice(r);

                    return (
                      <tr key={r.route} style={{ background: isDisabled ? '#fff0f0' : 'transparent' }}>
                        <td style={{ padding: '10px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <code style={{ fontSize: '13px', color: isDisabled ? '#d63638' : '#1d2327', fontWeight: 600, direction: 'ltr' }}>
                              {r.display_route || r.route}
                            </code>
                            <span style={{ fontSize: '10px', background: advice.badgeBg, color: advice.badgeColor, padding: '1px 6px', borderRadius: '8px', fontWeight: 'bold' }}>
                              {advice.badgeText}
                            </span>
                            {r.is_root && (
                              <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#3730a3', padding: '1px 6px', borderRadius: '8px', fontWeight: 600 }}>
                                جایگزین wp-json
                              </span>
                            )}
                          </div>
                          <span style={{ display: 'block', fontSize: '11px', color: '#646970', marginTop: '4px', lineHeight: '1.5' }}>
                            💡 {advice.advice}
                          </span>
                        </td>

                        <td style={{ padding: '10px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {r.methods.map((m) => (
                              <span
                                key={m}
                                style={{
                                  display: 'inline-block',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  padding: '2px 5px',
                                  borderRadius: '3px',
                                  background: m === 'GET' ? '#e7f5ea' : m === 'POST' ? '#e0f2fe' : m === 'DELETE' ? '#fee2e2' : '#f3f4f6',
                                  color: m === 'GET' ? '#166534' : m === 'POST' ? '#0369a1' : m === 'DELETE' ? '#991b1b' : '#374151',
                                }}
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            className={`button button-small ${isDisabled ? 'button-secondary' : 'button-primary'}`}
                            onClick={() => handleToggleRouteDisabled(r.route)}
                            style={{
                              borderRadius: '12px',
                              fontSize: '11px',
                              background: isDisabled ? '#d63638' : '#008a20',
                              borderColor: isDisabled ? '#d63638' : '#008a20',
                              color: '#fff',
                            }}
                          >
                            {isDisabled ? '⛔ مسدود' : '✓ فعال'}
                          </button>
                        </td>

                        <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            className="button button-small"
                            onClick={() => handleToggleRouteAuth(r.route)}
                            style={{
                              borderRadius: '12px',
                              fontSize: '11px',
                              background: requiresAuth ? '#2271b1' : '#f0f0f1',
                              borderColor: requiresAuth ? '#2271b1' : '#c3c4c7',
                              color: requiresAuth ? '#fff' : '#2c3338',
                            }}
                          >
                            {requiresAuth ? '🔒 فقط کاربران' : '🌐 عمومی'}
                          </button>
                        </td>

                        <td style={{ padding: '10px', verticalAlign: 'middle' }}>
                          <input
                            type="text"
                            placeholder="IP مجاز (مثلاً 1.2.3.4)"
                            value={ipWhite}
                            onChange={(e) => handleRouteChangeIp(r.route, e.target.value)}
                            style={{ width: '100%', fontSize: '11px', fontFamily: 'monospace', direction: 'ltr', height: '28px' }}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#646970' }}>
              نمایش {filteredRoutes.length} از {routes.length} اندپوینت
            </span>

            <Button
              variant="primary"
              onClick={handleSaveAll}
              disabled={saving}
              style={{ fontWeight: 600, height: '38px', padding: '0 20px' }}
            >
              {saving ? 'در حال ذخیره...' : '💾 ذخیره تغییرات'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
