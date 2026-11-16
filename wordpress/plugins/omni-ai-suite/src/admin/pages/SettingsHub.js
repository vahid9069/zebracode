import { createElement, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ApiSettings from './ApiSettings';
import ModulesManager from './ModulesManager';
import LogsHistory from './LogsHistory';
import ToolsManager from './ToolsManager';
import DeployManager from './DeployManager';

export default function SettingsHub({ initialSubTab = 'api', onSettingsUpdated, onNavigate }) {
  const [subTab, setSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (key) => {
    setSubTab(key);
    window.location.hash = `#/${key}`;
  };

  const isFa = document.dir === 'rtl' || (window.omniAiData?.isRtl ?? true);

  return (
    <div className="omni-settings-hub">
      {/* Sleek Minimal Segmented Switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '22px' }}>
        <div className="omni-segmented-control" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            className={`omni-segmented-btn ${subTab === 'api' || subTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleSubTabChange('api')}
          >
            <span className="dashicons dashicons-admin-settings" style={{ fontSize: '16px', width: '16px', height: '16px' }} />
            <span>{isFa ? 'تنظیمات API و کلیدها (BYOK)' : __('API & Keys', 'omni-ai-suite')}</span>
          </button>

          <button
            type="button"
            className={`omni-segmented-btn ${subTab === 'cicd' || subTab === 'deploy' ? 'active' : ''}`}
            onClick={() => handleSubTabChange('cicd')}
          >
            <span className="dashicons dashicons-cloud-upload" style={{ fontSize: '16px', width: '16px', height: '16px' }} />
            <span>{isFa ? '🚀 بیلد و انتشار وبلاگ (CI/CD)' : __('Blog CI/CD', 'omni-ai-suite')}</span>
          </button>

          <button
            type="button"
            className={`omni-segmented-btn ${subTab === 'tools' ? 'active' : ''}`}
            onClick={() => handleSubTabChange('tools')}
          >
            <span className="dashicons dashicons-admin-links" style={{ fontSize: '16px', width: '16px', height: '16px' }} />
            <span>{isFa ? '🔗 ابزارهای سایت (Sitemap)' : __('Site Tools (Sitemap)', 'omni-ai-suite')}</span>
          </button>

          <button
            type="button"
            className={`omni-segmented-btn ${subTab === 'modules' ? 'active' : ''}`}
            onClick={() => handleSubTabChange('modules')}
          >
            <span className="dashicons dashicons-screenoptions" style={{ fontSize: '16px', width: '16px', height: '16px' }} />
            <span>{isFa ? 'ماژول‌ها' : __('Modules', 'omni-ai-suite')}</span>
          </button>

          <button
            type="button"
            className={`omni-segmented-btn ${subTab === 'logs' ? 'active' : ''}`}
            onClick={() => handleSubTabChange('logs')}
          >
            <span className="dashicons dashicons-list-view" style={{ fontSize: '16px', width: '16px', height: '16px' }} />
            <span>{isFa ? 'لاگ‌ها و تاریخچه' : __('Logs & History', 'omni-ai-suite')}</span>
          </button>
        </div>
      </div>

      {/* Sub-Views */}
      {(subTab === 'api' || subTab === 'settings') && (
        <ApiSettings onSettingsUpdated={onSettingsUpdated} />
      )}
      {(subTab === 'cicd' || subTab === 'deploy') && <DeployManager />}
      {subTab === 'tools' && <ToolsManager />}
      {subTab === 'modules' && <ModulesManager />}
      {subTab === 'logs' && <LogsHistory onNavigate={onNavigate} />}
    </div>
  );
}
