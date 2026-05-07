import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { AuditResult } from '../types';
import AuditResults from '../components/AuditResults';
import { loadAudit } from '../lib/supabase';

// Demo audit for /audit/demo route
import { runAudit } from '../lib/AuditEngine';
import { generateFallbackSummary } from '../lib/anthropicAPI';

function getDemoAudit(): AuditResult {
  const result = runAudit({
    teamSize: 8,
    useCase: 'coding',
    tools: [
      { toolId: 'cursor', plan: 'business', seats: 8, monthlySpend: 0 },
      { toolId: 'github_copilot', plan: 'individual', seats: 8, monthlySpend: 0 },
      { toolId: 'chatgpt', plan: 'team', seats: 3, monthlySpend: 0 },
      { toolId: 'anthropic_api', plan: 'payg', seats: 1, monthlySpend: 620 },
    ],
  });
  result.id = 'demo';
  result.aiSummary = generateFallbackSummary(result);
  return result;
}

export default function SharedAuditPage() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      if (id === 'demo') {
        setAudit(getDemoAudit());
        setLoading(false);
        return;
      }
      if (!id) { setNotFound(true); setLoading(false); return; }
      const result = await loadAudit(id);
      if (result) setAudit(result);
      else setNotFound(true);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading audit…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="font-display font-700 text-2xl text-slate-100 mb-2">Audit not found</h1>
          <p className="text-slate-500 text-sm mb-6">This audit may have expired or the link is incorrect.</p>
          <Link to="/" className="btn-primary">Run your own audit</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-surface-border bg-surface/80" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span className="text-brand-400 text-sm">⬡</span>
            </div>
            <span className="font-display font-700 text-slate-100 text-base">SpendWise</span>
          </Link>
          <Link to="/" className="btn-ghost text-xs py-1.5 px-3">
            Audit my stack →
          </Link>
        </div>
      </nav>

      {/* Shared audit notice */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-6 bg-surface-muted rounded-xl px-4 py-2.5 border border-surface-border">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          Shared audit · Personal details removed
          {id === 'demo' && <span className="ml-auto text-slate-700">Demo mode</span>}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-20">
        {audit && (
          <AuditResults
            audit={audit}
            onStartOver={() => window.location.href = '/'}
            shareUrl={window.location.href}
          />
        )}
      </main>
    </div>
  );
}