# SDC Research Hub

Arabic-first, RTL, offline-capable workspace for the Saudi Developers Community Scientific Research team. It manages a monthly cycle of 15 research papers, with a separate Arabic translation and short Arabic summary for every paper.

## What works

- Arabic default layout with English toggle and demo role switcher.
- Safe `APP_MODE=demo` with deterministic fake Arabic names and test emails only.
- Optional `APP_MODE=private` loading members from ignored `private/members.csv` into local SQLite.
- Cycle calendar with Sunday–Thursday deadline shifting, per-deliverable status, completion rules, and escalation.
- Paper Gate using OpenAlex first and arXiv fallback, with recency, size, and license verdicts.
- Leader/deputy cockpit, approval queue, pending tracker, annual topics/sectors/activities calendar, camp conflict check, KPI dashboard, editable JSON configuration, rollback, and Arabic Markdown report download.
- Offline demo data and mock-only AI behavior; no external LLM call is made in M0–M6.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The safe default is demo mode. To run the production build locally:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Configuration and privacy

`APP_MODE=demo` is the only mode suitable for deployment. It uses invented data and a local ignored database at `private/demo.sqlite`.

`APP_MODE=private` is for local use only. Put a real CSV at `private/members.csv` or set `PRIVATE_MEMBERS_CSV` to another ignored path. Never commit `/private`, `.env*`, SQLite files, exports, or committee reference files. Never send member names, emails, poll answers, or private CSV contents to an LLM.

All generated text is marked `DRAFT (مسودة)` and requires human approval. A paper cannot enter the workflow without a license verdict, and completion requires both independent deliverables to be approved.

## Architecture

- `src/app`: Next.js App Router page and API routes.
- `src/components`: client-side workflow panels and controls.
- `src/lib`: cycle rules, paper gate, leadership logic, report generation, configuration, and SQLite runtime.
- `seed/*.json`: editable plan configuration loaded by the seed/runtime layer.
- `tests`: deterministic unit tests with no live network dependency.
- `private/`: ignored local data only.

The runtime uses SQLite with the Node `node:sqlite` API and keeps the schema in `src/lib/db/schema.ts`. Demo mode seeds one complete month with 15 pairs, 3 coordinators, 18 reviewers, 4 review groups, and 15 papers.

## Screenshots

The M6 production-shell review image is available at [`docs/screenshots/m6-production-shell.png`](docs/screenshots/m6-production-shell.png). For a fresh review, run the app with `npm run dev` and capture the Arabic Team Hub, Paper Gate verdict, Cycle Board, and Abdullah Mode panels at 1280px or wider.

## Demo recording script

1. Start at the Team Hub and point out the Arabic RTL layout, demo badge, counts, and role switcher.
2. Paste an arXiv URL into Paper Gate; show the source, recency, page, license checks, and verdict.
3. Save the proposal, then move to Cycle Board and show that translation and summary have separate statuses.
4. Change one deliverable status and show the persisted update and completion rule.
5. Open Abdullah Mode; demonstrate the 24-hour approval queue, dual sign-off, opened-links checklist, and draft pending message.
6. Open the 12-month calendar; show topics, sectors, activities, intersections, and the unscheduled camp conflict check.
7. Open M5; edit a JSON configuration entry, show the change message, generate the Arabic Markdown report, and download it.
8. Close by reminding viewers that demo mode is safe and all AI-generated text remains `DRAFT (مسودة)` until human approval.

## Deployment

Vercel and Netlify configuration files are included for demo-only deployment. They force `APP_MODE=demo`; do not deploy private mode. SQLite is local and is not a production multi-user database. A future milestone should replace this with an explicitly approved hosted persistence layer if needed.

## Roadmap

M0–M9 are implemented in the local demo application. M6 release verification is documented in [`docs/m6-release-verification.md`](docs/m6-release-verification.md). Authentication, hosted persistence, real AI providers, and real member-data import remain intentionally out of scope until their dedicated milestones.

## Built with Codex

Codex was used as the implementation partner to scaffold the app, encode the domain rules, create deterministic demo data, implement the cycle/paper/leadership/KPI workflows, run the test and build checks, and preserve the privacy boundary between demo and private data. Human review remains required for plan changes, AI drafts, approvals, and deployment decisions.

## Contributing

Keep changes small and milestone-scoped. Before opening a review, run lint, typecheck, tests, and build. Do not add real names, emails, poll answers, or copied committee material to tracked files.
