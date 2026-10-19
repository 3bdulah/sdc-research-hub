# Runtime and team rules

- `APP_MODE=private` is the default and starts empty. It may read a member CSV only from ignored `/private` storage. Real people’s data must never be committed or sent to an LLM.
- `APP_MODE=demo` is explicit-only and uses invented names/data. Do not present demo records as committee work or use demo mode with real member information.
- Arabic is the default locale and document direction is RTL. English is a toggle. Use `Asia/Riyadh` and a Sunday–Thursday work week.
- AI-generated text is always labeled `DRAFT (مسودة)` and remains unapproved until a human approves it.
- No paper enters the workflow without a license verdict.
- Configurable plans, topics, sectors, KPIs, activities, responsibilities, and templates belong in JSON/configuration or the database, not UI components.
- External integrations must fail clearly and gracefully. AI generation remains mock-only; paper metadata lookup may use public scholarly APIs when the user submits a source.
- A deployment with private data is not safe until authentication/authorization and durable hosted storage are implemented and tested. Local SQLite APIs must not be exposed as a public multi-user service.
- Keep components small, typed, accessible, and free of dead code.
