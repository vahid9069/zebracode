import { createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function Header({ configured = true, activeProvider = 'gemini' }) {
  const providerNames = {
    gemini: 'Google Gemini',
    openai: 'OpenAI',
    claude: 'Anthropic Claude',
  };

  return (
    <header className="omni-ai-header">
      <div className="omni-ai-header-left">
        <div className="omni-ai-header-icon">
          ⚡
        </div>
        <div>
          <h1 className="omni-ai-header-title">{__('Omni AI Suite', 'omni-ai-suite')}</h1>
          <div style={{ fontSize: '12px', color: '#646970' }}>
            {__('Modular, High-Performance WordPress AI Engine', 'omni-ai-suite')} &bull; v{window.omniAiData?.version || '1.0.0'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#50575e' }}>
          {__('Active Provider:', 'omni-ai-suite')} <strong>{providerNames[activeProvider] || activeProvider}</strong>
        </span>
        <span className={`omni-ai-header-badge ${configured ? 'configured' : 'unconfigured'}`}>
          {configured ? __('● Ready', 'omni-ai-suite') : __('● Key Needed', 'omni-ai-suite')}
        </span>
      </div>
    </header>
  );
}
