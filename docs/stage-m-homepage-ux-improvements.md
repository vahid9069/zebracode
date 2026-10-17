# Stage M — Homepage UX Improvements

## Executive summary

Stages M1–M4 were implemented against the previous homepage audit and the Stage L tokenization status. The work stayed within the existing Next.js, Tailwind v4, Radix, registry, i18n, and semantic-token architecture.

Implemented outcomes:

- Zero-result homepage modes are no longer rendered.
- Reset filters now clears every result-affecting filter and returns to a visible all-tools state.
- Existing translated quick searches are now real keyboard-accessible controls.
- The full 75-tool catalog is preserved, with three explicit registry-backed selected starting points ordered first.
- Landing/static routes now have a lightweight mobile navigation dialog for Home, About, language, and theme controls.
- Privacy copy is local-first and qualified around the editor's explicit URL-loader exception.
- `Cmd/Ctrl+K` behavior is shared by homepage search and Command Menu logic, with a neutral visible label.
- The announcement badge is informational rather than implying an unavailable action.
- Global `text-subtle` now has a distinct, contrast-checked value from `text-muted`.

No commit or stage operation was performed.

## Files changed for Stage M

These are the files changed by this stage. Several were already modified by earlier stages; those earlier changes were preserved rather than attributed to Stage M.

### Homepage, localization, and metadata

- `src/components/pages/HomePageClient.tsx` — unified filters, quick-search controls, available-mode rendering, selected-tool ordering, privacy copy usage, neutral shortcut label, informational announcement treatment, and semantic action contrast.
- `src/lib/home-catalog.ts` — pure registry-backed helpers for filter defaults, mode availability, filtering, selected-tool ordering, and localized hrefs.
- `src/lib/keyboard.ts` — shared `Cmd/Ctrl+K` predicate used by homepage search and Command Menu.
- `src/dictionaries/en/home.json` — English quick-search, selected-tool, privacy, shortcut, and technical display strings.
- `src/dictionaries/fa/home.json` — Persian equivalents of the same strings, including corrected Persian metric labels.
- `src/app/(fa)/page.tsx` — qualified local-first metadata and localized structured WebPage description.
- `src/app/en/page.tsx` — qualified local-first metadata and localized structured WebPage description.

### Layout and navigation

- `src/components/layout/AppLayout.tsx` — Radix-based mobile navigation for landing/static routes, focus-safe controls, theme/language actions, and mobile-dialog shortcut suppression.
- `src/components/layout/CommandMenu.tsx` — shared `Cmd/Ctrl+K` predicate.

### Foundation

- `src/app/globals.css` — distinct light/dark `text-subtle` values while preserving the existing semantic-token contract.

### Tests

- `src/lib/__tests__/home-catalog.test.ts` — mode availability, complete catalog preservation, reset defaults, quick-search filtering, and registry-backed route checks.
- `src/lib/__tests__/keyboard.test.ts` — Cmd+K, Ctrl+K, and negative shortcut cases.

## M1 — Correctness and trust

### M1.1 — General mode

`getAvailableHomeModes()` now derives visible modes from actual tool data and removes modes with zero results. With the current registry, the rendered homepage exposes:

- All tools: 75
- Engineering and development: 75
- General and everyday tools: not rendered because its count is 0

No tool was artificially reclassified. If an `other` category is added later, the general mode becomes available automatically.

### M1.2 — Reset filters

`createHomeFilters()` defines the valid reset state:

```text
searchTerm: ''
activeCategory: 'all'
activeTag: ''
activeMode: 'all'
```

The same `clearAllFilters` callback is used by the inline clear control and the empty-state action. The reset path therefore clears search, category, tag, and mode together.

### M1.3 — Privacy wording

The codebase inspection found that normal transformations and generators are browser-side. The explicit network-capable path found in the UI is the CodeMirror URL loader, which calls `fetch(urlInput)` only when the user chooses to load a URL.

The homepage now states that core transformations are local-first and that entered data is not uploaded for conversion. It also explicitly notes that the URL loader requests the URL chosen by the user. This avoids the previous absolute claim that was broader than the observable code path.

Homepage route metadata and WebPage structured data now use the localized hero description, while the visible privacy copy remains in the homepage dictionaries.

### M1.4 — Keyboard shortcut

The homepage now displays the neutral `Ctrl/Cmd K` label. The `isModKShortcut` helper is shared by homepage search and Command Menu handling, and the homepage ignores the shortcut while either Command Menu or mobile navigation is open.

## M2 — Tool discovery

### M2.1 — Quick searches

The existing dictionary entries are now rendered near the search input:

- JSON → TS
- JWT
- Base64
- Markdown

Each is a real button with an accessible label, focus ring, and `bdi` handling for mixed technical text. Selecting one applies it as a search query and resets category, tag, and mode to avoid silent filter conflicts. No route is guessed.

### M2.2 — Catalog prioritization

No usage analytics or popularity data was found. Therefore the implementation does not claim popularity. It uses a small explicit “Selected” starting-point list backed by existing registry hrefs:

```text
/json-format
/jwt-decoder
/password-generator
```

These tools appear first and carry a translated “Selected” label. The remaining catalog is preserved and rendered through the same `ToolCard` implementation. No tool is removed or duplicated.

### M2.3 — Discovery tests

`home-catalog.test.ts` covers:

- omission of zero-result modes
- full reset defaults
- quick-search application and matching
- complete registry preservation
- registry-backed localized routes

The homepage format-filter row was also expanded using real catalog terms rather than artificial categories. It now includes additional registry-backed formats such as JavaScript, HTML, JSON Schema, JSON-LD, SVG, XML, TOML, Markdown, Base64, and Flow. The search input now receives an explicit `rtl` direction on Persian routes and `ltr` on English routes, so the Persian placeholder aligns with the intended reading direction.

## M3 — Mobile navigation and responsive safety

### M3.1 — Landing/static mobile navigation

`AppLayout` now provides a compact Radix Dialog navigation on `/`, `/en`, `/about`, and `/en/about` when below the desktop breakpoint. It includes:

- Home and About links
- language switch
- theme toggle
- accessible title/description
- Escape and focus lifecycle through Radix
- focus-visible states
- RTL/LTR direction support
- overflow-safe max height and width

The full tool sidebar remains limited to tool routes and was not forced onto landing pages.

### M3.2 — Responsive verification

The repository has no Playwright configuration or screenshot harness. The local browser tool timed out for the existing dev-server tabs, so real screenshot verification at 375, 390, 768, 1280, and 1440 pixels was not available.

Read-only local HTTP rendering was verified for both `/` and `/en/` on a fresh local development port after implementation. This confirmed:

- both locales render the new quick searches
- the zero-result General mode is absent
- selected tools remain registry-backed
- privacy and shortcut copy are localized/updated

This is HTML/text verification, not a substitute for visual viewport testing.

### M3.3 — Accessibility and keyboard

The implementation retains `aria-pressed` for mode/category/tag/view controls, adds accessible labels for quick searches and mobile navigation, uses visible focus rings, and keeps technical labels in direction-safe containers. Screen-reader output and real keyboard traversal were not run with a dedicated assistive-technology tool.

## M4 — Visual and design-system refinement

### M4.1 — Hierarchy

The homepage identity and existing semantic surfaces were preserved. The announcement badge no longer includes a directional arrow that implied an action without a destination. The page still uses the existing hero, search, catalog, privacy callout, and footer structure rather than adding a second competing catalog.

### M4.2 — Text tokens

`text-muted` and `text-subtle` are now intentionally distinct:

| Theme | `text-muted` | `text-subtle` |
| --- | --- | --- |
| Light | `#475569` | `#64748b` |
| Dark | `#94a3b8` | `#7f8ea3` |

These values were checked against the primary canvas/surface backgrounds using the WCAG relative-luminance formula:

- `#64748b` on `#ffffff`: approximately 4.76:1
- `#7f8ea3` on `#0b0f19`: approximately 5.75:1
- `#7f8ea3` on `#161b26`: approximately 5.17:1

The change is global and affects existing subtle metadata across the product; no homepage-only duplicate token was introduced.

### M4.3 — Action contrast

The homepage's assurance code icon now uses `text-focus` rather than `text-action`, avoiding the lower-contrast blue action value in dark mode. Existing components already use `dark:text-focus` for action text where needed. Primary action backgrounds continue to use `action` with `action-foreground`.

### M4.4 — Announcement badge

The announcement remains an informational `<div>` and no longer presents an arrow that suggests an unavailable click action.

## Validation

### Focused tests

```text
npm.cmd test -- --run src/lib/__tests__/home-catalog.test.ts src/lib/__tests__/command-menu-search.test.ts src/lib/__tests__/keyboard.test.ts
```

Result: **3 test files passed, 12 tests passed**.

### Full tests

```text
npm.cmd test -- --run
```

Result: **7 test files passed, 89 tests passed**.

### Production build

```text
npm.cmd run build
```

Result: **passed**. 158 static pages generated/exported; postbuild generated tools, sitemap, and llms outputs.

### TypeScript

```text
npx.cmd tsc --noEmit --incremental false
```

Result: **not passed**, with the known baseline issues in locale dictionary typing, GraphQL readonly types, and missing/incorrect `css-tree`/`jsonld` declarations and transformer types. No new homepage-specific type error was identified.

### Lint

```text
npm.cmd run lint
```

Result: **not completed**. The existing `next lint` script opens the interactive ESLint configuration prompt; no new lint configuration was created.

### Whitespace and Git

- `git diff --check`: passed; only existing LF/CRLF normalization warnings were emitted.
- `git status --short`: checked after validation.
- `git diff --stat`: checked after validation.
- `git diff --cached --name-only`: empty; no files were staged.
- No commit, push, reset, restore, checkout, or destructive Git operation was performed.

## Remaining limitations

- No screenshot/browser automation was available for real viewport verification.
- Light/dark rendered contrast, touch target measurements, focus order, and RTL/LTR visual geometry still need manual browser review at the requested widths.
- Screen-reader output was not tested with a dedicated assistive technology.
- The existing TypeScript and lint baseline remains unresolved and was not hidden or reclassified as successful.
