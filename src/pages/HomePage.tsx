import { useState } from 'react';
import { TrendingDown, Shield, Zap } from 'lucide-react';
import type { AuditInput, AuditResult } from '../types';
import SpendForm from '../components/SpendForm';
import AuditResults from '../components/AuditResults';
import { runAudit } from '../lib/AuditEngine';
import { saveAudit } from '../lib/supabase';
import { generateAISummary } from '../lib/anthropicAPI';

type AppState = 'form' | 'loading' | 'results';

const FEATURES = [
  { icon: TrendingDown, label: 'Instant audit', desc: 'Spot overspend in seconds' },
  { icon: Shield, label: 'No sign-up', desc: 'Zero friction, instant value' },
  { icon: Zap, label: 'AI-powered', desc: 'Claude analyses your stack' },
];

const LOADING_STEPS = ['Checking plan fit', 'Detecting tool overlap', 'Calculating savings', 'Generating summary'];

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('form');
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');

  async function handleAuditSubmit(input: AuditInput) {
    setAppState('loading');

    const result = runAudit(input);
    const summary = await generateAISummary(result);
    result.aiSummary = summary;

    saveAudit(result).catch(() => {});

    const url = `${window.location.origin}/audit/${result.id}`;
    setShareUrl(url);
    setAudit(result);
    setAppState('results');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleStartOver() {
    setAppState('form');
    setAudit(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-surface-border bg-surface/80" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setAppState('form'); setAudit(null); }}>
            <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <TrendingDown size={14} className="text-brand-400" />
            </div>
            <span className="font-mono font-bold text-slate-100 text-sm uppercase tracking-wider">SpendWise</span>
            <span className="text-[9px] text-slate-700 font-mono hidden sm:inline uppercase tracking-widest border border-surface-border px-1.5 py-0.5">v1.0</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1.5 px-3 font-mono uppercase tracking-widest">
              Powered by Credex
            </a>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-10 pb-20">
        {appState === 'form' && (
          <>
            {/* Hero — brutalist editorial typography on dark bg */}
            <div className="mb-12 animate-fade-up">
              <div className="inline-flex items-center gap-2 text-brand-400 text-[9px] font-mono mb-6 border border-brand-500/20 px-3 py-1.5 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Free AI spend audit
              </div>

              {/* Big editorial headline — tight tracking, mixed weight */}
              <h1 className="font-mono font-bold text-5xl sm:text-7xl tracking-tighter leading-[0.88] uppercase mb-4">
                Stop<br />
                overpaying<br />
                <span className="font-serif italic normal-case font-light text-slate-400 tracking-normal" style={{ fontSize: '0.85em' }}>
                  for AI tools.
                </span>
              </h1>

              <p className="text-slate-500 text-base font-mono max-w-xl leading-relaxed mb-8">
                Most startups pay 20–40% more than they need to on AI subscriptions.
                Get an instant rule-based audit — free, no login required.
              </p>

              <div className="flex flex-wrap gap-6 text-xs text-slate-600 font-mono">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={13} className="text-brand-600" />
                    <span className="uppercase tracking-wider"><span className="text-slate-400">{label}</span> / {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <SpendForm onSubmit={handleAuditSubmit} />
          </>
        )}

        {appState === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in">
            {/* Loader */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border border-brand-500/20" />
              <div
                className="absolute inset-0 border border-transparent border-t-brand-500"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingDown size={20} className="text-brand-500" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="font-mono font-bold text-slate-100 text-lg uppercase tracking-wider mb-2">Decrypting Spend</h2>
              <p className="text-slate-600 text-xs font-mono uppercase tracking-widest">Running audit engine…</p>
            </div>
            {/* Steps */}
            <div className="border border-surface-border w-64">
              {LOADING_STEPS.map((step, i) => (
                <div
                  key={step}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-border last:border-b-0 text-[10px] font-mono uppercase tracking-widest text-slate-600"
                  style={{ animation: `fadeIn 0.4s ease ${i * 400}ms forwards`, opacity: 0 }}
                >
                  <div className="w-1.5 h-1.5 bg-brand-500/60 flex-shrink-0" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {appState === 'results' && audit && (
          <AuditResults
            audit={audit}
            onStartOver={handleStartOver}
            shareUrl={shareUrl}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border py-6 mt-auto">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] font-mono uppercase tracking-widest text-slate-700">
          <div className="flex items-center gap-2">
            <TrendingDown size={12} className="text-brand-600" />
            <span>SpendWise / Precision Financial Audit / Built for <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-400 transition-colors">Credex</a></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/audit/demo" className="hover:text-slate-400 transition-colors">Sample audit</a>
            <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">About Credex</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}