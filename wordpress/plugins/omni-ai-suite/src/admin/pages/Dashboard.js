import { createElement, useState, useEffect } from '@wordpress/element';
import { Card, CardBody, CardHeader, Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    total_generations: 0,
    total_tokens: 0,
    generations_today: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
        const nonce = window.omniAiData?.nonce || '';
        const res = await fetch(`${restUrl}logs?limit=5`, {
          headers: { 'X-WP-Nonce': nonce },
        });
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.logs) {
          setRecentLogs(data.logs);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {/* Stat cards */}
      <div className="omni-ai-stats-grid">
        <div className="omni-ai-stat-card">
          <div className="omni-ai-stat-label">{__('Total Generations', 'omni-ai-suite')}</div>
          <div className="omni-ai-stat-val">{stats.total_generations.toLocaleString()}</div>
        </div>
        <div className="omni-ai-stat-card">
          <div className="omni-ai-stat-label">{__('Estimated Tokens Used', 'omni-ai-suite')}</div>
          <div className="omni-ai-stat-val">{stats.total_tokens.toLocaleString()}</div>
        </div>
        <div className="omni-ai-stat-card">
          <div className="omni-ai-stat-label">{__('Generations Today', 'omni-ai-suite')}</div>
          <div className="omni-ai-stat-val" style={{ color: '#2271b1' }}>
            {stats.generations_today.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Card>
          <CardHeader>
            <strong>{__('✍️ AI Content Studio', 'omni-ai-suite')}</strong>
          </CardHeader>
          <CardBody>
            <p style={{ color: '#646970', fontSize: '13px' }}>
              {__('Generate blog posts, headlines, meta descriptions, and code with instant Server-Sent Events (SSE) streaming.', 'omni-ai-suite')}
            </p>
            <Button
              variant="primary"
              onClick={() => onNavigate('studio')}
              style={{ marginTop: '10px' }}
            >
              {__('Open Content Studio', 'omni-ai-suite')}
            </Button>
          </CardBody>
        </Card>

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
          {recentLogs.length === 0 ? (
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
                          {log.provider}
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
