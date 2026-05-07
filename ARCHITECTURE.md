## System Diagram
flowchart TD
    A[Cold Visitor via Tweet/HN/Blog] --> B[Next.js App Router - Landing Page /]
    
    B --> C[Form: Tool + Plan + Seats + Spend + Team Size + Use Case]
    C --> D[Zustand Store + localStorage Persist]
    
    D --> E[POST /api/audit]
    E --> F[Audit Engine lib/audit.ts]
    F --> G[PRICING_DATA.md - Hardcoded Rules]
    F --> H[Claude API - 100-word Summary]
    H -->|Success| I[LLM Summary]
    H -->|Fail| J[Fallback Template Summary]
    I --> K[Audit Result JSON]
    J --> K
    
    K --> L[POST /api/audits - Save to Supabase]
    L --> M[Supabase Postgres: audits table - public data only]
    L --> N[Return audit_id + results]
    
    N --> O[Results Page /audit/[id] - Private]
    O --> P{Email Gate Dialog}
    
    P -->|Submit Email| Q[POST /api/leads]
    Q --> R[Supabase Postgres: leads table - PII]
    Q --> S[Resend API: Transactional Email]
    S --> T[Email: Audit link + Credex CTA if >$500 savings]
    
    O --> U[Share Button: /s/[id] - Public]
    U --> V[Supabase RLS: public view, no PII]
    V --> W[OG Image Edge Function /api/og]
    W --> X[Twitter + LinkedIn + Slack Preview]
    
    subgraph Abuse Protection
      E -.-> Y[Upstash Redis Ratelimit 5 req/hr per IP]
      P -.-> Z[Honeypot Hidden Input]
    end
    
    subgraph Hosting
      B --> AA[Vercel Edge + SSR]
      L --> BB[Supabase Cloud]
      S --> CC[Resend Cloud]
    end
    
    style M fill:#e1f5fe
    style R fill:#ffebee
    style W fill:#f3e5f5

1. *Input → Validation*: User fills shadcn form. Zustand persists state to `localStorage` so reloads don’t lose data. Zod validates on client + server.

2. *Audit Calculation*: `/api/audit` runs pure `runAudit()` from `lib/audit.ts`. This uses `PRICING_DATA.md` as source of truth. No LLM here. Deterministic, testable, defensible.

3. *AI Summary*: Result JSON sent to Anthropic Claude 3.5 Sonnet via `/api/summary`. If API errors, timeout, or rate limit, we fall back to templated summary from `PROMPTS.md`. Always returns ∼100 words.

4. *Storage Split*: Two tables in Supabase:
   - `audits` - public. Contains `id`, `tools_json`, `savings`, `created_at`, `is_public`. No email/company.
   - `leads` - private. Contains `email`, `company`, `role`, `audit_id`. Row Level Security blocks public reads.

5. *Shareable URL*: `/s/[id]` fetches from `audits` only. RLS policy: `SELECT WHERE is_public = true`. OG image generated at edge via `/api/og?savings=2400` using `@vercel/og`.

6. *Abuse Protection*: Upstash Redis rate limits `/api/audit` to 5 requests/hour per IP. Email form has honeypot field `website` hidden via CSS. If filled, we silently reject.

*Why This Stack*

- *Next.js 15 + Vercel*: OG images require edge rendering. Vercel Analytics free. Server Components keep bundle small for cold visitors.
- *Supabase vs D1*: Picked Supabase for built-in RLS. At 10k audits/day I’d switch audits table to Cloudflare D1 + Durable Objects for $0 reads.
- *No Auth*: Clerk adds friction. We don’t need login until email gate, and that’s just a lead capture.
- *shadcn vs MUI*: shadcn copies code into your repo. You can edit button variants for brand. Critical for screenshot quality.

*What Changes at 10k audits/day*

1. Move audit engine to Cloudflare Worker. 0 cold start vs Vercel function.
2. Cache `PRICING_DATA.md` in Cloudflare KV. Updates via GitHub Action weekly.
3. Queue email via Upstash Qstash instead of synchronous Resend call. Return 200 to user immediately.
4. Add Postgres read replica for public `/s/[id]` queries.

---