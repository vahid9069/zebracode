import { createElement, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import ContentStudio from './pages/ContentStudio';
import ContentRanking from './pages/ContentRanking';
import RedirectsManager from './pages/RedirectsManager';
import SecuritySettings from './pages/SecuritySettings';
import SettingsHub from './pages/SettingsHub';
import AdsManager from './pages/AdsManager';
import SearchConsole from './pages/SearchConsole';

export default function App() {
  const parseHash = () => {
    const raw = (window.location.hash || '').replace('#/', '').replace('#', '').trim();
    if (raw === 'bulk') {
      return { tab: 'studio', sub: 'bulk' };
    }
    if (raw === 'calendar') {
      return { tab: 'studio', sub: 'calendar' };
    }
    if (raw === 'api') {
      return { tab: 'settings', sub: 'api' };
    }
    if (raw === 'cicd' || raw === 'deploy') {
      return { tab: 'settings', sub: 'cicd' };
    }
    if (raw === 'tools') {
      return { tab: 'settings', sub: 'tools' };
    }
    if (raw === 'modules') {
      return { tab: 'settings', sub: 'modules' };
    }
    if (raw === 'logs') {
      return { tab: 'settings', sub: 'logs' };
    }
    if (['dashboard', 'ranking', 'redirects', 'studio', 'ads', 'security', 'settings', 'gsc', 'search-console'].includes(raw)) {
      return { tab: raw === 'search-console' ? 'gsc' : raw, sub: null };
    }
    return { tab: 'dashboard', sub: null };
  };

  const initial = parseHash();
  const [activeTab, setActiveTab] = useState(initial.tab);
  const [studioSubView, setStudioSubView] = useState(initial.sub === 'bulk' ? 'bulk' : 'json');
  const [settingsSubTab, setSettingsSubTab] = useState(initial.sub || 'api');
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [isConfigured, setIsConfigured] = useState(true);

  // Sync tab state with browser URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash();
      setActiveTab(parsed.tab);
      if (parsed.tab === 'studio' && parsed.sub) {
        setStudioSubView(parsed.sub);
      }
      if (parsed.tab === 'settings' && parsed.sub) {
        setSettingsSubTab(parsed.sub);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (target) => {
    if (target === 'bulk') {
      setActiveTab('studio');
      setStudioSubView('bulk');
      window.location.hash = '#/bulk';
      return;
    }
    if (target === 'calendar') {
      setActiveTab('studio');
      setStudioSubView('calendar');
      window.location.hash = '#/calendar';
      return;
    }
    if (target === 'api') {
      setActiveTab('settings');
      setSettingsSubTab('api');
      window.location.hash = '#/api';
      return;
    }
    if (target === 'cicd' || target === 'deploy') {
      setActiveTab('settings');
      setSettingsSubTab('cicd');
      window.location.hash = '#/cicd';
      return;
    }
    if (target === 'tools') {
      setActiveTab('settings');
      setSettingsSubTab('tools');
      window.location.hash = '#/tools';
      return;
    }
    if (target === 'modules') {
      setActiveTab('settings');
      setSettingsSubTab('modules');
      window.location.hash = '#/modules';
      return;
    }
    if (target === 'logs') {
      setActiveTab('settings');
      setSettingsSubTab('logs');
      window.location.hash = '#/logs';
      return;
    }

    setActiveTab(target);
    window.location.hash = `#/${target}`;
  };

  const isFa = document.dir === 'rtl' || (window.omniAiData?.isRtl ?? true);

  // 6 Flat, Minimal Linear/Vercel Tabs
  const navTabs = [
    {
      id: 'dashboard',
      icon: 'dashicons-dashboard',
      title: isFa ? 'پیشخوان' : __('Dashboard', 'omni-ai-suite'),
    },
    {
      id: 'studio',
      icon: 'dashicons-edit-page',
      title: isFa ? 'استودیو محتوا' : __('Content Studio', 'omni-ai-suite'),
    },
    {
      id: 'ranking',
      icon: 'dashicons-chart-bar',
      title: isFa ? 'سئو و هوش مصنوعی' : __('SEO & AI Ranking', 'omni-ai-suite'),
    },
    {
      id: 'gsc',
      icon: 'dashicons-google',
      title: isFa ? 'سرچ کنسول' : __('Search Console', 'omni-ai-suite'),
    },
    {
      id: 'redirects',
      icon: 'dashicons-randomize',
      title: isFa ? 'ریدایرکت و ۴۰۴' : __('Redirects & 404', 'omni-ai-suite'),
    },
    {
      id: 'ads',
      icon: 'dashicons-megaphone',
      title: isFa ? 'تبلیغات و اسپانسر' : __('Ads & Sponsorship', 'omni-ai-suite'),
    },
    {
      id: 'security',
      icon: 'dashicons-shield',
      title: isFa ? 'امنیت و API' : __('Security & API', 'omni-ai-suite'),
    },
    {
      id: 'settings',
      icon: 'dashicons-admin-settings',
      title: isFa ? 'تنظیمات و ماژول‌ها' : __('Settings & Modules', 'omni-ai-suite'),
    },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleSelectTab} />;
      case 'studio':
        return (
          <ContentStudio
            initialSubView={studioSubView}
            onSubViewChange={(newSub) => setStudioSubView(newSub)}
          />
        );
      case 'ranking':
        return <ContentRanking onNavigate={handleSelectTab} />;
      case 'gsc':
      case 'search-console':
        return <SearchConsole onNavigate={handleSelectTab} />;
      case 'redirects':
        return <RedirectsManager />;
      case 'ads':
        return <AdsManager />;
      case 'security':
        return <SecuritySettings />;
      case 'settings':
        return (
          <SettingsHub
            initialSubTab={settingsSubTab}
            onNavigate={handleSelectTab}
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
    <div className="omni-ai-root">
      <Header configured={isConfigured} activeProvider={activeProvider} />

      <div className="omni-ai-nav-panel">
        <div className="omni-ai-nav-groups" role="tablist">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`omni-ai-nav-pill ${isActive ? 'is-active active' : ''}`}
                onClick={() => handleSelectTab(tab.id)}
              >
                <span className={`dashicons ${tab.icon}`} style={{ fontSize: '15px', width: '15px', height: '15px', lineHeight: '15px' }} />
                <span>{tab.title}</span>
              </button>
            );
          })}
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
