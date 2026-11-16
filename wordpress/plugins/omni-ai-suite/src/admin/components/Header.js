import { createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function Header({ configured = true, activeProvider = 'gemini' }) {
  const providerNames = {
    gemini: 'Google Gemini',
    openai: 'OpenAI',
    claude: 'Anthropic Claude',
  };

  const isFa = document.dir === 'rtl' || (window.omniAiData?.isRtl ?? true);

  return (
    <header className="omni-ai-header">
      <div className="omni-ai-header-left">
        <div className="omni-ai-header-logo">
          <span className="omni-ai-header-icon">⚡</span>
          <h1 className="omni-ai-header-title">Omni AI Suite</h1>
        </div>
        <span className="omni-ai-header-ver">v{window.omniAiData?.version || '1.0.0'}</span>
      </div>

      <div className="omni-ai-header-right">
        <button
          type="button"
          onClick={() => {
            window.location.hash = '#/cicd';
          }}
          className="omni-header-deploy-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            border: '1px solid #38bdf8',
            borderRadius: '20px',
            color: '#ffffff',
            padding: '5px 13px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={isFa ? 'مدیریت صف، وضعیت و اجرای بیلد وبلاگ در گیت‌هاب اکشنز' : __('Deploy Blog (CI/CD)', 'omni-ai-suite')}
        >
          <span className="dashicons dashicons-cloud-upload" style={{ fontSize: '15px', width: '15px', height: '15px' }} />
          <span>{isFa ? '🚀 بیلد وبلاگ' : __('Deploy Blog', 'omni-ai-suite')}</span>
        </button>

        <div className="omni-ai-header-status-pill">
          <span
            className="omni-ai-status-dot"
            style={{ backgroundColor: configured ? '#10b981' : '#f59e0b' }}
            title={configured ? __('سیستم آماده است', 'omni-ai-suite') : __('کلید API لازم است', 'omni-ai-suite')}
          />
          <span className="omni-ai-header-provider-label">
            {providerNames[activeProvider] || activeProvider}
          </span>
          <span className="omni-ai-header-status-tag">
            {configured ? (isFa ? 'فعال' : 'Ready') : (isFa ? 'نیاز به کلید' : 'Key Needed')}
          </span>
        </div>
      </div>
    </header>
  );
}
