import { useState } from 'react';
import { Zap, Shield, TrendingDown } from 'lucide-react';
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

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('form');
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');

  async function handleAuditSubmit(input: AuditInput) {
    setAppState('loading');

    // Run audit engine (synchronous)
    const result = runAudit(input);

    // Generate AI summary (async, with fallback)
    const summary = await generateAISummary(result);
    result.aiSummary = summary;

    // Save to backend (fire-and-forget)
    saveAudit(result).catch(() => {});

    // Generate share URL
    const url = `${window.location.origin}/audit/${result.id}`;
    setShareUrl(url);
    setAudit(result);
    setAppState('results');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleStartOver() {
    setAppState('form');
    setAudit(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-surface-border bg-surface/80" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span className="text-brand-400 text-sm">⬡</span>
            </div>
            <span className="font-display font-700 text-slate-100 text-base">SpendWise</span>
            <span className="text-xs text-slate-600 font-mono hidden sm:inline">AI spend auditor</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1.5 px-3">
              Powered by Credex
            </a>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-10 pb-20">
        {appState === 'form' && (
          <>
            {/* Hero */}
            <div className="text-center mb-12 animate-fade-up">
              <div className="inline-flex items-center gap-2 text-brand-400 text-xs font-mono mb-5 bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Free AI spend audit
              </div>

              <h1 className="font-display font-800 text-4xl sm:text-5xl text-slate-100 mb-4 leading-tight">
                Stop overpaying for<br />
                <span className="text-gradient">AI tools</span>
              </h1>

              <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                Most startups pay 20–40% more than they need to on AI subscriptions.
                Get an instant audit of your stack — free, no login required.
              </p>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={15} className="text-brand-500" />
                    <span><span className="text-slate-300">{label}</span> — {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <SpendForm onSubmit={handleAuditSubmit} />
          </>
        )}

        {appState === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <div className="absolute inset-3 rounded-full flex items-center justify-center text-2xl">⬡</div>
            </div>
            <div className="text-center">
              <h2 className="font-display font-700 text-slate-100 text-xl mb-2">Analysing your stack</h2>
              <p className="text-slate-500 text-sm">Running 12 audit rules across your tools…</p>
            </div>
            <div className="space-y-2 w-64">
              {['Checking plan fit', 'Detecting tool overlap', 'Calculating savings', 'Generating summary'].map((step, i) => (
                <div
                  key={step}
                  className="flex items-center gap-3 text-xs text-slate-500"
                  style={{ animation: `fadeIn 0.4s ease ${i * 400}ms forwards`, opacity: 0 }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500/60 flex-shrink-0" />
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
      <footer className="border-t border-surface-border py-8 mt-auto">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-brand-500">⬡</span>
            <span>SpendWise by <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400 transition-colors">Credex</a></span>
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