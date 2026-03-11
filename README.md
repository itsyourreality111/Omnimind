# OmniMind 🧠

> The AI operating system that runs your business while you sleep.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Database | Supabase (Postgres + pgvector) |
| AI | Claude Sonnet (Anthropic) + OpenAI Embeddings |
| Agents | Inngest (background jobs) |
| Payments | Stripe |
| Email | Resend |

---

## Setup (Day 1 — ~2 hours)

### 1. Clone & install
```bash
git clone https://github.com/yourname/omnimind.git
cd omnimind
npm install
```

### 2. Create accounts (all free tiers)
- [Clerk](https://clerk.com) → get publishable + secret keys
- [Supabase](https://supabase.com) → create project, get URL + anon key + service role key
- [Anthropic](https://console.anthropic.com) → get API key
- [OpenAI](https://platform.openai.com) → get API key (embeddings only)
- [Stripe](https://stripe.com) → create account, get keys, create 3 products
- [Resend](https://resend.com) → get API key
- [Inngest](https://inngest.com) → get event key

### 3. Configure environment
```bash
cp .env.local .env.local.example  # back it up
# Fill in all values in .env.local
```

### 4. Set up Supabase
```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Enable pgvector in your Supabase dashboard:
# Database → Extensions → vector → Enable
```

### 5. Run locally
```bash
npm run dev
# → http://localhost:3000
```

### 6. Set up Inngest (local dev)
```bash
npx inngest-cli@latest dev
# → Runs agent dashboard at http://localhost:8288
```

### 7. Stripe webhooks (local)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## File Structure

```
omnimind/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login + signup (Clerk)
│   │   ├── (dashboard)/         # Protected app routes
│   │   │   ├── layout.tsx       # Sidebar + nav
│   │   │   ├── dashboard/       # Overview page
│   │   │   ├── brain/           # Second brain + chat
│   │   │   ├── agents/          # Agent activity + controls
│   │   │   ├── content/         # Content queue + approvals
│   │   │   ├── revenue/         # Revenue dashboard
│   │   │   └── settings/        # Integrations + billing
│   │   └── api/
│   │       ├── ingest/          # Knowledge ingestion endpoint
│   │       ├── chat/            # Streaming RAG chat endpoint
│   │       ├── agents/run/      # Manual agent trigger
│   │       └── webhooks/stripe/ # Stripe event handler
│   ├── components/
│   │   ├── ui/                  # Buttons, inputs, cards
│   │   ├── layout/              # Sidebar, topbar
│   │   ├── dashboard/           # Stat cards, activity feed
│   │   ├── agents/              # Agent log, approval UI
│   │   └── brain/               # Chat interface, upload
│   ├── lib/
│   │   ├── supabase/            # Server + client helpers
│   │   ├── anthropic/           # Claude + embeddings + RAG
│   │   ├── agents/              # Inngest functions
│   │   └── utils/               # cn(), formatters
│   ├── hooks/                   # useChat, useAgentLogs, etc.
│   └── types/                   # TypeScript types
└── supabase/
    └── migrations/              # SQL schema files
```

---

## Deploy

### Frontend → Vercel
```bash
# Push to GitHub, import project in vercel.com
# Add all env vars in Vercel dashboard
# Deploy ✓
```

### Agents → Railway (Python LangGraph) or Inngest Cloud
```bash
# Inngest Cloud handles scheduling automatically
# Just deploy your Next.js app — Inngest picks up the functions
```

---

## Roadmap

- [x] Core auth + dashboard shell
- [x] Knowledge ingestion pipeline
- [x] RAG chat (streaming)
- [x] Nightly agent swarm (Inngest)
- [x] Stripe subscriptions
- [ ] Onboarding wizard
- [ ] Gmail/Notion OAuth (Nango)
- [ ] Content queue UI
- [ ] Revenue dashboard
- [ ] Shareable recap card (@vercel/og)
- [ ] Agent marketplace

---

Built with Claude · Owned by you
