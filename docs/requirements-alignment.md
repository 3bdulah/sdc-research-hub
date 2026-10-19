# Requirements alignment

This matrix compares the local application with the committee reference brief at `/Users/abdullah/Documents/SDC/sdc-ai-committee-research-team.md`. The brief is treated as private planning context; its member names, emails, poll answers, and source attachments are not application seed data.

## Aligned

- Arabic-first RTL shell, Riyadh-friendly cycle dates, and editable November 2026 cycle start.
- The plan targets three research axes, five pairs per axis, three axis coordinators, eighteen reviewers, and four review groups sized 5/5/4/4. In private mode these are targets, not populated records, until the approved roster is loaded.
- Fifteen monthly papers with separate translation and summary deliverables.
- Four monthly threads and one digest represented in the plan and publishing studio.
- Quarterly topics, five distinct sectors per axis, activity intersections, risks, responsibilities, and twelve KPIs loaded from `seed/*.json`.
- Paper eligibility gate covers recency, page-size warning, source metadata, and license/permission verdicts.
- Self-check, independent review, final approval, draft labeling, and human approval gates are represented across M2, M7, M8, and M9.
- The 28-day workflow plus 29–30 buffer and Sunday–Thursday weekend shifting are implemented in the cycle engine.

## Intentionally private or pending committee approval

- The reference brief's real member directory and poll details stay outside Git and outside demo seed data. Private mode accepts an ignored `private/members.csv` supplied by the committee.
- The five management decisions listed in section 3.11 remain pending and are represented as approval items rather than silently treated as approved.
- October member-development work is represented as committee context, not as a fabricated completion record.
- Publishing destinations and analytics are local draft/export workflows until the committee approves the channel and provides deployment configuration.

## Deployment boundary

The tracked seed is designed to exclude real member identities, emails, poll answers, committee attachments, API keys, and private databases. This does not make the application safe for a public deployment: API routes do not yet enforce authentication/authorization, and local SQLite is not shared durable storage. Keep private mode local until those deployment controls are implemented.
