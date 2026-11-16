# Omni AI Suite - All-in-One AI Plugin for WordPress

A modular, high-performance "All-in-One" WordPress AI plugin combining the best capabilities of AI Engine, AI Power, and Bertha AI, while strictly avoiding their drawbacks (database bloat, messy UI, asset bloat, and server timeouts during bulk generation).

---

## 🌟 Key Features & Blueprint Implementations

### 1. Admin UI Architecture & Styling Strategy
- **Native React SPA:** Admin dashboard built as a Single Page Application exclusively utilizing `@wordpress/element` and `@wordpress/components`.
- **Zero Discrepancy & Maximum Performance:** Leverages WordPress core pre-loaded scripts and styles (`wp-components`, `wp-element`, `wp-i18n`, `wp-api-fetch`).
- **Scoped Tailwind CSS:**
  - `corePlugins: { preflight: false }` explicitly disabled in `tailwind.config.js`.
  - Prefix `tw-ai-` and strictly scoped inside `.omni-ai-admin-wrap`.
  - Zero CSS bleeding into WP core admin or other plugins.

### 2. Bring Your Own Key (BYOK)
- Connect your own API keys directly:
  - **Google Gemini** (Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 2.0 Flash)
  - **OpenAI** (GPT-4o, GPT-4o-mini, GPT-4 Turbo)
  - **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus)
- Safe encrypted storage; API keys are **never** exposed to frontend JavaScript or client-side scripts.
- Fallback integration with WordPress core `wp-admin/options-connectors.php` (WP AI Client Registry).

### 3. Real-Time Streaming Response System (SSE)
- **Backend:** Custom high-performance cURL streaming implementation using `CURLOPT_WRITEFUNCTION`, non-blocking buffers, and forced flushes (`ob_flush()`, `flush()`).
- **Frontend:** Standard `fetch()` with POST passing `X-WP-Nonce`, consuming `response.body.getReader()` with `TextDecoder("utf-8")` to decode chunks in real time with an animated cursor.

### 4. Zero Database Bloat (Custom Table Architecture)
- Does **NOT** use Custom Post Types (CPT) or `wp_postmeta` for generation logs.
- Automatically creates `{$wpdb->prefix}ai_generation_logs` via `dbDelta` upon activation.
- Post-stream saving: triggers a lightweight secondary REST call (`/save-log`) only once the stream reader finishes (`done === true`).

### 5. 100% Modular System
Every integration is an independent module with a toggle in **Modules Manager**:
- **AI Content Studio:** Real-time generation workbench with templates and post-to-draft.
- **Gutenberg Editor:** Injects sidebar actions via `wp.plugins.registerPlugin` to rewrite, polish, expand, or summarize selected blocks.
- **Elementor Editor:** Floating AI panel loaded exclusively inside Elementor via `elementor/editor/before_enqueue_scripts`.
- **WooCommerce Product Writer:** "AI Generate Description" button in general product data tabs.
- **Frontend Chatbot:** Embedded via shortcode `[omni_ai_chatbot]`. Strictly satisfies the anti-bloat rule: **zero** frontend scripts are enqueued unless the shortcode is actually present!
- **Asynchronous Bulk Generator:** Dispatches bulk post creation into WooCommerce Action Scheduler (`as_enqueue_async_action()`), preventing HTTP 504 Gateway Timeouts.

---

## 📁 Directory Structure

```
wordpress/plugins/omni-ai-suite/
├── omni-ai-suite.php              # Main plugin file & constants
├── uninstall.php                  # Clean database tables & options
├── package.json                   # NPM build scripts & deps
├── tailwind.config.js             # preflight: false, prefix: tw-ai-
├── README.md                      # Documentation
├── assets/
│   ├── css/
│   │   ├── admin.css              # Scoped dashboard stylesheet
│   │   └── chatbot.css            # Scoped chatbot stylesheet
│   └── js/
│       ├── admin.js               # Compiled React SPA admin bundle
│       ├── admin.asset.php        # WordPress dependency handles
│       ├── gutenberg.js           # Gutenberg plugin integration
│       ├── gutenberg.asset.php
│       ├── elementor.js           # Elementor floating assistant
│       ├── woocommerce.js         # WooCommerce product generator
│       └── chatbot.js             # Lightweight frontend SSE chatbot
├── includes/
│   ├── class-autoloader.php       # PSR-4 compliant autoloader
│   ├── class-plugin.php           # Core Singleton orchestrator
│   ├── class-activator.php        # dbDelta table creation & defaults
│   ├── class-deactivator.php      # Action Scheduler cleanup
│   ├── admin/
│   │   └── class-admin.php        # Menus & SPA asset loader
│   ├── api/
│   │   ├── class-rest-controller.php # Secure REST API endpoints
│   │   └── class-stream-handler.php  # cURL SSE streaming engine
│   ├── database/
│   │   └── class-log-repository.php  # wp_ai_generation_logs repository
│   ├── providers/
│   │   ├── interface-ai-provider.php # AI_Provider_Interface
│   │   ├── class-provider-factory.php# Service Provider registry
│   │   ├── class-gemini-provider.php # Google Gemini provider
│   │   ├── class-openai-provider.php # OpenAI provider
│   │   └── class-claude-provider.php # Anthropic Claude provider
│   └── modules/
│       ├── interface-module.php      # Module_Interface
│       ├── class-module-manager.php  # Modular loader
│       ├── class-content-module.php  # Studio module
│       ├── class-gutenberg-module.php# Gutenberg module
│       ├── class-elementor-module.php# Elementor module
│       ├── class-woocommerce-module.php # WooCommerce module
│       ├── class-chatbot-module.php  # Shortcode chatbot module
│       └── class-bulk-module.php     # Action Scheduler bulk module
└── src/
    ├── admin/                     # Uncompiled React JSX SPA source
    ├── gutenberg/                 # Gutenberg source
    ├── elementor/                 # Elementor source
    └── chatbot/                   # Chatbot source
```

---

## 🛠️ Installation & Usage

1. Copy the `omni-ai-suite` directory into your WordPress `wp-content/plugins/` folder.
2. In the WordPress Admin, go to **Plugins** and activate **Omni AI Suite**.
3. Open **Omni AI** from the sidebar.
4. Go to **Settings (BYOK)** to enter your Google Gemini, OpenAI, or Claude API key.
5. Head to **Content Studio** to start streaming AI-generated content or use **Bulk Generator** for batch post creation!
