import { createElement, useState, useEffect } from '@wordpress/element';
import { Card, CardBody, CardHeader, Button, Spinner, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../utils/api';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    total_generations: 0,
    total_tokens: 0,
    generations_today: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch('logs', {}, { limit: 5 });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.message) msg = `${errData.message} (${res.status})`;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await res.json();
      if (data && data.stats) {
        setStats(data.stats);
      }
      if (data && Array.isArray(data.logs)) {
        setRecentLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setErrorMsg(err.message || __('Failed to fetch dashboard data.', 'omni-ai-suite'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div>
      {errorMsg && (
        <div style={{ marginBottom: '16px' }}>
          <Notice status="error" isDismissible={false}>
            {errorMsg}
          </Notice>
        </div>
      )}

      {/* Header bar with Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          {__('Overview & Generation Statistics', 'omni-ai-suite')}
        </h2>
        <Button
          variant="secondary"
          size="small"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          {loading ? __('Refreshing...', 'omni-ai-suite') : __('🔄 Refresh Data', 'omni-ai-suite')}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="omni-ai-stats-grid">
        <div className="omni-ai-stat-card">
          <div className="omni-ai-stat-label">{__('Total Generations', 'omni-ai-suite')}</div>
          <div className="omni-ai-stat-val">
            {Number(stats?.total_generations || 0).toLocaleString()}
          </div>
        </div>
        <div className="omni-ai-stat-card">
          <div className="omni-ai-stat-label">{__('Estimated Tokens Used', 'omni-ai-suite')}</div>
          <div className="omni-ai-stat-val">
            {Number(stats?.total_tokens || 0).toLocaleString()}
          </div>
        </div>
        <div className="omni-ai-stat-card">
          <div className="omni-ai-stat-label">{__('Generations Today', 'omni-ai-suite')}</div>
          <div className="omni-ai-stat-val" style={{ color: '#2271b1' }}>
            {Number(stats?.generations_today || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Card>
          <CardHeader>
            <strong>{__('✍️ Article Creator (JSON Importer)', 'omni-ai-suite')}</strong>
          </CardHeader>
          <CardBody>
            <p style={{ color: '#646970', fontSize: '13px' }}>
              {__('درج و پردازش سریع خروجی JSON از چت‌بات‌ها همراه با ایجاد پیش‌نویس، متادیتای کامل سئو و پرامپت‌های تصویر.', 'omni-ai-suite')}
            </p>
            <Button
              variant="primary"
              onClick={() => onNavigate('studio')}
              style={{ marginTop: '10px' }}
            >
              {__('ورود به بخش ایجاد مقاله', 'omni-ai-suite')}
            </Button>
          </CardBody>
        </Card>

        {/* Temporarily hidden - Bulk Generator
        <Card>
          <CardHeader>
            <strong>{__('⚡ Bulk Post Generator', 'omni-ai-suite')}</strong>
          </CardHeader>
          <CardBody>
            <p style={{ color: '#646970', fontSize: '13px' }}>
              {__('Generate 10 to 100+ articles in background workers using Action Scheduler without HTTP 504 timeouts.', 'omni-ai-suite')}
            </p>
            <Button
              variant="secondary"
              onClick={() => onNavigate('bulk')}
              style={{ marginTop: '10px' }}
            >
              {__('Launch Bulk Generator', 'omni-ai-suite')}
            </Button>
          </CardBody>
        </Card>
        */}

        <Card>
          <CardHeader>
            <strong>{__('🧩 Modular Architecture', 'omni-ai-suite')}</strong>
          </CardHeader>
          <CardBody>
            <p style={{ color: '#646970', fontSize: '13px' }}>
              {__('Enable or disable Gutenberg, Elementor, WooCommerce, and Chatbot modules. Inactive modules load 0 assets.', 'omni-ai-suite')}
            </p>
            <Button
              variant="secondary"
              onClick={() => onNavigate('modules')}
              style={{ marginTop: '10px' }}
            >
              {__('Manage Modules', 'omni-ai-suite')}
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Recent Generations */}
      <Card>
        <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>{__('Recent Generations (Custom Table - No CPT Bloat)', 'omni-ai-suite')}</strong>
          <Button variant="link" onClick={() => onNavigate('logs')}>
            {__('View All History →', 'omni-ai-suite')}
          </Button>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <Spinner />
            </div>
          ) : recentLogs.length === 0 ? (
            <p style={{ color: '#646970', margin: '10px 0' }}>
              {__('No generation history found yet. Head to the Content Studio to start writing!', 'omni-ai-suite')}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="widefat striped" style={{ border: 'none' }}>
                <thead>
                  <tr>
                    <th>{__('Date', 'omni-ai-suite')}</th>
                    <th>{__('Provider', 'omni-ai-suite')}</th>
                    <th>{__('Model', 'omni-ai-suite')}</th>
                    <th>{__('Prompt Preview', 'omni-ai-suite')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{log.created_at}</td>
                      <td>
                        <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold' }}>
                          {log.provider || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#50575e' }}>{log.model}</td>
                      <td style={{ fontSize: '13px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.prompt}
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
  );
}
