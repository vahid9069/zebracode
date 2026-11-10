import { createElement, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import ContentStudio from './pages/ContentStudio';
import BulkGenerator from './pages/BulkGenerator';
import LogsHistory from './pages/LogsHistory';
import ModulesManager from './pages/ModulesManager';
import ApiSettings from './pages/ApiSettings';
import SecuritySettings from './pages/SecuritySettings';
import ContentRanking from './pages/ContentRanking';
import RedirectsManager from './pages/RedirectsManager';

export default function App() {
  const getInitialTab = () => {
    const hash = (window.location.hash || '').replace('#/', '').replace('#', '').trim();
    const validTabs = ['dashboard', 'ranking', 'redirects', 'studio', 'bulk', 'security', 'logs', 'modules', 'settings'];
    return validTabs.includes(hash) ? hash : 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [isConfigured, setIsConfigured] = useState(true);

  // Sync tab with browser URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = (window.location.hash || '').replace('#/', '').replace('#', '').trim();
      const validTabs = ['dashboard', 'ranking', 'redirects', 'studio', 'bulk', 'security', 'logs', 'modules', 'settings'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tabName) => {
    setActiveTab(tabName);
    window.location.hash = `#/${tabName}`;
  };

  const isFa = document.dir === 'rtl' || (window.omniAiData?.isRtl ?? true);

  const tabGroups = [
    {
      id: 'general',
      groupTitle: isFa ? 'عمومی' : __('General', 'omni-ai-suite'),
      tabs: [
        {
          name: 'dashboard',
          icon: 'dashicons-dashboard',
          title: isFa ? 'پیشخوان' : __('Dashboard', 'omni-ai-suite'),
        },
      ],
    },
    {
      id: 'ai-suite',
      groupTitle: isFa ? 'ابزارهای هوش مصنوعی' : __('AI Studio', 'omni-ai-suite'),
      tabs: [
        {
          name: 'studio',
          icon: 'dashicons-edit-page',
          title: isFa ? 'استودیو محتوا' : __('Content Studio', 'omni-ai-suite'),
        },
        {
          name: 'bulk',
          icon: 'dashicons-database-add',
          title: isFa ? 'تولید انبوه' : __('Bulk Generator', 'omni-ai-suite'),
        },
        {
          name: 'logs',
          icon: 'dashicons-list-view',
          title: isFa ? 'تاریخچه و لاگ‌ها' : __('History & Logs', 'omni-ai-suite'),
        },
      ],
    },
    {
      id: 'seo-suite',
      groupTitle: isFa ? 'سئو و رتبه‌بندی' : __('SEO & Ranking', 'omni-ai-suite'),
      tabs: [
        {
          name: 'ranking',
          icon: 'dashicons-chart-bar',
          badge: 'SEO / AEO / GEO / خوانایی',
          title: isFa ? 'رتبه‌بندی، سئو و خوانایی محتوا' : __('SEO, Ranking & Readability', 'omni-ai-suite'),
        },
        {
          name: 'redirects',
          icon: 'dashicons-randomize',
          title: isFa ? 'تغییر مسیرها و خطاهای 404' : __('Redirects & 404', 'omni-ai-suite'),
        },
      ],
    },
    {
      id: 'system',
      groupTitle: isFa ? 'پیکربندی و امنیت' : __('Core & Security', 'omni-ai-suite'),
      tabs: [
        {
          name: 'security',
          icon: 'dashicons-shield',
          title: isFa ? 'امنیت و API' : __('Security & API', 'omni-ai-suite'),
        },
        {
          name: 'modules',
          icon: 'dashicons-screenoptions',
          title: isFa ? 'مدیریت ماژول‌ها' : __('Modules', 'omni-ai-suite'),
        },
        {
          name: 'settings',
          icon: 'dashicons-admin-settings',
          title: isFa ? 'تنظیمات (BYOK)' : __('Settings (BYOK)', 'omni-ai-suite'),
        },
      ],
    },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleSelectTab} />;
      case 'ranking':
        return <ContentRanking onNavigate={handleSelectTab} />;
      case 'redirects':
        return <RedirectsManager />;
      case 'studio':
        return <ContentStudio />;
      case 'security':
        return <SecuritySettings />;
      case 'bulk':
        return <BulkGenerator />;
      case 'logs':
        return <LogsHistory onNavigate={handleSelectTab} />;
      case 'modules':
        return <ModulesManager />;
      case 'settings':
        return (
          <ApiSettings
            onSettingsUpdated={(newSettings) => {
              if (newSettings?.default_provider) {
                setActiveProvider(newSettings.default_provider);
              }
            }}
          />
        );
      default:
        return <Dashboard onNavigate={handleSelectTab} />;
    }
  };

  return (
    <div>
      <Header configured={isConfigured} activeProvider={activeProvider} />

      <div className="omni-ai-nav-panel">
        <div className="omni-ai-nav-groups" role="tablist" style={{ display: 'flex', gap: '8px', padding: '8px 16px', background: '#ffffff', borderBottom: '1px solid #dcdcde', flexWrap: 'wrap', alignItems: 'center' }}>
          {tabGroups.map((group, gIdx) => (
            <div key={group.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '0 4px', borderLeft: (gIdx < tabGroups.length - 1 && isFa) ? '1px solid #e2e8f0' : 'none', borderRight: (gIdx < tabGroups.length - 1 && !isFa) ? '1px solid #e2e8f0' : 'none', paddingLeft: isFa ? '8px' : '4px', paddingRight: !isFa ? '8px' : '4px' }}>
              <span style={{ fontSize: '11px', color: '#8c8f94', fontWeight: 700, marginInlineEnd: '4px', textTransform: 'uppercase' }}>{group.groupTitle}:</span>
              {group.tabs.map((tab) => {
                const isActive = activeTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`components-button components-tab-panel__tabs-item ${tab.className || ''} ${isActive ? 'is-active active' : ''}`}
                    onClick={() => handleSelectTab(tab.name)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '5px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#ffffff' : '#3c434a',
                      background: isActive ? '#2271b1' : 'transparent',
                      padding: '5px 11px',
                      border: 'none',
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.icon && <span className={`dashicons ${tab.icon}`} style={{ fontSize: '16px', width: '16px', height: '16px', lineHeight: '16px' }} />}
                    <span>{tab.title}</span>
                    {tab.badge && (
                      <span style={{
                        fontSize: '9px',
                        background: isActive ? 'rgba(255,255,255,0.25)' : '#e0e7ff',
                        color: isActive ? '#ffffff' : '#3730a3',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontWeight: 700,
                      }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="components-tab-panel__tab-content" role="tabpanel">
          <ErrorBoundary>
            {renderActiveView()}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
