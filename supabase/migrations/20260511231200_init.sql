-- SpendWise Supabase Schema
-- Run this in the Supabase SQL editor under your project

-- Audits table (public results, PII-stripped for sharing)
create table if not exists audits (
  id text primary key,
  input jsonb not null,              -- AuditInput (tools, teamSize, useCase)
  findings jsonb not null,           -- AuditFinding[]
  total_monthly_savings numeric not null default 0,
  total_annual_savings numeric not null default 0,
  ai_summary text,
  is_optimal boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table audits enable row level security;

-- Public read (audits are shareable, PII is not stored here)
create policy "Anyone can read audits" on audits
  for select using (true);

-- Insert allowed from anon (service role only in production)
create policy "Anon can insert audits" on audits
  for insert with check (true);

-- Leads table (PII — restrict in production to service role)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  audit_id text references audits(id),
  email text not null,
  company_name text,
  role text,
  team_size int,
  captured_at timestamptz not null default now()
);

alter table leads enable row level security;

-- Only service role can read leads
create policy "Service role can read leads" on leads
  for select using (auth.role() = 'service_role');

-- Anon can insert leads
create policy "Anon can insert leads" on leads
  for insert with check (true);

-- Index for fast audit lookups
create index if not exists audits_created_at_idx on audits(created_at desc);
create index if not exists leads_audit_id_idx on leads(audit_id);

-- Rate limiting view: audits per IP per hour (implement at API layer)
-- Abuse protection notes:
-- 1. Honeypot field in email form (client-side, no server round-trip)
-- 2. Supabase anon key is public — restrict write permissions to insert-only
-- 3. Add hCaptcha or Turnstile to email gate in production
-- 4. Rate limit at Vercel Edge middleware: 10 audits/IP/hour