import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TrendingDown } from 'lucide-react';
import type { AuditResult } from '../types';
import AuditResults from '../components/AuditResults';
import { loadAudit } from '../lib/supabase';

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border border-brand-500/20 border-t-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-[10px] font-mono uppercase tracking-widest">Loading audit…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center border border-surface-border p-12">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="font-mono font-bold text-xl text-slate-100 mb-2 uppercase tracking-wider">Audit not found</h1>
          <p className="text-slate-600 text-xs font-mono mb-6">This audit may have expired or the link is incorrect.</p>
          <Link to="/" className="btn-primary font-mono text-xs uppercase tracking-widest">Run your own audit</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-surface-border bg-surface/80" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <TrendingDown size={14} className="text-brand-400" />
            </div>
            <span className="font-mono font-bold text-slate-100 text-sm uppercase tracking-wider">SpendWise</span>
          </Link>
          <Link to="/" className="btn-ghost text-[10px] py-1.5 px-3 font-mono uppercase tracking-widest">
            Audit my stack →
          </Link>
        </div>
      </nav>

      {/* Shared notice */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-700 mb-6 border border-surface-border px-4 py-2.5">
          <span className="w-1.5 h-1.5 bg-slate-700" />
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