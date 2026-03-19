# ProposalAI — AI-Powered Proposal Writer

Generate professional, persuasive project proposals in seconds using AI. Enter your project details, let GPT-4o craft a comprehensive proposal, refine it in a rich-text editor, and export a polished PDF.

## Features

- **AI-Powered Generation** — Structured prompts produce professional proposals with Executive Summary, Scope, Deliverables, Budget, Timeline, and more.
- **Streaming Response** — Watch the proposal generate in real-time via Server-Sent Events.
- **Rich Text Editor** — Full TipTap editor with formatting toolbar (bold, italic, underline, headings, lists, alignment).
- **One-Click PDF Export** — Export proposals as professionally formatted PDFs.
- **Dashboard** — View, search, filter, duplicate, and manage all your proposals.
- **Google Auth** — Sign in with Google via Supabase Auth.
- **Auto-Save** — Editor auto-saves to Supabase with debounced updates.
- **Row-Level Security** — Each user can only access their own proposals.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Shadcn UI |
| Auth & Database | Supabase (PostgreSQL + Auth) |
| AI | OpenAI GPT-4o |
| Editor | TipTap |
| PDF | jsPDF + html2canvas |
| Validation | Zod + React Hook Form |

## Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

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
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Run the migration SQL in the Supabase SQL Editor:

```bash
# Copy the contents of supabase/migrations/001_create_proposals.sql
# and run it in Supabase Dashboard > SQL Editor
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

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page with Google auth
│   ├── auth/callback/         # OAuth callback handler
│   ├── (protected)/
│   │   ├── dashboard/         # Proposals list with search/filter
│   │   └── proposals/
│   │       ├── new/           # Proposal input form
│   │       └── [id]/          # Proposal editor (TipTap)
│   └── api/
│       ├── proposals/         # CRUD REST endpoints
│       └── ai/generate/       # Streaming AI generation
├── components/
│   ├── ui/                    # Shadcn UI components
│   ├── auth/                  # Google login button, user menu
│   ├── layout/                # Header, sidebar
│   ├── proposal-form.tsx      # Input form component
│   ├── proposal-editor.tsx    # TipTap editor component
│   └── pdf-export-button.tsx  # PDF generation trigger
├── lib/
│   ├── supabase/              # Client & server Supabase helpers
│   ├── openai.ts              # OpenAI client
│   └── prompts.ts             # System & user prompt templates
├── types/
│   └── proposal.ts            # Zod schemas & TypeScript types
└── middleware.ts              # Auth session refresh & route guards
```

## License

MIT
