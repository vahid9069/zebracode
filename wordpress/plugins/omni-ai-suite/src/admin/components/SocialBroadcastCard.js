import { createElement, useState, useEffect } from '@wordpress/element';
import { Card, CardBody, CardHeader, Button, Spinner, Notice } from '@wordpress/components';
import { apiFetch } from '../utils/api';

export default function SocialBroadcastCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [testingPlatform, setTestingPlatform] = useState(null);
  const [testingReminder, setTestingReminder] = useState(false);
  const [sendingPostId, setSendingPostId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [secretCopied, setSecretCopied] = useState(false);

  const [settings, setSettings] = useState({
    blog_base_url: 'https://zebracode.ir/blog',
    telegram_enabled: false,
    has_telegram_token: false,
    telegram_masked: '',
    telegram_chat_id: '',
    bale_enabled: false,
    has_bale_token: false,
    bale_masked: '',
    bale_chat_id: '',
    rubika_enabled: false,
    has_rubika_token: false,
    rubika_masked: '',
    rubika_chat_id: '',
    delete_on_draft: false,
    verify_live_url: true,
    webhook_secret: '',
    webhook_url: '',
  });

  const [tgTokenInput, setTgTokenInput] = useState('');
  const [baleTokenInput, setBaleTokenInput] = useState('');
  const [rubikaTokenInput, setRubikaTokenInput] = useState('');
  const [posts, setPosts] = useState([]);

  const fetchSocialData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('social-broadcast');
      const data = await res.json();
      if (data && data.success) {
        setSettings(data.settings || {});
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      }
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'خطا در دریافت تنظیمات انتشار شبکه‌های اجتماعی' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await apiFetch('social-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_settings',
          blog_base_url: settings.blog_base_url,
          telegram_enabled: settings.telegram_enabled,
          telegram_bot_token: tgTokenInput.trim(),
          telegram_chat_id: settings.telegram_chat_id,
          bale_enabled: settings.bale_enabled,
          bale_bot_token: baleTokenInput.trim(),
          bale_chat_id: settings.bale_chat_id,
          rubika_enabled: settings.rubika_enabled,
          rubika_bot_token: rubikaTokenInput.trim(),
          rubika_chat_id: settings.rubika_chat_id,
          delete_on_draft: settings.delete_on_draft,
          verify_live_url: settings.verify_live_url,
          daily_reminder_enabled: settings.daily_reminder_enabled,
          daily_reminder_time: settings.daily_reminder_time,
          daily_reminder_telegram: settings.daily_reminder_telegram,
          daily_reminder_bale: settings.daily_reminder_bale,
          daily_reminder_telegram_chat_id: settings.daily_reminder_telegram_chat_id,
          daily_reminder_bale_chat_id: settings.daily_reminder_bale_chat_id,
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        setNotice({ type: 'success', message: data.message || 'تنظیمات ذخیره شد.' });
        setTgTokenInput('');
        setBaleTokenInput('');
        setRubikaTokenInput('');
        await fetchSocialData();
      } else {
        throw new Error(data?.message || 'خطا در ذخیره تنظیمات');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'خطا در ارتباط با سرور' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestChannel = async (platform) => {
    setTestingPlatform(platform);
    setNotice(null);
    try {
      const res = await apiFetch('social-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_channel', platform }),
      });
      const data = await res.json();
      if (data && data.success) {
        setNotice({ type: 'success', message: `✅ پیام آزمایشی با موفقیت به ${platform === 'telegram' ? 'تلگرام' : platform === 'bale' ? 'بله' : 'روبیکا'} ارسال شد.` });
      } else {
        setNotice({ type: 'error', message: data?.error || data?.message || 'خطا در ارسال پیام آزمایشی (ابتدا تنظیمات را ذخیره کنید).' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'خطا در ارتباط با سرور' });
    } finally {
      setTestingPlatform(null);
    }
  };

  const handleBroadcastPending = async () => {
    setBroadcasting(true);
    setNotice(null);
    try {
      const res = await apiFetch('social-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'broadcast_pending' }),
      });
      const data = await res.json();
      setNotice({
        type: data?.success ? 'success' : 'warning',
        message: data?.message || 'عملیات انجام شد.',
      });
      await fetchSocialData();
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'خطا در ارسال مقالات به کانال‌ها' });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleBroadcastSingle = async (postId, force = false) => {
    setSendingPostId(postId);
    setNotice(null);
    try {
      const res = await apiFetch('social-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'broadcast_post', post_id: postId, force }),
      });
      const data = await res.json();
      if (data && data.success) {
        setNotice({ type: 'success', message: `مقاله «${data.title}» با موفقیت به کانال‌های فعال ارسال شد.` });
      } else {
        setNotice({ type: 'error', message: data?.message || 'خطا در ارسال مقاله' });
      }
      await fetchSocialData();
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'خطا در ارتباط با سرور' });
    } finally {
      setSendingPostId(null);
    }
  };

  const pendingCount = posts.filter((p) => !p.posted).length;

  return (
    <Card style={{ marginTop: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
            📢 انتشار خودکار مقالات در کانال تلگرام، بله و روبیکا
          </span>
          <Button
            variant="primary"
            onClick={handleBroadcastPending}
            disabled={broadcasting || loading}
            style={{ background: '#0284c7', borderColor: '#0284c7', borderRadius: '8px', height: '36px' }}
          >
            {broadcasting ? <Spinner /> : `📢 ارسال مقالات جدید منتشرنشده (${pendingCount})`}
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        {notice && (
          <div style={{ marginBottom: '16px' }}>
            <Notice status={notice.type} isDismissible onRemove={() => setNotice(null)}>
              {notice.message}
            </Notice>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}><Spinner /></div>
        ) : (
          <>
            <form onSubmit={handleSaveSettings}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                {/* Telegram Box */}
                <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px', color: '#0369a1', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.telegram_enabled)}
                        onChange={(e) => setSettings({ ...settings, telegram_enabled: e.target.checked })}
                      />
                      <span>تلگرام (Telegram)</span>
                    </label>
                    <Button variant="secondary" size="small" disabled={testingPlatform === 'telegram'} onClick={() => handleTestChannel('telegram')}>
                      {testingPlatform === 'telegram' ? '...' : '🧪 تست ارسال'}
                    </Button>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      توکن ربات {settings.has_telegram_token && <span style={{ color: '#059669' }}>({settings.telegram_masked})</span>}
                    </label>
                    <input
                      type="password"
                      value={tgTokenInput}
                      onChange={(e) => setTgTokenInput(e.target.value)}
                      placeholder={settings.has_telegram_token ? 'برای حفظ توکن فعلی خالی بگذارید' : '123456789:ABCdef...'}
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '12.5px', direction: 'ltr' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>شناسه کانال (@channel یا -100...)</label>
                    <input
                      type="text"
                      value={settings.telegram_chat_id || ''}
                      onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                      placeholder="@zebracode_ir"
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '12.5px', direction: 'ltr' }}
                    />
                  </div>
                </div>

                {/* Bale Box */}
                <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px', color: '#047857', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.bale_enabled)}
                        onChange={(e) => setSettings({ ...settings, bale_enabled: e.target.checked })}
                      />
                      <span>بله (Bale)</span>
                    </label>
                    <Button variant="secondary" size="small" disabled={testingPlatform === 'bale'} onClick={() => handleTestChannel('bale')}>
                      {testingPlatform === 'bale' ? '...' : '🧪 تست ارسال'}
                    </Button>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      توکن بازو {settings.has_bale_token && <span style={{ color: '#059669' }}>({settings.bale_masked})</span>}
                    </label>
                    <input
                      type="password"
                      value={baleTokenInput}
                      onChange={(e) => setBaleTokenInput(e.target.value)}
                      placeholder={settings.has_bale_token ? 'برای حفظ توکن فعلی خالی بگذارید' : 'توکن بازوی بله...'}
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '12.5px', direction: 'ltr' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>شناسه کانال (@channel یا chat_id)</label>
                    <input
                      type="text"
                      value={settings.bale_chat_id || ''}
                      onChange={(e) => setSettings({ ...settings, bale_chat_id: e.target.value })}
                      placeholder="@zebracode"
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '12.5px', direction: 'ltr' }}
                    />
                  </div>
                </div>

                {/* Rubika Box */}
                <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px', color: '#7c3aed', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.rubika_enabled)}
                        onChange={(e) => setSettings({ ...settings, rubika_enabled: e.target.checked })}
                      />
                      <span>روبیکا (Rubika)</span>
                    </label>
                    <Button variant="secondary" size="small" disabled={testingPlatform === 'rubika'} onClick={() => handleTestChannel('rubika')}>
                      {testingPlatform === 'rubika' ? '...' : '🧪 تست ارسال'}
                    </Button>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      توکن ربات روبیکا {settings.has_rubika_token && <span style={{ color: '#059669' }}>({settings.rubika_masked})</span>}
                    </label>
                    <input
                      type="password"
                      value={rubikaTokenInput}
                      onChange={(e) => setRubikaTokenInput(e.target.value)}
                      placeholder={settings.has_rubika_token ? 'برای حفظ توکن فعلی خالی بگذارید' : 'توکن ربات روبیکا...'}
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '12.5px', direction: 'ltr' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>شناسه کانال روبیکا (chat_id)</label>
                    <input
                      type="text"
                      value={settings.rubika_chat_id || ''}
                      onChange={(e) => setSettings({ ...settings, rubika_chat_id: e.target.value })}
                      placeholder="c0..."
                      style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '12.5px', direction: 'ltr' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>آدرس پایه وبلاگ (برای تست در استیجینگ: https://test.zebracode.ir/blog)</label>
                  <input
                    type="text"
                    value={settings.blog_base_url || 'https://zebracode.ir/blog'}
                    onChange={(e) => setSettings({ ...settings, blog_base_url: e.target.value })}
                    style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '12.5px', direction: 'ltr' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.verify_live_url)}
                      onChange={(e) => setSettings({ ...settings, verify_live_url: e.target.checked })}
                    />
                    <span>بررسی در دسترس بودن لینک مقاله (HTTP 200) پیش از ارسال (جلوگیری از لینک ۴۰۴)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.delete_on_draft)}
                      onChange={(e) => setSettings({ ...settings, delete_on_draft: e.target.checked })}
                    />
                    <span>حذف خودکار پست از کانال در صورت برگشت مقاله به «پیش‌نویس» یا «زباله‌دان»</span>
                  </label>
                </div>
              </div>

              {/* Daily Missing-Article Reminder */}
              <div style={{ padding: '14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#92400e', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.daily_reminder_enabled)}
                      onChange={(e) => setSettings({ ...settings, daily_reminder_enabled: e.target.checked })}
                    />
                    <span>⏰ یادآور روزانه عدم ثبت مقاله (هشدار در تلگرام یا بله اگر امروز مقاله‌ای نساخته‌اید)</span>
                  </label>
                  <Button
                    variant="secondary"
                    size="small"
                    disabled={testingReminder}
                    onClick={async () => {
                      setTestingReminder(true);
                      setNotice(null);
                      try {
                        const res = await apiFetch('social-broadcast', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'test_daily_reminder' }),
                        });
                        const data = await res.json();
                        setNotice({ type: data?.success ? 'success' : 'error', message: data?.message || 'خطا در تست یادآور' });
                      } catch (err) {
                        setNotice({ type: 'error', message: err?.message || 'خطا در ارتباط با سرور' });
                      } finally {
                        setTestingReminder(false);
                      }
                    }}
                  >
                    {testingReminder ? '...' : '🧪 تست هشدار یادآور'}
                  </Button>
                </div>

                {settings.daily_reminder_enabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#78350f' }}>ساعت بررسی و ارسال هشدار</label>
                      <input
                        type="time"
                        value={settings.daily_reminder_time || '20:00'}
                        onChange={(e) => setSettings({ ...settings, daily_reminder_time: e.target.value })}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #fcd34d', padding: '0 8px', fontSize: '12.5px', direction: 'ltr' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#78350f', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(settings.daily_reminder_telegram)}
                          onChange={(e) => setSettings({ ...settings, daily_reminder_telegram: e.target.checked })}
                        />
                        <span>ارسال به تلگرام (اختیاری: چت‌آیدی شخصی)</span>
                      </label>
                      <input
                        type="text"
                        value={settings.daily_reminder_telegram_chat_id || ''}
                        onChange={(e) => setSettings({ ...settings, daily_reminder_telegram_chat_id: e.target.value })}
                        placeholder="خالی = کانال اصلی تلگرام"
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #fcd34d', padding: '0 8px', fontSize: '12px', direction: 'ltr' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#78350f', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(settings.daily_reminder_bale)}
                          onChange={(e) => setSettings({ ...settings, daily_reminder_bale: e.target.checked })}
                        />
                        <span>ارسال به بله (اختیاری: چت‌آیدی شخصی)</span>
                      </label>
                      <input
                        type="text"
                        value={settings.daily_reminder_bale_chat_id || ''}
                        onChange={(e) => setSettings({ ...settings, daily_reminder_bale_chat_id: e.target.value })}
                        placeholder="خالی = کانال اصلی بله"
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #fcd34d', padding: '0 8px', fontSize: '12px', direction: 'ltr' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* GitHub Actions Webhook Info */}
              <div style={{ padding: '12px 14px', background: '#0f172a', color: '#e2e8f0', borderRadius: '8px', marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span>
                    🔐 کلید Secret وب‌هوک برای گیت‌هاب اکشنز (<code>OMNI_SOCIAL_WEBHOOK_SECRET</code>):{' '}
                    <code style={{ color: '#38bdf8', background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>{settings.webhook_secret}</code>
                  </span>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(settings.webhook_secret || '');
                      setSecretCopied(true);
                      setTimeout(() => setSecretCopied(false), 2000);
                    }}
                  >
                    {secretCopied ? '✓ کپی شد' : 'کپی Secret'}
                  </Button>
                </div>
              </div>

              <Button variant="primary" type="submit" disabled={saving} style={{ height: '38px', padding: '0 18px', borderRadius: '6px' }}>
                {saving ? <Spinner /> : 'ذخیره تنظیمات شبکه‌های اجتماعی'}
              </Button>
            </form>

            {/* Recent Published Posts Broadcast Status */}
            {posts.length > 0 && (
              <div style={{ marginTop: '22px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                  وضعیت ارسال آخرین مقالات منتشرشده:
                </h4>
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'right' }}>
                        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>عنوان مقاله</th>
                        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>وضعیت کانال</th>
                        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.title}</td>
                          <td style={{ padding: '8px 12px' }}>
                            {p.posted ? (
                              <span style={{ color: '#059669', fontWeight: 600 }}>
                                ✅ ارسال‌شده ({(p.channels || []).join('، ') || 'کانال'})
                              </span>
                            ) : (
                              <span style={{ color: '#d97706', fontWeight: 600 }}>⏳ در انتظار ارسال</span>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <Button
                              variant="secondary"
                              size="small"
                              disabled={sendingPostId === p.id}
                              onClick={() => handleBroadcastSingle(p.id, p.posted)}
                            >
                              {sendingPostId === p.id ? '...' : p.posted ? '🔄 ارسال مجدد' : '📢 ارسال به کانال'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
