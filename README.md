# ProposalAI — SAM.gov Opportunity Proposal Studio

Build stronger government proposals with an end-to-end workflow: ingest SAM.gov opportunities, score fit against your vendor profile, generate proposal drafts with AI, enrich them with attachments and graphics, and export polished PDFs.

## Features

- **SAM.gov Sync** — On-demand import of federal opportunities from SAM.gov.
- **Opportunity Matching** — Deterministic scoring against a vendor profile (keywords, NAICS, set-aside, urgency).
- **Template-Based Generation** — Government, Executive, and Technical templates with selectable tone.
- **Attachment-Aware AI** — Include extracted text from uploaded files in generation prompts.
- **Opportunity-to-Proposal Flow** — Create proposals directly from matched opportunities.
- **Streaming Response** — Watch the proposal generate in real-time via Server-Sent Events.
- **Rich Text Editor** — TipTap editor with formatting, image insertion, and callout graphics blocks.
- **One-Click PDF Export** — Export proposals as professionally formatted PDFs.
- **Dashboard** — View, search, filter, duplicate, and manage all proposals.
- **Google Auth** — Sign in with Google via Supabase Auth.
- **Auto-Save** — Editor auto-saves to Supabase with debounced updates.
- **Row-Level Security** — User-isolated data for proposals, profiles, opportunities, matches, and attachments.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Shadcn UI |
| Auth & Database | Supabase (PostgreSQL + Auth) |
| AI | OpenAI GPT-4o |
| Opportunity Source | SAM.gov Opportunities API |
| Editor | TipTap + Image extension |
| PDF | jsPDF + html2canvas |
| Validation | Zod + React Hook Form |

## Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key
- A [SAM.gov](https://sam.gov) API key

## Getting Started

### 1. Clone and install

```bash
cd proposal-ai
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase and OpenAI credentials in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-api-key
SAM_GOV_API_KEY=your-sam-gov-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Run the migration SQL files in the Supabase SQL Editor:

```bash
# Run in order:
# 1) supabase/migrations/001_create_proposals.sql
# 2) supabase/migrations/002_mvp_samgov_foundation.sql
```

3. Enable the Google OAuth provider:
   - Go to **Authentication > Providers** in the Supabase Dashboard.
   - Enable the **Google** provider with your Google Cloud OAuth client ID and secret.
   - Set the redirect URL to `http://localhost:3000/auth/callback`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## MVP Workflow

1. Save your vendor profile in **Opportunities**.
2. Sync SAM.gov opportunities with optional keyword/agency filters.
3. Review match scores and rationale.
4. Create a proposal from a selected opportunity.
5. Attach supporting files and choose a template.
6. Generate, edit, add graphics/images, and export PDF.

## Testing

```bash
npm run test:unit
npm run test:e2e
```

For authenticated Playwright flows:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_STORAGE_STATE=./playwright/.auth/user.json
PLAYWRIGHT_RUN_AUTH_FLOW=true
```

## License

MIT
