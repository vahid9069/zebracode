# WordPress extensions

This directory contains source code for WordPress plugins that support ZebraCode. It is intentionally separate from both Next.js applications:

```text
wordpress/
└── plugins/
    ├── blog-plugin/
    └── future-plugin/
```

The repository is not a full WordPress installation. In production, each plugin folder is copied independently into:

```text
wp-content/plugins/<plugin-folder>/
```

## Why this location?

- `blog/` remains the independent Next.js frontend.
- The main `src/` application remains free of server-side WordPress and AI code.
- Multiple plugins can be developed and versioned as isolated units.
- The source tree does not pretend to contain WordPress core or a complete `wp-content` directory.

## Current plugin

`wordpress/plugins/blog-plugin/` is the initial ZebraCode Blog AI workspace. It now includes the complete admin information architecture and Tailwind-styled screens for:

- Dashboard
- Generate article
- Templates
- Drafts
- SEO tools
- Jobs & logs
- Settings

The current generation flow is draft-first: provider calls are server-side, responses are validated, and successful articles are stored as WordPress Drafts. Requests are processed through a bounded WP-Cron queue with one retry. The Settings screen has a non-generating connection test, Drafts and Jobs & logs read their real stored data, and published generated posts are available to the static blog through a public read-only endpoint.

The `Prompt lab` screen is available under `Blog AI` for manually testing the saved provider prompt. It shows the raw response, JSON validity, article-contract validity, finish reason, model, and usage without creating a WordPress post or queue job. Responses are bounded in the admin display and prompt tests are not persisted.

The Settings screen also includes `Test server cURL`. This runs DNS resolution, WordPress HTTP API, and native PHP cURL checks from the shared host itself, which is useful when SSH/terminal access is unavailable. It does not display or store the provider key.

## Gemini setup

The plugin supports the native Google Gemini Generative Language API. In `Blog AI → Settings`, use:

```text
Provider: Google Gemini (Generative Language API)
API base URL: https://generativelanguage.googleapis.com/v1beta
Model: gemini-flash-latest
API key: a newly generated Gemini key
```

The key is sent only from the server in the `X-goog-api-key` header. Never place it in frontend code, `NEXT_PUBLIC_*` variables, screenshots, commits, or chat messages. If a key has already been shared, revoke it and create a replacement before testing.
