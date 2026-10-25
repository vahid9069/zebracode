import { createElement, useState, useEffect } from '@wordpress/element';
import { Card, CardBody, CardHeader, ToggleControl, Spinner, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ModulesManager() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      const res = await fetch(`${restUrl}modules`, {
        headers: { 'X-WP-Nonce': nonce },
      });
      const data = await res.json();
      setModules(data.modules || []);
    } catch (err) {
      setNotice({ type: 'error', message: 'Failed to load modules list.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (moduleId, currentState) => {
    setUpdatingId(moduleId);
    setNotice(null);

    const newState = !currentState;
    try {
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      const res = await fetch(`${restUrl}modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify({
          module_id: moduleId,
          active: newState,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setModules(data.modules || []);
        setNotice({
          type: 'success',
          message: sprintf(
            newState
              ? __('Module "%s" enabled.', 'omni-ai-suite')
              : __('Module "%s" disabled. Inactive modules will not load any hooks or scripts.', 'omni-ai-suite'),
            moduleId
          ),
        });
      } else {
        throw new Error(data.message || 'Failed to update module state.');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      {notice && (
        <div style={{ marginBottom: '16px' }}>
          <Notice status={notice.type} onDismiss={() => setNotice(null)}>
            {notice.message}
          </Notice>
        </div>
      )}

      <Card>
        <CardHeader>
          <div>
            <strong>{__('Modular System Controls', 'omni-ai-suite')}</strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#646970' }}>
              {__(
                'Strict performance rule: Every inactive module is completely detached. Inactive modules register ZERO actions, filters, or script handles in WordPress.',
                'omni-ai-suite'
              )}
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <Spinner />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {modules.map((m) => (
                <div key={m.id} className="omni-ai-module-card">
                  <div className="omni-ai-module-info">
                    <h4>{m.title}</h4>
                    <p>{m.description}</p>
                    <span style={{ fontSize: '11px', color: '#8c8f94', fontFamily: 'monospace' }}>
                      ID: {m.id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {updatingId === m.id && <Spinner />}
                    <ToggleControl
                      checked={m.active}
                      onChange={() => handleToggle(m.id, m.active)}
                      disabled={updatingId === m.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
