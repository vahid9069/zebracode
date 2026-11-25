import { createElement, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../utils/api';

export default function SearchConsole({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [clientEmail, setClientEmail] = useState('');

  // Sites / Properties
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [dateRange, setDateRange] = useState('28d');
  const [activeSubTab, setActiveSubTab] = useState('queries'); // 'queries', 'pages', 'ai', 'guide', 'settings'

  // Performance Data
  const [perfLoading, setPerfLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [pagesData, setPagesData] = useState(null);
  const [queryFilter, setQueryFilter] = useState('all'); // 'all', 'striking', 'low_ctr', 'top'
  const [searchTerm, setSearchTerm] = useState('');

  // AI Diagnostics
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState(null);

  // Setup Form
  const [jsonKeyInput, setJsonKeyInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Manual Add Property Modal
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [newSiteInput, setNewSiteInput] = useState('');
  const [addingSite, setAddingSite] = useState(false);

  const showNotification = (type, message) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 6000);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('gsc/status');
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setClientEmail(data.client_email || '');
      if (data.configured) {
        await fetchSites();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await apiFetch('gsc/sites');
      const data = await res.json();
      if (data.success && Array.isArray(data.sites) && data.sites.length > 0) {
        setSites(data.sites);
        if (!selectedSite || !data.sites.some((s) => s.siteUrl === selectedSite)) {
          setSelectedSite(data.sites[0].siteUrl);
        }
      } else {
        setSites([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedSite && configured) {
      fetchPerformanceData(selectedSite, dateRange);
    }
  }, [selectedSite, dateRange, configured]);

  const fetchPerformanceData = async (siteUrl, range) => {
    setPerfLoading(true);
    setAiDiagnosis(null);
    try {
      const qRes = await apiFetch('gsc/performance', {
        method: 'POST',
        body: JSON.stringify({ site_url: siteUrl, date_range: range, dimension: 'query' }),
      });
      const qData = await qRes.json();
      if (qData.success) {
        setPerformanceData(qData);
      } else {
        showNotification('error', qData.message || __('خطا در دریافت اطلاعات سرچ کنسول.', 'omni-ai-suite'));
      }

      const pRes = await apiFetch('gsc/performance', {
        method: 'POST',
        body: JSON.stringify({ site_url: siteUrl, date_range: range, dimension: 'page' }),
      });
      const pData = await pRes.json();
      if (pData.success) {
        setPagesData(pData);
      }
    } catch (e) {
      console.error(e);
      showNotification('error', __('خطا در برقراری ارتباط با سرور.', 'omni-ai-suite'));
    } finally {
      setPerfLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!jsonKeyInput.trim()) {
      showNotification('error', __('لطفاً محتوای فایل JSON کلید گوگل را وارد کنید.', 'omni-ai-suite'));
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(jsonKeyInput);
    } catch (e) {
      showNotification('error', __('فرمت وارد شده یک JSON معتبر نیست.', 'omni-ai-suite'));
      return;
    }

    setSaveLoading(true);
    try {
      const res = await apiFetch('gsc/credentials', {
        method: 'POST',
        body: JSON.stringify({ credentials: parsed }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || __('اتصال با موفقیت برقرار شد.', 'omni-ai-suite'));
        setConfigured(true);
        setClientEmail(data.client_email);
        setJsonKeyInput('');
        await fetchSites();
        setActiveSubTab('queries');
      } else {
        showNotification('error', data.message || __('خطا در احراز هویت.', 'omni-ai-suite'));
      }
    } catch (e) {
      showNotification('error', __('خطا در ذخیره اطلاعات.', 'omni-ai-suite'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonKeyInput(event.target?.result || '');
    };
    reader.readAsText(file);
  };

  const handleDisconnect = async () => {
    if (!window.confirm(__('آیا از قطع اتصال سرچ کنسول اطمینان دارید؟', 'omni-ai-suite'))) {
      return;
    }
    try {
      await apiFetch('gsc/disconnect', { method: 'POST' });
      setConfigured(false);
      setClientEmail('');
      setSites([]);
      setSelectedSite('');
      setPerformanceData(null);
      showNotification('success', __('اتصال قطع شد.', 'omni-ai-suite'));
    } catch (e) {
      showNotification('error', __('خطا در قطع اتصال.', 'omni-ai-suite'));
    }
  };

  const handleRunAiDiagnosis = async () => {
    if (!performanceData || !selectedSite) {
      showNotification('error', __('اطلاعات عملکرد برای تحلیل تشخیصی بارگذاری نشده است.', 'omni-ai-suite'));
      return;
    }
    setAiLoading(true);
    try {
      const res = await apiFetch('gsc/ai-diagnose', {
        method: 'POST',
        body: JSON.stringify({
          site_url: selectedSite,
          performance_data: performanceData,
        }),
      });
      const data = await res.json();
      if (data.success && data.diagnosis) {
        setAiDiagnosis(data.diagnosis);
        showNotification('success', __('تحلیل تشخیصی با موفقیت انجام شد و گزارش به‌روزرسانی شد.', 'omni-ai-suite'));
      } else {
        showNotification('error', data.message || __('خطا در تحلیل هوش مصنوعی.', 'omni-ai-suite'));
      }
    } catch (e) {
      showNotification('error', __('خطا در دریافت تحلیل هوش مصنوعی: ' + (e.message || ''), 'omni-ai-suite'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddSite = async () => {
    if (!newSiteInput.trim()) {
      showNotification('error', __('لطفاً آدرس پراپرتی را وارد کنید (مثلاً https://kit.zebracode.ir/)', 'omni-ai-suite'));
      return;
    }
    setAddingSite(true);
    try {
      const res = await apiFetch('gsc/add-site', {
        method: 'POST',
        body: JSON.stringify({ site_url: newSiteInput.trim() }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.sites)) {
        setSites(data.sites);
        const entered = newSiteInput.trim();
        const matched = data.sites.find((s) => s.siteUrl === entered || s.siteUrl === `https://${entered}/` || s.siteUrl === entered + '/');
        if (matched) {
          setSelectedSite(matched.siteUrl);
        } else if (data.sites.length > 0) {
          setSelectedSite(data.sites[data.sites.length - 1].siteUrl);
        }
        setShowAddSiteModal(false);
        setNewSiteInput('');
        showNotification('success', __('پراپرتی با موفقیت به لیست افزوده شد.', 'omni-ai-suite'));
      } else {
        showNotification('error', data.message || __('خطا در افزودن پراپرتی.', 'omni-ai-suite'));
      }
    } catch (e) {
      showNotification('error', __('خطا در ارتباط با سرور جهت افزودن پراپرتی.', 'omni-ai-suite'));
    } finally {
      setAddingSite(false);
    }
  };

  const handleRemoveCustomSite = async (url) => {
    if (!window.confirm(__('آیا از حذف این پراپرتی دستی از لیست اطمینان دارید؟', 'omni-ai-suite'))) {
      return;
    }
    try {
      const res = await apiFetch('gsc/remove-site', {
        method: 'POST',
        body: JSON.stringify({ site_url: url }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.sites)) {
        setSites(data.sites);
        if (selectedSite === url && data.sites.length > 0) {
          setSelectedSite(data.sites[0].siteUrl);
        }
        showNotification('success', __('پراپرتی با موفقیت حذف شد.', 'omni-ai-suite'));
      }
    } catch (e) {
      showNotification('error', __('خطا در حذف پراپرتی.', 'omni-ai-suite'));
    }
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const getFilteredQueries = () => {
    if (!performanceData?.rows) return [];
    let list = performanceData.rows;

    if (queryFilter === 'striking') {
      list = performanceData.opportunities?.striking_distance || [];
    } else if (queryFilter === 'low_ctr') {
      list = performanceData.opportunities?.low_ctr || [];
    } else if (queryFilter === 'top') {
      list = performanceData.opportunities?.top_performers || [];
    }

    if (searchTerm.trim()) {
      const t = searchTerm.trim().toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(t));
    }
    return list;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
        <span className="spinner is-active" style={{ float: 'none', margin: '0 0 10px 0' }}></span>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>در حال بارگذاری اطلاعات سرچ کنسول...</p>
      </div>
    );
  }

  return (
    <div className="omni-gsc-wrap">
      {notice && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 600,
            background: notice.type === 'success' ? '#ecfdf5' : '#fff1f2',
            color: notice.type === 'success' ? '#065f46' : '#9f1239',
            border: `1px solid ${notice.type === 'success' ? '#a7f3d0' : '#fecdd3'}`,
          }}
        >
          <span>{notice.message}</span>
          <button
            onClick={() => setNotice(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '15px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Command Banner & Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '14px',
          padding: '20px 24px',
          color: '#f8fafc',
          marginBottom: '20px',
          border: '1px solid #334155',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              fontSize: '22px',
            }}
          >
            <span className="dashicons dashicons-google" style={{ fontSize: '24px', width: '24px', height: '24px' }}></span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 800 }}>
                گوگل سرچ کنسول و عیب‌یابی هوشمند (Search Console & AI Diagnosis)
              </h2>
              {configured && (
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: '999px',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                >
                  ● متصل
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              گزارش عملکرد، تحلیل کلمات، بررسی صفحات و راهکارهای هوشمند رفع ایرادات به تفکیک هر پراپرتی
            </p>
          </div>
        </div>

        {/* Property & Date Selector (if connected) */}
        {configured && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {sites.length > 0 ? (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>پراپرتی:</span>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    maxWidth: '220px',
                  }}
                >
                  {sites.map((s) => (
                    <option key={s.siteUrl} value={s.siteUrl} style={{ background: '#0f172a', color: '#f8fafc' }}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {sites.find((s) => s.siteUrl === selectedSite)?.is_custom && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomSite(selectedSite)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      padding: '2px',
                      fontSize: '12px',
                    }}
                    title="حذف این پراپرتی دستی"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '4px 8px', borderRadius: '6px' }}>
                پراپرتی یافت نشد
              </span>
            )}

            {/* Quick Add Custom Site Button */}
            <button
              type="button"
              onClick={() => setShowAddSiteModal(true)}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '8px',
                padding: '6px 11px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="افزودن پراپرتی یا ساب‌دامین دیگر (مانند https://kit.zebracode.ir/)"
            >
              <span className="dashicons dashicons-plus-alt2" style={{ fontSize: '13px', width: '13px', height: '13px' }}></span>
              <span>+ افزودن پراپرتی</span>
            </button>

            {sites.length > 0 && (
              <>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <option value="7d" style={{ background: '#0f172a' }}>۷ روز اخیر</option>
                  <option value="28d" style={{ background: '#0f172a' }}>۲۸ روز اخیر</option>
                  <option value="3m" style={{ background: '#0f172a' }}>۳ ماه اخیر</option>
                  <option value="6m" style={{ background: '#0f172a' }}>۶ ماه اخیر</option>
                </select>

                <button
                  type="button"
                  onClick={() => fetchPerformanceData(selectedSite, dateRange)}
                  disabled={perfLoading}
                  style={{
                    background: '#0284c7',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 12px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="به‌روزرسانی اطلاعات"
                >
                  <span className={`dashicons dashicons-update ${perfLoading ? 'animate-spin' : ''}`} style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                  <span>بروزرسانی</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!configured ? (
        /* ================= SETUP & CONNECTION VIEW ================= */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '20px' }}>
          {/* Form Card */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '26px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="dashicons dashicons-admin-network" style={{ color: '#0284c7' }}></span>
              اتصال Google Search Console با کلید Service Account
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: 1.7 }}>
              برای اتصال دائمی و خودکار بدون نیاز به لاگین مکرر، از روش رسمی <strong>Google Service Account</strong> استفاده می‌شود. کلید JSON دریافتی از گوگل کلود را در کادر زیر قرار دهید.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                محتوای فایل JSON کلید گوگل (یا آپلود فایل):
              </label>
              <textarea
                value={jsonKeyInput}
                onChange={(e) => setJsonKeyInput(e.target.value)}
                placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...",\n  "client_email": "example@project.iam.gserviceaccount.com"\n}'}
                rows={9}
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#0f172a',
                  direction: 'ltr',
                  lineHeight: 1.5,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <label
                style={{
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0284c7',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                }}
              >
                <span className="dashicons dashicons-upload" style={{ fontSize: '16px', width: '16px', height: '16px' }}></span>
                <span>آپلود فایل JSON از سیستم</span>
                <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <button
                type="button"
                onClick={handleSaveCredentials}
                disabled={saveLoading}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                }}
              >
                {saveLoading ? <span className="spinner is-active" style={{ float: 'none', margin: 0 }}></span> : <span className="dashicons dashicons-yes-alt"></span>}
                <span>تست اتصال و ذخیره کلید</span>
              </button>
            </div>
          </div>

          {/* Quick Checklist Sidebar */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '22px',
            }}
          >
            <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dashicons dashicons-clipboard" style={{ color: '#0284c7' }}></span>
              چک‌لیست اتصال سرچ کنسول
            </h4>
            <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>۱</span>
                <span>ساخت پروژه در <strong>گوگل کلود کنسول</strong> و فعال‌سازی API</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>۲</span>
                <span>ساخت Service Account و دانلود فایل <strong>کلید JSON</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>۳</span>
                <span>افزودن ایمیل سرویس‌اکانت به <strong>Google Search Console</strong></span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= CONNECTED VIEW ================= */
        <div>
          {/* KPI Metrics Grid */}
          {performanceData?.summary && (
            <div className="omni-gsc-kpi-grid">
              {/* Card 1: Clicks */}
              <div className="omni-gsc-kpi-card blue" style={{ borderTop: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>مجموع کلیک‌ها (Clicks)</span>
                  <span className="dashicons dashicons-networking" style={{ color: '#3b82f6' }}></span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>
                  {performanceData.summary.clicks.toLocaleString('fa-IR')}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>ترافیک ورودی خالص از نتایج گوگل</div>
              </div>

              {/* Card 2: Impressions */}
              <div className="omni-gsc-kpi-card purple" style={{ borderTop: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>مجموع نمایش (Impression)</span>
                  <span className="dashicons dashicons-visibility" style={{ color: '#8b5cf6' }}></span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>
                  {performanceData.summary.impressions.toLocaleString('fa-IR')}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>تعداد دفعات دیده‌شدن در نتایج</div>
              </div>

              {/* Card 3: CTR */}
              <div className="omni-gsc-kpi-card emerald" style={{ borderTop: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>میانگین نرخ کلیک (CTR)</span>
                  <span className="dashicons dashicons-chart-area" style={{ color: '#10b981' }}></span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>
                  {performanceData.summary.ctr}%
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>درصد تبدیل نمایش به کلیک واقعی</div>
              </div>

              {/* Card 4: Position */}
              <div className="omni-gsc-kpi-card amber" style={{ borderTop: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>میانگین رتبه (Position)</span>
                  <span className="dashicons dashicons-location" style={{ color: '#f59e0b' }}></span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>
                  {performanceData.summary.position}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>جایگاه متوسط در صفحه نتایج سرچ</div>
              </div>
            </div>
          )}

          {/* Sub Navigation Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #e2e8f0',
              marginBottom: '20px',
              paddingBottom: '10px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveSubTab('queries')}
                style={{
                  background: activeSubTab === 'queries' ? '#0f172a' : '#f1f5f9',
                  color: activeSubTab === 'queries' ? '#fff' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="dashicons dashicons-editor-ul" style={{ fontSize: '15px' }}></span>
                <span>کلمات کلیدی (Queries)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('pages')}
                style={{
                  background: activeSubTab === 'pages' ? '#0f172a' : '#f1f5f9',
                  color: activeSubTab === 'pages' ? '#fff' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="dashicons dashicons-admin-page" style={{ fontSize: '15px' }}></span>
                <span>صفحات (Pages)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('ai')}
                style={{
                  background: activeSubTab === 'ai' ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' : '#faf5ff',
                  color: activeSubTab === 'ai' ? '#fff' : '#7c3aed',
                  border: `1px solid ${activeSubTab === 'ai' ? '#6366f1' : '#e9d5ff'}`,
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: activeSubTab === 'ai' ? '0 4px 12px rgba(124, 58, 237, 0.25)' : 'none',
                }}
              >
                <span className="dashicons dashicons-superhero-alt" style={{ fontSize: '16px' }}></span>
                <span>گزارش تشخیصی و رفع ایرادات با AI</span>
                <span
                  style={{
                    background: '#fbbf24',
                    color: '#78350f',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: '999px',
                  }}
                >
                  هوش مصنوعی
                </span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveSubTab('guide')}
                style={{
                  background: activeSubTab === 'guide' ? '#0284c7' : '#f0f9ff',
                  color: activeSubTab === 'guide' ? '#fff' : '#0284c7',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="dashicons dashicons-book" style={{ fontSize: '14px' }}></span>
                <span>راهنمای اتصال سرچ کنسول</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('settings')}
                style={{
                  background: activeSubTab === 'settings' ? '#334155' : '#f8fafc',
                  color: activeSubTab === 'settings' ? '#fff' : '#64748b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="تنظیمات اتصال"
              >
                <span className="dashicons dashicons-admin-generic" style={{ fontSize: '14px' }}></span>
              </button>
            </div>
          </div>

          {/* TAB 1: QUERIES */}
          {activeSubTab === 'queries' && (
            <div className="omni-gsc-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setQueryFilter('all')}
                    style={{
                      background: queryFilter === 'all' ? '#0f172a' : '#f1f5f9',
                      color: queryFilter === 'all' ? '#fff' : '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    همه کلمات ({performanceData?.rows?.length || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setQueryFilter('striking')}
                    style={{
                      background: queryFilter === 'striking' ? '#d97706' : '#fef3c7',
                      color: queryFilter === 'striking' ? '#fff' : '#92400e',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>صفحه دوم گوگل (Striking Distance)</span>
                    <span style={{ background: 'rgba(0,0,0,0.15)', padding: '1px 6px', borderRadius: '999px', fontSize: '10px' }}>
                      {performanceData?.opportunities?.striking_distance?.length || 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQueryFilter('low_ctr')}
                    style={{
                      background: queryFilter === 'low_ctr' ? '#e11d48' : '#ffe4e6',
                      color: queryFilter === 'low_ctr' ? '#fff' : '#9f1239',
                      border: '1px solid #fecdd3',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>نرخ کلیک پایین (فرصت رشد CTR)</span>
                    <span style={{ background: 'rgba(0,0,0,0.15)', padding: '1px 6px', borderRadius: '999px', fontSize: '10px' }}>
                      {performanceData?.opportunities?.low_ctr?.length || 0}
                    </span>
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="جست‌وجوی کلمه کلیدی..."
                    style={{
                      padding: '7px 12px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      width: '220px',
                    }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <table className="omni-gsc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>کلمه کلیدی (Search Query)</th>
                      <th style={{ textAlign: 'center' }}>کلیک</th>
                      <th style={{ textAlign: 'center' }}>نمایش</th>
                      <th style={{ textAlign: 'center' }}>نرخ کلیک (CTR)</th>
                      <th style={{ textAlign: 'center' }}>جایگاه (Position)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfLoading ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          <span className="spinner is-active" style={{ float: 'none', margin: '0 0 6px 0' }}></span>
                          <div>در حال بارگذاری کلمات...</div>
                        </td>
                      </tr>
                    ) : getFilteredQueries().length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          هیچ کلمه‌ای در این فیلتر یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      getFilteredQueries().map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{row.name}</span>
                              {row.position > 10 && row.position <= 20 && (
                                <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                  صفحه ۲
                                </span>
                              )}
                              {row.position <= 10 && row.ctr < 2.5 && row.impressions >= 20 && (
                                <span style={{ background: '#ffe4e6', color: '#be123c', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                  CTR پایین
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#2563eb' }}>
                            {row.clicks.toLocaleString('fa-IR')}
                          </td>
                          <td style={{ textAlign: 'center', color: '#475569' }}>
                            {row.impressions.toLocaleString('fa-IR')}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: row.ctr < 2.5 && row.position <= 10 ? '#e11d48' : '#0f172a' }}>
                            {row.ctr}%
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                            {row.position}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PAGES */}
          {activeSubTab === 'pages' && (
            <div className="omni-gsc-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                صفحات پربازدید پراپرتی {selectedSite}:
              </h3>

              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <table className="omni-gsc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50%' }}>آدرس صفحه (Page URL)</th>
                      <th style={{ textAlign: 'center' }}>کلیک</th>
                      <th style={{ textAlign: 'center' }}>نمایش</th>
                      <th style={{ textAlign: 'center' }}>نرخ کلیک</th>
                      <th style={{ textAlign: 'center' }}>جایگاه</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!pagesData?.rows || pagesData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          اطلاعات صفحه‌ای برای این بازه یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      pagesData.rows.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '12px' }}>
                            <a href={row.name} target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none' }}>
                              {row.name}
                            </a>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#2563eb' }}>
                            {row.clicks.toLocaleString('fa-IR')}
                          </td>
                          <td style={{ textAlign: 'center', color: '#475569' }}>
                            {row.impressions.toLocaleString('fa-IR')}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.ctr}%</td>
                          <td style={{ textAlign: 'center', fontWeight: 800 }}>{row.position}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AI DIAGNOSIS */}
          {activeSubTab === 'ai' && (
            <div>
              {/* Trigger Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)',
                  border: '1px solid #c7d2fe',
                  borderRadius: '14px',
                  padding: '24px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 900, color: '#312e81', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="dashicons dashicons-superhero-alt" style={{ color: '#6366f1' }}></span>
                    تحلیل عمیق تشخیصی و راهکارهای جهش رتبه با هوش مصنوعی
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#4338ca', maxWidth: '650px', lineHeight: 1.7 }}>
                    هوش مصنوعی داده‌های کلیک‌ها، ایمپرشن‌ها، افت‌های نرخ کلیک و کلمات صفحه دوم را بررسی کرده و علت ریشه‌ای مشکلات را به همراه برنامه عملیاتی گام‌به‌گام به شما تحویل می‌دهد.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunAiDiagnosis}
                  disabled={aiLoading || !performanceData}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 18px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  {aiLoading ? (
                    <>
                      <span className="spinner is-active" style={{ float: 'none', margin: 0 }}></span>
                      <span>در حال پردازش هوش مصنوعی...</span>
                    </>
                  ) : (
                    <>
                      <span className="dashicons dashicons-controls-play"></span>
                      <span>اجرای تحلیل تشخیصی با AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Report Cards */}
              {aiDiagnosis && (
                <div>
                  {/* Score & Summary Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '18px', marginBottom: '20px' }}>
                    <div className="omni-gsc-card" style={{ textAlign: 'center', marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>نمره سلامت سئو و سرچ کنسول</span>
                      <div
                        style={{
                          width: '90px',
                          height: '90px',
                          borderRadius: '50%',
                          border: '5px solid #6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '32px',
                          fontWeight: 900,
                          color: '#4338ca',
                        }}
                      >
                        {aiDiagnosis.health_score}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
                        {aiDiagnosis.health_status}
                      </span>
                      {aiDiagnosis.generated_by && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#6366f1',
                            background: '#ede9fe',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            marginTop: '8px',
                          }}
                        >
                          تحلیلگر: {aiDiagnosis.generated_by}
                        </span>
                      )}
                    </div>

                    <div className="omni-gsc-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 800, color: '#64748b' }}>خلاصه وضعیت اجرایی:</h4>
                      <p style={{ margin: 0, fontSize: '13.5px', color: '#1e293b', lineHeight: 1.8 }}>
                        {aiDiagnosis.executive_summary}
                      </p>
                    </div>
                  </div>

                  {/* Issues & Action Plans */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="dashicons dashicons-warning" style={{ color: '#f59e0b' }}></span>
                      برنامه عملیاتی رفع آسیب‌ها (Actionable Issues & Solutions):
                    </h4>

                    {aiDiagnosis.critical_issues?.map((issue, idx) => (
                      <div key={idx} className="omni-gsc-card" style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                          <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: issue.severity === 'high' ? '#e11d48' : issue.severity === 'medium' ? '#d97706' : '#10b981',
                              }}
                            ></span>
                            {issue.title}
                          </h5>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 10px',
                              borderRadius: '999px',
                              background: issue.severity === 'high' ? '#ffe4e6' : '#fef3c7',
                              color: issue.severity === 'high' ? '#be123c' : '#92400e',
                            }}
                          >
                            اثرگذاری: {issue.impact}
                          </span>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', fontSize: '13px', color: '#334155', marginBottom: '12px', border: '1px solid #f1f5f9' }}>
                          <strong>علت ریشه‌ای: </strong> {issue.root_cause}
                        </div>

                        {issue.target_queries && issue.target_queries.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>کلمات درگیر:</span>
                            {issue.target_queries.map((q, qIdx) => (
                              <span key={qIdx} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700 }}>
                                {q}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#059669', marginBottom: '8px' }}>
                            <span className="dashicons dashicons-yes-alt" style={{ fontSize: '16px', width: '16px', height: '16px' }}></span>
                            راهکار گام‌به‌گام رفع این مشکل:
                          </span>
                          <ul style={{ margin: 0, paddingRight: '22px', fontSize: '13px', color: '#334155', lineHeight: 1.8 }}>
                            {issue.action_plan?.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Wins & Topics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '20px' }}>
                      <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="dashicons dashicons-awards"></span>
                        بردهای سریع برای هفته آینده (Quick Wins):
                      </h5>
                      <ul style={{ margin: 0, paddingRight: '20px', fontSize: '13px', color: '#047857', lineHeight: 1.8 }}>
                        {aiDiagnosis.growth_quick_wins?.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '20px' }}>
                      <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="dashicons dashicons-lightbulb"></span>
                        موضوعات پیشنهادی برای تولید محتوا:
                      </h5>
                      <ul style={{ margin: 0, paddingRight: '20px', fontSize: '13px', color: '#1d4ed8', lineHeight: 1.8 }}>
                        {aiDiagnosis.content_expansion_topics?.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {!aiDiagnosis && !aiLoading && (
                <div
                  style={{
                    background: '#fff',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '14px',
                    padding: '40px 20px',
                    textAlign: 'center',
                  }}
                >
                  <span className="dashicons dashicons-superhero-alt" style={{ fontSize: '40px', width: '40px', height: '40px', color: '#818cf8', marginBottom: '10px' }}></span>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                    هنوز تحلیلی برای این پراپرتی انجام نشده است
                  </h4>
                  <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#64748b', maxWidth: '520px', marginInline: 'auto', lineHeight: 1.7 }}>
                    برای بررسی ریشه‌ای افت‌های نرخ کلیک، کلمات صفحه دوم، جایگاه فعلی در نتایج و دریافت برنامه اقدام گام‌به‌گام، روی دکمه «اجرای تحلیل تشخیصی با AI» کلیک کنید.
                  </p>
                  <button
                    type="button"
                    onClick={handleRunAiDiagnosis}
                    disabled={!performanceData}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 22px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    اجرای فوری تحلیل با هوش مصنوعی
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONNECTION GUIDE (راهنمای اتصال سرچ کنسول) */}
          {activeSubTab === 'guide' && (
            <div className="omni-gsc-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="dashicons dashicons-book" style={{ color: '#0284c7' }}></span>
                راهنمای تصویری و گام‌به‌گام اتصال Google Search Console
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.8, marginBottom: '22px' }}>
                این افزونه از روش مدرن و ایمن <strong>Service Account</strong> گوگل استفاده می‌کند. با این روش نیازی به لاگین کردن دستی هر چند وقت یک‌بار ندارید و سرور شما به صورت امن و مستقیم آمار را دریافت می‌نماید.
              </p>

              {/* Step 1 */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>۱</span>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>ورود به Google Cloud Console و ساخت پروژه</h4>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569', lineHeight: 1.7, paddingRight: '36px' }}>
                  به پنل توسعه‌دهندگان گوگل بروید و یک پروژه جدید با نام دلخواه (مثلاً ZebraCode یا OmniAI) بسازید یا از پروژه‌های قبلی خود استفاده کنید.
                </p>
                <div style={{ paddingRight: '36px' }}>
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}
                  >
                    <span>باز کردن Google Cloud Console ↗</span>
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>۲</span>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>فعال‌سازی Google Search Console API</h4>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569', lineHeight: 1.7, paddingRight: '36px' }}>
                  از منوی کناری به بخش <strong>APIs & Services ← Enabled APIs & services</strong> رفته، روی دکمه <strong>+ ENABLE APIS AND SERVICES</strong> کلیک کنید. عبارت <code>Google Search Console API</code> را جستجو کرده و روی <strong>Enable</strong> کلیک نمایید.
                </p>
                <div style={{ paddingRight: '36px' }}>
                  <a
                    href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}
                  >
                    <span>صفحه فعال‌سازی مستقیم Google Search Console API ↗</span>
                  </a>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>۳</span>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>ایجاد Service Account و دانلود فایل JSON کلید</h4>
                </div>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.8, paddingRight: '36px' }}>
                  <ol style={{ margin: 0, paddingRight: '20px' }}>
                    <li>به بخش <strong>IAM & Admin ← Service Accounts</strong> بروید.</li>
                    <li>روی <strong>Create Service Account</strong> کلیک کنید و یک نام بدهید (مثلاً <code>omni-gsc</code>).</li>
                    <li>نقش (Role) را اختیاری روی <code>Viewer</code> یا <code>Browser</code> بگذارید و ذخیره کنید.</li>
                    <li>پس از ساخته شدن، روی ایمیل آن کلیک کنید، وارد تب <strong>Keys</strong> شوید.</li>
                    <li>روی <strong>Add Key ← Create new key</strong> کلیک کرده، فرمت <strong>JSON</strong> را انتخاب و فایل را دانلود کنید.</li>
                  </ol>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '18px 20px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#16a34a', color: '#fff', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>۴</span>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#166534' }}>افزودن ایمیل سرویس‌اکانت به Google Search Console</h4>
                </div>
                <div style={{ fontSize: '13px', color: '#15803d', lineHeight: 1.8, paddingRight: '36px' }}>
                  <p style={{ margin: '0 0 10px 0' }}>
                    ایمیل سرویس‌اکانت ساخته‌شده (مثلاً <code>omni-gsc@project-id.iam.gserviceaccount.com</code>) را کپی کنید. وارد <strong>Google Search Console</strong> سایت خود شوید، از منوی سمت چپ به <strong>Settings ← Users and permissions</strong> رفته، روی <strong>Add user</strong> کلیک کنید و ایمیل را با دسترسی <strong>Full</strong> یا <strong>Owner</strong> اضافه کنید.
                  </p>
                  {clientEmail && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #86efac', width: 'fit-content' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>ایمیل سرویس شما:</span>
                      <code style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{clientEmail}</code>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(clientEmail)}
                        style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                      >
                        {copiedEmail ? 'کپی شد!' : 'کپی ایمیل'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* FAQ Box */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px 20px' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 800, color: '#9a3412', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="dashicons dashicons-info"></span>
                  نکات مهم سرچ کنسول:
                </h5>
                <ul style={{ margin: 0, paddingRight: '20px', fontSize: '12.5px', color: '#9a3412', lineHeight: 1.7 }}>
                  <li>گوگل آمار سرچ کنسول را همواره با ۲ الی ۳ روز تأخیر نهایی می‌کند؛ این یک محدودیت فنی گوگل است و برای تمام سایت‌ها یکسان می‌باشد.</li>
                  <li>اگر پراپرتی دامنه‌ای (`sc-domain:`) دارید، ایمیل سرویس‌اکانت باید حتماً روی همان پراپرتی دامنه‌ای افزوده شود تا به تمام زیرشاخه‌ها دسترسی داشته باشد.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeSubTab === 'settings' && (
            <div className="omni-gsc-card" style={{ maxWidth: '600px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="dashicons dashicons-admin-generic" style={{ color: '#0284c7' }}></span>
                تنظیمات اتصال سرچ کنسول
              </h3>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', fontSize: '13px', color: '#334155', lineHeight: 1.8, marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>ایمیل سرویس‌اکانت فعال: </span>
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{clientEmail}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>تعداد کل پراپرتی‌های شناسایی‌شده: </span>
                  <strong style={{ color: '#0f172a' }}>{sites.length} پراپرتی</strong>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  style={{
                    background: '#fff1f2',
                    color: '#e11d48',
                    border: '1px solid #fecdd3',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span className="dashicons dashicons-dismiss"></span>
                  <span>قطع اتصال و پاک کردن کلید JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for Adding Custom Property */}
      {showAddSiteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
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
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '26px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="dashicons dashicons-plus-alt2" style={{ color: '#0284c7' }}></span>
                افزودن پراپرتی جدید سرچ کنسول
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSiteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, margin: '0 0 16px 0' }}>
              اگر ساب‌دامین یا پراپرتی دیگری در گوگل سرچ کنسول دارید (مانند <code>https://kit.zebracode.ir/</code>)، آدرس کامل آن را وارد کنید:
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                آدرس پراپرتی (URL یا Domain):
              </label>
              <input
                type="text"
                value={newSiteInput}
                onChange={(e) => setNewSiteInput(e.target.value)}
                placeholder="https://kit.zebracode.ir/ یا zebracode.ir"
                dir="ltr"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#0369a1', lineHeight: 1.7, marginBottom: '20px' }}>
              <strong>نکته مهم گوگل:</strong> در سرچ کنسول، مطمئن شوید ایمیل سرویس‌اکانت <code>{clientEmail || 'omni-gsc@...'}</code> در بخش <strong>Settings &gt; Users and permissions</strong> این پراپرتی نیز اضافه شده باشد.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddSiteModal(false)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleAddSite}
                disabled={addingSite}
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {addingSite ? 'در حال افزودن...' : 'افزودن و مشاهده گزارش'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
