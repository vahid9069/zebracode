import { createElement, useState, useEffect } from '@wordpress/element';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  TextControl,
  SelectControl,
  RangeControl,
  Spinner,
  Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ApiSettings({ onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    default_provider: 'gemini',
    gemini_api_key: '',
    gemini_model: 'gemini-1.5-flash',
    openai_api_key: '',
    openai_model: 'gpt-4o-mini',
    claude_api_key: '',
    claude_model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    max_tokens: 2000,
  });

  const [maskedState, setMaskedState] = useState({
    gemini_api_key_masked: '',
    gemini_api_key_configured: false,
    openai_api_key_masked: '',
    openai_api_key_configured: false,
    claude_api_key_masked: '',
    claude_api_key_configured: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';
      const res = await fetch(`${restUrl}settings`, {
        headers: { 'X-WP-Nonce': nonce },
      });
      const data = await res.json();
      if (data.settings) {
        setSettings({
          default_provider: data.settings.default_provider || 'gemini',
          gemini_api_key: '',
          gemini_model: data.settings.gemini_model || 'gemini-1.5-flash',
          openai_api_key: '',
          openai_model: data.settings.openai_model || 'gpt-4o-mini',
          claude_api_key: '',
          claude_model: data.settings.claude_model || 'claude-3-5-sonnet-20241022',
          temperature: parseFloat(data.settings.temperature) || 0.7,
          max_tokens: parseInt(data.settings.max_tokens, 10) || 2000,
        });

        setMaskedState({
          gemini_api_key_masked: data.settings.gemini_api_key_masked || '',
          gemini_api_key_configured: !!data.settings.gemini_api_key_configured,
          openai_api_key_masked: data.settings.openai_api_key_masked || '',
          openai_api_key_configured: !!data.settings.openai_api_key_configured,
          claude_api_key_masked: data.settings.claude_api_key_masked || '',
          claude_api_key_configured: !!data.settings.claude_api_key_configured,
        });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const restUrl = window.omniAiData?.restUrl || '/wp-json/omni-ai/v1/';
      const nonce = window.omniAiData?.nonce || '';

      const payload = {
        default_provider: settings.default_provider,
        gemini_model: settings.gemini_model,
        openai_model: settings.openai_model,
        claude_model: settings.claude_model,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
      };

      if (settings.gemini_api_key.trim()) {
        payload.gemini_api_key = settings.gemini_api_key.trim();
      }
      if (settings.openai_api_key.trim()) {
        payload.openai_api_key = settings.openai_api_key.trim();
      }
      if (settings.claude_api_key.trim()) {
        payload.claude_api_key = settings.claude_api_key.trim();
      }

      const res = await fetch(`${restUrl}settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotice({ type: 'success', message: __('Settings saved successfully.', 'omni-ai-suite') });
        fetchSettings();
        if (typeof onSettingsUpdated === 'function') {
          onSettingsUpdated(payload);
        }
      } else {
        throw new Error(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px' }}>
      {notice && (
        <div style={{ marginBottom: '16px' }}>
          <Notice status={notice.type} onDismiss={() => setNotice(null)}>
            {notice.message}
          </Notice>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Core Provider Selection */}
        <Card style={{ marginBottom: '20px' }}>
          <CardHeader>
            <strong>{__('Default Engine Settings', 'omni-ai-suite')}</strong>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <SelectControl
                label={__('Default Active Provider', 'omni-ai-suite')}
                value={settings.default_provider}
                options={[
                  { label: 'Google Gemini (Recommended)', value: 'gemini' },
                  { label: 'OpenAI (GPT-4o)', value: 'openai' },
                  { label: 'Anthropic Claude', value: 'claude' },
                ]}
                onChange={(val) => setSettings({ ...settings, default_provider: val })}
              />

              <RangeControl
                label={__('Global Temperature (Creativity)', 'omni-ai-suite')}
                value={settings.temperature}
                onChange={(val) => setSettings({ ...settings, temperature: val })}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          </CardBody>
        </Card>

        {/* Bring Your Own Key (BYOK) Section */}
        <Card style={{ marginBottom: '20px' }}>
          <CardHeader>
            <div>
              <strong>{__('Bring Your Own Key (BYOK) Credentials', 'omni-ai-suite')}</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#646970' }}>
                {__(
                  'Your API keys are stored securely on your server and NEVER exposed to frontend scripts or client browsers.',
                  'omni-ai-suite'
                )}
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {/* Google Gemini */}
            <div style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #f0f0f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Google Gemini</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: maskedState.gemini_api_key_configured ? '#e7f5ec' : '#fff8e5',
                    color: maskedState.gemini_api_key_configured ? '#1a7f37' : '#9a6700',
                  }}
                >
                  {maskedState.gemini_api_key_configured ? __('● Configured', 'omni-ai-suite') : __('○ Not Set', 'omni-ai-suite')}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px' }}>
                <TextControl
                  label={__('Gemini API Key', 'omni-ai-suite')}
                  value={settings.gemini_api_key}
                  onChange={(val) => setSettings({ ...settings, gemini_api_key: val })}
                  placeholder={maskedState.gemini_api_key_masked || 'AIzaSy...'}
                  type="password"
                  help={__('Get key at Google AI Studio (aistudio.google.com)', 'omni-ai-suite')}
                />
                <SelectControl
                  label={__('Model', 'omni-ai-suite')}
                  value={settings.gemini_model}
                  options={[
                    { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                    { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                    { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
                  ]}
                  onChange={(val) => setSettings({ ...settings, gemini_model: val })}
                />
              </div>
            </div>

            {/* OpenAI */}
            <div style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #f0f0f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>OpenAI</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: maskedState.openai_api_key_configured ? '#e7f5ec' : '#fff8e5',
                    color: maskedState.openai_api_key_configured ? '#1a7f37' : '#9a6700',
                  }}
                >
                  {maskedState.openai_api_key_configured ? __('● Configured', 'omni-ai-suite') : __('○ Not Set', 'omni-ai-suite')}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px' }}>
                <TextControl
                  label={__('OpenAI API Key', 'omni-ai-suite')}
                  value={settings.openai_api_key}
                  onChange={(val) => setSettings({ ...settings, openai_api_key: val })}
                  placeholder={maskedState.openai_api_key_masked || 'sk-proj-...'}
                  type="password"
                  help={__('Get key at platform.openai.com', 'omni-ai-suite')}
                />
                <SelectControl
                  label={__('Model', 'omni-ai-suite')}
                  value={settings.openai_model}
                  options={[
                    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                    { label: 'GPT-4o', value: 'gpt-4o' },
                    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
                  ]}
                  onChange={(val) => setSettings({ ...settings, openai_model: val })}
                />
              </div>
            </div>

            {/* Anthropic Claude */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Anthropic Claude</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: maskedState.claude_api_key_configured ? '#e7f5ec' : '#fff8e5',
                    color: maskedState.claude_api_key_configured ? '#1a7f37' : '#9a6700',
                  }}
                >
                  {maskedState.claude_api_key_configured ? __('● Configured', 'omni-ai-suite') : __('○ Not Set', 'omni-ai-suite')}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px' }}>
                <TextControl
                  label={__('Claude API Key', 'omni-ai-suite')}
                  value={settings.claude_api_key}
                  onChange={(val) => setSettings({ ...settings, claude_api_key: val })}
                  placeholder={maskedState.claude_api_key_masked || 'sk-ant-...'}
                  type="password"
                  help={__('Get key at console.anthropic.com', 'omni-ai-suite')}
                />
                <SelectControl
                  label={__('Model', 'omni-ai-suite')}
                  value={settings.claude_model}
                  options={[
                    { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
                    { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
                    { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
                  ]}
                  onChange={(val) => setSettings({ ...settings, claude_model: val })}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner /> {__('Saving...', 'omni-ai-suite')}
              </>
            ) : (
              __('Save Settings', 'omni-ai-suite')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
