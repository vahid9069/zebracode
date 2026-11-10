import { createElement, render, createRoot } from '@wordpress/element';
import App from './App';

// Global sprintf polyfill to prevent any 3rd party or WordPress i18n reference crashes
if (typeof window !== 'undefined') {
  if (typeof window.sprintf !== 'function') {
    window.sprintf = (format, ...args) => {
      if (typeof window.wp?.i18n?.sprintf === 'function') {
        return window.wp.i18n.sprintf(format, ...args);
      }
      let i = 0;
      return String(format || '').replace(/%[sdf1-9\$]*/g, () => args[i++] ?? '');
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('omni-ai-admin-root');
  if (!container) return;

  if (createRoot) {
    const root = createRoot(container);
    root.render(createElement(App));
  } else if (render) {
    render(createElement(App), container);
  }
});
