import { createElement, useState, useEffect } from '@wordpress/element';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  ToggleControl,
  Spinner,
  Notice,
  SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../utils/api';

const PLACEMENT_LABELS = {
  before_content: 'ابتدای مقاله (قبل از متن)',
  middle_content: 'میانه مقاله (خودکار)',
  after_paragraph: 'پس از پاراگراف مشخص',
  after_content: 'انتهای مقاله (پیش از نظرات)',
  catalog_top: 'بالای فهرست مقالات (کاتالوگ)',
  catalog_bottom: 'پایین فهرست مقالات (کاتالوگ)',
};

export default function AdsManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [rotatedTool, setRotatedTool] = useState(null);
  const [settings, setSettings] = useState({
    master_enabled: true,
    head_script_enabled: false,
    global_head_script: '',
    tool_rotation_enabled: true,
    tool_rotation_mode: 'per_post',
    tool_rotation_days: 1,
    tool_rotation_placement: 'after_content',
    tool_rotation_badge: 'پیشنهاد ویژه ابزار',
    tool_rotation_cta: 'مشاهده و استفاده رایگان',
    tool_rotation_offset: 0,
    placements_status: {
      before_content: true,
      middle_content: true,
      after_paragraph: true,
      after_content: true,
      catalog_top: true,
      catalog_bottom: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showHeadScriptDrawer, setShowHeadScriptDrawer] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterPlacement, setFilterPlacement] = useState('all');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState(() => {
    return Array.isArray(window.omniAiData?.categories) ? window.omniAiData.categories : [];
  });

  // Form modal state
  const [editingCampaign, setEditingCampaign] = useState(null); // null = closed, {} = new or edit
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    active: true,
    ad_type: 'image',
    placement: 'middle_content',
    paragraph_number: 3,
    priority: 10,
    image_url: '',
    mobile_image_url: '',
    target_url: '',
    alt_text: '',
    utm_campaign: '',
    open_new_tab: true,
    script_code: '',
    badge_text: 'پیشنهاد ویژه',
    headline: '',
    description: '',
    cta_text: 'مشاهده و شروع',
    target_categories: [],
    include_posts: '',
    exclude_posts: '',
    device: 'all',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchAdsData();

    // Fetch live categories for ad targeting
    apiFetch('categories')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.log('Could not load categories in AdsManager:', err));
  }, []);

  const fetchAdsData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('ads?mode=admin');
      const data = await res.json();
      if (data && data.success) {
        if (data.campaigns) setCampaigns(data.campaigns);
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
        setRotatedTool(data.rotated_tool || null);
      }
    } catch (err) {
      console.error('Error fetching ads data:', err);
      setNotice({ type: 'error', message: 'خطا در بارگذاری اطلاعات تبلیغات.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaster = async (val) => {
    const updated = { ...settings, master_enabled: val };
    setSettings(updated);
    await saveGlobalSettings(updated);
  };

  const handleTogglePlacement = async (placementKey) => {
    const updated = {
      ...settings,
      placements_status: {
        ...settings.placements_status,
        [placementKey]: !settings.placements_status[placementKey],
      },
    };
    setSettings(updated);
    await saveGlobalSettings(updated);
  };

  const saveGlobalSettings = async (settingsToSave) => {
    setSavingSettings(true);
    try {
      const res = await apiFetch('ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_global_settings',
          settings: settingsToSave || settings,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
        if ('rotated_tool' in data) setRotatedTool(data.rotated_tool || null);
        setNotice({ type: 'success', message: 'تنظیمات عمومی تبلیغات ذخیره شد.' });
      }
    } catch (err) {
      console.error('Error saving global ad settings:', err);
      setNotice({ type: 'error', message: 'خطا در ذخیره‌سازی تنظیمات عمومی.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleCampaignActive = async (id, currentVal) => {
    const nextVal = !currentVal;
    // Optimistic update
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: nextVal } : c))
    );

    try {
      const res = await apiFetch('ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_campaign',
          id,
          active: nextVal,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        setNotice({ type: 'success', message: data.message });
      }
    } catch (err) {
      console.error('Error toggling campaign:', err);
      // Revert on error
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: currentVal } : c))
      );
      setNotice({ type: 'error', message: 'خطا در تغییر وضعیت کمپین.' });
    }
  };

  const handleDeleteCampaign = async (id, title) => {
    if (!window.confirm(`آیا از حذف کمپین «${title}» مطمئن هستید؟`)) {
      return;
    }
    try {
      const res = await apiFetch('ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_campaign', id }),
      });
      const data = await res.json();
      if (data && data.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        setNotice({ type: 'success', message: 'کمپین با موفقیت حذف شد.' });
      }
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setNotice({ type: 'error', message: 'خطا در حذف کمپین.' });
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      id: '',
      title: '',
      active: true,
      ad_type: 'image',
      placement: 'middle_content',
      paragraph_number: 3,
      priority: (campaigns.length + 1) * 5,
      image_url: '',
      mobile_image_url: '',
      target_url: '',
      alt_text: '',
      utm_campaign: '',
      open_new_tab: true,
      script_code: '',
      badge_text: 'پیشنهاد ویژه',
      headline: '',
      description: '',
      cta_text: 'مشاهده و شروع',
      target_categories: [],
      include_posts: '',
      exclude_posts: '',
      device: 'all',
      start_date: '',
      end_date: '',
    });
    setEditingCampaign('new');
  };

  const handleOpenEdit = (c) => {
    setFormData({
      ...c,
      target_categories: Array.isArray(c.target_categories) ? c.target_categories : [],
    });
    setEditingCampaign(c.id);
  };

  const handleSaveCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('لطفاً عنوان داخلی کمپین را وارد کنید.');
      return;
    }

    try {
      const res = await apiFetch('ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_campaign',
          campaign: formData,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        setCampaigns(data.campaigns || []);
        setEditingCampaign(null);
        setNotice({ type: 'success', message: 'کمپین تبلیغاتی با موفقیت ذخیره شد.' });
      } else {
        setNotice({ type: 'error', message: data?.message || 'خطا در ذخیره‌سازی کمپین.' });
      }
    } catch (err) {
      console.error('Error saving campaign:', err);
      setNotice({ type: 'error', message: 'خطای ارتباط در ذخیره کمپین.' });
    }
  };

  const handleCategoryToggle = (slug) => {
    setFormData((prev) => {
      const current = prev.target_categories || [];
      const updated = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug];
      return { ...prev, target_categories: updated };
    });
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      c.title?.toLowerCase().includes(q) ||
      c.headline?.toLowerCase().includes(q) ||
      c.target_url?.toLowerCase().includes(q);

    const matchType = filterType === 'all' || c.ad_type === filterType;
    const matchPlacement = filterPlacement === 'all' || c.placement === filterPlacement;

    return matchSearch && matchType && matchPlacement;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spinner />
        <p style={{ marginTop: '10px', color: '#64748b' }}>در حال بارگذاری سیستم تبلیغات...</p>
      </div>
    );
  }

  return (
    <div className="omni-ads-manager" style={{ maxWidth: '1100px', margin: '0 auto', direction: 'rtl' }}>
      {notice && (
        <Notice status={notice.type} onRemove={() => setNotice(null)} style={{ marginBottom: '16px' }}>
          {notice.message}
        </Notice>
      )}

      {/* Level 1 & 2: Top Master Control Panel */}
      <div
        style={{
          background: settings.master_enabled
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : '#334155',
          borderRadius: '12px',
          padding: '22px 26px',
          color: '#f8fafc',
          marginBottom: '20px',
          border: '1px solid #334155',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>📢</span>
              <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '20px', fontWeight: 800 }}>
                مدیریت هوشمند تبلیغات و اسپانسرینگ (Ads Manager)
              </h2>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              کنترل یکپارچه بنرهای تصویری، کدهای اسکریپت شبکه‌ها (یکتانت/نجوا) و کارت‌های تبلیغاتی همسان با هدف‌گذاری دقیق.
            </p>
          </div>

          {/* Master Kill Switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: settings.master_enabled ? '#0c4a6e' : '#475569',
              padding: '10px 18px',
              borderRadius: '999px',
              border: `1px solid ${settings.master_enabled ? '#38bdf8' : '#64748b'}`,
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              {settings.master_enabled ? 'کل سیستم تبلیغات: فعال' : 'کل سیستم تبلیغات: غیرفعال'}
            </span>
            <ToggleControl
              checked={settings.master_enabled}
              onChange={handleToggleMaster}
              help=""
            />
          </div>
        </div>

        {/* Global Head Script Trigger */}
        <div style={{ marginTop: '18px', borderTop: '1px solid #334155', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            <span>🌐 اسکریپت عمومی هدر (Najva / Yektanet Script):</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '999px',
                background: settings.head_script_enabled ? '#065f46' : '#475569',
                color: settings.head_script_enabled ? '#a7f3d0' : '#cbd5e1',
                fontWeight: 600,
              }}
            >
              {settings.head_script_enabled ? 'فعال در Head' : 'غیرفعال'}
            </span>
          </div>

          <Button
            isSecondary
            onClick={() => setShowHeadScriptDrawer(!showHeadScriptDrawer)}
            style={{ fontSize: '12px', borderRadius: '6px', background: '#1e293b', color: '#38bdf8', borderColor: '#334155' }}
          >
            {showHeadScriptDrawer ? 'بستن تنظیمات اسکریپت' : '⚙️ تنظیم اسکریپت سراسری شبکه'}
          </Button>
        </div>

        {/* Head Script Drawer */}
        {showHeadScriptDrawer && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              background: '#090d16',
              borderRadius: '8px',
              border: '1px solid #1e293b',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                کد اصلی لودر شبکه تبلیغاتی (در تگ &lt;head&gt; وبلاگ تزریق می‌شود):
              </span>
              <ToggleControl
                label="فعالسازی لود این اسکریپت"
                checked={settings.head_script_enabled}
                onChange={(val) => setSettings({ ...settings, head_script_enabled: val })}
              />
            </div>
            <textarea
              rows={4}
              value={settings.global_head_script || ''}
              onChange={(e) => setSettings({ ...settings, global_head_script: e.target.value })}
              placeholder="<!-- اسکریپت اصلی یکتانت یا نجوا -->&#10;<script type='text/javascript'>...</script>"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#111827',
                color: '#f3f4f6',
                fontFamily: 'Consolas, monospace',
                fontSize: '12px',
                direction: 'ltr',
                lineHeight: '1.5',
                boxSizing: 'border-box',
                marginBottom: '10px',
              }}
            />
            <Button
              isPrimary
              onClick={() => saveGlobalSettings()}
              disabled={savingSettings}
              style={{ borderRadius: '6px' }}
            >
              {savingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات اسکریپت'}
            </Button>
          </div>
        )}
      </div>

      {/* Level 3: Placements Quick Toggles Bar */}
      <Card style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
        <CardBody style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              📍 وضعیت جایگاه‌های نمایش تبلیغات در سایت (کلیک جهت فعال/غیرفعال کردن سریع جایگاه):
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(PLACEMENT_LABELS).map(([pkey, label]) => {
              const isEnabled = settings.placements_status?.[pkey] ?? true;
              return (
                <button
                  key={pkey}
                  type="button"
                  onClick={() => handleTogglePlacement(pkey)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: `1px solid ${isEnabled ? '#38bdf8' : '#cbd5e1'}`,
                    background: isEnabled ? '#f0f9ff' : '#f1f5f9',
                    color: isEnabled ? '#0284c7' : '#94a3b8',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isEnabled ? '#0284c7' : '#94a3b8',
                    }}
                  />
                  <span>{label}</span>
                  <span style={{ fontSize: '10px', opacity: 0.85 }}>({isEnabled ? 'فعال' : 'خاموش'})</span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Auto Tool Rotation Card */}
      <Card style={{ marginBottom: '20px', border: '1px solid #bae6fd', borderRadius: '10px', background: '#f8fafc' }}>
        <CardBody style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                🔄 چرخش خودکار «پیشنهاد ویژه ابزار» (بین ابزارهای زبراکد)
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569' }}>
                به صورت خودکار هر چند روز یک‌بار یکی از ابزارهای کاتالوگ را به عنوان کارت همسان (Native) در وبلاگ نمایش می‌دهد.
              </p>
            </div>
            <ToggleControl
              label={settings.tool_rotation_enabled ? 'فعال' : 'غیرفعال'}
              checked={Boolean(settings.tool_rotation_enabled)}
              onChange={(val) => {
                const updated = { ...settings, tool_rotation_enabled: val };
                setSettings(updated);
                saveGlobalSettings(updated);
              }}
            />
          </div>

          {settings.tool_rotation_enabled && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <SelectControl
                  label="حالت چرخش"
                  value={settings.tool_rotation_mode || 'per_post'}
                  options={[
                    { label: 'متفاوت برای هر مقاله (توزیع بین همه ابزارها)', value: 'per_post' },
                    { label: 'یکسان برای کل وبلاگ (ابزار ویژه دوره)', value: 'global' },
                  ]}
                  onChange={(val) => setSettings({ ...settings, tool_rotation_mode: val })}
                />

                <SelectControl
                  label="بازه تغییر خودکار"
                  value={String(settings.tool_rotation_days ?? 1)}
                  options={[
                    { label: 'روزانه (هر ۱ روز)', value: '1' },
                    { label: 'هر ۲ روز یک‌بار', value: '2' },
                    { label: 'هر ۳ روز یک‌بار', value: '3' },
                    { label: 'هر ۵ روز یک‌بار', value: '5' },
                    { label: 'هفتگی (هر ۷ روز)', value: '7' },
                    { label: 'هر ۱۴ روز یک‌بار', value: '14' },
                    { label: 'ماهانه (هر ۳۰ روز)', value: '30' },
                  ]}
                  onChange={(val) => setSettings({ ...settings, tool_rotation_days: Number(val) || 1 })}
                />

                <SelectControl
                  label="جایگاه نمایش"
                  value={settings.tool_rotation_placement || 'after_content'}
                  options={Object.entries(PLACEMENT_LABELS).map(([k, v]) => ({ label: v, value: k }))}
                  onChange={(val) => setSettings({ ...settings, tool_rotation_placement: val })}
                />

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
                    برچسب بالای کارت (Badge)
                  </label>
                  <input
                    type="text"
                    value={settings.tool_rotation_badge || ''}
                    onChange={(e) => setSettings({ ...settings, tool_rotation_badge: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
                    متن دکمه (CTA)
                  </label>
                  <input
                    type="text"
                    value={settings.tool_rotation_cta || ''}
                    onChange={(e) => setSettings({ ...settings, tool_rotation_cta: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '10px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  {rotatedTool ? (
                    <>
                      <strong>{settings.tool_rotation_mode === 'per_post' ? 'نمونه ابزار پایه این دوره (در هر مقاله متفاوت است):' : 'ابزار فعلی این دوره:'}</strong>{' '}
                      <a href={rotatedTool.target_url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 700 }}>
                        {rotatedTool.headline}
                      </a>
                      {rotatedTool.rotation_index && rotatedTool.rotation_total ? (
                        <span style={{ color: '#64748b', marginRight: '6px' }}>
                          ({rotatedTool.rotation_index} از {rotatedTool.rotation_total})
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span>ابزار فعلی در دسترس نیست (بررسی کنید جایگاه نمایش فعال باشد).</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button
                    isSecondary
                    disabled={savingSettings}
                    onClick={() => {
                      const nextOffset = (Number(settings.tool_rotation_offset) || 0) + 1;
                      const updated = { ...settings, tool_rotation_offset: nextOffset };
                      setSettings(updated);
                      saveGlobalSettings(updated);
                    }}
                    style={{ borderRadius: '6px', fontSize: '12px' }}
                  >
                    ⏭️ تغییر به ابزار بعدی
                  </Button>
                  <Button
                    isPrimary
                    disabled={savingSettings}
                    onClick={() => saveGlobalSettings(settings)}
                    style={{ borderRadius: '6px', fontSize: '12px' }}
                  >
                    {savingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات چرخش'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Level 4: Campaigns List & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در کمپین‌ها..."
            style={{
              padding: '7px 12px',
              borderRadius: '7px',
              border: '1px solid #cbd5e1',
              minWidth: '200px',
              fontSize: '12px',
            }}
          />

          <SelectControl
            value={filterType}
            options={[
              { label: 'همه انواع تبلیغ', value: 'all' },
              { label: '🖼️ بنر تصویری', value: 'image' },
              { label: '💻 اسکریپت (نجوا/یکتانت)', value: 'script' },
              { label: '✨ کارت همسان (Native)', value: 'native' },
            ]}
            onChange={setFilterType}
            style={{ fontSize: '12px' }}
          />

          <SelectControl
            value={filterPlacement}
            options={[
              { label: 'همه جایگاه‌ها', value: 'all' },
              ...Object.entries(PLACEMENT_LABELS).map(([k, v]) => ({ label: v, value: k })),
            ]}
            onChange={setFilterPlacement}
            style={{ fontSize: '12px' }}
          />
        </div>

        <Button
          isPrimary
          onClick={handleOpenCreate}
          style={{
            background: '#0284c7',
            borderColor: '#0284c7',
            borderRadius: '7px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
          }}
        >
          <span className="dashicons dashicons-plus" style={{ fontSize: '16px', width: '16px', height: '16px' }} />
          <span>افزودن کمپین تبلیغاتی جدید</span>
        </Button>
      </div>

      {/* Campaigns Table */}
      <Card style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center' }}>اولویت</th>
                <th style={{ padding: '12px 14px', width: '85px', textAlign: 'center' }}>وضعیت</th>
                <th style={{ padding: '12px 14px', width: '110px' }}>نوع تبلیغ</th>
                <th style={{ padding: '12px 14px', width: '190px' }}>عنوان کمپین</th>
                <th style={{ padding: '12px 14px', width: '170px' }}>جایگاه نمایش</th>
                <th style={{ padding: '12px 14px' }}>هدف‌گذاری و محدودیت</th>
                <th style={{ padding: '12px 14px', width: '110px', textAlign: 'center' }}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    هیچ کمپین تبلیغاتی ثبت نشده است. روی «افزودن کمپین تبلیغاتی جدید» کلیک کنید.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => {
                  const typeBadge = {
                    image: { label: '🖼️ بنر تصویری', bg: '#e0f2fe', color: '#0369a1' },
                    script: { label: '💻 اسکریپت', bg: '#fef3c7', color: '#b45309' },
                    native: { label: '✨ کارت همسان', bg: '#f3e8ff', color: '#7e22ce' },
                  }[c.ad_type] || { label: c.ad_type, bg: '#f1f5f9', color: '#475569' };

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        opacity: c.active ? 1 : 0.6,
                        background: c.active ? '#fff' : '#fafafa',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = c.active ? '#fff' : '#fafafa')}
                    >
                      {/* Priority */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <span style={{ fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '2px 8px', borderRadius: '4px' }}>
                          {c.priority ?? 10}
                        </span>
                      </td>

                      {/* Active Toggle (Level 4: 1-Click quick pause) */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <ToggleControl
                          checked={Boolean(c.active)}
                          onChange={() => handleToggleCampaignActive(c.id, c.active)}
                          help=""
                        />
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: typeBadge.bg,
                            color: typeBadge.color,
                          }}
                        >
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Title */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{c.title}</strong>
                        {c.target_url && (
                          <a
                            href={c.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '11px', color: '#64748b', textDecoration: 'none', direction: 'ltr', display: 'inline-block' }}
                          >
                            {c.target_url.slice(0, 32)}...
                          </a>
                        )}
                      </td>

                      {/* Placement */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <span style={{ color: '#334155', fontWeight: 600 }}>
                          {PLACEMENT_LABELS[c.placement] || c.placement}
                        </span>
                        {c.placement === 'after_paragraph' && (
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                            (بعد از پاراگراف {c.paragraph_number || 3})
                          </span>
                        )}
                      </td>

                      {/* Targeting */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: '11.5px', color: '#64748b' }}>
                        <div>
                          <strong>دسته‌ها: </strong>
                          {c.target_categories && c.target_categories.length > 0
                            ? c.target_categories.join(', ')
                            : 'همه دسته‌ها'}
                        </div>
                        {c.exclude_posts && (
                          <div style={{ color: '#ef4444' }}>
                            <strong>استثنا: </strong> {c.exclude_posts}
                          </div>
                        )}
                        {c.device && c.device !== 'all' && (
                          <div>
                            <strong>دستگاه: </strong> {c.device === 'mobile' ? 'فقط موبایل' : 'فقط دسکتاپ'}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            title="ویرایش کمپین"
                            style={{
                              border: '1px solid #cbd5e1',
                              background: '#fff',
                              color: '#0284c7',
                              cursor: 'pointer',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                            }}
                          >
                            ویرایش
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(c.id, c.title)}
                            title="حذف کمپین"
                            style={{
                              border: '1px solid #fecaca',
                              background: '#fff',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                            }}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Campaign Create/Edit Modal */}
      {editingCampaign && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              padding: '24px 28px',
              direction: 'rtl',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>
                {editingCampaign === 'new' ? '➕ ایجاد کمپین تبلیغاتی جدید' : `✏️ ویرایش کمپین: ${formData.title}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCampaignSubmit}>
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>عنوان کمپین:</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: بنر دوره آموزش Next.js"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>اولویت نمایش (عدد کمتر = اولویت بالاتر):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 10 })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Type Switcher */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>نوع فرمت تبلیغ:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'image', label: '🖼️ بنر تصویری (لینکدار)' },
                    { id: 'script', label: '💻 کد اسکریپت (نجوا / یکتانت)' },
                    { id: 'native', label: '✨ کارت همسان (Native CTA)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, ad_type: t.id })}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '7px',
                        border: `1px solid ${formData.ad_type === t.id ? '#0284c7' : '#cbd5e1'}`,
                        background: formData.ad_type === t.id ? '#f0f9ff' : '#fff',
                        color: formData.ad_type === t.id ? '#0284c7' : '#475569',
                        fontWeight: formData.ad_type === t.id ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Placement */}
              <div style={{ display: 'grid', gridTemplateColumns: formData.placement === 'after_paragraph' ? '1.5fr 1fr' : '1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>جایگاه قرارگیری در صفحه:</label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    {Object.entries(PLACEMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.placement === 'after_paragraph' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>نمایش بعد از پاراگراف شماره:</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={formData.paragraph_number}
                      onChange={(e) => setFormData({ ...formData, paragraph_number: parseInt(e.target.value) || 3 })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                )}
              </div>

              {/* Conditional: IMAGE ad */}
              {formData.ad_type === 'image' && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>آدرس تصویر دسکتاپ (Image URL):</label>
                    <input
                      type="url"
                      required={formData.ad_type === 'image'}
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', direction: 'ltr', fontSize: '12.5px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>آدرس تصویر موبایل (اختیاری):</label>
                      <input
                        type="url"
                        value={formData.mobile_image_url}
                        onChange={(e) => setFormData({ ...formData, mobile_image_url: e.target.value })}
                        placeholder="https://... (اختیاری)"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', direction: 'ltr', fontSize: '12.5px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>لینک مقصد (Target URL):</label>
                      <input
                        type="url"
                        required={formData.ad_type === 'image'}
                        value={formData.target_url}
                        onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                        placeholder="https://example.com/..."
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', direction: 'ltr', fontSize: '12.5px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>متن جایگزین (Alt Text):</label>
                      <input
                        type="text"
                        value={formData.alt_text}
                        onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                        placeholder="توضیح کوتاه تصویر برای سئو"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>کمپین UTM (اختیاری):</label>
                      <input
                        type="text"
                        value={formData.utm_campaign}
                        onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                        placeholder="e.g. blog_sponsor_winter"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', direction: 'ltr', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional: SCRIPT ad */}
              {formData.ad_type === 'script' && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    کد اسکریپت یا تگ جایگاه (Snippet):
                  </label>
                  <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#64748b' }}>
                    کد کامل HTML / JavaScript ارائه‌شده توسط یکتانت، نجوا یا تپسل را در این کادر قرار دهید:
                  </p>
                  <textarea
                    rows={5}
                    required={formData.ad_type === 'script'}
                    value={formData.script_code}
                    onChange={(e) => setFormData({ ...formData, script_code: e.target.value })}
                    placeholder="<div id='pos-article-display'></div>&#10;<script type='text/javascript'>...</script>"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontFamily: 'Consolas, monospace',
                      fontSize: '12px',
                      direction: 'ltr',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Conditional: NATIVE ad */}
              {formData.ad_type === 'native' && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>بج یا نشان تبلیغ:</label>
                      <input
                        type="text"
                        value={formData.badge_text}
                        onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                        placeholder="پیشنهاد ویژه / حامی رسانه"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>تیتر جذاب کارت (Headline):</label>
                      <input
                        type="text"
                        required={formData.ad_type === 'native'}
                        value={formData.headline}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        placeholder="تیتر متقاعدکننده کارت همسان..."
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>توضیحات بدنه کارت:</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="توضیح کوتاه ارزش پیشنهادی محصول یا خدمت..."
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>متن دکمه (CTA):</label>
                      <input
                        type="text"
                        value={formData.cta_text}
                        onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                        placeholder="مشاهده و شروع"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>لینک مقصد (Target URL):</label>
                      <input
                        type="url"
                        required={formData.ad_type === 'native'}
                        value={formData.target_url}
                        onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                        placeholder="https://..."
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', direction: 'ltr', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Targeting Rules */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginBottom: '16px' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '8px' }}>🎯 قوانین هدف‌گذاری (Targeting & Scheduling):</strong>

                {/* Categories */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '6px' }}>
                    نمایش در دسته‌بندی‌های خاص (خالی = نمایش در همه دسته‌ها):
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {categories.map((cat) => {
                      const catSlug = cat.slug || String(cat.id);
                      const isChecked = formData.target_categories?.includes(catSlug);
                      return (
                        <button
                          key={catSlug}
                          type="button"
                          onClick={() => handleCategoryToggle(catSlug)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${isChecked ? '#0284c7' : '#cbd5e1'}`,
                            background: isChecked ? '#e0f2fe' : '#f8fafc',
                            color: isChecked ? '#0369a1' : '#475569',
                            fontSize: '11.5px',
                            fontWeight: isChecked ? 700 : 500,
                            cursor: 'pointer',
                          }}
                        >
                          {isChecked ? '✓ ' : ''}{cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exclude / Include Post inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>نمایش فقط در این پست‌ها (ID یا نامک با کاما):</label>
                    <input
                      type="text"
                      value={formData.include_posts}
                      onChange={(e) => setFormData({ ...formData, include_posts: e.target.value })}
                      placeholder="e.g. 104, uuid-v4-v7"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', direction: 'ltr', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>عدم نمایش در این پست‌ها (Exclude):</label>
                    <input
                      type="text"
                      value={formData.exclude_posts}
                      onChange={(e) => setFormData({ ...formData, exclude_posts: e.target.value })}
                      placeholder="e.g. 210, privacy-policy"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', direction: 'ltr', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Dates & Device */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>نمایش در دستگاه:</label>
                    <select
                      value={formData.device}
                      onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    >
                      <option value="all">همه دستگاه‌ها</option>
                      <option value="desktop">فقط دسکتاپ</option>
                      <option value="mobile">فقط موبایل</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>تاریخ شروع (اختیاری):</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>تاریخ انقضا (اختیاری):</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <Button isTertiary onClick={() => setEditingCampaign(null)}>
                  انصراف
                </Button>
                <Button isPrimary type="submit" style={{ borderRadius: '6px', fontWeight: 700 }}>
                  ذخیره و اعمال کمپین
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
