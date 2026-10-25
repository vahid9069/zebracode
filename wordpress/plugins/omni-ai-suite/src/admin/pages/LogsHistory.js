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

export default function LogsHistory() {
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
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      let url = `${restUrl}logs?page=${p}&limit=15`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (providerFilter) url += `&provider=${encodeURIComponent(providerFilter)}`;

      const res = await fetch(url, {
        headers: { 'X-WP-Nonce': nonce },
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
      setPage(p);
    } catch (err) {
      setNotice({ type: 'error', message: 'Failed to fetch logs.' });
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
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      await fetch(`${restUrl}logs/${id}`, {
        method: 'DELETE',
        headers: { 'X-WP-Nonce': nonce },
      });
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setNotice({ type: 'success', message: __('Log entry deleted.', 'omni-ai-suite') });
    } catch (err) {
      setNotice({ type: 'error', message: __('Failed to delete log entry.', 'omni-ai-suite') });
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(__('WARNING: This will permanently delete ALL logs from the custom table. Continue?', 'omni-ai-suite'))) {
      return;
    }
    try {
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      await fetch(`${restUrl}logs/clear`, {
        method: 'POST',
        headers: { 'X-WP-Nonce': nonce },
      });
      setLogs([]);
      setTotalCount(0);
      setNotice({ type: 'success', message: __('All logs cleared.', 'omni-ai-suite') });
    } catch (err) {
      setNotice({ type: 'error', message: __('Failed to clear logs.', 'omni-ai-suite') });
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
          {logs.length > 0 && (
            <Button variant="tertiary" isDestructive size="small" onClick={handleClearAll}>
              {__('Clear All Logs', 'omni-ai-suite')}
            </Button>
          )}
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
            <p style={{ color: '#646970', padding: '20px 0', textAlign: 'center' }}>
              {__('No generation logs found.', 'omni-ai-suite')}
            </p>
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
                    {sprintf(__('Page %1$d of %2$d', 'omni-ai-suite'), page, totalPages)}
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
