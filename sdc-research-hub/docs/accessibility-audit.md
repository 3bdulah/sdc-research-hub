# Accessibility audit — M6

Target: SDC Research Hub Team Hub, Arabic RTL layout.

Standard: WCAG 2.1 AA baseline. Automated checks are limited; manual keyboard and screen-reader verification remains recommended before public release.

Implemented in M6:

- Visible `:focus-visible` outline for keyboard users.
- Semantic main landmark, table caption, table header scopes, and labels for form controls.
- Error messages use `role="alert"`; successful status messages use `role="status"`.
- Empty Cycle Board state is explicit instead of rendering a blank table.
- Reduced-motion preference is respected.
- Buttons have explicit button types and controls have accessible names.
- Error and 404 pages provide a recovery action.

Manual release checklist:

1. Navigate the full page using Tab/Shift+Tab only.
2. Confirm every select, input, button, and error is announced in VoiceOver.
3. Test at 200% zoom and at a narrow mobile width.
4. Verify text and control contrast against the sand/white surfaces.
5. Test the English toggle and RTL layout after a hard refresh.
