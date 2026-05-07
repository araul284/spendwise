import { createClient } from '@supabase/supabase-js';
import type { AuditResult, LeadCapture } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ─── Save audit to Supabase ─────────────────────────────────────────────────
export async function saveAudit(audit: AuditResult): Promise<void> {
  if (!supabase) {
    // Store in localStorage as fallback when Supabase is not configured
    const audits = JSON.parse(localStorage.getItem('sw_audits') || '{}');
    audits[audit.id] = audit;
    localStorage.setItem('sw_audits', JSON.stringify(audits));
    return;
  }

  await supabase.from('audits').insert({
    id: audit.id,
    input: audit.input,
    findings: audit.findings,
    total_monthly_savings: audit.totalMonthlySavings,
    total_annual_savings: audit.totalAnnualSavings,
    ai_summary: audit.aiSummary,
    is_optimal: audit.isOptimal,
    created_at: audit.createdAt,
  });
}

// ─── Load audit by ID ────────────────────────────────────────────────────────
export async function loadAudit(id: string): Promise<AuditResult | null> {
  if (!supabase) {
    const audits = JSON.parse(localStorage.getItem('sw_audits') || '{}');
    return audits[id] || null;
  }

  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    input: data.input,
    findings: data.findings,
    totalMonthlySavings: data.total_monthly_savings,
    totalAnnualSavings: data.total_annual_savings,
    aiSummary: data.ai_summary,
    isOptimal: data.is_optimal,
    createdAt: data.created_at,
  };
}

// ─── Save lead ───────────────────────────────────────────────────────────────
export async function saveLead(lead: LeadCapture): Promise<void> {
  if (!supabase) {
    const leads = JSON.parse(localStorage.getItem('sw_leads') || '[]');
    leads.push({ ...lead, savedAt: new Date().toISOString() });
    localStorage.setItem('sw_leads', JSON.stringify(leads));
    return;
  }

  await supabase.from('leads').insert({
    email: lead.email,
    company_name: lead.companyName,
    role: lead.role,
    team_size: lead.teamSize,
    audit_id: lead.auditId,
    captured_at: new Date().toISOString(),
  });
}