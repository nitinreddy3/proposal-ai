<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Product overview
ProposalAI is a single Next.js 16 (App Router) application — not a monorepo, no Docker. It uses cloud-hosted Supabase (PostgreSQL + Auth + Storage), OpenAI GPT-4o for AI generation, and optionally the SAM.gov API.

### Running the app
- `npm run dev` starts the dev server on port 3000.
- The `.env.local` file must exist (copy from `.env.local.example`). Supabase URL/anon key from the example file allow the app to start, but auth and data flows require real Supabase credentials.

### Key commands
| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Unit tests | `npm run test:unit` (Vitest) |
| E2E tests | `npx playwright test --project=chromium` |
| Build | `npm run build` |

### Non-obvious caveats
- **Next.js 16 middleware deprecation**: The build emits a warning that the `middleware` file convention is deprecated in favor of `proxy`. This is cosmetic and does not block the build.
- **Lint has 2 pre-existing errors** in `src/app/(protected)/proposals/[id]/loading.tsx` related to `Math.random()` in render. These are not introduced by setup.
- **E2E tests**: The Playwright spec `tests/e2e/proposal-mvp.spec.ts` has a pre-existing locator mismatch — it expects `getByRole('heading', { name: /proposal ai/i })` but the login page uses a `<span>` element, not a heading. Tests will fail until the spec or the page is updated.
- **Playwright browsers**: Only Chromium is needed for basic e2e testing. Install with `npx playwright install --with-deps chromium`.
- **Auth**: The only login method is Google OAuth via Supabase Auth. Authenticated E2E flows require `PLAYWRIGHT_RUN_AUTH_FLOW=true` and a valid storage state file.
- **No local database**: All data is in cloud Supabase. No `supabase start` or Docker needed.
- **External API keys**: `OPENAI_API_KEY` is required for AI proposal generation. `SAM_GOV_API_KEY` is optional (only for opportunity sync).
