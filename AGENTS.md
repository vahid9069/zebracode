# AGENTS.md

## Project overview

This repo is a Next.js 15 application for ZebraCode, a browser-first toolkit for developer utilities. The app is mostly client-side: conversion and transformation logic runs in the browser, and tool metadata drives page generation.

Key folders:
- `src/app/` holds Next.js routes and locale route groups, notably `(fa)` and `en`.
- `src/lib/registry/` defines tool metadata for each category (`jsonToolsList`, `cssToolsList`, `dateTimeToolsList`, etc.).
- `src/config/tools.ts` builds the final converter definitions used by generic conversion workbenches.
- `src/dictionaries/{fa,en}/` stores localized strings for layout, home, categories, and individual tool metadata.
- `src/components/tools/` contains dedicated tool UIs like `LoremGenerator`, `PasswordGenerator`, and `TextDiff`.

## Commands

Use the repo scripts from the project root:

```bash
npm install
npm run dev
npm run build
npm run start
npm test
npm run lint
```

Important notes:
- `npm run build` triggers a `postbuild` step: `tsx scripts/export-tools.ts && node scripts/generate-sitemap.mjs`.
- `scripts/export-tools.ts` regenerates `scripts/tools.json` from `AllToolsList`; do not hand-edit that generated file unless intentionally updating generation logic.

## Architecture and data flow

### Tool registry pattern

Tool definitions are assembled from category registries:
- `src/lib/registry/tools.ts` merges category lists into `AllToolsList`.
- `src/lib/registry/index.ts` re-exports the registry pieces for debugging and consumption.
- Example: `JsonToolsList`, `CssToolsList`, `TypescriptToolsList`, and `GeneratorToolsList` are all merged into a single `AllToolsList` record.

This is the canonical source for tool metadata. Most tool pages ultimately resolve against this registry rather than hardcoded local arrays.

### Generic conversion pipeline

The generic workflow is:
1. `src/components/utils/tools/helper.ts` resolves a tool config from `AllToolsList` via `getToolConfig(toolType)`.
2. `src/config/tools.ts` creates a `ToolDefinition` with `validate`, `transform`, `features`, `faq`, and output metadata via `buildToolDefinition()` and `getToolDefinition()`.
3. `src/components/pages/ToolPageClient.tsx` renders either a dedicated component or `UniversalConverterWorkbench` depending on the tool slug.

This pattern is used extensively for converter-style tools. Example:
- `getToolDefinition(slug)` is used to fetch the converter definition for a slug.
- Dedicated routes call `UniversalConverterWorkbench` with that definition.

### Route and page structure

The app is divided by locale route groups:
- `src/app/(fa)/page.tsx` and `src/app/en/page.tsx` are the server entry points for each locale.
- `src/app/(fa)/[toolSlug]/page.tsx` and `src/app/en/[toolSlug]/page.tsx` render localized pages for each tool.

Server routes normally stay thin and pull dictionary data, for example:
- `const dict = await getDictionary('fa');`
- then pass `dict` into `HomePageClient` or `ToolPageClient`.

## i18n conventions

The app uses a JSON dictionary layer for locale strings:
- `src/i18n/getDictionary.ts` dynamically imports `src/dictionaries/fa/*.json` and `src/dictionaries/en/*.json`.
- Example: `dict.tools[toolType]` and `dict.categories[categoryKey]` are used to override labels at render time.

Pattern to follow:
- Put static tool metadata and logic in the registry/config layer.
- Put user-facing labels in locale dictionaries.
- Merge the two in page components with fallbacks.

Example from `src/components/pages/ToolPageClient.tsx`:

```ts
const toolTranslation = dict?.tools?.[toolType];
const config = {
  ...baseConfig,
  title: toolTranslation?.title || baseConfig.title,
  shortDescription: toolTranslation?.shortDescription || baseConfig.shortDescription,
  description: toolTranslation?.description || baseConfig.description,
};
```

## Adding or changing tools

If you add a new tool, do the following in order:

1. Add or update the appropriate registry list in `src/lib/registry/`.
2. Export it through `src/lib/registry/tools.ts` so it enters `AllToolsList`.
3. If the tool is a generic converter, verify the `slug` and config in `src/config/tools.ts`.
4. If the tool has a custom UI, add it to the `dedicatedTool` lookup in `src/components/pages/ToolPageClient.tsx`.
5. Ensure the route slug matches the registry `href` and the localized JSON keys.

Example patterns:
- Registry file: `src/lib/registry/jsonToolsList.ts`
- Tool UI: `src/components/tools/UniversalConverterWorkbench.tsx`
- Tool page orchestration: `src/components/pages/ToolPageClient.tsx`

## UI and component conventions

- Interactive UI components should use `'use client';` when they need React state or browser APIs.
- Page-level components in `src/components/pages/` are wrappers over server data and route state.
- Tool-specific components live under `src/components/tools/`.
- Keep route `page.tsx` files thin: fetch locale data and pass it down; avoid business logic in the route itself.

## Local processing requirement

This project is intentionally browser-first. Most tools should follow the pattern used in `src/config/tools.ts`:
- validate input in the browser,
- transform data client-side,
- avoid sending user content to a server,
- expose copy/download actions for output.

The `validate` and `transform` functions in `src/config/tools.ts` are the reference implementation for generic tools.

## Do / don't

Do:
- Use the registry/config pattern for tool metadata and converter behavior.
- Follow the `@/` alias convention (`@/lib/...`, `@/components/...`, `@/i18n/...`).
- Prefer editing the relevant category registry or config file instead of hardcoded per-page data.
- Keep locale dictionaries and tool metadata separate.

Don't:
- Do not treat `scripts/tools.json` as a canonical source file; it is generated.
- Do not add generic converter logic directly inside route components.
- Do not create custom tool metadata in multiple places; register it once in the registry and let config/UI resolve it.

## Files worth checking first

When working in this repo, start with these files for context:
- `src/lib/registry/tools.ts`
- `src/config/tools.ts`
- `src/components/pages/ToolPageClient.tsx`
- `src/i18n/getDictionary.ts`
- `src/app/(fa)/page.tsx`
- `scripts/export-tools.ts`

