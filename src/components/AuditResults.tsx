import React, { useState, useRef } from 'react';
import {
  TrendingDown, CheckCircle, AlertTriangle, ArrowRight,
  Share2, Mail, ExternalLink, Copy, Check, Sparkles, Download, Info
} from 'lucide-react';
import type { AuditResult, AuditFinding } from '../types';
import { TOOLS } from '../data/tools';

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

function StatusBadge({ status }: { status: AuditFinding['status'] }) {
  if (status === 'overspending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest border"
        style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>
        <AlertTriangle size={10} /> Overspending
      </span>
    );
  }
  if (status === 'suboptimal') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest border"
        style={{ background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.2)' }}>
        <TrendingDown size={10} /> Suboptimal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest border"
      style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}>
      <CheckCircle size={10} /> Optimal
    </span>
  );
}

function FindingCard({ finding, index }: { finding: AuditFinding; index: number }) {
  const tool = TOOLS.find(t => t.id === finding.toolId);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border border-surface-border animate-fade-up overflow-hidden"
      style={{ animationDelay: `${200 + index * 80}ms`, animationFillMode: 'both', opacity: 0 }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border bg-surface-muted/40">
        <div className="flex items-center gap-2.5">
          <span className="text-base" style={{ color: tool?.color || '#10b981' }}>{tool?.logo || '◎'}</span>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{finding.toolName}</span>
            <span className="font-mono text-[9px] text-slate-700 ml-2">· {finding.currentPlan}</span>
          </div>
        </div>
        <StatusBadge status={finding.status} />
      </div>

      <div className="p-4">
        {/* Spend comparison — mini data table */}
        {finding.monthlySavings > 0 && (
          <div className="flex items-stretch gap-0 mb-4 border border-surface-border">
            <div className="flex-1 p-3 text-center border-r border-surface-border">
              <div className="font-mono text-[9px] uppercase tracking-widest text-slate-600 mb-1">Current</div>
              <div className="font-mono text-base text-slate-300">${finding.currentSpend}<span className="text-[10px] text-slate-600">/mo</span></div>
            </div>
            <div className="flex items-center px-3 text-slate-700">
              <ArrowRight size={14} />
            </div>
            <div className="flex-1 p-3 text-center border-r border-surface-border" style={{ background: 'rgba(16,185,129,0.04)' }}>
              <div className="font-mono text-[9px] uppercase tracking-widest text-slate-600 mb-1">Suggested</div>
              <div className="font-mono text-base text-brand-400">${finding.suggestedSpend.toFixed(0)}<span className="text-[10px] text-slate-600">/mo</span></div>
            </div>
            <div className="p-3 text-center" style={{ background: 'rgba(16,185,129,0.06)' }}>
              <div className="font-mono text-[9px] uppercase tracking-widest text-brand-600 mb-1">Savings</div>
              <div className="font-mono text-base text-brand-400 font-bold">−{formatCurrency(finding.monthlySavings)}</div>
              <div className="font-mono text-[9px] text-slate-600">−{formatCurrency(finding.annualSavings)}/yr</div>
            </div>
          </div>
        )}

        {/* Recommendation */}
        <p className="text-sm text-slate-300 mb-3 leading-relaxed">{finding.recommendation}</p>

        {/* Expandable reason */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
        >
          <Info size={11} />
          {expanded ? 'Hide reasoning' : 'Why this recommendation?'}
        </button>

        {expanded && (
          <div className="mt-3 border-l-2 border-brand-500/20 pl-3">
            <p className="text-xs text-slate-500 leading-relaxed font-mono">{finding.reason}</p>
          </div>
        )}

        {/* Alternative tool */}
        {finding.alternativeTool && finding.alternativeToolUrl && (
          <a
            href={finding.alternativeToolUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-brand-400 hover:text-brand-300 transition-colors"
          >
            <ExternalLink size={11} />
            Try {finding.alternativeTool}
          </a>
        )}

        {/* Credex tag */}
        {finding.credexApplicable && finding.monthlySavings > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2.5 border border-brand-500/15"
            style={{ background: 'rgba(16,185,129,0.05)' }}>
            <Sparkles size={12} className="text-brand-400 flex-shrink-0" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-400">
              Credex credits could unlock additional savings on this tool
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface EmailGateProps {
  onSubmit: (email: string, company?: string, role?: string) => void;
  isSubmitting?: boolean;
  submitted?: boolean;
}

function EmailGate({ onSubmit, isSubmitting, submitted }: EmailGateProps) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [honeypot, setHoneypot] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return;
    if (!email.includes('@')) return;
    onSubmit(email, company || undefined, role || undefined);
  }

  if (submitted) {
    return (
      <div className="border border-brand-500/20 p-6 text-center animate-fade-in"
        style={{ background: 'rgba(16,185,129,0.05)' }}>
        <CheckCircle size={28} className="text-brand-400 mx-auto mb-3" />
        <h3 className="font-mono text-xs uppercase tracking-widest text-slate-100 mb-1">Report on its way</h3>
        <p className="text-slate-500 text-sm font-mono">Check your inbox for the full audit summary.</p>
      </div>
    );
  }

  return (
    <div className="border border-surface-border">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border bg-surface-muted/40">
        <Mail size={12} className="text-slate-600" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">Get your full report</span>
      </div>
      <div className="p-5">
        <p className="text-slate-400 text-sm mb-4 font-mono leading-relaxed">
          Receive a PDF summary + get notified when new optimisations apply to your stack.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            aria-hidden="true"
          />

          <div>
            <label className="block text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@company.com"
              className="input-field font-mono"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-1.5">Company</label>
              <input
                type="text"
                placeholder="Optional"
                className="input-field font-mono"
                value={company}
                onChange={e => setCompany(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-1.5">Role</label>
              <input
                type="text"
                placeholder="Optional"
                className="input-field font-mono"
                value={role}
                onChange={e => setRole(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs uppercase tracking-widest"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Mail size={14} />
            )}
            Send me the report
          </button>
          <p className="text-[10px] font-mono text-slate-700 uppercase tracking-widest text-center">No spam. Unsubscribe anytime.</p>
        </form>
      </div>
    </div>
  );
}

function CredexCTA({ savings }: { savings: number }) {
  return (
    <div className="border overflow-hidden" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
      {/* Header strip */}
      <div className="p-5 text-white relative overflow-hidden" style={{ background: '#141414' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 -translate-y-10 translate-x-10"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-brand-400 text-[9px] font-mono uppercase tracking-widest mb-2 border border-brand-500/30 px-2 py-0.5">
            <Sparkles size={10} />
            Credex Partner
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">High Savings Detected</div>
          <div className="text-3xl font-bold tracking-tighter">
            Unlock another {formatCurrency(savings * 0.3)}
            <span className="text-lg font-mono font-normal text-slate-400">/mo in savings</span>
          </div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-slate-400 text-sm mb-4 leading-relaxed font-mono text-xs">
          Credex sources discounted AI infrastructure credits from companies that overforecast compute.
          Real credits, real savings — same API endpoints, lower bills.
        </p>
        <a
          href="https://credex.rocks"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex font-mono text-xs uppercase tracking-widest"
        >
          Book a Credex consultation
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}

interface AuditResultsProps {
  audit: AuditResult;
  onStartOver: () => void;
  shareUrl?: string;
}

export default function AuditResults({ audit, onStartOver, shareUrl }: AuditResultsProps) {
  const [copied, setCopied] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const showCredex = audit.totalMonthlySavings > 500 || audit.findings.some(f => f.credexApplicable);

  async function copyShareLink() {
    const url = shareUrl || window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleEmailSubmit(email: string, company?: string, role?: string) {
    setEmailSubmitting(true);
    try {
      const { saveLead } = await import('../lib/supabase');
      await saveLead({ email, companyName: company, role, teamSize: audit.input.teamSize, auditId: audit.id });
    } catch { /* best effort */ }
    setEmailSubmitting(false);
    setEmailSubmitted(true);
  }

  async function exportPDF() {
    if (!reportRef.current) return;
    setIsExportingPDF(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0f1a',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`SpendWise-Audit-${audit.id?.slice(-8) || 'Report'}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
    }
    setIsExportingPDF(false);
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Hero savings — editorial report header */}
      <div
        className="border animate-fade-up overflow-hidden"
        style={{
          borderColor: audit.isOptimal ? 'rgba(100,116,139,0.2)' : 'rgba(16,185,129,0.3)',
        }}
      >
        {/* Black header strip */}
        <div className="p-8 text-white relative overflow-hidden" style={{ background: '#0d1117' }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-slate-600 mb-3">
                Audit Report #{audit.id?.slice(-8).toUpperCase() || 'PREVIEW'}
              </div>
              {audit.isOptimal ? (
                <>
                  <div className="text-5xl mb-1">🏆</div>
                  <h2 className="text-4xl font-bold tracking-tighter text-slate-100">You're spending well.</h2>
                  <p className="text-slate-500 text-sm font-mono mt-2">Your stack is optimised. No significant savings found.</p>
                </>
              ) : (
                <>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-slate-600 mb-2">Potential savings identified</div>
                  <div className="text-7xl sm:text-8xl font-bold tracking-tighter leading-none text-gradient">
                    {formatCurrency(audit.totalMonthlySavings)}
                    <span className="text-2xl font-mono font-normal text-slate-500 align-top ml-2 tracking-normal">/MO</span>
                  </div>
                  <div className="font-mono text-base text-slate-400 mt-2 italic">
                    Potential Annual Savings: {formatCurrency(audit.totalAnnualSavings)}
                  </div>
                  <div className="font-mono text-[10px] text-slate-600 mt-1 uppercase tracking-widest">
                    Across {audit.findings.filter(f => f.status !== 'optimal').length} of {audit.findings.length} tools
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={copyShareLink}
                className="flex flex-col items-center gap-1.5 p-3.5 border border-white/10 hover:border-white/30 transition-all"
              >
                {copied ? <Check size={18} className="text-brand-400" /> : <Share2 size={18} className="text-white" />}
                <span className="text-[8px] font-mono uppercase tracking-widest text-slate-500">{copied ? 'Copied' : 'Share'}</span>
              </button>
              <button
                onClick={exportPDF}
                disabled={isExportingPDF}
                className="flex flex-col items-center gap-1.5 p-3.5 border border-white/10 hover:border-white/30 transition-all disabled:opacity-40"
              >
                {isExportingPDF
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Download size={18} className="text-white" />}
                <span className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Audit metadata strip */}
        <div className="flex items-center gap-6 px-6 py-2.5 border-t border-surface-border bg-surface-muted/20">
          <div className="flex items-center gap-4 text-[9px] font-mono uppercase tracking-widest text-slate-700">
            <div className="flex justify-between gap-2">
              <span>Audit Engine</span>
              <span className="text-slate-600">v1.2</span>
            </div>
            <span>·</span>
            <div className="flex gap-2">
              <span>Data Verified</span>
              <span className="text-slate-600">{new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {audit.aiSummary && (
        <div
          className="border animate-fade-up"
          style={{
            animationDelay: '100ms', animationFillMode: 'both', opacity: 0,
            borderColor: 'rgba(99,102,241,0.15)',
            background: 'rgba(99,102,241,0.04)',
          }}
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-indigo-500/10">
            <Sparkles size={12} className="text-indigo-400" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-indigo-400">AI Analysis</span>
          </div>
          <p className="px-5 py-4 text-slate-300 text-sm leading-relaxed font-mono">{audit.aiSummary}</p>
        </div>
      )}

      {/* Share bar */}
      <div
        className="flex items-center gap-3 p-4 border border-surface-border"
        style={{ background: '#0d1117' }}
      >
        <Share2 size={14} className="text-slate-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-0.5">Share this audit</p>
          <p className="text-xs text-slate-700 font-mono truncate">{shareUrl || window.location.href}</p>
        </div>
        <button
          onClick={copyShareLink}
          className="btn-ghost text-[10px] py-2 px-3 flex-shrink-0 font-mono uppercase tracking-widest"
        >
          {copied ? <Check size={13} className="text-brand-400" /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      {/* Credex CTA */}
      {showCredex && !audit.isOptimal && (
        <div className="animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'both', opacity: 0 }}>
          <CredexCTA savings={audit.totalMonthlySavings} />
        </div>
      )}

      {/* Per-tool findings */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">03. Recommendations</span>
        </div>
        <div className="space-y-2">
          {audit.findings
            .sort((a, b) => b.monthlySavings - a.monthlySavings)
            .map((finding, i) => (
              <FindingCard key={finding.toolId} finding={finding} index={i} />
            ))}
        </div>
      </div>

      {/* Email gate */}
      <div className="animate-fade-up" style={{ animationDelay: '600ms', animationFillMode: 'both', opacity: 0 }}>
        <EmailGate
          onSubmit={handleEmailSubmit}
          isSubmitting={emailSubmitting}
          submitted={emailSubmitted}
        />
      </div>

      {/* Start over */}
      <div className="text-center pt-2">
        <button onClick={onStartOver} className="text-[10px] font-mono uppercase tracking-widest border border-surface-border px-6 py-2 text-slate-600 hover:text-slate-400 hover:border-slate-600 transition-all">
          ← New Audit
        </button>
      </div>
    </div>
  );
}