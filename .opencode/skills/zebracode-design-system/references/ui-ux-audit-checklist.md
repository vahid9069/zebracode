# UI/UX Audit Checklist

Record evidence and severity for each applicable finding. Do not mark an item as a defect without verification.

## Navigation and discovery
- Can users find tools by name and category?
- Are search, filtering, sorting, and reset behaviors clear?
- Are active states and empty results understandable?
- Is keyboard navigation supported?

## Hierarchy and consistency
- Is the page purpose clear quickly?
- Are heading levels, type scale, spacing, and content width consistent?
- Are buttons and links visually distinguishable?
- Are cards and repeated elements aligned consistently?

## Tool workflow
- Are labels, placeholders, examples, and primary actions clear?
- Are input/output areas usable for long content?
- Are copy/clear/run/download actions present only when relevant?
- Are validation and error messages specific and actionable?
- Are loading, success, and empty states handled?

## Responsive behavior
- Check narrow mobile, tablet, and desktop layouts where possible.
- Look for horizontal overflow, clipped controls, unusable editors, and cramped toolbars.
- Check navigation, dialogs, tables, and multi-column input/output layouts.

## Accessibility
- Semantic structure and labels.
- Keyboard operation and visible focus.
- Contrast and non-color error cues.
- Touch targets and zoom/reflow.
- Reduced motion where applicable.

## Technical and product safety
- Existing routes and metadata remain intact.
- Tool behavior and output remain correct.
- No unexpected network transmission of user-provided data.
- No unnecessary dependency or performance regression.
- Tests and build checks are reported truthfully.

## Finding format
For each finding include:
- Severity: Critical / High / Medium / Low.
- Evidence: route, component, file, screenshot, or reproducible steps.
- Impact on the user.
- Recommended fix.
- Reuse/system implication.
- Validation method.
