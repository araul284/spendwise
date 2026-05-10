import { useState } from 'react';
import { TrendingDown, Zap, Shield } from 'lucide-react';
import type { AuditInput, AuditResult } from '../types';
import SpendForm from '../components/SpendForm';
import AuditResults from '../components/AuditResults';
import { runAudit } from '../lib/AuditEngine';
import { saveAudit } from '../lib/supabase';
import { generateAISummary } from '../lib/anthropicAPI';

type AppState = 'form' | 'loading' | 'results';

const FEATURES = [
  { icon: TrendingDown, label: 'Instant audit',  desc: 'Spot overspend in seconds' },
  { icon: Shield,      label: 'No sign-up',      desc: 'Zero friction, instant value' },
  { icon: Zap,         label: 'AI-powered',      desc: 'Claude analyses your stack' },
];

const LOADING_STEPS = [
  'Checking plan fit',
  'Detecting tool overlap',
  'Calculating savings',
  'Generating summary',
];

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('form');
  const [audit, setAudit]       = useState<AuditResult | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');

  async function handleAuditSubmit(input: AuditInput) {
    setAppState('loading');
    const result  = runAudit(input);
    const summary = await generateAISummary(result);
    result.aiSummary = summary;
    saveAudit(result).catch(() => {});
    setShareUrl(`${window.location.origin}/audit/${result.id}`);
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
    <div className="min-h-screen bg-slate-100 text-black flex flex-col">

      {/* ── Nav ───────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-black bg-slate-100/90"
        style={{ backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TrendingDown size={22} className="text-black" />
            <span className="font-mono font-bold text-[20px] text-black uppercase tracking-tighter">SpendWise.</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-black hidden sm:inline ml-1">AI spend auditor</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest bg-black border text-slate-100 px-2 py-0.5 rounded">v1.0.0</span>
          </div>
        </div>
      </nav>

      {/* ── Main ──────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-10 pb-24 w-full">

        {/* FORM STATE */}
        {appState === 'form' && (
          <>
            {/* Hero — brutalist typography on dark canvas */}
            <div className="mb-14 animate-fade-up">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-brand-400 mb-8 border border-brand-500/25 bg-brand-500/8 px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Free AI spend audit
              </div>

              {/* Editorial headline — mix of display weights + serif italic */}
              <h1 className="font-sans font-bold uppercase tracking-tighter leading-[0.88] text-6xl sm:text-7xl text-black mb-6">
                Stop<br />
                <span className="font-serif italic font-light normal-case"
                  style={{
                    WebkitTextStroke: '1px rgba(0, 0, 0, 0.8)',
                    color: 'transparent'
                  }}
                  >
                  overpaying
                </span>
                <br />
                For AI.
              </h1>

              <p className="font-mono opacity-80 text-sm leading-relaxed max-w-md mb-8">
                Most startups pay 20–40% more than they need to on AI subscriptions.
                Get an instant audit of your stack — free, no login required.
              </p>

              <div className="flex flex-wrap gap-6 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-700">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={12} className="text-black" />
                    <span className="opacity-100">{label}</span>
                    <span className="opacity-90">— {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <SpendForm onSubmit={handleAuditSubmit} />
          </>
        )}

        {/* LOADING STATE */}
        {appState === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10 animate-fade-in">

            {/* Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border border-slate-800" />
              <div
                className="absolute inset-0 border border-transparent border-t-brand-500"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingDown size={20} className="text-brand-500" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="font-mono font-bold uppercase tracking-[0.15em] text-black text-lg mb-1">
                Decrypting Spend
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black">
                Running audit rules across your stack…
              </p>
            </div>

            {/* Step list */}
            <div className="space-y-2 w-72 border border-slate-800 p-5">
              <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-slate-700 mb-3 border-b border-slate-800 pb-2">
                Audit Engine v1.2.0-beta
              </div>
              {LOADING_STEPS.map((step, i) => (
                <div
                  key={step}
                  className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-600"
                  style={{ animation: `fadeIn 0.4s ease ${i * 400}ms forwards`, opacity: 0 }}
                >
                  <div className="w-1.5 h-1.5 bg-brand-500/60 shrink-0" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS STATE */}
        {appState === 'results' && audit && (
          <AuditResults
            audit={audit}
            onStartOver={handleStartOver}
            shareUrl={shareUrl}
          />
        )}
      </main>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-6 mt-auto">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
            <a href="https://github.com/araul284/spendwise.git" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
              SpendWise
            </a> © 2026 / Precision Financial Audit
          </span>
          <div className="flex items-center gap-6 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
            <a href="/audit/demo" className="hover:text-slate-900 transition-colors">Sample audit</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        .text-stroke-dark  { -webkit-text-stroke: 1px rgba(100,116,139,0.4); color: transparent; }
      `}</style>
    </div>
  );
}