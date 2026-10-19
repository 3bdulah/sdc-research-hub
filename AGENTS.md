# SDC Research Hub

@RTK.md

This repository is an Arabic-first, offline-capable research workflow app for
the SDC Scientific Research team. Read `RTK.md` before changing code.

## Project structure

- `src/app`: Next.js App Router pages and global styles
- `src/components`: reusable UI components
- `src/lib`: configuration, mode handling, database schema, and seed helpers
- `seed`: editable JSON configuration and synthetic demo data
- `scripts`: local database and maintenance scripts
- `tests`: unit tests
- `private`: local-only CSV/SQLite data; never commit it

## Milestone workflow

Each milestone must end with lint, typecheck, tests, and build verification, a
clear commit, and a summary of working behavior, stubs, and the next milestone.
Stop for review before starting the next milestone.
