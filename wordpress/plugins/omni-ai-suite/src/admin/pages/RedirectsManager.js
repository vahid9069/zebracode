import { createElement, useState, useEffect } from '@wordpress/element';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  TextControl,
  SelectControl,
  Spinner,
  Notice,
  Modal,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../utils/api';

export default function RedirectsManager() {
  const isFa = true;
  const [activeSubTab, setActiveSubTab] = useState('redirects'); // 'redirects' | '404s'

  // Redirects state
  const [redirects, setRedirects] = useState([]);
  const [loadingRedirects, setLoadingRedirects] = useState(true);
  const [redirectPage, setRedirectPage] = useState(1);
  const [totalRedirects, setTotalRedirects] = useState(0);

  // New redirect form
  const [sourceUrl, setSourceUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [statusCode, setStatusCode] = useState(301);
  const [matchType, setMatchType] = useState('exact');
  const [savingRedirect, setSavingRedirect] = useState(false);

  // 404s state
  const [logs404, setLogs404] = useState([]);
  const [loading404, setLoading404] = useState(false);
  const [page404, setPage404] = useState(1);
  const [total404, setTotal404] = useState(0);

  // Convert 404 to redirect modal
  const [convertModal, setConvertModal] = useState(null); // { id, url }
  const [convertTarget, setConvertTarget] = useState('');
  const [converting, setConverting] = useState(false);

  const [notice, setNotice] = useState(null);

  const fetchRedirects = async (p = 1) => {
    setLoadingRedirects(true);
    try {
      const res = await apiFetch(`redirects?page=${p}&limit=20`);
      const json = await res.json();
      if (res.ok && json.success) {
        setRedirects(json.items || []);
        setTotalRedirects(json.total || 0);
        setRedirectPage(json.page || 1);
      }
    } catch (_) {
    } finally {
      setLoadingRedirects(false);
    }
  };

  const fetch404s = async (p = 1) => {
    setLoading404(true);
    try {
      const res = await apiFetch(`404s?page=${p}&limit=20`);
      const json = await res.json();
      if (res.ok && json.success) {
        setLogs404(json.items || []);
        setTotal404(json.total || 0);
        setPage404(json.page || 1);
      }
    } catch (_) {
    } finally {
      setLoading404(false);
    }
  };

  useEffect(() => {
    fetchRedirects(1);
  }, []);

  const handleSubTabChange = (tab) => {
    setActiveSubTab(tab);
    setNotice(null);
    if (tab === 'redirects') {
      fetchRedirects(1);
    } else {
      fetch404s(1);
    }
  };

  const handleCreateRedirect = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!sourceUrl.trim() || !targetUrl.trim()) {
      setNotice({ type: 'error', message: 'لطفاً آدرس مبدأ و آدرس مقصد را وارد نمایید.' });
      return;
    }
    setSavingRedirect(true);
    setNotice(null);
    try {
      const res = await apiFetch('redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: sourceUrl.trim(),
          target_url: targetUrl.trim(),
          status_code: parseInt(statusCode, 10),
          match_type: matchType,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotice({ type: 'success', message: json.message || 'تغییر مسیر با موفقیت ذخیره شد.' });
        setSourceUrl('');
        setTargetUrl('');
        fetchRedirects(1);
      } else {
        throw new Error(json.message || 'خطا در ثبت تغییر مسیر.');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSavingRedirect(false);
    }
  };

  const handleDeleteRedirect = async (id) => {
    if (!confirm('آیا از حذف این ریدایرکت مطمئن هستید؟')) return;
    try {
      const res = await apiFetch(`redirects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotice({ type: 'success', message: 'تغییر مسیر با موفقیت حذف گردید.' });
        fetchRedirects(redirectPage);
      }
    } catch (_) {}
  };

  const handleDelete404 = async (id) => {
    try {
      const res = await apiFetch(`404s/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetch404s(page404);
      }
    } catch (_) {}
  };

  const handleClearAll404s = async () => {
    if (!confirm('آیا از پاک‌سازی تمام رکوردهای خطای ۴۰۴ مطمئن هستید؟')) return;
    try {
      const res = await apiFetch('404s/clear', { method: 'POST' });
      if (res.ok) {
        setNotice({ type: 'success', message: 'تمام لاگ‌های ۴۰۴ پاک شدند.' });
        fetch404s(1);
      }
    } catch (_) {}
  };

  const handleExecuteConvert404 = async () => {
    if (!convertTarget.trim()) {
      alert('لطفاً آدرس مقصد ریدایرکت را وارد کنید.');
      return;
    }
    setConverting(true);
    try {
      const res = await apiFetch('404s/to-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_id: convertModal.id,
          source_url: convertModal.url,
          target_url: convertTarget.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotice({ type: 'success', message: json.message || 'ریدایرکت ۳۰۱ با موفقیت ایجاد شد.' });
        setConvertModal(null);
        setConvertTarget('');
        fetch404s(page404);
      } else {
        alert(json.message || 'خطا در تبدیل ۴۰۴.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="omni-redirects-manager-wrap" style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 0' }} dir="rtl">
      {notice && (
        <Notice status={notice.type} onRemove={() => setNotice(null)} style={{ marginBottom: '16px' }}>
          {notice.message}
        </Notice>
      )}

      {/* ناوبری زیربخش‌ها */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        <button
          type="button"
          onClick={() => handleSubTabChange('redirects')}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            border: activeSubTab === 'redirects' ? '1px solid #2563eb' : '1px solid #cbd5e1',
            background: activeSubTab === 'redirects' ? '#2563eb' : '#ffffff',
            color: activeSubTab === 'redirects' ? '#ffffff' : '#334155',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span className="dashicons dashicons-randomize" />
          <span>مدیریت تغییر مسیرها (Redirects)</span>
          <span style={{ background: activeSubTab === 'redirects' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', padding: '2px 7px', borderRadius: '10px', fontSize: '11px' }}>
            {totalRedirects}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('404s')}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            border: activeSubTab === '404s' ? '1px solid #dc2626' : '1px solid #cbd5e1',
            background: activeSubTab === '404s' ? '#dc2626' : '#ffffff',
            color: activeSubTab === '404s' ? '#ffffff' : '#334155',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span className="dashicons dashicons-warning" />
          <span>مانیتور خطاهای ۴۰۴ (404 Monitor)</span>
          <span style={{ background: activeSubTab === '404s' ? 'rgba(255,255,255,0.25)' : '#fee2e2', color: activeSubTab === '404s' ? '#fff' : '#991b1b', padding: '2px 7px', borderRadius: '10px', fontSize: '11px' }}>
            {total404}
          </span>
        </button>
      </div>

      {/* تب ۱: تغییر مسیرها */}
      {activeSubTab === 'redirects' && (
        <div>
          {/* فرم افزودن ریدایرکت جدید */}
          <Card style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <CardHeader style={{ fontWeight: 700, fontSize: '14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="dashicons dashicons-plus-alt2" style={{ marginInlineEnd: '6px', color: '#2563eb' }} />
              افزودن تغییر مسیر جدید (301 / 302)
            </CardHeader>
            <CardBody>
              <form onSubmit={handleCreateRedirect}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'flex-start' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>
                      آدرس مبدأ (Source URL / Path) *
                    </label>
                    <input
                      type="text"
                      className="regular-text"
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px' }}
                      placeholder="/old-page/ یا old-post"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      required
                    />
                    <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>مسیر نسبی یا کامل صفحه‌ای که می‌خواهید منتقل شود.</small>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>
                      آدرس مقصد (Target URL) *
                    </label>
                    <input
                      type="text"
                      className="regular-text"
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px' }}
                      placeholder="/new-page/ یا https://example.com/dest"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      required
                    />
                    <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>آدرس صفحه جدید در سایت یا لینک خارجی.</small>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>نوع کد ریدایرکت</label>
                      <select
                        value={statusCode}
                        onChange={(e) => setStatusCode(e.target.value)}
                        style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="301">301 دائمی (Permanent)</option>
                        <option value="302">302 موقت (Temporary)</option>
                        <option value="307">307 تغییر موقت (Temporary 307)</option>
                        <option value="410">410 محتوا حذف شده (Gone)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>نوع تطابق</label>
                      <select
                        value={matchType}
                        onChange={(e) => setMatchType(e.target.value)}
                        style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="exact">دقیق (Exact)</option>
                        <option value="prefix">شروع با آدرس (Prefix)</option>
                        <option value="regex">عبارت منظم (Regex)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    isPrimary
                    type="submit"
                    isBusy={savingRedirect}
                    disabled={savingRedirect}
                    style={{ padding: '8px 20px', borderRadius: '6px', fontWeight: 700 }}
                  >
                    افزودن تغییر مسیر
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* جدول لیست ریدایرکت‌های فعال */}
          <Card style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>لیست تغییر مسیرهای فعال ({totalRedirects})</span>
              <Button isSmall variant="secondary" onClick={() => fetchRedirects(redirectPage)}>
                <span className="dashicons dashicons-update" /> تازه‌سازی
              </Button>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              {loadingRedirects ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Spinner />
                  <p style={{ marginTop: '8px', color: '#64748b' }}>در حال بارگذاری لیست ریدایرکت‌ها...</p>
                </div>
              ) : redirects.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <span className="dashicons dashicons-randomize" style={{ fontSize: '40px', width: '40px', height: '40px', color: '#94a3b8' }} />
                  <p style={{ marginTop: '12px', fontWeight: 600 }}>هیچ تغییر مسیری ثبت نشده است.</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>ریدایرکت‌های خودکار ناشی از تغییر اسلاگ پست‌ها و ریدایرکت‌های دستی در اینجا لیست خواهند شد.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="wp-list-table widefat fixed striped" style={{ border: 'none', margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '30%', fontWeight: 700 }}>آدرس مبدأ</th>
                        <th style={{ width: '30%', fontWeight: 700 }}>آدرس مقصد</th>
                        <th style={{ width: '12%', fontWeight: 700, textAlign: 'center' }}>کد وضعیت</th>
                        <th style={{ width: '10%', fontWeight: 700, textAlign: 'center' }}>تعداد بازدید</th>
                        <th style={{ width: '18%', fontWeight: 700, textAlign: 'center' }}>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redirects.map((item) => (
                        <tr key={item.id}>
                          <td style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '12px' }}>
                            <strong style={{ color: '#1e293b' }}>{item.source_url}</strong>
                          </td>
                          <td style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '12px', color: '#2563eb' }}>
                            {item.target_url}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: item.status_code == 301 ? '#dcfce7' : '#fef3c7',
                                color: item.status_code == 301 ? '#15803d' : '#b45309',
                              }}
                            >
                              {item.status_code}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                            {item.hits || 0}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Button
                              isDestructive
                              isSmall
                              variant="secondary"
                              onClick={() => handleDeleteRedirect(item.id)}
                            >
                              حذف
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* تب ۲: مانیتور خطاهای ۴۰۴ */}
      {activeSubTab === '404s' && (
        <div>
          <Card style={{ border: '1px solid #fee2e2', borderRadius: '8px' }}>
            <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff5f5', borderBottom: '1px solid #fee2e2' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#991b1b' }}>
                  گزارش خطاهای ۴۰۴ شناسایی شده ({total404})
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', marginInlineStart: '10px' }}>
                  صفحاتی که کاربران یا خزنده‌های گوگل با خطای Not Found مواجه شده‌اند.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button isSmall variant="secondary" onClick={() => fetch404s(page404)}>
                  <span className="dashicons dashicons-update" /> تازه‌سازی
                </Button>
                {logs404.length > 0 && (
                  <Button isSmall isDestructive variant="primary" onClick={handleClearAll404s}>
                    پاک‌سازی همه
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              {loading404 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Spinner />
                  <p style={{ marginTop: '8px', color: '#64748b' }}>در حال بارگذاری لاگ‌های ۴۰۴...</p>
                </div>
              ) : logs404.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <span className="dashicons dashicons-yes-alt" style={{ fontSize: '40px', width: '40px', height: '40px', color: '#16a34a' }} />
                  <p style={{ marginTop: '12px', fontWeight: 600, color: '#15803d' }}>عالی است! هیچ خطای ۴۰۴ فعالی ثبت نشده است.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="wp-list-table widefat fixed striped" style={{ border: 'none', margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40%', fontWeight: 700 }}>آدرس صفحه ناموجود (404 URL)</th>
                        <th style={{ width: '20%', fontWeight: 700 }}>ارجاع دهنده (Referrer)</th>
                        <th style={{ width: '10%', fontWeight: 700, textAlign: 'center' }}>تعداد خطا</th>
                        <th style={{ width: '15%', fontWeight: 700, textAlign: 'center' }}>آخرین مشاهده</th>
                        <th style={{ width: '15%', fontWeight: 700, textAlign: 'center' }}>اقدام هوشمند</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs404.map((item) => (
                        <tr key={item.id}>
                          <td style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '12px', color: '#dc2626' }}>
                            <strong>{item.url}</strong>
                          </td>
                          <td style={{ direction: 'ltr', textAlign: 'left', fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
                            {item.referer || 'مستقیم (Direct)'}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>
                            {item.hits}
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
                            {item.last_accessed || item.created_at}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '4px' }}>
                              <Button
                                isPrimary
                                isSmall
                                onClick={() => {
                                  setConvertModal({ id: item.id, url: item.url });
                                  setConvertTarget('/');
                                }}
                              >
                                ریدایرکت ۳۰۱ بساز
                              </Button>
                              <Button
                                isDestructive
                                isSmall
                                variant="tertiary"
                                onClick={() => handleDelete404(item.id)}
                              >
                                &times;
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* مودال تبدیل ۴۰۴ به ریدایرکت ۳۰۱ */}
      {convertModal && (
        <Modal
          title="تبدیل خطای ۴۰۴ به تغییر مسیر دائمی (301 Redirect)"
          onRequestClose={() => setConvertModal(null)}
          style={{ maxWidth: '500px' }}
        >
          <div dir="rtl" style={{ padding: '10px 0' }}>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              آدرس ناموجود مبدأ:
              <br />
              <code style={{ direction: 'ltr', display: 'block', marginTop: '4px', padding: '6px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px' }}>
                {convertModal.url}
              </code>
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
                آدرس مقصد برای ریدایرکت ۳۰۱:
              </label>
              <input
                type="text"
                className="regular-text"
                style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', direction: 'ltr' }}
                placeholder="/new-page/ یا /"
                value={convertTarget}
                onChange={(e) => setConvertTarget(e.target.value)}
                autoFocus
              />
              <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
                کاربران و موتورهای جستجو هنگام دسترسی به این آدرس بلافاصله به مقصد منتقل خواهند شد.
              </small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setConvertModal(null)}>
                انصراف
              </Button>
              <Button isPrimary isBusy={converting} disabled={converting} onClick={handleExecuteConvert404}>
                ثبت ریدایرکت ۳۰۱ و پاکسازی ۴۰۴
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
