# Developer utilities — implementation and verification

## Delivered scope

23 browser-local utilities have been added in three engine modules. Every tool has Persian and English metadata, field labels, option labels, scope notes and safe error messages. Routes are `/<slug>/` (Persian) and `/en/<slug>/` (English).

| Phase | Slug | Supported operation |
| --- | --- | --- |
| 1 | `uuid-generator` | Secure v4/v7 UUIDs, 1–1,000 per run |
| 1 | `hash-generator` | UTF-8 SHA-1/256/384/512 hex digests |
| 1 | `case-converter` | Unicode camel/Pascal/snake/kebab/upper |
| 1 | `slug-generator` | Persian/English Unicode slugs |
| 1 | `line-ending-converter` | LF, CRLF and CR normalization |
| 1 | `whitespace-inspector` | Visible tokens for whitespace and invisible controls |
| 1 | `http-status-lookup` | Common HTTP status catalog |
| 1 | `mime-type-lookup` | Common extension/media-type catalog |
| 2 | `regex-tester` | JavaScript matches, groups and indexes in a bounded worker |
| 2 | `jsonpath-tester` | JSONPath selection; script evaluation disabled |
| 2 | `sql-formatter` | SQL, PostgreSQL, MySQL, SQLite, T-SQL, BigQuery, Snowflake |
| 2 | `yaml-formatter` | Single-document parsing, syntax checking and formatting |
| 2 | `env-parser` | Line-based dotenv ↔ scalar JSON object |
| 2 | `query-string-parser` | Query ↔ JSON, repeated keys preserved |
| 2 | `url-parser` | Absolute WHATWG URL components |
| 2 | `curl-to-fetch` | Supported cURL flags → Fetch/Axios source text |
| 3 | `openapi-validator` | Selected 3.0/3.1 structural checks |
| 3 | `json-schema-validator` | Ajv draft-07/2020-12 with standard formats |
| 3 | `docker-compose-validator` | Static services, ports and environment shape checks |
| 3 | `cidr-calculator` | IPv4 /0–/32, including /31 point-to-point semantics |
| 3 | `html-accessibility-checker` | Inert HTML image/label/heading/landmark heuristics |
| 3 | `svg-optimizer` | Conservative SVGO source optimization; preserve viewBox |
| 3 | `jwt-encoder-verifier` | HS256 sign/verify, separate exp/nbf status |

## Architecture

- `src/lib/developer-tools/types.ts`: string-valued field descriptors and operation contract.
- `src/lib/developer-tools/phase-{one,two,three}.ts`: raw engines and public samples.
- `src/lib/developer-tools/index.ts`: input bounds and isolated execution routing.
- `src/lib/registry/developerToolsList.ts`: canonical registry metadata assembled from descriptors and English dictionaries; included in `AllToolsList` for routes, home, sidebar, command search, metadata and export.
- `src/components/tools/DeveloperUtilityWorkbench.tsx`: shared semantic-token UI with RTL/LTR chrome, labels, manual run, Ctrl/⌘+Enter, sample, clear, text output, copy and download.
- `src/i18n/getDictionary.ts`: merges metadata into `dict.tools`, and exposes `developerTools`/`developerUi` copy. Dictionaries live in `src/dictionaries/{fa,en}/developer-*.json`.
- Dedicated utilities are intentionally excluded from generic converter definitions. Their multi-field operations cannot be invoked through the legacy one-string transform API.

## Security and supported-scope boundaries

- No input upload, user-data persistence, external schema loading, cURL execution or HTML/SVG rendering. Clipboard/download actions are explicit. JavaScript libraries/chunks are loaded locally from the site as needed; inputs are not attached to those asset requests.
- A central 200,000-character limit applies per field. Regex further limits pattern/text/output; its worker terminates after one second.
- JSONPath, SQL/YAML formatting, OpenAPI, JSON Schema, Compose and SVG run in terminable workers with a five-second total deadline and a 2,000,000-character output cap. No main-thread fallback for these jobs. Edits, clear, sample loading and unmount cancel active workers.
- Edited inputs mark results stale and disable copy/download until rerun; revision tokens prevent old asynchronous results from replacing newer state.
- JSONPath uses `eval: false`. Ajv compilation runs only in a worker; this is library-generated validation code, not evaluation of user-provided JavaScript. Deployments with restrictive CSP must allow the required local worker/library behavior or report an unavailable/invalid-operation error.
- Hashes are not password hashing; SHA-1 is legacy. UUID v7 does not guarantee same-millisecond monotonic order.
- OpenAPI/Compose are **limited structural checks**, not full specification/runtime validation. Accessibility reports are **heuristics, not WCAG conformance**. CIDR is IPv4-only.
- SVG optimization is **not sanitization**: scripts, event attributes or external links can remain in downloaded source. Untrusted markup is never rendered here.
- JWT supports only HS256 with UTF-8 secrets. Signature and temporal validity are separate; issuer/audience/replay/application authorization are not checked. Samples contain only a public demo secret. Real secrets stay in component memory and are not included in error/report text.
- Dotenv, cURL and lookup catalogs deliberately support documented subsets; unsupported inputs fail explicitly. YAML comments/original formatting are not preserved.

## Verification performed

- `npm test -- --run`: **12 files, 267 tests passed**. Includes all 23 engines where Node permits execution, localized descriptor coverage, registry/route uniqueness and localized search, server-rendered forms in both locales, and worker timeout/cancellation/error/output-bound tests. Regex worker lifecycle tests use a fake worker; HTML tests cover pure heuristics rather than the browser's DOM extraction.
- `npm run build`: **passed**, including postbuild. Generated 204 static pages, 200 sitemap URLs and 98 tools per locale in `llms.txt`. `scripts/tools.json`, sitemap and `public/llms.txt` were generated, not manually edited.
- Static HTTP smoke: **49 paths returned 200 with a page heading**: all 46 new localized routes plus `/`, `/en/`, `/en/json-format/`. This verifies exported routing/HTML, not client interactions.
- Built-in browser at 580 × 775, dark theme: English Regex sample loaded and ran successfully; visible JSON output contained two matches, and exports became enabled. Persian JSON Schema page and sample loading displayed correctly with RTL chrome and LTR technical fields.
- Browser control failed while attempting the below-fold JSON Schema Run button. Fresh observations showed the sample remained loaded without a result. That operation was not blindly repeated; real browser execution of the general utility worker is **not yet confirmed**.
- `git diff --check`: passed; Git reported Windows line-ending conversion warnings, not whitespace errors.

### Existing project check blockers

- `npx tsc --noEmit --incremental false --pretty false`: still fails on locale `common.faqByTool` shape mismatch and existing GraphQL/CSS/JSON-LD/JSON Schema transformer types/declarations. No diagnostics were reported in the new utility/workbench files. Build explicitly skips type validation in existing `next.config.ts`, so build success does **not** mean typecheck success.
- `CI=1 npm run lint`: opens the existing ESLint configuration prompt. Lint was not completed; no unrelated lint configuration was installed. Build also skips lint under the existing configuration.

## How to try and remaining manual checks

For development, run `npm run dev` and use the port it prints. For the verified static export, run `python -m http.server 3003 --bind 127.0.0.1 --directory out` from the project root; visit `http://127.0.0.1:3003/en/regex-tester/` or `http://127.0.0.1:3003/json-schema-validator/`. A static preview server was started on this port during verification. Avoid a concurrent dev server writing `.next` while building.

Before release, complete these browser checks:

1. Run samples for all 23 tools in each supported browser. In particular confirm the production utility worker's dynamic Ajv/SVGO/SQL/JSONPath chunks load, and HTML DOM extraction remains inert.
2. Test a pathological regex/schema pattern: timeout leaves the page usable. Edit or clear during processing: cancelled/stale results must never replace current output.
3. Confirm copy success/failure feedback, file downloads and exact CRLF/CR bytes; check expired/tampered JWT verification separately from signing.
4. Check light/dark, 375/768/1440 widths, keyboard focus/shortcuts, RTL/LTR and screen-reader announcements. A narrow dark-theme visual smoke is not complete accessibility or responsive certification.
5. Verify the new Validators/Inspectors home tabs, search selection and sidebar groups. JSON inspectors/validators should not be labeled JSON converters.

No commit or push was performed. Unrelated IDE/settings and pre-existing workspace changes were left intact.

## Editor alignment follow-up

The utility workbench now uses the site's existing `CodeMirrorEditorComponent` instead of plain textarea input/output. `src/components/tools/shared/DeveloperCodeEditorPanel.tsx` supplies converter-style headers, format badges, real line numbers, and localized line/UTF-16-character/UTF-8-byte counts. Settings sit above the editor grid; narrow screens stack panels and desktop uses input/output columns. Scope notes remain available below the editors in expandable details. Password fields remain password inputs, never code editors.

`src/lib/developer-tools/editor-presentation.ts` selects modes based on the tool, field and operation. JSON, JavaScript, SQL, HTML and SVG/XML have installed syntax grammars; YAML, dotenv, cURL, URLs, JWT and ordinary text retain honest format badges with plain-text CodeMirror editing. No grammar dependency was added.

Shared CodeMirror changes are backward-compatible optional accessibility, placeholder, toolbar-visibility and file-drop props. Utility panels disable the built-in file/URL toolbar and file drops, preserving their local-only behavior. Read-only outputs also disable content editing, remain keyboard-focusable, and use the existing guarded copy/download handlers. A ref-backed change listener avoids stale callbacks after runs. Programmatic CR/CRLF document updates use CodeMirror's normalized text length so cursor selection cannot exceed the editor document.

Follow-up checks: **13 files / 299 tests passed**. Production build and postbuild passed with **204 pages** after temporarily stopping a same-project dev server that conflicted with `.next`; the dev server was restarted on port 3000. Typecheck still reports only the project blockers above, with no new editor diagnostics. Browser observation confirmed mounted CodeMirror panels and numbered gutters on the Persian JSON Schema page at **310 × 573**. A sample-button action timed out and a fresh observation showed no input/result change, so interaction, syntax-color screenshots and desktop visual verification are not claimed complete. Tests cover mode selection, UTF-8 and CR/LF counts, read-only editor shells, original default toolbar compatibility and all 23 localized workbenches.

## SEO, GEO and FAQ content follow-up

- All 23 tools now have complete Persian and English public guides: direct definition/answer, 3–4 usage steps, practical use cases, a checked example, accurate limitations, related-tool links and standards/library references. Four tool-specific questions per page give **184 localized FAQ pairs across 46 pages**. This is authored public product content, not visitor input.
- Source catalogs: `src/dictionaries/{fa,en}/developer-content-{one,two}.json`; shared headings: `developer-content-ui.json`; types/loading: `src/lib/developer-tools/content-types.ts` and `content.ts`.
- `DeveloperToolGuide.tsx` is rendered by both server routes, outside the interactive workbench. Definitions, examples, links and FAQ answer text are in the exported HTML even without client execution. Native details expose FAQ answers on expansion. Catalogs are not passed wholesale to the interactive client component.
- Dedicated SEO titles and meta descriptions feed ordinary metadata, Open Graph and Twitter. Existing canonical/hreflang routing is preserved. `ToolStructuredData.tsx` connects WebPage, SoftwareApplication and BreadcrumbList, adds the guide abstract/reference citations, and emits a single FAQPage using the exact same question/answer array as the public guide. JSON-LD escapes script terminators. No fabricated ratings, reviews or compliance claims are emitted.
- `scripts/export-tools.ts` now includes the new Persian/English dictionaries rather than falling back to English for new Persian entries. Generated metadata descriptions reuse the dedicated content descriptions.
- `scripts/generate-llms.mjs` links to and generates `public/llms-full.txt` and `out/llms-full.txt` using the same 46 guides, examples, limits and FAQs as the HTML. Existing `llms.txt` retains the 98-tool bilingual index. These plain-text discovery aids do not guarantee consumption, recommendation or citations by any model.
- The sitemap and llms generators now load production environment layers with Next's existing `@next/env` package. Their postbuild processes previously could use a fallback origin different from Next's canonical origin; sitemap/robots/llms URLs now align with built canonical URLs. Existing crawler access policy was not changed.

### Checks for this follow-up

- `npm test -- --run`: **14 files / 307 tests passed**. New coverage checks complete localized catalogs, unique descriptions, examples/related routes, static guide rendering, exact FAQ/schema parity, canonical/hreflang/social metadata, unchanged old-tool fallbacks and script/markup escaping.
- `npm run build`: passed, **204 static pages**; postbuild passed. `npm run postbuild` was rerun after correcting environment loading.
- HTTP source checks against the exported site passed for **all 46 localized tool pages**: 200 responses, a single H1, guide/FAQ anchors, one FAQPage with exact catalog questions/answers, matching canonical/WebPage URLs, and canonical-source URLs shared by sitemap, robots and llms. Both generated llms files contain the expected localized content.
- `npx tsc --noEmit --incremental false --pretty false`: still reports the pre-existing locale/transformer problems above; no new SEO/content/route diagnostics. Lint remains unconfigured; a successful build skips these checks under existing configuration.
- A new browser navigation to the FAQ required tab selection/attention and was not dispatched; fresh visual/interactive inspection is not claimed. No production Search Console submission, external rich-result validation, reference-URL availability sweep or observed ranking/citation improvement was performed.

FAQ schema and readable answers can improve machine understanding but do not establish rich-result eligibility or guarantee search/AI visibility. The guide explicitly preserves limited OpenAPI/Compose checking, accessibility heuristics, IPv4-only CIDR, HS256-only JWT, SVG optimization-not-sanitization and actual input/runtime limits. Hash guidance also explains that the code editor normalizes pasted CR/CRLF line breaks, so text hashing is not a raw-file checksum.
