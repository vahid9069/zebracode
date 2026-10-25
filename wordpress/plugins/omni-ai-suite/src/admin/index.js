import { createElement, render, createRoot } from '@wordpress/element';
import App from './App';

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
