# M6 release verification

M6 closes the production-readiness and accessibility pass for the demo deployment.

## Verified locally

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm start` followed by `curl -I http://localhost:3000/` returned `200 OK`.
- Production response includes `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers.
- Vercel and Netlify configuration force `APP_MODE=demo`.
- The rendered production page exposes semantic landmarks, table headers, named controls, live status regions, and visible keyboard focus styling.
- A production-shell review image is stored at [`docs/screenshots/m6-production-shell.png`](./screenshots/m6-production-shell.png).

## Manual review still required before public release

- Complete a full Tab/Shift+Tab pass with VoiceOver.
- Confirm 200% zoom and narrow mobile layout on the target hosting environment.
- Confirm contrast with the committee's final brand palette.
- Obtain deployment credentials and an explicit approval before publishing externally.

Private mode remains local-only. No private CSV, committee reference file, real member identity, or external LLM call is part of the demo deployment.
