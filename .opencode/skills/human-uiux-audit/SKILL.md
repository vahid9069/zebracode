---
name: human-uiux-audit
description: Use when evaluating a website or product as an experienced human UX designer would. Performs evidence-based, task-oriented UI/UX walkthroughs, finds usability and accessibility problems, prioritizes their impact, and reports practical fixes without changing code unless explicitly asked.
---

# Human UI/UX Audit Skill

## Mission

Evaluate the product from the user's point of view, not only from the implementation's point of view. Reproduce realistic user journeys, inspect the interface at the moments where people make decisions, and report the friction, confusion, accessibility barriers, visual hierarchy problems, and trust issues that a professional human designer/tester would notice.

The goal is not to redesign the product into a generic fashionable interface. The goal is to discover whether the current product helps its intended users complete meaningful tasks clearly, efficiently, confidently, and accessibly.

This is an expert simulation. Never claim that a real human participant, external user, or visual inspection was used unless that actually happened. Clearly separate observed evidence, source-code evidence, and reasoned hypotheses.

## When to use

Use this skill when the user asks to:

- Audit, test, review, or critique a website's UI/UX.
- Find usability problems "like a human" or "like a professional designer".
- Review a page, flow, tool, dashboard, form, navigation, or responsive experience.
- Evaluate accessibility, information architecture, interaction clarity, trust, or conversion friction.
- Compare a product experience against human-centered design quality.

Do not edit implementation files during an audit unless the user explicitly asks for fixes. An audit must remain useful and honest even when the repository, running app, browser, or visual preview is unavailable.

## Core principles

1. **Start with user goals.** A beautiful screen that does not help users complete their task is not a successful experience.
2. **Test the journey, not isolated components.** Follow a task from entry to completion, including errors, recovery, and next steps.
3. **Use evidence.** Cite a route, element, state, file, screenshot, viewport, or reproducible step for every defect.
4. **Prioritize impact over taste.** Do not report personal aesthetic preferences as usability defects.
5. **Preserve product context.** Inspect the existing patterns, domain, language, audience, and design system before judging consistency.
6. **Check the uncomfortable states.** Empty, loading, validation, error, disabled, slow, long-content, mobile, keyboard, zoom, and returning-user states often reveal the most serious problems.
7. **Prefer systemic fixes.** If the same problem appears across pages, recommend a token, component, pattern, content rule, or information-architecture change rather than a page-by-page patch.
8. **Do not invent certainty.** Label assumptions and unverified risks explicitly.

## Mandatory workflow

### 1. Establish the audit scope

Before inspecting details, determine or state:

- Product, route(s), and page(s) in scope.
- Intended audience and the primary job the product helps them do.
- The most important user journey to test.
- Supported language(s), direction(s), and likely device sizes.
- Whether this is a source audit, a running-app audit, a browser walkthrough, or a combination.
- Whether the user wants findings only or findings plus implementation recommendations.

If the user did not specify a route, choose a representative high-value journey and say why. If several journeys are equally plausible, ask one focused clarification question rather than silently choosing a large scope.

### 2. Inspect before judging

For a repository-backed audit, inspect enough of the product to understand its system:

1. Repository structure, framework, routing, scripts, and available checks.
2. Global styles, design tokens, typography, layout shell, navigation, and shared components.
3. Representative pages and their states: initial, empty, loading, success, error, disabled, and validation.
4. Localization and direction handling, especially for mixed RTL/LTR content, code, URLs, numbers, and punctuation.
5. Data/privacy boundaries and whether user input is processed locally or sent to a service.
6. Existing tests, storybook/preview setup, screenshots, and documented design conventions.

For a running-app audit, inspect the actual rendered experience when access is available. Record the URL/route, viewport, browser context, and relevant state. Do not assume production and checked-out source are identical.

Create an evidence table while inspecting:

| Evidence | Source | Confidence |
| --- | --- | --- |
| What was directly observed | Browser, screenshot, or rendered preview | Confirmed |
| What implementation indicates | File, component, route, or test | Confirmed in source |
| What is likely but unverified | Reasoned UX hypothesis | Needs validation |

### 3. Build realistic user tasks

Use one primary task and, where useful, one or two secondary tasks. Tasks must describe an outcome, not a sequence of UI actions. For example:

- Weak: “Click the blue button and enter JSON.”
- Strong: “As a developer who received malformed JSON, format it, understand what was wrong, and copy the corrected result without sending the data to a server.”

For each task, define:

- User role and assumed prior knowledge.
- Trigger or entry point.
- Desired outcome and success signal.
- Likely uncertainty or fear.
- What counts as failure, abandonment, or a workaround.

Include a newcomer perspective even if the product targets experts. Experts also need clear status, error recovery, sensible defaults, and confidence that their data is safe.

### 4. Perform the human-like walkthrough

Walk through the task in this order. Do not skip a section merely because the page looks visually polished.

#### A. First impression and orientation

- Within roughly five seconds, can a new visitor tell what the product/page is for?
- Is the primary audience and value proposition clear?
- Is the next action obvious without reading everything?
- Are heading, supporting text, navigation, and primary action hierarchically clear?
- Does the page establish trust without excessive marketing or vague claims?

#### B. Findability and information architecture

- Can the user find the right tool or section by name, category, search, or navigation?
- Are labels written in the user's language rather than internal product language?
- Are active, selected, filtered, and current states understandable?
- Can users recover from zero results or a wrong category?
- Are links, breadcrumbs, related tools, and next steps useful rather than decorative?

#### C. Task flow and interaction clarity

- Is the order of actions natural and predictable?
- Are primary, secondary, destructive, and optional actions distinguishable?
- Do controls have clear labels, appropriate defaults, and sensible affordances?
- Is the current state visible after every important action?
- Can users undo, reset, clear, cancel, or go back when appropriate?
- Are success messages specific enough to confirm what happened and what to do next?

#### D. Content, language, and cognitive load

- Does the copy explain what matters at the moment it matters?
- Are labels, placeholders, examples, helper text, and errors consistent?
- Is jargon explained or appropriate for the stated audience?
- Are instructions concise, scannable, and ordered by importance?
- Are long code, JSON, tables, URLs, numbers, and mixed-language strings readable?
- Does RTL/LTR behavior preserve meaning and legibility rather than merely mirroring layout?

#### E. Forms, tools, and output workflows

- Is each input clearly associated with a label and expected format?
- Does the initial state teach the user how to begin?
- Are examples, presets, or sample data available where they reduce uncertainty?
- Are validation messages actionable and located near the problem?
- Are input, output, run, copy, download, clear, and reset actions present only when relevant?
- Can users handle long content without clipped text, broken layout, or accidental data loss?
- Is output distinguishable from input and easy to verify or reuse?

#### F. Error recovery and edge cases

- What happens with empty input, invalid input, unexpected input, and very large input?
- Does the error explain the problem, its location, and a practical fix?
- Is error communicated by more than color alone?
- Does the user retain their work after failure?
- Are loading, timeout, offline, permission, rate-limit, and partial-success states understandable where applicable?

#### G. Accessibility and inclusive use

- Are semantic headings, landmarks, form labels, button names, and link names present?
- Can the task be completed with keyboard only, including menus, dialogs, tabs, editors, and dismissible messages?
- Is focus visible, logical, and preserved after dynamic updates?
- Are touch targets usable on small screens?
- Is contrast sufficient for text, controls, borders, focus, and disabled states?
- Does the interface remain usable under zoom/reflow and with reduced motion?
- Are instructions and errors understandable without relying on color, position, sound, or hover alone?

#### H. Responsive and visual-quality review

Check narrow mobile, tablet, and desktop layouts when possible. Look specifically for:

- Horizontal overflow, clipped controls, or inaccessible side panels.
- Toolbars that wrap into ambiguous or unusable layouts.
- Multi-column input/output areas that become too narrow.
- Navigation, dialogs, tables, code editors, and cards that fail at small widths.
- Inconsistent spacing, alignment, typography, component dimensions, or states.
- Excessive cards, radii, gradients, shadows, motion, or decorative elements that compete with the task.

#### I. Trust, privacy, and product safety

- Does the product clearly communicate what happens to user data when that matters?
- Are destructive actions explicit and recoverable where possible?
- Are permissions, external redirects, downloads, and irreversible actions understandable?
- Does the experience create false confidence through unclear status or misleading success language?
- Are privacy claims consistent with the actual implementation and network behavior?

### 5. Record findings, not impressions

A valid finding must connect a user problem to evidence and impact. Use this format for every finding:

```markdown
### [ID] Short problem statement
- Severity: Critical | High | Medium | Low
- Category: Navigation | Flow | Content | Form | Error recovery | Accessibility | Responsive | Visual hierarchy | Trust/privacy | Performance
- Evidence: route, component, viewport, state, file, screenshot, or exact reproduction steps
- User perspective: what the user is trying to do
- Observed problem: what happened, without speculation
- Impact: confusion, delay, abandonment, error risk, accessibility barrier, or loss of trust
- Recommendation: the smallest practical fix
- Reuse/system implication: token, component, pattern, content rule, or page-local change
- Validation: how to verify the fix with a task, viewport, keyboard path, or test
- Confidence: Confirmed | Likely | Needs validation
```

Write findings as user-centered problems:

- Prefer: “A first-time user cannot tell whether the formatter has finished because the output area remains visually identical while processing.”
- Avoid: “The loading state needs a nicer spinner.”

Do not create multiple findings for the same root cause unless the user impact or fix is materially different. Note repeated instances under one systemic finding.

## Severity model

Use severity consistently and explain it:

- **Critical:** The primary task cannot be completed, data may be lost/exposed, or a serious accessibility barrier blocks a meaningful group of users.
- **High:** A common task is likely to fail, cause a major mistake, create serious confusion, or make an important feature inaccessible without a workaround.
- **Medium:** The task can be completed, but friction, ambiguity, inconsistency, or recoverable errors materially reduce efficiency or confidence.
- **Low:** Minor polish, copy, alignment, or consistency issue with limited task impact. Still report repeated low-severity issues when they reveal a systemic quality problem.

Severity is about user impact, not how difficult the fix is. A technically easy fix can be Critical; a technically difficult fix can be Low.

## Scoring rubric (optional, never a substitute for findings)

When the user wants an overall score, rate each dimension from 0 to 4 and include evidence:

- **0 — Blocked:** Task cannot be completed or is inaccessible.
- **1 — Fragile:** Completion requires guessing, repeated errors, or a workaround.
- **2 — Usable with friction:** A capable user can complete it, but important confusion or inefficiency remains.
- **3 — Solid:** Clear and reliable for the intended audience, with minor gaps.
- **4 — Strong:** Clear, efficient, inclusive, resilient, and consistent across relevant states and viewports.

Score: orientation, findability, task flow, content clarity, error recovery, accessibility, responsive behavior, visual hierarchy, and trust/privacy. Do not average away a blocking issue; call out the lowest critical dimension separately.

## Required audit output

Unless the user requests another format, return the audit in this order:

1. **Scope and method** — pages, tasks, surfaces inspected, viewports/input methods, and what could not be accessed.
2. **Executive summary** — the three most important user risks and the strongest part of the experience.
3. **Task walkthrough** — short chronological notes from entry to success/failure.
4. **Prioritized findings** — Critical/High first, using the required finding format.
5. **Systemic patterns** — repeated issues that should be fixed through shared components, tokens, content rules, or information architecture.
6. **Quick wins** — low-risk changes that improve clarity without redesigning the product.
7. **Recommended sequence** — immediate blockers, next usability improvements, then polish.
8. **Validation plan** — exact tasks, states, viewport sizes, keyboard paths, and accessibility checks to rerun.
9. **Limitations and confidence** — source-only gaps, missing browser access, untested devices, assumptions, and items needing real user research.

If useful, include a compact scorecard after the executive summary, but never let a score replace concrete evidence.

## Evidence and tooling rules

- Prefer the running rendered page and reproducible interaction evidence for visual/behavioral claims.
- Use repository code to verify routes, components, states, semantics, styles, privacy behavior, and available tests.
- Use screenshots or visual previews when available, especially for spacing, hierarchy, clipping, responsive layout, and visual states.
- If browser or visual access is unavailable, perform a source audit and explicitly say that rendered appearance and real interaction could not be verified.
- Never infer contrast, focus behavior, responsive fit, or animation behavior solely from source when it has not been rendered or measured; label it as unverified.
- Do not claim accessibility compliance from a checklist alone. Report inspected checks and remaining gaps.
- Do not send user-provided content to external services for the purpose of auditing it unless the user explicitly authorizes that behavior.

## Guardrails against shallow or biased reviews

- Do not recommend a redesign merely because the reviewer prefers another visual style.
- Do not reward complexity, novelty, gradients, animation, or excessive whitespace by default.
- Do not assume desktop, mouse, sighted, expert, English-speaking, or LTR users are the only users.
- Do not treat “users can figure it out” as evidence of good UX.
- Do not mark a missing feature as a defect unless the task, product promise, convention, or comparable flow establishes that it is expected.
- Do not use severity to pressure implementation; explain the user consequence and let product priorities determine the trade-off.
- Do not modify code during an audit-only request.

## Transition to implementation

If the user later asks to fix the findings:

1. Confirm which findings are in scope.
2. Inspect the existing design system and closest working patterns before editing.
3. Prefer shared tokens, primitives, and patterns over duplicated page-specific CSS.
4. Preserve routes, metadata, business logic, privacy behavior, localization, and analytics unless explicitly asked to change them.
5. Implement the smallest complete fix, then rerun the exact task walkthrough and relevant project checks.
6. Report which findings were fixed, which remain, and what was actually verified.

An audit is complete only when the user can see what is wrong, why it matters, how confident the evidence is, and what to do next.
