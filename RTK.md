# Runtime and team rules

- `APP_MODE=demo` is the safe default and uses only invented Arabic names and fake email addresses.
- `APP_MODE=private` may read local data only from `/private`, which is git-ignored. Real people’s data must never be committed or sent to an LLM.
- Arabic is the default locale and document direction is RTL. English is a toggle. Use `Asia/Riyadh` and a Sunday–Thursday work week.
- AI-generated text is always labeled `DRAFT (مسودة)` and remains unapproved until a human approves it.
- No paper enters the workflow without a license verdict.
- Configurable plans, topics, sectors, KPIs, activities, responsibilities, and templates belong in JSON/configuration or the database, not UI components.
- External integrations must fail clearly and gracefully. M0 uses a mock AI provider and no network calls.
- Keep components small, typed, accessible, and free of dead code.
