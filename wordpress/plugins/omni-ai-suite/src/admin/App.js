import { createElement, useState, useEffect } from '@wordpress/element';
import { TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ContentStudio from './pages/ContentStudio';
import BulkGenerator from './pages/BulkGenerator';
import LogsHistory from './pages/LogsHistory';
import ModulesManager from './pages/ModulesManager';
import ApiSettings from './pages/ApiSettings';

export default function App() {
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#/', '');
    const validTabs = ['dashboard', 'studio', 'bulk', 'logs', 'modules', 'settings'];
    return validTabs.includes(hash) ? hash : 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [isConfigured, setIsConfigured] = useState(true);

  // Sync tab with browser URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      const validTabs = ['dashboard', 'studio', 'bulk', 'logs', 'modules', 'settings'];
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

  const tabs = [
    {
      name: 'dashboard',
      title: __('Dashboard', 'omni-ai-suite'),
      className: 'omni-ai-tab-dashboard',
    },
    {
      name: 'studio',
      title: __('AI Content Studio', 'omni-ai-suite'),
      className: 'omni-ai-tab-studio',
    },
    {
      name: 'bulk',
      title: __('Bulk Generator', 'omni-ai-suite'),
      className: 'omni-ai-tab-bulk',
    },
    {
      name: 'logs',
      title: __('History & Logs', 'omni-ai-suite'),
      className: 'omni-ai-tab-logs',
    },
    {
      name: 'modules',
      title: __('Modules', 'omni-ai-suite'),
      className: 'omni-ai-tab-modules',
    },
    {
      name: 'settings',
      title: __('Settings (BYOK)', 'omni-ai-suite'),
      className: 'omni-ai-tab-settings',
    },
  ];

  return (
    <div>
      <Header configured={isConfigured} activeProvider={activeProvider} />

      <div className="omni-ai-nav-panel">
        <TabPanel
          className="omni-ai-tab-panel"
          activeClass="is-active"
          initialTabName={activeTab}
          onSelect={handleSelectTab}
          tabs={tabs}
        >
          {(tab) => {
            switch (tab.name) {
              case 'dashboard':
                return <Dashboard onNavigate={handleSelectTab} />;
              case 'studio':
                return <ContentStudio />;
              case 'bulk':
                return <BulkGenerator />;
              case 'logs':
                return <LogsHistory />;
              case 'modules':
                return <ModulesManager />;
              case 'settings':
                return (
                  <ApiSettings
                    onSettingsUpdated={(newSettings) => {
                      if (newSettings.default_provider) {
                        setActiveProvider(newSettings.default_provider);
                      }
                    }}
                  />
                );
              default:
                return <Dashboard onNavigate={handleSelectTab} />;
            }
          }}
        </TabPanel>
      </div>
    </div>
  );
}
