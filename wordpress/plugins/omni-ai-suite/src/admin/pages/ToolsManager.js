import { createElement, useState, useEffect } from '@wordpress/element';
import { Card, CardBody, CardHeader, Button, Spinner, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../utils/api';

export default function ToolsManager() {
  const [tools, setTools] = useState([]);
  const [sitemapUrls, setSitemapUrls] = useState([
    'https://zebracode.ir/sitemap.xml',
    'https://kit.zebracode.ir/sitemap.xml',
  ]);
  const [sitemapsText, setSitemapsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [notice, setNotice] = useState(null);

  // New tool modal / inline state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTool, setNewTool] = useState({
    slug: '',
    title: '',
    description: '',
    url: '',
    domain: 'zebracode.ir',
  });

  const isFa = document.dir === 'rtl' || (window.omniAiData?.isRtl ?? true);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('tools');
      const data = await res.json();
      if (data && data.tools) {
        setTools(data.tools || []);
        if (data.sitemap_urls && Array.isArray(data.sitemap_urls)) {
          setSitemapUrls(data.sitemap_urls);
          setSitemapsText(data.sitemap_urls.join('\n'));
        }
      }
    } catch (err) {
      console.error('Error fetching tools:', err);
      setNotice({ type: 'error', message: 'خطا در بارگذاری ابزارهای سایت.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromSitemaps = async () => {
    setSyncing(true);
    setNotice(null);
    try {
      const urls = sitemapsText
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      const res = await apiFetch('tools/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitemap_urls: urls }),
      });
      const data = await res.json();

      if (data && data.success) {
        setTools(data.tools || []);
        if (data.sitemap_urls) {
          setSitemapUrls(data.sitemap_urls);
          setSitemapsText(data.sitemap_urls.join('\n'));
        }
        setNotice({
          type: 'success',
          message: data.message || `با موفقیت ${data.count || data.tools?.length || 0} ابزار همگام‌سازی شد.`,
        });
      } else {
        setNotice({
          type: 'error',
          message: data?.message || 'خطا در همگام‌سازی سایت‌مپ‌ها.',
        });
      }
    } catch (err) {
      console.error('Error syncing tools from sitemaps:', err);
      setNotice({ type: 'error', message: 'خطای ارتباط با سرور هنگام همگام‌سازی سایت‌مپ.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateToolField = (index, field, value) => {
    setTools((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveAllTools = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await apiFetch('tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_all', tools }),
      });
      const data = await res.json();
      if (data && data.success) {
        setTools(data.tools || tools);
        setNotice({ type: 'success', message: 'تغییرات ابزارها با موفقیت در وردپرس ذخیره شد.' });
      } else {
        setNotice({ type: 'error', message: data?.message || 'خطا در ذخیره‌سازی ابزارها.' });
      }
    } catch (err) {
      console.error('Error saving tools:', err);
      setNotice({ type: 'error', message: 'خطای ارتباط هنگام ذخیره‌سازی ابزارها.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTool = async (slug) => {
    if (!window.confirm(`آیا از حذف ابزار «${slug}» اطمینان دارید؟`)) {
      return;
    }
    try {
      const res = await apiFetch('tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', slug }),
      });
      const data = await res.json();
      if (data && data.success) {
        setTools((prev) => prev.filter((t) => t.slug !== slug));
        setNotice({ type: 'success', message: `ابزار «${slug}» با موفقیت حذف شد.` });
      }
    } catch (err) {
      console.error('Error deleting tool:', err);
      setNotice({ type: 'error', message: 'خطا در حذف ابزار.' });
    }
  };

  const handleAddToolSubmit = (e) => {
    e.preventDefault();
    if (!newTool.slug.trim()) {
      alert('لطفاً نامک (slug) ابزار را وارد کنید.');
      return;
    }
    const slug = newTool.slug.trim().toLowerCase().replace(/\s+/g, '-');
    const domain = newTool.domain.trim() || 'zebracode.ir';
    const url = newTool.url.trim() || `https://${domain}/${slug}`;
    const title = newTool.title.trim() || `ابزار ${slug}`;
    const description = newTool.description.trim() || 'ابزار آنلاین توسعه‌دهندگان زبراکد.';

    const toolObj = { slug, title, description, url, domain };

    setTools((prev) => [toolObj, ...prev.filter((t) => t.slug !== slug)]);
    setShowAddForm(false);
    setNewTool({ slug: '', title: '', description: '', url: '', domain: 'zebracode.ir' });
    setNotice({ type: 'success', message: `ابزار «${title}» به لیست اضافه شد. برای نهایی‌سازی دکمه «ذخیره تغییرات» را بزنید.` });
  };

  // Filtered tools
  const filteredTools = tools.filter((tool) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      tool.slug?.toLowerCase().includes(q) ||
      tool.title?.toLowerCase().includes(q) ||
      tool.description?.toLowerCase().includes(q) ||
      tool.domain?.toLowerCase().includes(q);

    const matchDomain = selectedDomain === 'all' || tool.domain === selectedDomain;

    return matchSearch && matchDomain;
  });

  const domains = Array.from(new Set(tools.map((t) => t.domain).filter(Boolean)));

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spinner />
        <p style={{ marginTop: '10px', color: '#64748b' }}>در حال فراخوانی ابزارهای همگام‌شده...</p>
      </div>
    );
  }

  return (
    <div className="omni-tools-manager" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {notice && (
        <Notice
          status={notice.type}
          onRemove={() => setNotice(null)}
          style={{ marginBottom: '18px' }}
        >
          {notice.message}
        </Notice>
      )}

      {/* Header Info */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '12px',
          padding: '24px 28px',
          color: '#f8fafc',
          marginBottom: '24px',
          border: '1px solid #334155',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🔗</span>
          <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '20px', fontWeight: 800 }}>
            همگام‌ساز خودکار ابزارهای سایت (Sitemap-Driven Tools)
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.8' }}>
          با ثبت نقشه سایت دامنه‌های خود (مانند <code style={{ color: '#38bdf8', background: '#090d16', padding: '2px 6px', borderRadius: '4px' }}>zebracode.ir</code> و{' '}
          <code style={{ color: '#a855f7', background: '#090d16', padding: '2px 6px', borderRadius: '4px' }}>kit.zebracode.ir</code>)، کلیه ابزارهای آنلاین به صورت خودکار شناسایی و با هوش مصنوعی و وبلاگ هدلس Next.js همگام می‌شوند تا در مقالات به آن‌ها لینک داخلی داده شود.
        </p>
      </div>

      {/* Sitemap Crawler Configuration Card */}
      <Card style={{ marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
        <CardHeader style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>🌐 نشانی‌های نقشه سایت (Sitemaps) جهت پویش و استخراج</strong>
        </CardHeader>
        <CardBody style={{ padding: '20px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
            آدرس‌های فایل sitemap.xml (هر آدرس در یک خط):
          </label>
          <textarea
            rows={3}
            value={sitemapsText}
            onChange={(e) => setSitemapsText(e.target.value)}
            placeholder="https://zebracode.ir/sitemap.xml&#10;https://kit.zebracode.ir/sitemap.xml"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontFamily: 'Consolas, monospace',
              fontSize: '13px',
              direction: 'ltr',
              lineHeight: '1.6',
              boxSizing: 'border-box',
              marginBottom: '14px',
            }}
          />

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              isPrimary
              onClick={handleSyncFromSitemaps}
              disabled={syncing}
              style={{
                background: '#0284c7',
                borderColor: '#0284c7',
                padding: '8px 18px',
                borderRadius: '7px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {syncing ? (
                <>
                  <Spinner />
                  <span>در حال استخراج و همگام‌سازی از Sitemap...</span>
                </>
              ) : (
                <>
                  <span className="dashicons dashicons-update" style={{ fontSize: '16px', width: '16px', height: '16px' }} />
                  <span>همگام‌سازی خودکار از Sitemap</span>
                </>
              )}
            </Button>

            <Button
              isSecondary
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ borderRadius: '7px', fontWeight: 600 }}
            >
              <span className="dashicons dashicons-plus" style={{ fontSize: '16px', width: '16px', height: '16px', marginLeft: '4px' }} />
              <span>افزودن ابزار دستی</span>
            </Button>

            <span style={{ fontSize: '12.5px', color: '#64748b', marginRight: 'auto' }}>
              مجموع ابزارهای فعال: <strong style={{ color: '#0f172a' }}>{tools.length} ابزار</strong>
            </span>
          </div>

          {/* Add Manual Tool Inline Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddToolSubmit}
              style={{
                marginTop: '18px',
                padding: '16px',
                background: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '12px', color: '#0f172a', fontSize: '13.5px' }}>
                ➕ ثبت ابزار جدید
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>نامک (Slug) انگلیسی:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. json-to-csv"
                    value={newTool.slug}
                    onChange={(e) => setNewTool({ ...newTool, slug: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', direction: 'ltr', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>عنوان فارسی ابزار:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. تبدیل JSON به CSV"
                    value={newTool.title}
                    onChange={(e) => setNewTool({ ...newTool, title: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>دامنه هدف:</label>
                  <input
                    type="text"
                    placeholder="zebracode.ir یا kit.zebracode.ir"
                    value={newTool.domain}
                    onChange={(e) => setNewTool({ ...newTool, domain: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', direction: 'ltr', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>نشانی کامل (URL):</label>
                  <input
                    type="url"
                    placeholder="https://zebracode.ir/json-to-csv"
                    value={newTool.url}
                    onChange={(e) => setNewTool({ ...newTool, url: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', direction: 'ltr', fontSize: '12px' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>توضیحات کوتاه ابزار:</label>
                <input
                  type="text"
                  placeholder="توضیح کوتاه کاربردی برای نمایش در باکس ابزارهای مرتبط مقاله..."
                  value={newTool.description}
                  onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button isPrimary type="submit" style={{ borderRadius: '6px' }}>
                  افزودن به لیست
                </Button>
                <Button isTertiary onClick={() => setShowAddForm(false)}>
                  انصراف
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس عنوان، اسلاگ یا دامنه..."
            style={{
              padding: '7px 12px',
              borderRadius: '7px',
              border: '1px solid #cbd5e1',
              minWidth: '260px',
              fontSize: '12.5px',
            }}
          />

          <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '3px', borderRadius: '7px' }}>
            <button
              type="button"
              onClick={() => setSelectedDomain('all')}
              style={{
                border: 'none',
                background: selectedDomain === 'all' ? '#fff' : 'transparent',
                fontWeight: selectedDomain === 'all' ? 700 : 500,
                color: selectedDomain === 'all' ? '#0f172a' : '#64748b',
                padding: '4px 10px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '11.5px',
              }}
            >
              همه ({tools.length})
            </button>
            {domains.map((dom) => {
              const cnt = tools.filter((t) => t.domain === dom).length;
              return (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setSelectedDomain(dom)}
                  style={{
                    border: 'none',
                    background: selectedDomain === dom ? '#fff' : 'transparent',
                    fontWeight: selectedDomain === dom ? 700 : 500,
                    color: selectedDomain === dom ? '#0284c7' : '#64748b',
                    padding: '4px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                  }}
                >
                  {dom} ({cnt})
                </button>
              );
            })}
          </div>
        </div>

        <Button
          isPrimary
          onClick={handleSaveAllTools}
          disabled={saving}
          style={{
            background: '#16a34a',
            borderColor: '#16a34a',
            borderRadius: '7px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {saving ? (
            <>
              <Spinner />
              <span>در حال ذخیره...</span>
            </>
          ) : (
            <>
              <span className="dashicons dashicons-saved" style={{ fontSize: '16px', width: '16px', height: '16px' }} />
              <span>ذخیره تغییرات ویرایش‌شده</span>
            </>
          )}
        </Button>
      </div>

      {/* Tools Table */}
      <Card style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', width: '110px' }}>دامنه</th>
                <th style={{ padding: '12px 16px', width: '170px' }}>نامک (Slug)</th>
                <th style={{ padding: '12px 16px', width: '220px' }}>عنوان فارسی ابزار</th>
                <th style={{ padding: '12px 16px' }}>توضیحات کاربردی</th>
                <th style={{ padding: '12px 16px', width: '90px', textAlign: 'center' }}>پیوند</th>
                <th style={{ padding: '12px 16px', width: '70px', textAlign: 'center' }}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    هیچ ابزاری مطابق با فیلتر یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredTools.map((tool) => {
                  // Find original index in tools state for editing
                  const originalIndex = tools.findIndex((t) => t.slug === tool.slug);
                  const isKit = tool.domain?.includes('kit');

                  return (
                    <tr
                      key={tool.slug}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      {/* Domain badge */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            direction: 'ltr',
                            background: isKit ? '#f3e8ff' : '#e0f2fe',
                            color: isKit ? '#7e22ce' : '#0369a1',
                            border: `1px solid ${isKit ? '#d8b4fe' : '#bae6fd'}`,
                          }}
                        >
                          {tool.domain || 'zebracode.ir'}
                        </span>
                      </td>

                      {/* Slug */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <code
                          style={{
                            fontFamily: 'Consolas, monospace',
                            fontSize: '11.5px',
                            color: '#0f172a',
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            direction: 'ltr',
                            display: 'inline-block',
                          }}
                        >
                          {tool.slug}
                        </code>
                      </td>

                      {/* Title (editable) */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={tool.title || ''}
                          onChange={(e) => handleUpdateToolField(originalIndex, 'title', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '5px',
                            border: '1px solid transparent',
                            background: 'transparent',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: '#1e293b',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => {
                            e.target.style.background = '#fff';
                            e.target.style.borderColor = '#93c5fd';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.borderColor = 'transparent';
                          }}
                        />
                      </td>

                      {/* Description (editable) */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          value={tool.description || ''}
                          onChange={(e) => handleUpdateToolField(originalIndex, 'description', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '5px 8px',
                            borderRadius: '5px',
                            border: '1px solid transparent',
                            background: 'transparent',
                            fontSize: '12px',
                            color: '#64748b',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => {
                            e.target.style.background = '#fff';
                            e.target.style.borderColor = '#93c5fd';
                          }}
                          onBlur={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.borderColor = 'transparent';
                          }}
                        />
                      </td>

                      {/* Direct Link */}
                      <td style={{ padding: '10px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <a
                          href={tool.url || `https://${tool.domain}/${tool.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="مشاهده ابزار در سایت"
                          style={{
                            color: '#0284c7',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                          }}
                        >
                          <span className="dashicons dashicons-external" style={{ fontSize: '15px', width: '15px', height: '15px' }} />
                        </a>
                      </td>

                      {/* Delete */}
                      <td style={{ padding: '10px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteTool(tool.slug)}
                          title="حذف ابزار"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span className="dashicons dashicons-trash" style={{ fontSize: '16px', width: '16px', height: '16px' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
