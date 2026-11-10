---
name: zebracode-design-system
description: Use when auditing, improving, implementing, or extending the ZebraCode website UI/UX and design system. Enforces evidence-based changes, reusable components, accessibility, responsive layouts, RTL/LTR correctness, and regression-safe implementation.
---

# ZebraCode Design System Skill

## Mission

Maintain and evolve ZebraCode as a coherent, professional developer-tools platform. Improve the existing product rather than replacing it with a generic AI-generated design. Make future pages and tools possible through shared tokens, components, patterns, and documented conventions with minimal duplication.

## When to use

Use this skill when:
- Auditing existing UI/UX or identifying visual inconsistencies.
- Changing styles, layouts, navigation, forms, tool pages, or shared components.
- Adding a new developer utility or page.
- Refactoring UI code to improve reuse and maintainability.
- Reviewing accessibility, responsive behavior, or visual regressions.

Do not use it for unrelated backend-only tasks unless they affect UI behavior or the design system.

## Mandatory workflow

### 1. Inspect before changing

Before editing:
1. Inspect the repository structure, framework, routing, styling approach, build/test scripts, and existing component conventions.
2. Locate global styles/tokens, layout shells, navigation, shared UI components, and how tool pages are registered/rendered.
3. Inspect representative pages and existing states (loading, empty, success, error, disabled, validation).
4. Identify the smallest set of files that can safely implement the requested change.
5. Distinguish observed facts from assumptions. If browser access or repository context is missing, say what could not be verified.

Do not assume the production website and checked-out source are identical. Treat repository code as the source of truth for implementation.

### 2. Audit and plan

For broad UI/UX work, report:
- Finding and evidence (file, component, route, or observed behavior).
- User impact and severity.
- Proposed fix and reuse opportunity.
- Scope, regression risk, and validation method.

Prioritize user-facing usability, accessibility, consistency, and functional correctness over decorative polish. Do not invent problems or claim testing that did not happen.

### 3. Preserve existing behavior

- Do not rewrite working business logic just to change presentation.
- Preserve routes, query parameters, SEO metadata, analytics hooks, browser-side processing, and privacy behavior unless the task explicitly requires a change.
- Do not introduce a framework, styling system, or dependency without a concrete reason.
- Avoid unrelated refactors and broad rewrites.
- Before significant changes, explain the plan and wait for approval if the user requested audit/planning only or the scope is ambiguous.

### 4. Implement the shared system first

Prefer this hierarchy, adapting to the actual codebase:
1. **Tokens:** semantic colors, typography, spacing, sizing, radii, borders, shadows, elevation, content widths, breakpoints, and focus styles.
2. **Primitives:** buttons, fields, labels, selects, tabs, dialogs, tooltips, badges, alerts, and icon controls.
3. **Product components:** tool cards, toolbars, input/output panels, code/data editors, copy actions, validation messages, examples, and related-tool links.
4. **Patterns:** search and filtering, converter workflows, formatter workflows, generator workflows, empty/error states, and help sections.
5. **Templates/pages:** homepage, tool detail pages, category/search pages, and documentation pages where they exist.

Reuse existing components when suitable. Extend a component with clear variants when appropriate instead of cloning it. Do not force genuinely different interactions into one inflexible template.

### 5. ZebraCode-specific UX considerations

ZebraCode is understood as a developer-tools platform with many utilities. Confirm details in the actual project before relying on them.

For tool discovery:
- Make search, categories, filters, and tool cards predictable and easy to scan.
- Preserve useful keyboard interactions and visible focus.
- Make empty results and filter reset states clear.

For tool pages:
- Keep input, output, primary actions, examples, and errors easy to understand.
- Use consistent copy, clear, reset, download, or run actions only where relevant to that tool.
- Handle long text, code, JSON, tables, and overflow without breaking mobile layouts.
- Make validation and errors actionable; do not communicate errors by color alone.
- Keep tool-specific processing separate from presentation when the current architecture permits.

For localization and direction:
- Inspect the actual languages and direction settings before making assumptions.
- Support RTL and LTR correctly where both are needed.
- Use logical CSS properties (for example, `margin-inline-start`) when compatible with the existing stack.
- Ensure mixed Persian/English text, code, URLs, numbers, and punctuation remain legible.
- Do not reverse code editor content or technical strings simply because the surrounding page is RTL.

For privacy and performance:
- Preserve existing data-processing and privacy guarantees.
- Do not send user input to a server or third-party service unless the existing product design and task explicitly require it.
- Avoid unnecessary client-side dependencies, large assets, and animations.

### 6. Visual and accessibility quality bar

Check applicable items:
- Clear information hierarchy and consistent spacing.
- Readable type sizes, line lengths, and line heights.
- Consistent component dimensions and interaction states.
- Responsive behavior at narrow, medium, and wide viewport sizes.
- Semantic HTML and accessible names.
- Keyboard navigation and visible focus.
- Sufficient color contrast; do not rely on color alone.
- Reduced-motion preferences when animation is used.
- Touch target usability on mobile.
- Useful empty, loading, success, and error states.

Avoid generic AI aesthetics, gratuitous gradients, excessive rounded cards, decorative motion, and one-off visual treatments unless they serve the product's purpose.

### 7. Adding a new tool/page

Before implementation:
1. Identify the closest existing tool/page pattern.
2. Reuse the established layout and components.
3. Keep tool-specific logic and configuration isolated from shared UI.
4. Add only genuinely new components; document why reuse is insufficient.
5. Preserve route conventions, metadata, navigation, localization, and privacy behavior.
6. Add or update tests where the repository supports them.

A new tool should require configuration and domain logic—not copied page markup and duplicated CSS—where the current architecture makes that practical.

### 8. Validation and reporting

After changes:
- Run the relevant lint, typecheck, unit, build, and/or test commands available in the repository.
- Inspect the diff for accidental edits and duplicated styles.
- Check affected routes and representative viewport sizes if browser preview/testing is available.
- Report exactly what was changed, what checks were run, results, and what could not be verified.
- Never claim a test, browser inspection, or accessibility audit passed unless it was actually performed.

## Output expectations

For an audit: provide prioritized findings, evidence, proposed tokens/components/patterns, risks, and a phased plan. Do not edit files if the user asked for audit only.

For implementation: summarize the approach, changed files, reuse decisions, validation results, and remaining limitations.

## Reference documents

Read the relevant files under `references/` when needed:
- `design-system-principles.md`
- `ui-ux-audit-checklist.md`
- `new-tool-page-checklist.md`

Do not invent project-specific token values or component APIs before inspecting the actual codebase.
