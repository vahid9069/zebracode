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

const KNOWN_CATEGORY_COLORS = {
  tools: '#0284c7',
  security: '#dc2626',
  'tech-trends': '#0f766e',
  development: '#16a34a',
  data: '#d97706',
  network: '#7c3aed',
  ai: '#4f46e5',
  programming: '#059669',
  cloud: '#2563eb',
  productivity: '#0891b2',
};

const DYNAMIC_PALETTE = [
  '#0284c7',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0f766e',
  '#4f46e5',
  '#ea580c',
  '#0891b2',
  '#db2777',
];

export function getCategoryStyle(slug = '', index = 0) {
  const cleanSlug = String(slug || '').toLowerCase().trim();
  if (KNOWN_CATEGORY_COLORS[cleanSlug]) {
    return {
      color: KNOWN_CATEGORY_COLORS[cleanSlug],
      bg: `${KNOWN_CATEGORY_COLORS[cleanSlug]}14`,
      border: `${KNOWN_CATEGORY_COLORS[cleanSlug]}33`,
    };
  }
  const color = DYNAMIC_PALETTE[Math.abs(index) % DYNAMIC_PALETTE.length];
  return {
    color,
    bg: `${color}14`,
    border: `${color}33`,
  };
}

const PILLAR_LABELS = {
  'Tool-Led': { label: 'ابزار محور', color: '#0284c7' },
  'Problem-Solving': { label: 'حل مسئله', color: '#16a34a' },
  'Comparison': { label: 'مقایسه‌ای', color: '#d97706' },
  'Trend': { label: 'ترند و آینده', color: '#7c3aed' },
};

export default function ContentCalendar({ categories = [], onSelectTopic }) {
  const [items, setItems] = useState([]);
  const [existingTopics, setExistingTopics] = useState([]);
  const [syncedTools, setSyncedTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [aiJsonInput, setAiJsonInput] = useState('');
  const [aiPromptCopied, setAiPromptCopied] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Web Trends / RSS-to-Article state
  const [trendCat, setTrendCat] = useState('ai');
  const [trendFeeds, setTrendFeeds] = useState({});
  const [trendItems, setTrendItems] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [generatingTrendLink, setGeneratingTrendLink] = useState(null);
  const [showFeedEditor, setShowFeedEditor] = useState(false);

  // Live Categories State initialized from prop or window.omniAiData
  const [liveCategories, setLiveCategories] = useState(() => {
    if (Array.isArray(categories) && categories.length > 0) return categories;
    if (Array.isArray(window.omniAiData?.categories) && window.omniAiData.categories.length > 0) {
      return window.omniAiData.categories;
    }
    return [];
  });

  // Daily High-Frequency Publishing controls
  const [durationDays, setDurationDays] = useState(30);
  const [postsPerDay, setPostsPerDay] = useState(2);

  const adminUrl = window?.omniAiData?.adminUrl || '/wp-admin/';

  // Enriched categories with dynamic palette styling
  const enrichedCategories = (liveCategories.length > 0 ? liveCategories : [
    { slug: 'tools', name: 'ابزارها و بهره‌وری' },
    { slug: 'security', name: 'امنیت کاربردی' },
    { slug: 'tech-trends', name: 'تازه‌ها و ترندهای فناوری' },
    { slug: 'development', name: 'توسعه و برنامه‌نویسی' },
    { slug: 'data', name: 'داده و ساختار' },
    { slug: 'network', name: 'شبکه، وب و API' },
  ]).map((c, idx) => {
    const style = getCategoryStyle(c.slug, idx);
    return {
      id: c.id,
      slug: c.slug || `cat-${c.id}`,
      name: c.name || `دسته #${c.id}`,
      count: typeof c.count === 'number' ? c.count : 0,
      description: c.description || '',
      color: style.color,
      bg: style.bg,
      border: style.border,
    };
  });

  // New item form state
  const [newItem, setNewItem] = useState({
    day_slot: '',
    week: '',
    title: '',
    focus_keyword: '',
    category_slug: enrichedCategories[0]?.slug || 'tools',
    pillar: 'Tool-Led',
    notes: '',
  });

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('calendar');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.items)) {
        setItems(data.items);
        if (Array.isArray(data.existing_topics)) {
          setExistingTopics(data.existing_topics);
        }
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setLiveCategories(data.categories);
        }
      }
    } catch (err) {
      setNotice({ type: 'error', text: __('خطا در دریافت تقویم محتوایی.', 'omni-ai-suite') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();

    // Fetch dynamic live categories
    apiFetch('categories')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setLiveCategories(data.categories);
        }
      })
      .catch((err) => console.log('Could not load categories in Calendar:', err));

    // Fetch synced tools for tool-led topic planning
    apiFetch('tools')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.tools)) {
          setSyncedTools(data.tools);
        }
      })
      .catch((err) => console.log('Could not load tools for calendar:', err));
  }, []);

  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      setLiveCategories(categories);
    }
  }, [categories]);

  const totalCalculatedPosts = durationDays * postsPerDay;

  const handleCopyAiPrompt = () => {
    const totalPosts = durationDays * postsPerDay;

    // Available synced tools for Tool-Led topics
    let toolsSection = '';
    if (syncedTools && syncedTools.length > 0) {
      const toolNames = syncedTools.slice(0, 30).map((t) => `- ${t.title} (${t.domain}/${t.slug})`).join('\n');
      toolsSection = `

### 🛠 ابزارهای آنلاین فعال سایت جهت تولید مقالات ابزارمحور (Tool-Led & Problem-Solving):
در سایت ما ابزارهای توسعه‌دهنده زیر فعال هستند. حتماً در دسته "tools" و مقالات پیلار "Tool-Led"، آموزش‌ها و راهنماهایی اختصاص دهید که مستقیماً مسائل کاربران را با معرفی این ابزارها حل کنند:
${toolNames}`;
    }

    // Layer 1: Anti-duplication & Keyword Cannibalization Guard
    let antiDuplicationSection = '';
    if (existingTopics && existingTopics.length > 0) {
      const sampleTopics = existingTopics.slice(0, 50).map((t, idx) => {
        const kwPart = t.keyword ? ` (کلمه کلیدی: ${t.keyword})` : '';
        return `${idx + 1}. ${t.title}${kwPart}`;
      }).join('\n');

      antiDuplicationSection = `

### 🚫 قانون عدم تکرار و جلوگیری از Keyword Cannibalization:
موضوعات و کلمات کلیدی زیر قبلاً در سایت پوشش داده شده‌اند یا در تقویم وجود دارند. اکیداً از تولید موضوعات تکراری، همپوشان یا بازنویسی این موارد خودداری کن و حتماً زوایای کاملاً جدید، کاربردی و مکمل ارائه بده:
${sampleTopics}`;
    }

    const catListText = enrichedCategories.length > 0
      ? enrichedCategories.map((c, idx) => {
          const desc = c.description ? `: ${c.description}` : '';
          return `${idx + 1}. "${c.slug}" (${c.name}${desc})`;
        }).join('\n')
      : '1. "tools" (ابزارها و بهره‌وری)\n2. "security" (امنیت کاربردی)\n3. "tech-trends" (تازه‌ها و ترندهای فناوری)\n4. "development" (توسعه و برنامه‌نویسی)\n5. "data" (داده و ساختار)\n6. "network" (شبکه، وب و API)';

    const totalCats = enrichedCategories.length || 6;
    const perCatTarget = Math.max(1, Math.round(totalPosts / totalCats));
    const firstCatSlug = enrichedCategories[0]?.slug || 'tools';

    const prompt = `You are an elite SEO/AEO content strategist and senior technical editor for a high-traffic developer tools & programming publication.
Please generate a strategic high-frequency daily content calendar for ${durationDays} days with ${postsPerDay} article(s) published per day (total ${totalPosts} articles), strictly organized across these ${totalCats} categories:
${catListText}

Requirements:
- High-Frequency Daily Publishing: Exactly ${postsPerDay} article(s) per day for ${durationDays} days (total ${totalPosts} topics).
- In "day_slot", explicitly specify the day and daily publishing slot in Persian:
  ${postsPerDay === 1
    ? 'e.g. "روز ۱", "روز ۲", "روز ۳", ...'
    : postsPerDay === 2
    ? 'e.g. "روز ۱ - نوبت ۱ (صبح)", "روز ۱ - نوبت ۲ (عصر)", "روز ۲ - نوبت ۱ (صبح)", "روز ۲ - نوبت ۲ (عصر)", ...'
    : 'e.g. "روز ۱ - نوبت ۱ (صبح)", "روز ۱ - نوبت ۲ (ظهر)", "روز ۱ - نوبت ۳ (عصر)", ...'
  }
- Balance topics evenly across all ${totalCats} categories (~${perCatTarget} topics per category).
- Diverse Content Pillars: 'Tool-Led', 'Problem-Solving', 'Comparison', 'Trend'.
- High-intent Persian (Farsi) article titles with attractive, modern developer wording.
- Explicit focus_keyword for each article.
- Output ONLY a valid JSON array of objects with no conversational markdown text:${toolsSection}${antiDuplicationSection}

[
  {
    "day_slot": "روز ۱ - نوبت ۱ (صبح)",
    "title": "۱۰ ابزار ضروری و آنلاین برای توسعه‌دهندگان وب در سال ۲۰۲۶",
    "focus_keyword": "ابزارهای آنلاین توسعه دهنده",
    "category_slug": "${firstCatSlug}",
    "pillar": "Tool-Led",
    "notes": "معرفی ابزارهای کاربردی و راهکارهای آنلاین برای توسعه‌دهندگان"
  }
]`;

    navigator.clipboard.writeText(prompt);
    setAiPromptCopied(true);
    setTimeout(() => setAiPromptCopied(false), 2500);
  };

  const handleSelectTopic = (item) => {
    if (item.status === 'completed') {
      const ok = window.confirm(
        `این موضوع («${item.title}») قبلاً به صورت مقاله تولید شده است.\nآیا مطمئن هستید که می‌خواهید دوباره آن را در استودیو بارگذاری کرده و مقاله جدیدی بر اساس آن بسازید؟`
      );
      if (!ok) return;
    }
    if (onSelectTopic) {
      onSelectTopic(item);
    }
  };

  const handleBulkImport = async (mode = 'append') => {
    const raw = aiJsonInput.trim();
    if (!raw) {
      setNotice({ type: 'error', text: __('لطفاً ابتدا کد JSON تقویم را در کادر وارد کنید.', 'omni-ai-suite') });
      return;
    }

    try {
      let cleaned = raw.replace(/^```(?:json)?\s*(.*?)\s*```$/ms, '$1').trim();
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(__('ساختار JSON باید آرایه‌ای از موضوعات باشد.', 'omni-ai-suite'));
      }

      const normalized = parsed.map((item, idx) => {
        const slot = item.day_slot || item.week || item.slot || `روز ${idx + 1}`;
        return {
          ...item,
          day_slot: slot,
          week: slot,
        };
      });

      const res = await apiFetch('calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_import',
          mode,
          items: normalized,
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        setItems(data.items || []);
        setAiJsonInput('');
        setShowAiDrawer(false);
        setNotice({ type: 'success', text: data.message || __('موضوعات با موفقیت به تقویم اضافه شدند.', 'omni-ai-suite') });
      } else {
        throw new Error(data?.message || __('خطا در ذخیره موضوعات.', 'omni-ai-suite'));
      }
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || __('فرمت JSON وارد شده نامعتبر است.', 'omni-ai-suite') });
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await apiFetch('calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status', id }),
      });
      const data = await res.json();
      if (data && data.success) {
        setItems(data.items || []);
      }
    } catch (_) {}
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm(__('آیا از حذف این موضوع اطمینان دارید؟', 'omni-ai-suite'))) {
      return;
    }
    try {
      const res = await apiFetch('calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data && data.success) {
        setItems(data.items || []);
        setNotice({ type: 'success', text: __('موضوع با موفقیت حذف شد.', 'omni-ai-suite') });
      }
    } catch (_) {}
  };

  const handleResetDefault = async () => {
    if (!window.confirm(__('آیا می‌خواهید تقویم به ۱۲ موضوع استاندارد بازنشانی شود؟', 'omni-ai-suite'))) {
      return;
    }
    try {
      const res = await apiFetch('calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (data && data.success) {
        setItems(data.items || []);
        setNotice({ type: 'success', text: __('تقویم با ۱۲ موضوع پیشنهادی بازنشانی شد.', 'omni-ai-suite') });
      }
    } catch (_) {}
  };

  const handleAddSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newItem.title.trim()) {
      setNotice({ type: 'error', text: __('عنوان موضوع الزامی است.', 'omni-ai-suite') });
      return;
    }

    try {
      const res = await apiFetch('calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          item: newItem,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        setItems(data.items || []);
        setShowAddForm(false);
        setNewItem({
          day_slot: '',
          week: '',
          title: '',
          focus_keyword: '',
          category_slug: 'tools',
          pillar: 'Tool-Led',
          notes: '',
        });
        setNotice({ type: 'success', text: __('موضوع جدید به تقویم اضافه شد.', 'omni-ai-suite') });
      }
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || __('خطا در افزودن موضوع.', 'omni-ai-suite') });
    }
  };

  // Category counts mapping from live enriched WordPress categories
  const categoryStats = enrichedCategories.map((cat) => ({
    ...cat,
    realName: cat.name,
    postCount: cat.count,
  }));

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (filterCat !== 'all' && item.category_slug !== filterCat) {
      return false;
    }
    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchKey = (item.focus_keyword || '').toLowerCase().includes(q);
      if (!matchTitle && !matchKey) {
        return false;
      }
    }
    return true;
  });

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const plannedCount = items.filter((i) => i.status !== 'completed').length;

  return (
    <div className="omni-content-calendar">
      {notice && (
        <div style={{ marginBottom: '16px' }}>
          <Notice status={notice.type || 'info'} isDismissible onDismiss={() => setNotice(null)}>
            {notice.text}
          </Notice>
        </div>
      )}

      {/* 1. Category Balance Bar */}
      <Card style={{ marginBottom: '18px' }}>
        <CardHeader style={{ padding: '12px 18px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span style={{ fontSize: '15px' }}>⚖️</span>
              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                توازن دسته‌بندی‌ها:
              </strong>
              <span dir="ltr" style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                (Category Balance)
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748b', flex: '1 1 280px', textAlign: 'left' }}>
              روی هر دسته کلیک کنید تا موضوعات تقویم فیلتر شوند. دسته‌های بدون مقاله با نشانگر زرد مشخص شده‌اند.
            </span>
          </div>
        </CardHeader>
        <CardBody style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {categoryStats.map((cat) => {
              const isZero = cat.postCount === 0;
              const isActive = filterCat === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setFilterCat(filterCat === cat.slug ? 'all' : cat.slug)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isActive ? '#0284c7' : (isZero ? '#fffbeb' : '#f8fafc'),
                    color: isActive ? '#ffffff' : (isZero ? '#b45309' : '#334155'),
                    border: isActive ? '1px solid #0284c7' : (isZero ? '1px solid #fcd34d' : '1px solid #e2e8f0'),
                    boxShadow: isActive ? '0 1px 3px rgba(2, 132, 199, 0.25)' : 'none',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isActive ? '#ffffff' : (isZero ? '#f59e0b' : cat.color),
                    }}
                  />
                  <span>{cat.realName}</span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(255,255,255,0.2)' : (isZero ? '#fef3c7' : '#e2e8f0'),
                      color: isActive ? '#ffffff' : (isZero ? '#92400e' : '#475569'),
                    }}
                  >
                    {isZero ? '۰ نوشته (نیاز به مقاله)' : `${cat.postCount} نوشته`}
                  </span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Web Trends / Generate Article from Latest Internet News by Category */}
      <Card style={{ marginBottom: '20px', border: '1px solid #c7d2fe', borderRadius: '10px', background: '#f8fafc' }}>
        <CardHeader style={{ background: '#eef2ff', borderBottom: '1px solid #c7d2fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#312e81' }}>
              🌐 شکار مطالب جدید اینترنت و تبدیل به مقاله (بر اساس دسته‌بندی)
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={trendCat}
                onChange={(e) => setTrendCat(e.target.value)}
                style={{ height: '32px', borderRadius: '6px', border: '1px solid #a5b4fc', padding: '0 10px', fontSize: '12px' }}
              >
                {enrichedCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <Button
                variant="primary"
                size="small"
                disabled={loadingTrends}
                onClick={async () => {
                  setLoadingTrends(true);
                  setNotice(null);
                  try {
                    const res = await apiFetch(`web-trends?category=${encodeURIComponent(trendCat)}`);
                    const data = await res.json();
                    if (data && data.success) {
                      setTrendFeeds(data.feeds || {});
                      setTrendItems(Array.isArray(data.items) ? data.items : []);
                      if (!data.items || data.items.length === 0) {
                        setNotice({ type: 'warning', text: 'مطلبی از فیدهای این دسته دریافت نشد. می‌توانید آدرس RSS دلخواه اضافه کنید.' });
                      }
                    }
                  } catch (err) {
                    setNotice({ type: 'error', text: err?.message || 'خطا در دریافت اخبار جدید' });
                  } finally {
                    setLoadingTrends(false);
                  }
                }}
              >
                {loadingTrends ? 'در حال دریافت...' : '🔍 دریافت مطالب جدید اینترنت'}
              </Button>
              <Button variant="secondary" size="small" onClick={() => setShowFeedEditor(!showFeedEditor)}>
                {showFeedEditor ? 'بستن منابع RSS' : '⚙️ ویرایش منابع RSS'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody style={{ padding: '14px 18px' }}>
          {showFeedEditor && (
            <div style={{ marginBottom: '14px', padding: '12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                آدرس فیدهای RSS/Atom برای دسته «{trendCat}» (هر آدرس در یک خط):
              </label>
              <textarea
                rows={3}
                value={trendFeeds[trendCat] || ''}
                onChange={(e) => setTrendFeeds({ ...trendFeeds, [trendCat]: e.target.value })}
                style={{ width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '8px', fontSize: '12px', direction: 'ltr', marginBottom: '8px' }}
              />
              <Button
                variant="secondary"
                size="small"
                onClick={async () => {
                  try {
                    const res = await apiFetch('web-trends', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'save_feeds', category: trendCat, urls: trendFeeds[trendCat] || '' }),
                    });
                    const data = await res.json();
                    if (data?.success) setNotice({ type: 'success', text: data.message });
                  } catch (_) {}
                }}
              >
                ذخیره منابع RSS این دسته
              </Button>
            </div>
          )}

          {trendItems.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {trendItems.map((item, idx) => (
                <div key={`${item.link}-${idx}`} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                      {item.source} {item.date ? `• ${item.date}` : ''}
                    </div>
                    <a href={item.link} target="_blank" rel="noreferrer" style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', textDecoration: 'none', display: 'block', marginBottom: '6px' }}>
                      {item.title}
                    </a>
                    {item.summary && (
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: 1.5 }}>{item.summary}</p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    disabled={generatingTrendLink === item.link}
                    onClick={async () => {
                      setGeneratingTrendLink(item.link);
                      setNotice(null);
                      try {
                        const res = await apiFetch('web-trends', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'generate_from_trend',
                            category: trendCat,
                            title: item.title,
                            link: item.link,
                            summary: item.summary,
                          }),
                        });
                        const data = await res.json();
                        if (data && data.success) {
                          setNotice({
                            type: 'success',
                            text: `✅ پیش‌نویس «${data.title}» ساخته شد (شناسه: ${data.post_id}).`,
                          });
                        } else {
                          setNotice({ type: 'error', text: data?.message || 'خطا در تولید مقاله' });
                        }
                      } catch (err) {
                        setNotice({ type: 'error', text: err?.message || 'خطا در ارتباط با سرور' });
                      } finally {
                        setGeneratingTrendLink(null);
                      }
                    }}
                  >
                    {generatingTrendLink === item.link ? 'در حال نگارش با AI...' : '✨ تولید پیش‌نویس مقاله فارسی'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              دسته مورد نظر را انتخاب کرده و روی «دریافت مطالب جدید اینترنت» بزنید تا تازه‌ترین مقالات منتشرشده در وب را ببینید و با یک کلیک به مقاله فارسی تبدیل کنید.
            </p>
          )}
        </CardBody>
      </Card>

      {/* 2. Calendar Header & Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: '15px', color: '#0f172a' }}>
            📅 تقویم و پلنر موضوعات هوشمند
          </strong>
          <span style={{ fontSize: '12px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
            {items.length} موضوع کل
          </span>
          <span style={{ fontSize: '12px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
            {completedCount} تولید شده
          </span>
          <span style={{ fontSize: '12px', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
            {plannedCount} در انتظار
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => setShowAddForm((p) => !p)}
            style={{ height: '36px', fontSize: '12.5px' }}
          >
            {showAddForm ? '✕ بستن فرم' : '+ افزودن موضوع دستی'}
          </Button>

          <Button
            variant="primary"
            onClick={() => setShowAiDrawer((p) => !p)}
            style={{ height: '36px', fontSize: '12.5px', background: '#0284c7' }}
          >
            {showAiDrawer ? '✕ بستن پلنر هوش مصنوعی' : '✨ پرامپت تولید تقویم با AI'}
          </Button>

          <Button
            variant="tertiary"
            onClick={handleResetDefault}
            style={{ height: '36px', fontSize: '12px', color: '#64748b' }}
            title="بازنشانی تقویم به ۱۲ موضوع استاندارد"
          >
            بازنشانی پیش‌فرض
          </Button>
        </div>
      </div>

      {/* 3. AI Calendar Generator Drawer (Collapsed by default) */}
      {showAiDrawer && (
        <Card style={{ marginBottom: '18px', border: '1px solid #38bdf8' }}>
          <CardHeader style={{ background: '#f0f9ff', padding: '12px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🤖</span>
                <strong style={{ fontSize: '13.5px', color: '#0369a1' }}>
                  تولید هوشمند تقویم محتوایی با فرکانس روزانه (ChatGPT / Claude / Gemini)
                </strong>
              </div>
              <Button
                variant="primary"
                onClick={handleCopyAiPrompt}
                style={{ height: '34px', fontSize: '12px', background: '#0284c7' }}
              >
                {aiPromptCopied ? `✓ پرامپت (${totalCalculatedPosts} مقاله) کپی شد!` : '📋 کپی پرامپت تولید تقویم'}
              </Button>
            </div>
          </CardHeader>
          <CardBody style={{ padding: '16px' }}>
            {/* Frequency and Duration Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px', background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0369a1', marginBottom: '5px' }}>
                  تعداد روزهای تقویم:
                </label>
                <SelectControl
                  value={durationDays}
                  options={[
                    { label: '۷ روزه (تقویم ۱ هفته‌ای)', value: 7 },
                    { label: '۱۴ روزه (تقویم ۲ هفته‌ای)', value: 14 },
                    { label: '۳۰ روزه (تقویم ۱ ماهه)', value: 30 },
                  ]}
                  onChange={(val) => setDurationDays(parseInt(val, 10))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0369a1', marginBottom: '5px' }}>
                  تعداد مقاله در هر روز (فرکانس انتشار):
                </label>
                <SelectControl
                  value={postsPerDay}
                  options={[
                    { label: 'روزی ۱ مقاله', value: 1 },
                    { label: 'روزی ۲ مقاله (صبح و عصر)', value: 2 },
                    { label: 'روزی ۳ مقاله (صبح، ظهر، عصر)', value: 3 },
                  ]}
                  onChange={(val) => setPostsPerDay(parseInt(val, 10))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>مجموع مقالات محاسبه‌شده:</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                  🎯 {totalCalculatedPosts} مقاله ({durationDays} روز × روزی {postsPerDay} مقاله)
                </span>
              </div>
            </div>

            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#475569', lineHeight: '1.7' }}>
              ۱. تنظیمات روز و فرکانس انتشار در روز را مشخص کرده و روی <strong>«کپی پرامپت تولید تقویم»</strong> بالا کلیک کنید و در چت‌بات ارسال نمایید.<br />
              ۲. خروجی JSON چت‌بات را در کادر زیر پیست کرده و دکمه وارد کردن را بزنید تا مستقیماً به جدول تقویم افزوده شود:
            </p>

            <textarea
              value={aiJsonInput}
              onChange={(e) => setAiJsonInput(e.target.value)}
              placeholder="[\n  {\n    &quot;day_slot&quot;: &quot;روز ۱ - نوبت ۱ (صبح)&quot;,\n    &quot;title&quot;: &quot;عنوان مقاله...&quot;,\n    &quot;focus_keyword&quot;: &quot;کلمه کلیدی...&quot;,\n    &quot;category_slug&quot;: &quot;tools&quot;,\n    &quot;pillar&quot;: &quot;Tool-Led&quot;,\n    &quot;notes&quot;: &quot;خلاصه...&quot;\n  }\n]"
              rows={6}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '12px',
                direction: 'ltr',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                marginBottom: '12px',
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="primary"
                onClick={() => handleBulkImport('append')}
                style={{ background: '#059669', borderColor: '#047857', height: '36px', fontSize: '12.5px' }}
              >
                📥 افزودن به موضوعات فعلی (Append)
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleBulkImport('replace')}
                style={{ height: '36px', fontSize: '12.5px' }}
              >
                🔄 جایگزینی کامل تقویم (Replace All)
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 4. Manual Add Form */}
      {showAddForm && (
        <Card style={{ marginBottom: '18px', border: '1px solid #cbd5e1' }}>
          <CardHeader style={{ padding: '12px 18px', background: '#f8fafc' }}>
            <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>+ افزودن موضوع دستی به تقویم</strong>
          </CardHeader>
          <CardBody style={{ padding: '16px' }}>
            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <TextControl
                  label="روز و نوبت انتشار:"
                  placeholder="مثال: روز ۱ - نوبت ۲"
                  value={newItem.day_slot || newItem.week}
                  onChange={(val) => setNewItem({ ...newItem, day_slot: val, week: val })}
                />
                <TextControl
                  label="عنوان مقاله:"
                  placeholder="عنوان کامل مقاله به فارسی..."
                  value={newItem.title}
                  onChange={(val) => setNewItem({ ...newItem, title: val })}
                />
                <TextControl
                  label="کلمه کلیدی اصلی:"
                  placeholder="مثال: آموزش Next.js"
                  value={newItem.focus_keyword}
                  onChange={(val) => setNewItem({ ...newItem, focus_keyword: val })}
                />
                <SelectControl
                  label="دسته‌بندی هدف:"
                  value={newItem.category_slug}
                  options={enrichedCategories.map((c) => ({ label: c.name, value: c.slug }))}
                  onChange={(val) => setNewItem({ ...newItem, category_slug: val })}
                />
                <SelectControl
                  label="پیلار و رویکرد محتوا:"
                  value={newItem.pillar}
                  options={[
                    { label: 'ابزار محور (Tool-Led)', value: 'Tool-Led' },
                    { label: 'حل مسئله (Problem-Solving)', value: 'Problem-Solving' },
                    { label: 'مقایسه‌ای (Comparison)', value: 'Comparison' },
                    { label: 'ترند و آینده (Trend)', value: 'Trend' },
                  ]}
                  onChange={(val) => setNewItem({ ...newItem, pillar: val })}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <TextControl
                  label="نکات و زاویه دید (اختیاری):"
                  placeholder="نکات کلیدی برای ساخت پرامپت یا نگارش..."
                  value={newItem.notes}
                  onChange={(val) => setNewItem({ ...newItem, notes: val })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="primary" type="submit" style={{ height: '36px', background: '#0284c7' }}>
                  ذخیره در تقویم
                </Button>
                <Button variant="secondary" onClick={() => setShowAddForm(false)} style={{ height: '36px' }}>
                  انصراف
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* 5. Filter Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '14px', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ minWidth: '160px' }}>
          <SelectControl
            value={filterCat}
            options={[
              { label: 'همه دسته‌ها', value: 'all' },
              ...enrichedCategories.map((c) => ({ label: c.name, value: c.slug })),
            ]}
            onChange={(val) => setFilterCat(val)}
          />
        </div>

        <div style={{ minWidth: '140px' }}>
          <SelectControl
            value={filterStatus}
            options={[
              { label: 'همه وضعیت‌ها', value: 'all' },
              { label: 'در انتظار (Planned)', value: 'planned' },
              { label: 'تولید شده (Completed)', value: 'completed' },
            ]}
            onChange={(val) => setFilterStatus(val)}
          />
        </div>

        <div style={{ flex: 1, minWidth: '180px' }}>
          <input
            type="text"
            placeholder="جستجوی عنوان یا کلمه کلیدی..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              height: '36px',
              padding: '0 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* 6. Calendar Items Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Spinner />
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>در حال بارگذاری تقویم محتوایی...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              موضوعی یافت نشد. می‌توانید با دکمه‌های بالا موضوع جدید اضافه کنید.
            </div>
          ) : (
            <div className="omni-calendar-table-wrap">
              <table className="widefat striped" style={{ border: 'none', margin: 0, fontSize: '12.5px', width: '100%', boxSizing: 'border-box' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ width: '85px', padding: '10px 10px', whiteSpace: 'nowrap' }}>روز و نوبت</th>
                    <th style={{ minWidth: '220px', padding: '10px 10px' }}>عنوان مقاله و کلمه کلیدی</th>
                    <th style={{ width: '130px', padding: '10px 10px', whiteSpace: 'nowrap' }}>دسته‌بندی هدف</th>
                    <th style={{ width: '100px', padding: '10px 10px', whiteSpace: 'nowrap' }}>پیلار محتوا</th>
                    <th style={{ width: '90px', padding: '10px 10px', whiteSpace: 'nowrap' }}>وضعیت</th>
                    <th style={{ width: '120px', padding: '10px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => {
                    const isCompleted = item.status === 'completed';
                    const catObj = enrichedCategories.find((c) => c.slug === item.category_slug) || {
                      name: item.category_slug,
                      color: getCategoryStyle(item.category_slug).color,
                    };
                    const pillarObj = PILLAR_LABELS[item.pillar] || { label: item.pillar || 'عمومی', color: '#64748b' };
                    const slotText = item.day_slot || item.week || `روز ${index + 1}`;

                    return (
                      <tr
                        key={item.id || index}
                        style={{
                          background: isCompleted ? '#f8fafc' : 'transparent',
                          opacity: isCompleted ? 0.88 : 1,
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {/* Day / Slot */}
                        <td style={{ padding: '12px', fontWeight: 600, color: '#64748b', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#334155', padding: '2px 7px', borderRadius: '4px' }}>
                            {slotText}
                          </span>
                        </td>

                        {/* Title & Keyword */}
                        <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px', lineHeight: '1.45', wordBreak: 'break-word' }}>
                            {item.title}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {item.focus_keyword && (
                              <span style={{ fontSize: '11px', color: '#0369a1', background: '#f0f9ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                                🔑 {item.focus_keyword}
                              </span>
                            )}
                            {item.notes && (
                              <span style={{ fontSize: '11px', color: '#64748b' }} title={item.notes}>
                                📝 {item.notes.length > 50 ? item.notes.substring(0, 50) + '...' : item.notes}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11.5px',
                              fontWeight: 500,
                              color: catObj.color,
                              background: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: `1px solid ${catObj.color}33`,
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: catObj.color }} />
                            {catObj.name}
                          </span>
                        </td>

                        {/* Pillar */}
                        <td style={{ padding: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '11px', color: '#475569', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px' }}>
                            {pillarObj.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.id)}
                            style={{
                              border: isCompleted ? '1px solid #86efac' : '1px solid #fde68a',
                              cursor: 'pointer',
                              borderRadius: '12px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: isCompleted ? '#dcfce7' : '#fef3c7',
                              color: isCompleted ? '#166534' : '#92400e',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="کلیک برای تغییر وضعیت"
                          >
                            <span>{isCompleted ? '✅ تولید شده' : '⏳ در انتظار'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'left', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {isCompleted && item.post_id ? (
                              <a
                                href={`${adminUrl}post.php?post=${item.post_id}&action=edit`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  height: '28px',
                                  lineHeight: '26px',
                                  padding: '0 8px',
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  textDecoration: 'none',
                                  color: '#15803d',
                                  border: '1px solid #86efac',
                                  background: '#f0fdf4',
                                  borderRadius: '4px',
                                  fontWeight: 500,
                                }}
                                title={`مشاهده و ویرایش نوشته #${item.post_id} در وردپرس`}
                              >
                                <span>✏️ ویرایش نوشته (#{item.post_id})</span>
                              </a>
                            ) : (
                              <Button
                                variant={isCompleted ? 'secondary' : 'primary'}
                                size="small"
                                onClick={() => handleSelectTopic(item)}
                                style={{
                                  height: '28px',
                                  fontSize: '11.5px',
                                  background: isCompleted ? '#ffffff' : '#0284c7',
                                  borderColor: isCompleted ? '#cbd5e1' : '#0284c7',
                                  color: isCompleted ? '#475569' : '#ffffff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title={isCompleted ? 'تولید مجدد این مقاله در استودیو' : 'انتقال موضوع به استودیو و تولید مقاله'}
                              >
                                <span>{isCompleted ? '🔄 بازنویسی' : '✍️ ساخت مقاله'}</span>
                              </Button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: '#94a3b8',
                                fontSize: '14px',
                                borderRadius: '4px',
                              }}
                              title="حذف موضوع"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
