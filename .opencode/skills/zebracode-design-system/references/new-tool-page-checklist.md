# New Tool / Page Checklist

Before building:
- Find an existing page with a similar interaction model.
- Confirm route, metadata, localization, and navigation conventions.
- Identify which shared components can be reused.
- Separate tool-specific processing from UI where practical.
- Confirm privacy and client/server processing expectations.

During implementation:
- Reuse tokens and shared patterns.
- Avoid page-specific duplicate styles and copied layout markup.
- Provide clear labels and examples where useful.
- Implement relevant empty, invalid, loading, success, and error states.
- Ensure long content and code are usable on mobile.
- Preserve keyboard accessibility and focus behavior.

Before completion:
- Verify main happy path and edge cases.
- Run relevant project checks.
- Inspect affected page at available viewport sizes.
- Check route, metadata, and links.
- Document new variants or patterns so future tools can reuse them.
