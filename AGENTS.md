# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Single Next.js 16 app (not a monorepo). See `README.md` for stack, routes, and project structure.

### Required secrets

Three environment variables must be injected as secrets and written to `.env.local` before the dev server or E2E tests will work:

| Secret | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (the app also accepts `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`) |
| `OPENAI_API_KEY` | OpenAI API key for AI parsing/enrichment |

Create `.env.local` from these env vars before starting:

```bash
printf "NEXT_PUBLIC_SUPABASE_URL=%s\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=%s\nOPENAI_API_KEY=%s\n" \
  "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" "$OPENAI_API_KEY" > .env.local
```

### Key commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Unit tests | `npm test` (Vitest, 30 tests, no external deps needed) |
| E2E tests | `npm run test:e2e` (Playwright Chromium; auto-starts dev server; full-flow test skipped when `CI=true`) |
| Build | `npm run build` |
| Debug connections | `curl http://localhost:3000/api/debug-connections` (verify OpenAI + Supabase + Nominatim) |

### Gotchas

- `.env.local` is gitignored and must be recreated from injected secrets each session.
- The Supabase client (`lib/supabase.ts`) tries keys in order: `SUPABASE_SECRET_KEY` > `SUPABASE_SERVICE_ROLE_KEY` > `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` > `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Only one needs to be set.
- Playwright needs Chromium installed: `npx playwright install --with-deps chromium`.
- ESLint has 1 pre-existing error (`react/no-unescaped-entities` in `app/trips/page.tsx`) and several warnings (unused vars, `<img>` vs `<Image />`). These are in the existing code.
- The full-flow E2E test (`tests/e2e/full-flow.spec.ts`) is skipped when `CI=true`; it requires a running dev server + Supabase + OpenAI.
- Database schema is managed via SQL migrations in `supabase/migrations/`. These must be run on the Supabase project (see `docs/SUPABASE-SETUP.md`).
