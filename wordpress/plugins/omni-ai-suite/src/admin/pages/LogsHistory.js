import { createElement, useState, useEffect } from '@wordpress/element';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  TextControl,
  SelectControl,
  Modal,
  Spinner,
  Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { apiFetch } from '../utils/api';

export default function LogsHistory({ onNavigate }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [activeLog, setActiveLog] = useState(null);
  const [notice, setNotice] = useState(null);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (search) params.search = search;
      if (providerFilter) params.provider = providerFilter;

      const res = await apiFetch('logs', {}, params);

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.message) msg = `${errData.message} (${res.status})`;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await res.json();
      if (data && data.code) {
        throw new Error(data.message || data.code);
      }

      setLogs(Array.isArray(data?.logs) ? data.logs : []);
      setTotalPages(data?.total_pages || 1);
      setTotalCount(data?.total || 0);
      setPage(p);
    } catch (err) {
      console.error('Failed to fetch logs', err);
      setNotice({ type: 'error', message: err.message || __('Failed to fetch logs.', 'omni-ai-suite') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [providerFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(__('Are you sure you want to delete this log entry?', 'omni-ai-suite'))) {
      return;
    }
    try {
      const res = await apiFetch(`logs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setNotice({ type: 'success', message: __('Log entry deleted.', 'omni-ai-suite') });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || __('Failed to delete log entry.', 'omni-ai-suite') });
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(__('WARNING: This will permanently delete ALL logs from the custom table. Continue?', 'omni-ai-suite'))) {
      return;
    }
    try {
      const res = await apiFetch('logs/clear', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setLogs([]);
      setTotalCount(0);
      setNotice({ type: 'success', message: __('All logs cleared.', 'omni-ai-suite') });
    } catch (err) {
      setNotice({ type: 'error', message: err.message || __('Failed to clear logs.', 'omni-ai-suite') });
    }
  };

  return (
    <div>
      {notice && (
        <div style={{ marginBottom: '16px' }}>
          <Notice status={notice.type} onDismiss={() => setNotice(null)}>
            {notice.message}
          </Notice>
        </div>
      )}

      <Card>
        <CardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{__('Generation Logs & Audit Trail', 'omni-ai-suite')}</strong>
            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#646970' }}>
              ({totalCount} {__('total entries stored in custom table', 'omni-ai-suite')})
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => fetchLogs(page)}
              disabled={loading}
            >
              {loading ? __('Loading...', 'omni-ai-suite') : __('🔄 Refresh', 'omni-ai-suite')}
            </Button>
            {logs.length > 0 && (
              <Button variant="tertiary" isDestructive size="small" onClick={handleClearAll}>
                {__('Clear All Logs', 'omni-ai-suite')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {/* Filter Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '18px' }}>
            <div style={{ flex: 1, maxWidth: '300px' }}>
              <TextControl
                label={__('Search prompt/response', 'omni-ai-suite')}
                value={search}
                onChange={setSearch}
                placeholder={__('Search keywords...', 'omni-ai-suite')}
              />
            </div>
            <div style={{ width: '180px' }}>
              <SelectControl
                label={__('Filter by Provider', 'omni-ai-suite')}
                value={providerFilter}
                options={[
                  { label: __('All Providers', 'omni-ai-suite'), value: '' },
                  { label: 'Google Gemini', value: 'gemini' },
                  { label: 'OpenAI', value: 'openai' },
                  { label: 'Anthropic Claude', value: 'claude' },
                ]}
                onChange={setProviderFilter}
              />
            </div>
            <Button variant="secondary" type="submit" style={{ height: '36px', marginBottom: '8px' }}>
              {__('Filter', 'omni-ai-suite')}
            </Button>
          </form>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spinner />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#646970' }}>
              <p style={{ margin: '0 0 10px', fontSize: '14px' }}>
                {__('No generation logs found.', 'omni-ai-suite')}
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  if (typeof onNavigate === 'function') {
                    onNavigate('studio');
                  } else {
                    window.location.hash = '#/studio';
                  }
                }}
              >
                {__('Go to Content Studio to Generate First Article', 'omni-ai-suite')}
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="widefat striped" style={{ border: 'none' }}>
                <thead>
                  <tr>
                    <th>{__('Date', 'omni-ai-suite')}</th>
                    <th>{__('Provider', 'omni-ai-suite')}</th>
                    <th>{__('Model', 'omni-ai-suite')}</th>
                    <th>{__('Prompt Snippet', 'omni-ai-suite')}</th>
                    <th style={{ textAlign: 'right' }}>{__('Actions', 'omni-ai-suite')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{row.created_at}</td>
                      <td>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                          {row.provider || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#50575e' }}>{row.model}</td>
                      <td style={{ maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}>
                        {row.prompt}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Button
                          variant="tertiary"
                          size="small"
                          onClick={() => setActiveLog(row)}
                          style={{ marginRight: '6px' }}
                        >
                          {__('View Details', 'omni-ai-suite')}
                        </Button>
                        <Button
                          variant="tertiary"
                          isDestructive
                          size="small"
                          onClick={() => handleDelete(row.id)}
                        >
                          {__('Delete', 'omni-ai-suite')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '8px 0' }}>
                  <span style={{ fontSize: '13px', color: '#646970' }}>
                    {`${__('Page', 'omni-ai-suite')} ${page} ${__('of', 'omni-ai-suite')} ${totalPages}`}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={page <= 1}
                      onClick={() => fetchLogs(page - 1)}
                    >
                      {__('« Previous', 'omni-ai-suite')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={page >= totalPages}
                      onClick={() => fetchLogs(page + 1)}
                    >
                      {__('Next »', 'omni-ai-suite')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Detail Modal */}
      {activeLog && (
        <Modal
          title={__('Generation Log Details', 'omni-ai-suite')}
          onRequestClose={() => setActiveLog(null)}
          style={{ maxWidth: '750px', width: '90%' }}
        >
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', color: '#646970' }}>
              <strong>{__('Model:', 'omni-ai-suite')}</strong> {activeLog.provider} / {activeLog.model} &bull; {activeLog.created_at}
            </span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              {__('Prompt:', 'omni-ai-suite')}
            </label>
            <div style={{ background: '#f0f0f1', padding: '10px 14px', borderRadius: '4px', fontSize: '13px' }}>
              {activeLog.prompt}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              {__('Generated Response:', 'omni-ai-suite')}
            </label>
            <div
              style={{
                background: '#f6f7f7',
                border: '1px solid #dcdcde',
                padding: '12px 16px',
                borderRadius: '4px',
                maxHeight: '350px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              {activeLog.response}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(activeLog.response);
              }}
            >
              {__('Copy Response', 'omni-ai-suite')}
            </Button>
            <Button variant="primary" onClick={() => setActiveLog(null)}>
              {__('Close', 'omni-ai-suite')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
