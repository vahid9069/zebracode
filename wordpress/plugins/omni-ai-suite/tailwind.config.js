/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './includes/**/*.php',
  ],
  important: '.omni-ai-admin-wrap',
  prefix: 'tw-ai-',
  corePlugins: {
    // Strictly disabled to prevent CSS bleeding and avoid overriding WordPress core admin styles
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        wp: {
          blue: '#2271b1',
          'blue-hover': '#135e96',
          dark: '#1d2327',
          gray: '#f0f0f1',
          border: '#c3c4c7',
        },
      },
    },
  },
  plugins: [],
};
