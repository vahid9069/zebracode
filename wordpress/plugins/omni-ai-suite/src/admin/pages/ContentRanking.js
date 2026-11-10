import { createElement, useState, useEffect } from '@wordpress/element';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  TextControl,
  TextareaControl,
  ToggleControl,
  SelectControl,
  Modal,
  Spinner,
  Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../utils/api';

export default function ContentRanking({ onNavigate }) {
  // ساب‌تب‌های سازمان‌دهی UI/UX برای رفع شلوغی رابط کاربری
  const [activeSubTab, setActiveSubTab] = useState('ranking'); // 'ranking' | 'llms' | 'schemas' | 'ai_bots' | 'mcp'

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // تنظیمات جامع llms.txt، اسکیماها، ربات‌های هوش مصنوعی و MCP
  const [rankingSettings, setRankingSettings] = useState({
    enable_schemas: true,
    enable_speakable: true,
    enable_faq_schema: true,
    enable_article_schema: true,
    enable_howto_schema: true,
    enable_review_schema: true,
    enable_org_schema: true,
    org_type: 'Organization',
    org_name: '',
    org_logo: '',
    org_phone: '',
    org_price_range: '',
    enable_breadcrumbs: true,
    breadcrumb_separator: '»',
    breadcrumbs_show_home: true,
    breadcrumbs_home_label: 'خانه',
    auto_insert_breadcrumbs: false,
    enable_breadcrumb_schema: true,
    google_verify: '',
    bing_verify: '',
    pinterest_verify: '',
    yandex_verify: '',
    baidu_verify: '',
    enable_llms_txt: true,
    llms_site_summary: '',
    llms_post_limit: 50,
    custom_site_url: '',
    enable_ai_bots_manager: true,
    ai_bots: {
      'GPTBot': 'allow',
      'ChatGPT-User': 'allow',
      'ClaudeBot': 'allow',
      'PerplexityBot': 'allow',
      'Google-Extended': 'allow',
      'ByteSpider': 'disallow',
      'CCBot': 'disallow',
      'FacebookBot': 'allow',
      'cohere-ai': 'allow',
    },
    enable_mcp_server: true,
  });
  const [settingsUrls, setSettingsUrls] = useState({});
  const [sampleLlms, setSampleLlms] = useState('');
  const [generatedRobots, setGeneratedRobots] = useState('');
  const [mcpClaudeConfig, setMcpClaudeConfig] = useState('');
  const [mcpClientTab, setMcpClientTab] = useState('claude');
  const [savingSettings, setSavingSettings] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch('ranking/settings');
      const json = await res.json();
      if (res.ok && json.success) {
        setRankingSettings(json.settings);
        setSettingsUrls(json.urls || {});
        setSampleLlms(json.sample_content || '');
        setGeneratedRobots(json.generated_robots || '');
        setMcpClaudeConfig(json.mcp_claude_config || '');
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingSettings(true);
    setNotice(null);
    try {
      const res = await apiFetch('ranking/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rankingSettings),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotice({ type: 'success', message: json.message || 'تنظیمات با موفقیت ذخیره شد.' });
        if (json.settings) setRankingSettings(json.settings);
        if (json.urls) setSettingsUrls(json.urls);
        if (json.generated_robots) setGeneratedRobots(json.generated_robots);
        fetchSettings();
      } else {
        throw new Error(json.message || 'خطا در ذخیره تنظیمات.');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const copyToClipboard = (text, key) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const wpBaseUrl = (rankingSettings.custom_site_url || settingsUrls.detected_site || window.omniAiData?.siteUrl || '').replace(/\/+$/, '');
  const llmsTxtUrl = settingsUrls.llms_txt || (wpBaseUrl ? `${wpBaseUrl}/llms.txt` : '/llms.txt');
  const llmsFullUrl = settingsUrls.llms_full_txt || (wpBaseUrl ? `${wpBaseUrl}/llms-full.txt` : '/llms-full.txt');
  const robotsUrl = settingsUrls.robots_txt || (wpBaseUrl ? `${wpBaseUrl}/robots.txt` : '/robots.txt');

  const getLiveRobotsPreview = () => {
    if (!rankingSettings.enable_ai_bots_manager) {
      return '# مدیریت ربات‌های هوش مصنوعی غیرفعال است (قوانین سفارشی در robots.txt درج نمی‌شود).';
    }
    const bots = rankingSettings.ai_bots || {};
    let out = '# =============================================================\n';
    out += '# Omni AI Suite - AI Bots & LLM Web Crawlers Directives\n';
    out += '# Generated automatically based on your AI Bots Manager settings\n';
    out += '# =============================================================\n\n';
    Object.entries(bots).forEach(([bot, action]) => {
      out += `User-agent: ${bot}\n`;
      out += action === 'allow' ? 'Allow: /\n\n' : 'Disallow: /\n\n';
    });
    return out.trim();
  };

  // فیلترها و مرتب‌سازی
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all'); // all, under_50, 50_to_79, over_80, custom
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [metric, setMetric] = useState('avg'); // avg, seo, aeo, geo
  const [order, setOrder] = useState('asc'); // asc (کمترین به بیشترین), desc (بیشترین به کمترین)
  const [orderBy, setOrderBy] = useState('score'); // score, date, title
  const [postStatus, setPostStatus] = useState('publish');

  // آمار کلی
  const [summary, setSummary] = useState({
    total_all: 0,
    site_avg: 0,
    critical_count: 0,
    warning_count: 0,
    good_count: 0,
  });

  // مودال تحلیل و هوش مصنوعی
  const [activeModalPost, setActiveModalPost] = useState(null);
  const [modalHtml, setModalHtml] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // عملیات
  const [analyzingId, setAnalyzingId] = useState(null);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchPosts = async (p = 1) => {
    setLoading(true);
    try {
      const params = {
        page: p,
        per_page: 15,
        metric,
        order,
        order_by: orderBy,
        status: postStatus,
      };

      if (search) params.search = search;
      if (scoreFilter) params.score_filter = scoreFilter;
      if (scoreFilter === 'custom') {
        params.min_score = minScore;
        params.max_score = maxScore;
      }

      const res = await apiFetch('ranking/posts', {}, params);

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.message) msg = errData.message;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await res.json();
      if (data && data.success) {
        setPosts(data.posts || []);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total || 0);
        setPage(p);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        throw new Error(data?.message || 'خطا در واکشی لیست نوشته‌ها.');
      }
    } catch (err) {
      console.error('Failed to fetch ranking posts', err);
      setNotice({ type: 'error', message: err.message || 'خطا در ارتباط با سرور.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, [scoreFilter, metric, order, orderBy, postStatus]);

  useEffect(() => {
    const handleRankingUpdated = (e) => {
      if (e?.detail?.postId) {
        fetchPosts(page);
      }
    };
    window.addEventListener('omni-ranking-updated', handleRankingUpdated);
    return () => {
      window.removeEventListener('omni-ranking-updated', handleRankingUpdated);
    };
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPosts(1);
  };

  // تحلیل مجدد یک نوشته
  const handleRecalculate = async (postId) => {
    setAnalyzingId(postId);
    try {
      const res = await apiFetch(`ranking/reanalyze/${postId}`, { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success && json.ratings) {
        const ratings = json.ratings;
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                scores: {
                  avg: ratings.avg_score,
                  seo: ratings.seo.score,
                  aeo: ratings.aeo.score,
                  geo: ratings.geo.score,
                  readability: ratings.readability?.score || 0,
                },
              };
            }
            return p;
          })
        );
        setNotice({ type: 'success', message: 'رتبه نوشته با موفقیت مجدداً محاسبه شد.' });
      } else {
        throw new Error(json.message || 'خطا در محاسبه رتبه نوشته.');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setAnalyzingId(null);
    }
  };

  // باز کردن مودال تحلیل نوشته با قابلیت Fallback خودکار به admin-ajax
  const handleOpenModal = async (post) => {
    setActiveModalPost(post);
    setModalLoading(true);
    setModalHtml('');

    try {
      let success = false;
      let html = '';

      // ۱. تلاش اولیه از طریق REST API
      try {
        const res = await apiFetch(`ranking/modal/${post.id}`);
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const json = JSON.parse(text);
          if (res.ok && json.success && json.html) {
            html = json.html;
            success = true;
          }
        }
      } catch (_) {
        // در صورت عدم پاسخگویی یا خطای ریدایرکت/HTML در REST، مرحله بعد اجرا می‌شود
      }

      // ۲. در صورت ناموفق بودن REST، استفاده بلادرنگ از admin-ajax.php
      if (!success) {
        const ajaxUrl = (window.omniRankingConfig && window.omniRankingConfig.ajax_url)
          || (typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php');
        const nonce = (window.omniRankingConfig && window.omniRankingConfig.nonce)
          || (window.omniAiData && window.omniAiData.nonce) || '';

        const formData = new FormData();
        formData.append('action', 'omni_ai_get_post_rating_modal');
        formData.append('security', nonce);
        formData.append('post_id', post.id);

        const ajaxRes = await fetch(ajaxUrl, {
          method: 'POST',
          body: formData,
          credentials: 'same-origin',
        });
        const ajaxText = await ajaxRes.text();
        if (ajaxText && ajaxText.trim().startsWith('{')) {
          const ajaxJson = JSON.parse(ajaxText);
          if (ajaxJson.success && ajaxJson.data && ajaxJson.data.html) {
            html = ajaxJson.data.html;
            success = true;
          } else if (ajaxJson.data && ajaxJson.data.message) {
            throw new Error(ajaxJson.data.message);
          }
        }
      }

      if (success && html) {
        setModalHtml(html);
      } else {
        throw new Error('عدم دریافت پاسخ معتبر از سرور برای تحلیل نوشته. لطفاً مجدداً تلاش نمایید.');
      }
    } catch (err) {
      setModalHtml(
        '<div class="notice notice-error inline" style="padding: 14px 18px; border-radius: 6px; margin: 20px 0;">' +
        '<p style="margin: 0; font-weight: 600; color: #dc2626;">' + (err.message || 'خطا در بارگذاری مودال.') + '</p>' +
        '</div>'
      );
    } finally {
      setModalLoading(false);
    }
  };

  // تحلیل دسته‌جمعی تمام مقالات
  const handleBatchAnalyze = async () => {
    if (!window.confirm('آیا می‌خواهید تمام مقالات سایت مجدداً تحلیل و رتبه‌بندی شوند؟')) {
      return;
    }
    setBatchAnalyzing(true);
    setNotice(null);
    try {
      const res = await apiFetch('ranking/analyze-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice({ type: 'success', message: data.message || 'تمام مقالات با موفقیت تحلیل شدند.' });
        fetchPosts(page);
      } else {
        throw new Error(data.message || 'خطا در تحلیل دسته‌جمعی مقالات.');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setBatchAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 50) return '#d97706';
    return '#dc2626';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return '#f0fdf4';
    if (score >= 50) return '#fffbeb';
    return '#fef2f2';
  };

  return (
    <div className="omni-ranking-dashboard-wrap" style={{ direction: 'rtl', paddingBottom: '40px' }}>
      {notice && (
        <div style={{ marginBottom: '16px' }}>
          <Notice status={notice.type} onDismiss={() => setNotice(null)}>
            {notice.message}
          </Notice>
        </div>
      )}

      {/* ناوبری ساب‌تب‌های مدرن برای نظم‌بخشی و جلوگیری از شلوغی رابط کاربری */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('ranking')}
          style={{
            background: activeSubTab === 'ranking' ? '#2563eb' : '#f8fafc',
            color: activeSubTab === 'ranking' ? '#ffffff' : '#475569',
            border: activeSubTab === 'ranking' ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === 'ranking' ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <span className="dashicons dashicons-chart-bar" style={{ fontSize: '18px', width: '18px', height: '18px' }}></span>
          رتبه‌بندی مقالات (SEO / AEO / GEO / خوانایی)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('llms')}
          style={{
            background: activeSubTab === 'llms' ? '#2563eb' : '#f8fafc',
            color: activeSubTab === 'llms' ? '#ffffff' : '#475569',
            border: activeSubTab === 'llms' ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === 'llms' ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <span className="dashicons dashicons-admin-site-alt3" style={{ fontSize: '18px', width: '18px', height: '18px' }}></span>
          استاندارد جهانی (llms.txt)
          <span
            style={{
              background: '#10b981',
              color: '#ffffff',
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '10px',
              fontWeight: 800,
            }}
          >
            AEO
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('schemas')}
          style={{
            background: activeSubTab === 'schemas' ? '#2563eb' : '#f8fafc',
            color: activeSubTab === 'schemas' ? '#ffffff' : '#475569',
            border: activeSubTab === 'schemas' ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === 'schemas' ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <span className="dashicons dashicons-rest-api" style={{ fontSize: '18px', width: '18px', height: '18px' }}></span>
          اسکیماهای هوشمند JSON-LD
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ai_bots')}
          style={{
            background: activeSubTab === 'ai_bots' ? '#2563eb' : '#f8fafc',
            color: activeSubTab === 'ai_bots' ? '#ffffff' : '#475569',
            border: activeSubTab === 'ai_bots' ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === 'ai_bots' ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <span className="dashicons dashicons-shield" style={{ fontSize: '18px', width: '18px', height: '18px' }}></span>
          مدیریت ربات‌های هوش مصنوعی (robots.txt)
          <span
            style={{
              background: '#8b5cf6',
              color: '#ffffff',
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '10px',
              fontWeight: 800,
            }}
          >
            کنترل AI
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('mcp')}
          style={{
            background: activeSubTab === 'mcp' ? '#2563eb' : '#f8fafc',
            color: activeSubTab === 'mcp' ? '#ffffff' : '#475569',
            border: activeSubTab === 'mcp' ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeSubTab === 'mcp' ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <span className="dashicons dashicons-plugins-checked" style={{ fontSize: '18px', width: '18px', height: '18px' }}></span>
          سرور پروتکل MCP (اتصال ایجنت‌ها)
          <span
            style={{
              background: '#059669',
              color: '#ffffff',
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '10px',
              fontWeight: 800,
            }}
          >
            پیشرفته
          </span>
        </button>
      </div>

      {/* ۱. تب جدول رتبه‌بندی */}
      {activeSubTab === 'ranking' && (
        <>
          {/* ۱. کارت‌های آمار کلی سایت */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <Card style={{ borderRight: '4px solid #2563eb' }}>
          <CardBody style={{ padding: '16px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>میانگین سئو و هوش مصنوعی سایت</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: getScoreColor(summary.site_avg) }}>
                {summary.site_avg}%
              </span>
              <span
                style={{
                  background: getScoreBg(summary.site_avg),
                  color: getScoreColor(summary.site_avg),
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {summary.total_all} مقاله کل
              </span>
            </div>
          </CardBody>
        </Card>

        <Card style={{ borderRight: '4px solid #dc2626' }}>
          <CardBody style={{ padding: '16px' }}>
            <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>نیازمند بهینه‌سازی فوری (زیر ۵۰٪)</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626' }}>
                {summary.critical_count}
              </span>
              <Button
                isSmall
                isDestructive
                variant="secondary"
                onClick={() => {
                  setScoreFilter('under_50');
                  setOrder('asc');
                }}
              >
                مشاهده ضعیف‌ترین‌ها
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card style={{ borderRight: '4px solid #d97706' }}>
          <CardBody style={{ padding: '16px' }}>
            <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 600 }}>رتبه متوسط (۵۰٪ تا ۷۹٪)</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#d97706' }}>
                {summary.warning_count}
              </span>
              <Button
                isSmall
                variant="secondary"
                onClick={() => {
                  setScoreFilter('50_to_79');
                }}
              >
                مشاهده لیست
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card style={{ borderRight: '4px solid #16a34a' }}>
          <CardBody style={{ padding: '16px' }}>
            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>مقالات عالی و بهینه (بالای ۸۰٪)</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>
                {summary.good_count}
              </span>
              <Button
                isSmall
                variant="secondary"
                onClick={() => {
                  setScoreFilter('over_80');
                  setOrder('desc');
                }}
              >
                مشاهده برترین‌ها
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ۲. پنل فیلترها و مرتب‌سازی دقیق */}
      <Card style={{ marginBottom: '20px' }}>
        <CardHeader style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong>فیلتر و رتبه‌بندی هوشمند نوشته‌ها</strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              نوشته‌ها را بر اساس درصد نمره از کم به زیاد یا زیاد به کم فیلتر کرده و با یک کلیک ارتقا دهید.
            </p>
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={handleBatchAnalyze}
              disabled={batchAnalyzing}
              icon="update"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {batchAnalyzing ? 'در حال تحلیل مقالات...' : 'تحلیل دسته‌جمعی تمام مقالات'}
            </Button>
          </div>
        </CardHeader>

        <CardBody style={{ padding: '16px' }}>
          <form onSubmit={handleSearchSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                alignItems: 'end',
              }}
            >
              {/* فیلتر درصد */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  فیلتر بر اساس بازه درصد:
                </label>
                <SelectControl
                  value={scoreFilter}
                  options={[
                    { label: 'همه نوشته‌ها (بدون فیلتر درصد)', value: 'all' },
                    { label: '🔴 کمتر از ۵۰٪ (نیازمند اصلاح فوری)', value: 'under_50' },
                    { label: '🟡 بین ۵۰٪ تا ۷۹٪ (متوسط)', value: '50_to_79' },
                    { label: '🟢 ۸۰٪ به بالا (عالی و آماده رتبه)', value: 'over_80' },
                    { label: '⚙️ محدوده سفارشی...', value: 'custom' },
                  ]}
                  onChange={(val) => setScoreFilter(val)}
                />
              </div>

              {/* شاخص رتبه‌بندی */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  شاخص ارزیابی:
                </label>
                <SelectControl
                  value={metric}
                  options={[
                    { label: 'میانگین کل (SEO + AEO + GEO + خوانایی)', value: 'avg' },
                    { label: 'فقط سئو ارگانیک (SEO)', value: 'seo' },
                    { label: 'فقط موتور پاسخگو (AEO)', value: 'aeo' },
                    { label: 'فقط موتورهای هوش مصنوعی (GEO)', value: 'geo' },
                    { label: 'فقط خوانایی و روانی متن (READ)', value: 'readability' },
                  ]}
                  onChange={(val) => setMetric(val)}
                />
              </div>

              {/* جهت مرتب‌سازی (صعودی یا نزولی) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  ترتیب چیدمان:
                </label>
                <SelectControl
                  value={order}
                  options={[
                    { label: '🔻 از کمترین به بیشترین (صعودی - ضعیف‌ترین‌ها اول)', value: 'asc' },
                    { label: '🔺 از بیشترین به کمترین (نزولی - قوی‌ترین‌ها اول)', value: 'desc' },
                  ]}
                  onChange={(val) => setOrder(val)}
                />
              </div>

              {/* جستجو در عنوان */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  جستجو در عنوان:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="عنوان مقاله..."
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #8c8f94',
                      fontSize: '13px',
                    }}
                  />
                  <Button variant="primary" type="submit">
                    جستجو
                  </Button>
                </div>
              </div>
            </div>

            {/* ورودی محدوده سفارشی */}
            {scoreFilter === 'custom' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <span>نمایش مقالاتی که درصد آن‌ها بین:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  style={{ width: '70px', padding: '4px 8px' }}
                />
                <span>تا</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  style={{ width: '70px', padding: '4px 8px' }}
                />
                <span>درصد است.</span>
                <Button variant="secondary" isSmall onClick={() => fetchPosts(1)}>
                  اعمال محدوده
                </Button>
              </div>
            )}
          </form>
        </CardBody>
      </Card>

      {/* ۳. جدول نوشته‌ها */}
      <Card>
        <CardBody style={{ padding: '0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Spinner />
              <p style={{ marginTop: '12px', color: '#64748b' }}>در حال بارگذاری و ارزیابی نوشته‌ها...</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
              <span className="dashicons dashicons-search" style={{ fontSize: '32px', width: '32px', height: '32px' }}></span>
              <p>هیچ نوشته‌ای با معیارهای فیلتر انتخاب‌شده یافت نشد.</p>
              <Button variant="secondary" onClick={() => { setScoreFilter('all'); setSearch(''); }}>
                پاک کردن فیلترها
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table
                className="wp-list-table widefat striped"
                style={{ border: 'none', direction: 'rtl', width: '100%', minWidth: '920px', tableLayout: 'auto' }}
              >
                <thead>
                  <tr>
                    <th style={{ padding: '12px 14px' }}>عنوان نوشته</th>
                    <th style={{ width: '90px', minWidth: '90px', padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>SEO ارگانیک</th>
                    <th style={{ width: '110px', minWidth: '110px', padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>موتور پاسخگو AEO</th>
                    <th style={{ width: '110px', minWidth: '110px', padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>هوش مصنوعی GEO</th>
                    <th style={{ width: '95px', minWidth: '95px', padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>خوانایی متن</th>
                    <th style={{ width: '100px', minWidth: '100px', padding: '12px 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>میانگین کل</th>
                    <th style={{ width: '210px', minWidth: '210px', padding: '12px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => {
                    const avg = post.scores?.avg || 0;
                    const seo = post.scores?.seo || 0;
                    const aeo = post.scores?.aeo || 0;
                    const geo = post.scores?.geo || 0;
                    const readability = post.scores?.readability || 0;

                    return (
                      <tr key={post.id}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                            <a href={post.edit_url} style={{ color: '#2563eb', textDecoration: 'none' }}>
                              {post.title}
                            </a>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px' }}>
                            <span>شناسه: #{post.id}</span>
                            <span>تاریخ: {post.date}</span>
                            {post.categories?.length > 0 && <span>دسته: {post.categories.join('، ')}</span>}
                          </div>
                        </td>

                        {/* بج SEO */}
                        <td style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              background: getScoreBg(seo),
                              color: getScoreColor(seo),
                              border: `1px solid ${getScoreColor(seo)}40`,
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            {seo}%
                          </span>
                        </td>

                        {/* بج AEO */}
                        <td style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              background: getScoreBg(aeo),
                              color: getScoreColor(aeo),
                              border: `1px solid ${getScoreColor(aeo)}40`,
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            {aeo}%
                          </span>
                        </td>

                        {/* بج GEO */}
                        <td style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              background: getScoreBg(geo),
                              color: getScoreColor(geo),
                              border: `1px solid ${getScoreColor(geo)}40`,
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            {geo}%
                          </span>
                        </td>

                        {/* بج خوانایی (Readability) */}
                        <td style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              background: getScoreBg(readability),
                              color: getScoreColor(readability),
                              border: `1px solid ${getScoreColor(readability)}40`,
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            {readability}%
                          </span>
                        </td>

                        {/* میانگین کل */}
                        <td style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap', width: '100px', minWidth: '100px' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: getScoreBg(avg),
                              border: `2px solid ${getScoreColor(avg)}`,
                              color: getScoreColor(avg),
                              fontWeight: 800,
                              fontSize: '13px',
                            }}
                          >
                            {avg}%
                          </div>
                        </td>

                        {/* عملیات */}
                        <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '10px 8px', whiteSpace: 'nowrap', width: '210px', minWidth: '210px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', flexWrap: 'nowrap', width: '100%' }}>
                            <Button
                              isSmall
                              variant="primary"
                              onClick={() => handleOpenModal(post)}
                              title="مشاهده چک‌لیست و تولید هوشمند با AI"
                              style={{
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '0 8px',
                                height: '28px',
                                fontSize: '11px',
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              <span className="dashicons dashicons-analytics" style={{ fontSize: '13px', width: '13px', height: '13px' }}></span>
                              تحلیل و AI
                            </Button>

                            <button
                              type="button"
                              className="button button-secondary button-small"
                              onClick={() => handleRecalculate(post.id)}
                              disabled={analyzingId === post.id}
                              title="تحلیل مجدد"
                              style={{
                                height: '28px',
                                width: '28px',
                                padding: 0,
                                minWidth: '28px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {analyzingId === post.id ? (
                                <Spinner style={{ margin: 0, width: '14px', height: '14px' }} />
                              ) : (
                                <span
                                  className="dashicons dashicons-update"
                                  style={{
                                    fontSize: '15px',
                                    width: '15px',
                                    height: '15px',
                                    lineHeight: '15px',
                                  }}
                                ></span>
                              )}
                            </button>

                            <a
                              href={post.edit_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button button-secondary button-small"
                              title="ویرایش در وردپرس"
                              style={{
                                height: '28px',
                                width: '28px',
                                padding: 0,
                                minWidth: '28px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                flexShrink: 0,
                              }}
                            >
                              <span className="dashicons dashicons-edit" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* صفحه‌بندی */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                نمایش صفحه {page} از {totalPages} (مجموع {totalCount} نوشته)
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  variant="secondary"
                  isSmall
                  disabled={page <= 1}
                  onClick={() => fetchPosts(page - 1)}
                >
                  صفحه قبل
                </Button>
                <Button
                  variant="secondary"
                  isSmall
                  disabled={page >= totalPages}
                  onClick={() => fetchPosts(page + 1)}
                >
                  صفحه بعد
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
      </>
      )}

      {/* ۲. تب استاندارد هوش مصنوعی llms.txt */}
      {activeSubTab === 'llms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '15px' }}>استاندارد جهانی llms.txt و llms-full.txt</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  فرمت استاندارد متنی (Markdown) برای خوانش، استخراج سریع و استناد محتوای سایت شما توسط مدل‌های هوش مصنوعی (ChatGPT، Claude، Perplexity و Google AI Overviews).
                </p>
              </div>
              <span
                style={{
                  background: rankingSettings.enable_llms_txt ? '#dcfce7' : '#fee2e2',
                  color: rankingSettings.enable_llms_txt ? '#166534' : '#991b1b',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                }}
              >
                {rankingSettings.enable_llms_txt ? '● فعال و در دسترس' : '○ غیرفعال'}
              </span>
            </CardHeader>
            <CardBody>
              {/* فرم تنظیمات llms.txt */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px' }}>
                  <ToggleControl
                    label="فعال‌سازی استاندارد جهانی llms.txt برای خوانش توسط مدل‌های هوش مصنوعی"
                    help="تولید خودکار فایل‌های متنی سبک در روت وبلاگ/سایت و پاسخگویی آنی به درخواست‌های هوش مصنوعی."
                    checked={rankingSettings.enable_llms_txt}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, enable_llms_txt: val })}
                  />

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      🌐 آدرس پایه وبلاگ / سایت (WordPress Site URL):
                    </label>
                    <input
                      type="url"
                      className="regular-text"
                      dir="ltr"
                      placeholder={wpBaseUrl || 'https://yourdomain.ir/blog'}
                      value={rankingSettings.custom_site_url || ''}
                      onChange={(e) => setRankingSettings({ ...rankingSettings, custom_site_url: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                      آدرس اصلی وبلاگ شما که فایل‌های llms.txt و robots.txt روی آن سرویس‌دهی می‌شوند. در صورت خالی بودن، به طور خودکار از <code>{settingsUrls.detected_site || window.omniAiData?.siteUrl || 'site_url()'}</code> خوانده می‌شود.
                    </p>
                  </div>

                  <TextareaControl
                    label="توضیحات معرفی سایت در ابتدای فایل llms.txt"
                    value={rankingSettings.llms_site_summary}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, llms_site_summary: val })}
                    rows={2}
                    help="این متن در هدر فایل llms.txt به عنوان خلاصه‌ای از هویت و زمینه تخصصی سایت به هوش مصنوعی معرفی می‌شود."
                  />

                  <div style={{ maxWidth: '180px' }}>
                    <TextControl
                      label="حداکثر تعداد مقالات در فایل‌ها"
                      type="number"
                      value={rankingSettings.llms_post_limit}
                      onChange={(val) => setRankingSettings({ ...rankingSettings, llms_post_limit: parseInt(val, 10) || 50 })}
                      min={10}
                      max={200}
                    />
                  </div>

                  <div>
                    <Button
                      variant="primary"
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      style={{ minWidth: '140px' }}
                    >
                      {savingSettings ? <Spinner /> : 'ذخیره تنظیمات llms.txt'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* آدرس‌های دسترسی مستقیم و اندپوینت‌های REST API */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {/* کارت ۱: فایل خلاصه llms.txt */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px' }}>📄</span>
                        <strong style={{ fontSize: '13px', color: '#1e293b' }}>فایل خلاصه سایت (llms.txt)</strong>
                      </div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                        آدرس عمومی وب
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <input
                        type="text"
                        readOnly
                        value={llmsTxtUrl}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          border: 'none',
                          background: 'transparent',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          direction: 'ltr',
                          textAlign: 'left',
                          color: '#334155',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(llmsTxtUrl, 'llms_txt')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#ffffff',
                          border: 'none',
                          borderRight: '1px solid #cbd5e1',
                          color: '#2563eb',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span className="dashicons dashicons-admin-page" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                        {copiedKey === 'llms_txt' ? 'کپی شد!' : 'کپی'}
                      </button>
                      <a
                        href={llmsTxtUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#f1f5f9',
                          borderRight: '1px solid #cbd5e1',
                          color: '#475569',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span className="dashicons dashicons-external" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                        مشاهده
                      </a>
                    </div>
                  </div>

                  {/* کارت ۲: فایل کامل llms-full.txt */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px' }}>📚</span>
                        <strong style={{ fontSize: '13px', color: '#1e293b' }}>آرشیو متنی کامل (llms-full.txt)</strong>
                      </div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                        آدرس عمومی وب
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <input
                        type="text"
                        readOnly
                        value={llmsFullUrl}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          border: 'none',
                          background: 'transparent',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          direction: 'ltr',
                          textAlign: 'left',
                          color: '#334155',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(llmsFullUrl, 'llms_full')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#ffffff',
                          border: 'none',
                          borderRight: '1px solid #cbd5e1',
                          color: '#2563eb',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span className="dashicons dashicons-admin-page" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                        {copiedKey === 'llms_full' ? 'کپی شد!' : 'کپی'}
                      </button>
                      <a
                        href={llmsFullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#f1f5f9',
                          borderRight: '1px solid #cbd5e1',
                          color: '#475569',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span className="dashicons dashicons-external" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                        مشاهده
                      </a>
                    </div>
                  </div>

                  {/* کارت ۳: اندپوینت REST API خلاصه سایت */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px' }}>⚡</span>
                        <strong style={{ fontSize: '13px', color: '#1e293b' }}>اندپوینت REST API خلاصه سایت (llms.txt)</strong>
                      </div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                        ویژه فرانت‌اند Next.js
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <input
                        type="text"
                        readOnly
                        value={settingsUrls.rest_llms_txt || '/wp-json/omni-ai/v1/llms.txt'}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          border: 'none',
                          background: 'transparent',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          direction: 'ltr',
                          textAlign: 'left',
                          color: '#334155',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settingsUrls.rest_llms_txt || '/wp-json/omni-ai/v1/llms.txt', 'rest_llms')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#ffffff',
                          border: 'none',
                          borderRight: '1px solid #cbd5e1',
                          color: '#2563eb',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span className="dashicons dashicons-admin-page" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                        {copiedKey === 'rest_llms' ? 'کپی شد!' : 'کپی'}
                      </button>
                      {settingsUrls.rest_llms_txt && (
                        <a
                          href={settingsUrls.rest_llms_txt}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#f1f5f9',
                            borderRight: '1px solid #cbd5e1',
                            color: '#475569',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span className="dashicons dashicons-external" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                          تست
                        </a>
                      )}
                    </div>
                  </div>

                  {/* کارت ۴: اندپوینت REST API متن کامل مقالات */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px' }}>⚡</span>
                        <strong style={{ fontSize: '13px', color: '#1e293b' }}>اندپوینت REST API متن کامل (llms-full.txt)</strong>
                      </div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                        ویژه فرانت‌اند Next.js
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <input
                        type="text"
                        readOnly
                        value={settingsUrls.rest_llms_full || '/wp-json/omni-ai/v1/llms-full.txt'}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          border: 'none',
                          background: 'transparent',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          direction: 'ltr',
                          textAlign: 'left',
                          color: '#334155',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settingsUrls.rest_llms_full || '/wp-json/omni-ai/v1/llms-full.txt', 'rest_llms_full')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#ffffff',
                          border: 'none',
                          borderRight: '1px solid #cbd5e1',
                          color: '#2563eb',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span className="dashicons dashicons-admin-page" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                        {copiedKey === 'rest_llms_full' ? 'کپی شد!' : 'کپی'}
                      </button>
                      {settingsUrls.rest_llms_full && (
                        <a
                          href={settingsUrls.rest_llms_full}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#f1f5f9',
                            borderRight: '1px solid #cbd5e1',
                            color: '#475569',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span className="dashicons dashicons-external" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                          تست
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* باکس راهنمای Next.js (Headless) */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  padding: '18px 20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px' }}>
                    <span>🚀</span> راهنمای فعال‌سازی در فرانت‌اند Next.js (App Router):
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      isSmall
                      variant="secondary"
                      onClick={() => {
                        const snippet = `// app/llms.txt/route.ts
export async function GET() {
  const res = await fetch('${settingsUrls.rest_llms_txt || 'https://api.yourdomain.ir/wp-json/omni-ai/v1/llms.txt'}', {
    next: { revalidate: 3600 }
  });
  const text = await res.text();
  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}`;
                        copyToClipboard(snippet, 'next_llms');
                      }}
                    >
                      {copiedKey === 'next_llms' ? 'کپی شد!' : 'کپی route.ts (خلاصه)'}
                    </Button>
                    <Button
                      isSmall
                      variant="secondary"
                      onClick={() => {
                        const snippet = `// app/llms-full.txt/route.ts
export async function GET() {
  const res = await fetch('${settingsUrls.rest_llms_full || 'https://api.yourdomain.ir/wp-json/omni-ai/v1/llms-full.txt'}', {
    next: { revalidate: 3600 }
  });
  const text = await res.text();
  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}`;
                        copyToClipboard(snippet, 'next_full');
                      }}
                    >
                      {copiedKey === 'next_full' ? 'کپی شد!' : 'کپی route.ts (کامل)'}
                    </Button>
                  </div>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  در پروژه فرانت‌اند Next.js کافیست دو فایل <code style={{ color: '#38bdf8' }}>app/llms.txt/route.ts</code> و <code style={{ color: '#38bdf8' }}>app/llms-full.txt/route.ts</code> را بسازید تا فرانت‌اند با کش هوشمند محتوا را مستقیماً از وردپرس تحویل هوش مصنوعی دهد:
                </p>
                <pre
                  style={{
                    background: '#090d16',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    direction: 'ltr',
                    textAlign: 'left',
                    color: '#e2e8f0',
                    margin: 0,
                    overflowX: 'auto',
                  }}
                >
{`// 1. فایل app/llms.txt/route.ts
export async function GET() {
  const res = await fetch('${settingsUrls.rest_llms_txt || 'https://api.yourdomain.ir/wp-json/omni-ai/v1/llms.txt'}', {
    next: { revalidate: 3600 } // کش خودکار یک ساعته
  });
  const text = await res.text();
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

// 2. فایل app/llms-full.txt/route.ts
export async function GET() {
  const res = await fetch('${settingsUrls.rest_llms_full || 'https://api.yourdomain.ir/wp-json/omni-ai/v1/llms-full.txt'}', {
    next: { revalidate: 3600 }
  });
  const text = await res.text();
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}`}
                </pre>
              </div>

              {/* پیش‌نمایش زنده */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  پیش‌نمایش خروجی زنده llms.txt بر اساس مقالات منتشرشده:
                </label>
                <textarea
                  readOnly
                  rows={8}
                  value={sampleLlms}
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    direction: 'rtl',
                    textAlign: 'right',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ۳. تب تنظیمات اسکیماهای AEO و GEO */}
      {activeSubTab === 'schemas' && (
        <Card>
          <CardHeader>
            <div>
              <strong style={{ fontSize: '15px' }}>مدیریت تزریق اسکیماهای ساختاریافته (Schema.org JSON-LD)</strong>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                تنظیم نحوه درج کدهای ساختاریافته برای افزایش شانس حضور در Featured Snippets، جستجوی صوتی و استناد LLMها.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div style={{ maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ToggleControl
                label="فعال‌سازی تزریق خودکار اسکیماهای هوش مصنوعی (AEO / GEO)"
                help="در صورت فعال بودن، اسکیماهای رسمی به تگ head مقالات بدون ایجاد تداخل با رنک‌مث یا یواست افزوده می‌شوند."
                checked={rankingSettings.enable_schemas}
                onChange={(val) => setRankingSettings({ ...rankingSettings, enable_schemas: val })}
              />

              <div style={{ paddingRight: '24px', opacity: rankingSettings.enable_schemas ? 1 : 0.5 }}>
                <ToggleControl
                  label="اسکیمای جستجوی صوتی SpeakableSpecification (AEO)"
                  help="پاراگراف پاسخ صریح را به دستیارهای هوشمند صوتی (مانند Siri و Google Assistant) به عنوان متن قابل قرائت معرفی می‌کند."
                  checked={rankingSettings.enable_speakable}
                  disabled={!rankingSettings.enable_schemas}
                  onChange={(val) => setRankingSettings({ ...rankingSettings, enable_speakable: val })}
                />

                <div style={{ marginTop: '16px' }}>
                  <ToggleControl
                    label="اسکیمای پرسش و پاسخ FAQPage خودکار"
                    help="تبدیل خودکار بخش سوالات متداول تولیدشده به ساختار رسمی FAQPage گوگل برای نمایش آکاردئونی."
                    checked={rankingSettings.enable_faq_schema}
                    disabled={!rankingSettings.enable_schemas}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, enable_faq_schema: val })}
                  />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <ToggleControl
                    label="اسکیمای پیشرفته مقاله و موجودیت‌ها BlogPosting / Entities (GEO)"
                    help="درج متادیتای ساختاریافته نویسنده، تاریخ انتشار/بروزرسانی و نهادهای کلیدی (About Entities) برای تقویت اعتبار موضوعی در مدل‌های هوش مصنوعی."
                    checked={rankingSettings.enable_article_schema}
                    disabled={!rankingSettings.enable_schemas}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, enable_article_schema: val })}
                  />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <ToggleControl
                    label="پشتیبانی از اسکیمای آموزش گام‌به‌گام (HowTo Schema)"
                    help="امکان فعال‌سازی اسکیمای HowTo در نوشته‌های آموزشی برای نمایش مراحل در نتایج گوگل."
                    checked={rankingSettings.enable_howto_schema}
                    disabled={!rankingSettings.enable_schemas}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, enable_howto_schema: val })}
                  />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <ToggleControl
                    label="پشتیبانی از اسکیمای نقد و بررسی و امتیاز (Review / Rating Schema)"
                    help="تولید خودکار ستاره‌های طلایی امتیاز نقد و بررسی کالا یا محتوا در سرچ گوگل."
                    checked={rankingSettings.enable_review_schema}
                    disabled={!rankingSettings.enable_schemas}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, enable_review_schema: val })}
                  />
                </div>
              </div>

              {/* بخش مسیر راهنما (Breadcrumbs) */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '10px' }}>
                <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                  📍 تنظیمات مسیر راهنما (Breadcrumbs Trail & Schema)
                </strong>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                  تولید خودکار مسیر سلسله‌مراتبی صفحات به همراه اسکیمای رسمی BreadcrumbList. همچنین می‌توانید با شرت‌کد <code>[omni_ai_breadcrumbs]</code> یا تابع PHP <code>omni_ai_breadcrumbs()</code> مسیر راهنما را در هر نقطه از قالب نمایش دهید.
                </p>

                <ToggleControl
                  label="فعال‌سازی اسکیمای ساختاریافته مسیر راهنما (BreadcrumbList Schema)"
                  checked={rankingSettings.enable_breadcrumb_schema}
                  onChange={(val) => setRankingSettings({ ...rankingSettings, enable_breadcrumb_schema: val })}
                />

                <div style={{ marginTop: '12px' }}>
                  <ToggleControl
                    label="درج خودکار مسیر راهنما در ابتدای مقالات وبلاگ"
                    help="اگر قالب شما فاقد بردکرامب است، این گزینه مسیر راهنما را به طور خودکار بالای محتوا قرار می‌دهد."
                    checked={rankingSettings.auto_insert_breadcrumbs}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, auto_insert_breadcrumbs: val })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                  <TextControl
                    label="کاراکتر جداکننده مسیر راهنما"
                    value={rankingSettings.breadcrumb_separator || '»'}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, breadcrumb_separator: val })}
                    help="مثال: » یا / یا •"
                  />
                  <TextControl
                    label="عنوان پیوند خانه (Home)"
                    value={rankingSettings.breadcrumbs_home_label || 'خانه'}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, breadcrumbs_home_label: val })}
                  />
                </div>
              </div>

              {/* بخش اسکیمای سازمان / کسب‌وکار (Organization Schema) */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '10px' }}>
                <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                  🏢 اطلاعات ساختاریافته کسب‌وکار و سازمان (Organization Schema)
                </strong>
                <ToggleControl
                  label="تزریق خودکار اسکیمای سازمان در صفحه اصلی سایت"
                  checked={rankingSettings.enable_org_schema}
                  onChange={(val) => setRankingSettings({ ...rankingSettings, enable_org_schema: val })}
                />

                {rankingSettings.enable_org_schema && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <SelectControl
                      label="نوع نهاد (Entity Type)"
                      value={rankingSettings.org_type || 'Organization'}
                      options={[
                        { label: 'سازمان / شرکت (Organization)', value: 'Organization' },
                        { label: 'کسب‌وکار محلی (LocalBusiness)', value: 'LocalBusiness' },
                        { label: 'شرکت حقوقی (Corporation)', value: 'Corporation' },
                      ]}
                      onChange={(val) => setRankingSettings({ ...rankingSettings, org_type: val })}
                    />
                    <TextControl
                      label="نام رسمی سازمان یا سایت"
                      value={rankingSettings.org_name || ''}
                      onChange={(val) => setRankingSettings({ ...rankingSettings, org_name: val })}
                    />
                    <TextControl
                      label="آدرس آیکون یا لوگو سازمان"
                      value={rankingSettings.org_logo || ''}
                      onChange={(val) => setRankingSettings({ ...rankingSettings, org_logo: val })}
                    />
                    <TextControl
                      label="شماره تلفن رسمی پشتیبانی"
                      value={rankingSettings.org_phone || ''}
                      onChange={(val) => setRankingSettings({ ...rankingSettings, org_phone: val })}
                    />
                  </div>
                )}
              </div>

              {/* بخش کدهای تأیید وب‌مستر تولز (Webmaster Verification Codes) */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '10px' }}>
                <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                  🔍 کدهای تأیید وب‌مستر تولز (Webmaster Tools Verification)
                </strong>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                  کد تأیید یا کل متاتگ ارائه شده توسط سرچ‌کنسول گوگل، بینگ و پینترست را در کادرهای زیر قرار دهید تا به طور خودکار به تگ head اضافه شود:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <TextControl
                    label="گوگل سرچ کنسول (Google Search Console)"
                    placeholder="کد تأیید یا تگ google-site-verification"
                    value={rankingSettings.google_verify || ''}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, google_verify: val })}
                  />
                  <TextControl
                    label="بینگ وب‌مستر تولز (Bing Webmaster Tools)"
                    placeholder="کد تأیید یا تگ msvalidate.01"
                    value={rankingSettings.bing_verify || ''}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, bing_verify: val })}
                  />
                  <TextControl
                    label="پینترست (Pinterest Verification)"
                    placeholder="کد تأیید یا تگ p:domain_verify"
                    value={rankingSettings.pinterest_verify || ''}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, pinterest_verify: val })}
                  />
                  <TextControl
                    label="یاندکس وب‌مستر (Yandex Verification)"
                    placeholder="کد تأیید یا تگ yandex-verification"
                    value={rankingSettings.yandex_verify || ''}
                    onChange={(val) => setRankingSettings({ ...rankingSettings, yandex_verify: val })}
                  />
                </div>
              </div>

              <div style={{ paddingTop: '8px' }}>
                <Button
                  variant="primary"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  style={{ minWidth: '130px' }}
                >
                  {savingSettings ? <Spinner /> : 'ذخیره تنظیمات اسکیما'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ۴. تب مدیریت دسترسی ربات‌های هوش مصنوعی (AI Bots Manager) */}
      {activeSubTab === 'ai_bots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <CardHeader>
              <div>
                <strong style={{ fontSize: '15px' }}>مدیریت دسترسی ربات‌ها و خزنده‌های هوش مصنوعی (AI Bots Manager)</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  کنترل کنید کدام مدل‌ها و خزنده‌های وب اجازه مطالعه یا استفاده از محتوای سایت را در فایل <code>robots.txt</code> دارند.
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <div style={{ marginBottom: '20px' }}>
                <ToggleControl
                  label="فعال‌سازی مدیریت پیشرفته خزنده‌های هوش مصنوعی در robots.txt"
                  help="در صورت فعال بودن، دستورات استاندارد Allow و Disallow مستقیماً و به صورت خودکار به robots.txt وردپرس اضافه می‌شوند."
                  checked={rankingSettings.enable_ai_bots_manager}
                  onChange={(val) => setRankingSettings({ ...rankingSettings, enable_ai_bots_manager: val })}
                />
              </div>

              {rankingSettings.enable_ai_bots_manager && (
                <>
                  {/* دکمه‌های پری‌ست سریع */}
                  <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                      الگوهای سریع تنظیم دسترسی (Presets):
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        isSmall
                        variant="secondary"
                        onClick={() => {
                          const updated = {};
                          Object.keys(rankingSettings.ai_bots || {}).forEach((k) => { updated[k] = 'allow'; });
                          setRankingSettings({ ...rankingSettings, ai_bots: updated });
                        }}
                      >
                        ✅ اجازه به همه (بیشترین سئو و ارجاع در AI)
                      </Button>
                      <Button
                        isSmall
                        variant="secondary"
                        onClick={() => {
                          const updated = {
                            'GPTBot': 'disallow',
                            'ChatGPT-User': 'allow',
                            'ClaudeBot': 'disallow',
                            'PerplexityBot': 'allow',
                            'Google-Extended': 'disallow',
                            'ByteSpider': 'disallow',
                            'CCBot': 'disallow',
                            'FacebookBot': 'disallow',
                            'cohere-ai': 'disallow',
                          };
                          setRankingSettings({ ...rankingSettings, ai_bots: updated });
                        }}
                      >
                        🔍 فقط موتورهای پاسخگو و سرچ (Perplexity و ChatGPT-User)
                      </Button>
                      <Button
                        isSmall
                        variant="secondary"
                        onClick={() => {
                          const updated = {};
                          Object.keys(rankingSettings.ai_bots || {}).forEach((k) => { updated[k] = 'disallow'; });
                          setRankingSettings({ ...rankingSettings, ai_bots: updated });
                        }}
                      >
                        🚫 مسدودسازی کامل تمام ربات‌های هوش مصنوعی
                      </Button>
                    </div>
                  </div>

                  {/* گرید لیست ربات‌ها */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    {[
                      { id: 'GPTBot', name: 'OpenAI GPTBot', desc: 'خزنده اصلی یادگیری مدل‌های ChatGPT / GPT-4o' },
                      { id: 'ChatGPT-User', name: 'ChatGPT Browsing', desc: 'خزنده زنده هنگام جستجوی کاربران در چت‌جی‌پی‌تی' },
                      { id: 'ClaudeBot', name: 'Anthropic ClaudeBot', desc: 'خزنده هوش مصنوعی کلود (Claude 3.5 Sonnet)' },
                      { id: 'PerplexityBot', name: 'PerplexityBot', desc: 'موتور پاسخگوی هوشمند پرپلکسیتی جهت استناد و لینک‌دهی' },
                      { id: 'Google-Extended', name: 'Google-Extended', desc: 'آموزش مدل‌های هوش مصنوعی گوگل جمینای و ورتکس' },
                      { id: 'ByteSpider', name: 'ByteSpider (ByteDance)', desc: 'ربات جمع‌آوری داده هوش مصنوعی شرکت تیک‌تاک' },
                      { id: 'CCBot', name: 'CCBot (Common Crawl)', desc: 'پایگاه داده باز اینترنت مورد استفاده مدل‌های متن‌باز' },
                      { id: 'FacebookBot', name: 'Meta FacebookBot', desc: 'خزنده یادگیری مدل‌های Llama هوش مصنوعی متا' },
                      { id: 'cohere-ai', name: 'Cohere AI', desc: 'مدل‌های زبانی سازمانی و پردازش زبان Cohere' },
                    ].map((bot) => {
                      const currentRule = rankingSettings.ai_bots?.[bot.id] || 'allow';
                      const isAllowed = currentRule === 'allow';

                      return (
                        <div
                          key={bot.id}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '14px',
                            background: isAllowed ? '#ffffff' : '#fef2f2',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <strong style={{ fontSize: '13px' }}>{bot.name}</strong>
                              <span
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontWeight: 700,
                                  background: isAllowed ? '#dcfce7' : '#fee2e2',
                                  color: isAllowed ? '#15803d' : '#b91c1c',
                                }}
                              >
                                {isAllowed ? 'مجاز (Allow)' : 'مسدود (Disallow)'}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                              {bot.desc}
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setRankingSettings({
                                  ...rankingSettings,
                                  ai_bots: { ...rankingSettings.ai_bots, [bot.id]: 'allow' },
                                });
                              }}
                              style={{
                                flex: 1,
                                padding: '5px 0',
                                fontSize: '11px',
                                fontWeight: isAllowed ? 700 : 500,
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: isAllowed ? '#16a34a' : '#cbd5e1',
                                background: isAllowed ? '#16a34a' : '#ffffff',
                                color: isAllowed ? '#ffffff' : '#475569',
                                cursor: 'pointer',
                              }}
                            >
                              Allow
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRankingSettings({
                                  ...rankingSettings,
                                  ai_bots: { ...rankingSettings.ai_bots, [bot.id]: 'disallow' },
                                });
                              }}
                              style={{
                                flex: 1,
                                padding: '5px 0',
                                fontSize: '11px',
                                fontWeight: !isAllowed ? 700 : 500,
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: !isAllowed ? '#dc2626' : '#cbd5e1',
                                background: !isAllowed ? '#dc2626' : '#ffffff',
                                color: !isAllowed ? '#ffffff' : '#475569',
                                cursor: 'pointer',
                              }}
                            >
                              Disallow
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* پیش‌نمایش زنده خروجی robots.txt */}
                  <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700 }}>
                        پیش‌نمایش خروجی افزوده شده به فایل robots.txt:
                      </label>
                      {robotsUrl && (
                        <a
                          href={robotsUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none' }}
                        >
                          مشاهده فایل robots.txt زنده سایت ↗
                        </a>
                      )}
                    </div>
                    <pre
                      style={{
                        background: '#0f172a',
                        color: '#38bdf8',
                        padding: '12px 14px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        direction: 'ltr',
                        textAlign: 'left',
                        margin: 0,
                        maxHeight: '180px',
                        overflowY: 'auto',
                      }}
                    >
                      {getLiveRobotsPreview()}
                    </pre>
                  </div>

                  {/* اندپوینت REST API برای robots.txt و راهنمای Next.js */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px' }}>⚡</span>
                        <strong style={{ fontSize: '13px', color: '#1e293b' }}>اندپوینت REST API فایل robots.txt (ویژه اتصال به فرانت‌اند Next.js)</strong>
                      </div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                        Next.js Headless
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        marginBottom: '16px',
                      }}
                    >
                      <input
                        type="text"
                        readOnly
                        value={settingsUrls.rest_robots_txt || '/wp-json/omni-ai/v1/robots.txt'}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          border: 'none',
                          background: 'transparent',
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          direction: 'ltr',
                          textAlign: 'left',
                          color: '#334155',
                          outline: 'none',
                          boxShadow: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settingsUrls.rest_robots_txt || '/wp-json/omni-ai/v1/robots.txt', 'rest_robots')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: '#ffffff',
                          border: 'none',
                          borderRight: '1px solid #cbd5e1',
                          color: '#2563eb',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span className="dashicons dashicons-admin-page" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                        {copiedKey === 'rest_robots' ? 'کپی شد!' : 'کپی'}
                      </button>
                      {settingsUrls.rest_robots_txt && (
                        <a
                          href={settingsUrls.rest_robots_txt}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#f1f5f9',
                            borderRight: '1px solid #cbd5e1',
                            color: '#475569',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span className="dashicons dashicons-external" style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                          تست
                        </a>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                          راهنمای اتصال در Next.js App Router (فایل app/robots.txt/route.ts یا app/robots.ts):
                        </span>
                        <Button
                          isSmall
                          variant="secondary"
                          onClick={() => {
                            const snippet = `// app/robots.txt/route.ts
export async function GET() {
  const res = await fetch('${settingsUrls.rest_robots_txt || 'https://api.yourdomain.ir/wp-json/omni-ai/v1/robots.txt'}', {
    next: { revalidate: 3600 } // کش یک ساعته
  });
  const text = await res.text();
  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}`;
                            copyToClipboard(snippet, 'next_robots_snippet');
                          }}
                        >
                          {copiedKey === 'next_robots_snippet' ? 'کد کپی شد!' : 'کپی کد route.ts'}
                        </Button>
                      </div>
                      <pre
                        style={{
                          background: '#0f172a',
                          color: '#e2e8f0',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          direction: 'ltr',
                          textAlign: 'left',
                          margin: 0,
                          overflowX: 'auto',
                        }}
                      >
{`// app/robots.txt/route.ts
export async function GET() {
  const res = await fetch('${settingsUrls.rest_robots_txt || 'https://api.yourdomain.ir/wp-json/omni-ai/v1/robots.txt'}', {
    next: { revalidate: 3600 }
  });
  const text = await res.text();
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}`}
                      </pre>
                    </div>
                  </div>
                </>
              )}

              <div>
                <Button
                  variant="primary"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  style={{ minWidth: '150px' }}
                >
                  {savingSettings ? <Spinner /> : 'ذخیره تنظیمات ربات‌ها'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ۵. تب سرور پروتکل MCP (Model Context Protocol) */}
      {activeSubTab === 'mcp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <CardHeader>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '15px' }}>سرور پروتکل استاندارد Model Context Protocol (MCP)</strong>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontWeight: 700,
                    }}
                  >
                    JSON-RPC 2.0 آماده اتصال
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  امکان اتصال مستقیم نرم‌افزارهای هوش مصنوعی (مانند Claude Desktop، Cursor، و Antigravity) به مقالات و دانش سایت شما به عنوان سرور MCP.
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <div style={{ marginBottom: '20px' }}>
                <ToggleControl
                  label="فعال‌سازی اندپوینت سرور MCP سایت"
                  help="با فعال بودن این گزینه، هوش مصنوعی می‌تواند ابزارهای جستجو، دریافت متن مقالات و رتبه‌بندی را از راه دور فراخوانی کند."
                  checked={rankingSettings.enable_mcp_server}
                  onChange={(val) => setRankingSettings({ ...rankingSettings, enable_mcp_server: val })}
                />
              </div>

              {rankingSettings.enable_mcp_server && (
                <>
                  {/* آدرس اندپوینت سرور */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      نشانی اندپوینت رسمی MCP سرور سایت شما (Endpoint URL):
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        readOnly
                        value={settingsUrls.mcp_endpoint || 'https://domain.ir/wp-json/omni-ai/v1/mcp'}
                        style={{
                          flex: 1,
                          direction: 'ltr',
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                        }}
                      />
                      <Button
                        variant="secondary"
                        onClick={() => copyToClipboard(settingsUrls.mcp_endpoint || '', 'mcp_url')}
                      >
                        {copiedKey === 'mcp_url' ? 'کپی شد! ✓' : 'کپی آدرس'}
                      </Button>
                    </div>
                  </div>

                  {/* ابزارهای آماده در سرور MCP */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                      ابزارهای ارائه شده توسط این سرور به مدل‌های هوش مصنوعی (Exposed Tools):
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                        <code style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700 }}>search_posts(query, limit)</code>
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748b' }}>
                          جستجوی هوشمند در تمام مقالات منتشرشده با کلیدواژه و بازگرداندن چکیده و شناسه نوشته.
                        </p>
                      </div>

                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                        <code style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700 }}>get_post(id)</code>
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748b' }}>
                          واکشی متن کامل، تمیز و بدون کدهای اضافی مقاله برای مطالعه توسط چت‌بات یا ایجنت.
                        </p>
                      </div>

                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                        <code style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700 }}>get_site_summary()</code>
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748b' }}>
                          خلاصه کل محتوا، ساختار مقالات و عناوین اصلی مطابق استاندارد llms.txt.
                        </p>
                      </div>

                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                        <code style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700 }}>get_content_ranking(id)</code>
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748b' }}>
                          ارزیابی آنلاین نمرات SEO ،AEO و GEO نوشته همراه با توصیه‌های اصلاحی.
                        </p>
                      </div>

                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                        <code style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>create_post(title, content, slug, ...)</code>
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748b' }}>
                          ایجاد و انتشار مقاله در وردپرس طبق قوانین هوشمند سئو و بررسی عدم تکراری بودن.
                        </p>
                      </div>

                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                        <code style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: 700 }}>set_featured_image(post_id, alt, ...)</code>
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748b' }}>
                          آپلود تصویر و تکمیل ۱۰۰٪ متادیتا (متن Alt، عنوان، توضیح و کپشن) برای سئو.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* قوانین هوشمند ایجاد و انتشار مقاله توسط دستیارهای هوش مصنوعی */}
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span className="dashicons dashicons-shield" style={{ color: '#0284c7', fontSize: '18px' }}></span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>قوانین هوشمند انتشار مقاله توسط هوش مصنوعی (MCP Publishing Rules):</strong>
                    </div>
                    <ul style={{ margin: 0, paddingRight: '20px', fontSize: '12px', color: '#334155', lineHeight: 1.8 }}>
                      <li><strong>نامک انگلیسی (English Slug):</strong> نشانی URL تمامی مقالات تولیدی اجباراً با حروف انگلیسی و خط تیره (kebab-case) ساخته می‌شود تا از کاراکترهای نامناسب فارسی در پیوندها جلوگیری شود.</li>
                      <li><strong>تکمیل کامل اطلاعات تصویر (Image Metadata):</strong> تصاویر با متن جایگزین (Alt Text)، عنوان رسانه و کپشن اختصاصی ثبت می‌شوند تا سئوی تصاویر و استاندارد دسترسی‌پذیری کامل رعایت گردد.</li>
                      <li><strong>جلوگیری از محتوای تکراری (Duplicate Prevention):</strong> پیش از انتشار، بررسی خودکار روی عنوان و بدنه انجام می‌شود تا از بازنشر مقالات تکراری یا کپی‌برداری داخلی جلوگیری به عمل آید.</li>
                      <li><strong>ارزیابی و امتیازدهی لحظه‌ای:</strong> بلافاصله پس از ایجاد هر مقاله، رتبه کیفی سئو ارگانیک، موتورهای پاسخگو (AEO) و موتورهای هوش مصنوعی (GEO) محاسبه و گزارش می‌شود.</li>
                    </ul>
                  </div>

                  {/* راهنمای سازگاری پروتکل MCP با تمام ایجنت‌ها و نرم‌افزارها */}
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="dashicons dashicons-info" style={{ color: '#059669', fontSize: '18px' }}></span>
                      <strong style={{ fontSize: '13px', color: '#065f46' }}>آیا پروتکل MCP فقط برای کلاد (Claude) است یا سایر هوش‌های مصنوعی؟</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#047857', lineHeight: 1.6 }}>
                      خیر! پروتکل <strong>Model Context Protocol (MCP)</strong> یک استاندارد باز جهانی و مشترک در صنعت هوش مصنوعی است. این اندپوینت علاوه بر Claude Desktop، به شکل کامل توسط <strong>Cursor IDE</strong>، <strong>Google Antigravity</strong>، <strong>Windsurf</strong>، <strong>VS Code (Cline / Continue)</strong> و فریم‌ورک‌های توسعه چند ایجنتی نظیر <strong>LangChain</strong>، <strong>LlamaIndex</strong> و <strong>CrewAI</strong> پشتیبانی می‌شود. هر ایجنت با اتصال به این سرور می‌تواند مقالات سایت شما را بخواند و تحلیل نماید.
                    </p>
                  </div>

                  {/* تب‌های انتخاب کلاینت برای کانفیگ اتصال */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <Button
                        isSmall
                        variant={mcpClientTab === 'claude' ? 'primary' : 'secondary'}
                        onClick={() => setMcpClientTab('claude')}
                      >
                        Claude Desktop
                      </Button>
                      <Button
                        isSmall
                        variant={mcpClientTab === 'cursor' ? 'primary' : 'secondary'}
                        onClick={() => setMcpClientTab('cursor')}
                      >
                        Cursor IDE (.cursor/mcp.json)
                      </Button>
                      <Button
                        isSmall
                        variant={mcpClientTab === 'antigravity' ? 'primary' : 'secondary'}
                        onClick={() => setMcpClientTab('antigravity')}
                      >
                        Antigravity / Gemini CLI
                      </Button>
                      <Button
                        isSmall
                        variant={mcpClientTab === 'agents' ? 'primary' : 'secondary'}
                        onClick={() => setMcpClientTab('agents')}
                      >
                        پایتون / LangChain / ایجنت‌ها
                      </Button>
                    </div>

                    {mcpClientTab === 'claude' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label style={{ fontSize: '13px', fontWeight: 700 }}>
                            پیکربندی برای Claude Desktop (فایل claude_desktop_config.json):
                          </label>
                          <Button
                            isSmall
                            variant="secondary"
                            onClick={() => copyToClipboard(mcpClaudeConfig || '{\n  "mcpServers": {\n    "wordpress-omni-ai": {\n      "url": "' + (settingsUrls.mcp_endpoint || '') + '",\n      "type": "http"\n    }\n  }\n}', 'claude_config')}
                          >
                            {copiedKey === 'claude_config' ? 'کپی شد! ✓' : 'کپی کانفیگ JSON'}
                          </Button>
                        </div>
                        <pre
                          style={{
                            background: '#0f172a',
                            color: '#f8fafc',
                            padding: '12px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            direction: 'ltr',
                            textAlign: 'left',
                            margin: 0,
                          }}
                        >
                          {mcpClaudeConfig || '{\n  "mcpServers": {\n    "wordpress-omni-ai": {\n      "url": "' + (settingsUrls.mcp_endpoint || '') + '",\n      "type": "http"\n    }\n  }\n}'}
                        </pre>
                      </div>
                    )}

                    {mcpClientTab === 'cursor' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label style={{ fontSize: '13px', fontWeight: 700 }}>
                            پیکربندی برای Cursor IDE (فایل .cursor/mcp.json در ریشه پروژه):
                          </label>
                          <Button
                            isSmall
                            variant="secondary"
                            onClick={() => copyToClipboard(JSON.stringify({
                              mcpServers: {
                                "wordpress-omni-ai": {
                                  url: settingsUrls.mcp_endpoint || 'https://domain.ir/wp-json/omni-ai/v1/mcp',
                                }
                              }
                            }, null, 2), 'cursor_config')}
                          >
                            {copiedKey === 'cursor_config' ? 'کپی شد! ✓' : 'کپی کانفیگ Cursor'}
                          </Button>
                        </div>
                        <pre
                          style={{
                            background: '#0f172a',
                            color: '#f8fafc',
                            padding: '12px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            direction: 'ltr',
                            textAlign: 'left',
                            margin: 0,
                          }}
                        >
{`{
  "mcpServers": {
    "wordpress-omni-ai": {
      "url": "${settingsUrls.mcp_endpoint || 'https://domain.ir/wp-json/omni-ai/v1/mcp'}"
    }
  }
}`}
                        </pre>
                      </div>
                    )}

                    {mcpClientTab === 'antigravity' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label style={{ fontSize: '13px', fontWeight: 700 }}>
                            پیکربندی برای Antigravity / Gemini CLI (تنظیمات MCP Servers):
                          </label>
                          <Button
                            isSmall
                            variant="secondary"
                            onClick={() => copyToClipboard(JSON.stringify({
                              mcpServers: {
                                "wordpress-omni-ai": {
                                  url: settingsUrls.mcp_endpoint || 'https://domain.ir/wp-json/omni-ai/v1/mcp',
                                }
                              }
                            }, null, 2), 'antigravity_config')}
                          >
                            {copiedKey === 'antigravity_config' ? 'کپی شد! ✓' : 'کپی کانفیگ JSON'}
                          </Button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px' }}>
                          این کانفیگ را در فایل تنظیمات MCP ابزار خود وارد کنید تا هوش مصنوعی به ابزارهای <code>search_posts</code> و <code>get_post</code> و <code>get_content_ranking</code> متصل گردد:
                        </p>
                        <pre
                          style={{
                            background: '#0f172a',
                            color: '#f8fafc',
                            padding: '12px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            direction: 'ltr',
                            textAlign: 'left',
                            margin: 0,
                          }}
                        >
{`{
  "mcpServers": {
    "wordpress-omni-ai": {
      "url": "${settingsUrls.mcp_endpoint || 'https://domain.ir/wp-json/omni-ai/v1/mcp'}"
    }
  }
}`}
                        </pre>
                      </div>
                    )}

                    {mcpClientTab === 'agents' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label style={{ fontSize: '13px', fontWeight: 700 }}>
                            نمونه اتصال در پایتون (Python HTTP JSON-RPC Client):
                          </label>
                          <Button
                            isSmall
                            variant="secondary"
                            onClick={() => copyToClipboard(`import requests

ENDPOINT = "${settingsUrls.mcp_endpoint || 'https://domain.ir/wp-json/omni-ai/v1/mcp'}"

# 1. فراخوانی لیست ابزارهای وردپرس
tools_res = requests.post(ENDPOINT, json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"}).json()
print("Tools:", [t["name"] for t in tools_res["result"]["tools"]])

# 2. جستجوی مقالات در وردپرس
search_res = requests.post(ENDPOINT, json={
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {"name": "search_posts", "arguments": {"query": "سئو", "limit": 3}}
}).json()
print("Articles:", search_res["result"]["content"][0]["text"])`, 'python_snippet')}
                          >
                            {copiedKey === 'python_snippet' ? 'کپی شد! ✓' : 'کپی کد Python'}
                          </Button>
                        </div>
                        <pre
                          style={{
                            background: '#0f172a',
                            color: '#f8fafc',
                            padding: '12px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            direction: 'ltr',
                            textAlign: 'left',
                            margin: 0,
                          }}
                        >
{`import requests

ENDPOINT = "${settingsUrls.mcp_endpoint || 'https://domain.ir/wp-json/omni-ai/v1/mcp'}"

# 1. لیست ابزارها (tools/list)
tools = requests.post(ENDPOINT, json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"}).json()

# 2. اجرای ابزار جستجو یا استخراج مقاله در وردپرس
res = requests.post(ENDPOINT, json={
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {"name": "search_posts", "arguments": {"query": "هوش مصنوعی", "limit": 5}}
}).json()
print(res["result"]["content"][0]["text"])`}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <Button
                  variant="primary"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  style={{ minWidth: '150px' }}
                >
                  {savingSettings ? <Spinner /> : 'ذخیره تنظیمات MCP'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ۴. مودال تحلیل جزئیات و رفع خودکار با هوش مصنوعی */}
      {activeModalPost && (
        <Modal
          title={`تحلیل رتبه محتوا: ${activeModalPost.title}`}
          onRequestClose={() => setActiveModalPost(null)}
          className="omni-ranking-react-modal"
          style={{ maxWidth: '900px', width: '90%' }}
        >
          {modalLoading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spinner />
              <p style={{ marginTop: '12px', color: '#64748b' }}>در حال واکشی اطلاعات و استخراج چک‌لیست...</p>
            </div>
          ) : (
            <div
              id="omni-modal-content-area"
              dangerouslySetInnerHTML={{ __html: modalHtml }}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
