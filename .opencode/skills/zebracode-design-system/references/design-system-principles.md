# Design System Principles

## Source of truth
Inspect the current stack before choosing file locations or formats. Keep tokens in the existing styling system where possible. Avoid parallel token systems that disagree.

## Tokens
Prefer semantic roles over raw values in components, such as:
- `--color-text`, `--color-text-muted`
- `--color-surface`, `--color-surface-raised`
- `--color-border`, `--color-primary`, `--color-danger`, `--color-success`
- `--space-*`, `--radius-*`, `--shadow-*`
- typography roles for body, labels, headings, and code
- focus ring and motion tokens

These are examples of naming, not mandatory names. Align with repository conventions and avoid migrating every token at once without a reason.

## Component contracts
A reusable component should have:
- One clear responsibility.
- A documented API and intentional variants.
- Consistent states and accessibility behavior.
- Sensible defaults and optional composition.
- No hidden coupling to one specific page.
- Tests or usage examples where the project supports them.

Avoid boolean-prop overload. If variants represent distinct concepts, use explicit variant names or composition.

## Page composition
Compose pages from stable primitives, product components, and patterns. Keep content/data separate from presentation when practical. Do not abstract a component used once unless there is a clear reuse or complexity benefit.

## Change management
Prefer small, reversible steps. Migrate one representative page first, validate the approach, then expand. Record decisions that affect future pages. Avoid changing tokens and dozens of pages simultaneously without visual regression checks.
