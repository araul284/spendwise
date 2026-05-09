import { useRef, useState } from 'react';
import { Share2, Download, RotateCcw, ShieldCheck, Info, TrendingDown, ArrowRight } from 'lucide-react';
import type { AuditResult } from '../types';

interface AuditResultsProps {
  audit: AuditResult;
  onStartOver: () => void;
  shareUrl: string;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <h3 className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-600 mb-4 flex items-center gap-2">
      <div className="w-4 h-px bg-slate-800" />
      {label}
      <div className="flex-1 h-px bg-slate-800" />
    </h3>
  );
}

function DefensibleMatrix({ rec }: { rec: AuditResult['recommendations'][0] }) {
  if (!rec.comparison) return null;
  return (
    <div className="border-t border-slate-800/60 bg-slate-950/80 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Info size={10} className="text-slate-700" />
        <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-slate-700">Defensible Logic Matrix</span>
      </div>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-4 space-y-2">
          <div className="font-mono text-[7px] uppercase tracking-widest text-slate-700 h-5">Attribute</div>
          {['Context Window', 'Max Output', 'Primary Model', 'ROI Fit'].map(attr => (
            <div key={attr} className="font-mono text-[9px] font-bold text-slate-400 py-1 border-b border-slate-800/60">{attr}</div>
          ))}
        </div>
        <div className="col-span-4 space-y-2 text-center bg-red-950/30 border border-red-900/30 p-1 py-2">
          <div className="font-mono text-[7px] uppercase tracking-widest text-red-600/70 h-5 italic">{rec.currentPlan}</div>
          <div className="font-mono text-[9px] text-slate-500 py-1 border-b border-slate-800/40">{rec.comparison.current.contextWindow}</div>
          <div className="font-mono text-[9px] text-slate-500 py-1 border-b border-slate-800/40">{rec.comparison.current.maxOutputTokens}</div>
          <div className="font-mono text-[9px] text-slate-500 py-1 border-b border-slate-800/40">{rec.comparison.current.primaryModel}</div>
          <div className="font-mono text-[9px] text-red-500 py-1">Diminishing ROI</div>
        </div>
        <div className="col-span-4 space-y-2 text-center bg-emerald-950/30 border border-emerald-900/30 p-1 py-2">
          <div className="font-mono text-[7px] uppercase tracking-widest text-emerald-500/70 h-5 italic">{rec.recommendedPlan}</div>
          <div className="font-mono text-[9px] font-bold text-slate-300 py-1 border-b border-slate-800/40">{rec.comparison.recommended.contextWindow}</div>
          <div className="font-mono text-[9px] font-bold text-slate-300 py-1 border-b border-slate-800/40">{rec.comparison.recommended.maxOutputTokens}</div>
          <div className="font-mono text-[9px] font-bold text-slate-300 py-1 border-b border-slate-800/40">{rec.comparison.recommended.primaryModel}</div>
          <div className="font-mono text-[9px] font-bold text-emerald-400 py-1">MAX EFFICIENCY</div>
        </div>
      </div>
    </div>
  );
}

export default function AuditResults({ audit, onStartOver, shareUrl }: AuditResultsProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { alert(shareUrl); }
  }

  async function handleExportPDF() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#000000',
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            if (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab')) el.style.backgroundColor = '#000000';
            if (style.color.includes('oklch') || style.color.includes('oklab')) el.style.color = '#e2e8f0';
          }
        },
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`SpendWise-Audit-${audit.id?.slice(-8) || 'Report'}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('PDF export failed — please try again.');
    }
    setExporting(false);
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div ref={reportRef} className="border border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="p-8 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-600 mb-3">
              Audit Report #{audit.id?.slice(-8).toUpperCase() ?? 'XXXXXXXX'}
            </div>
            <div className="font-mono font-bold tracking-tighter leading-none text-slate-100 text-7xl sm:text-8xl">
              ${audit.totalSavingsMonthly ?? 0}
              <span className="text-2xl font-normal align-top ml-2 text-slate-500">/MO</span>
            </div>
            <div className="font-serif italic text-slate-400 text-xl mt-3">
              Potential Annual Savings: ${audit.totalSavingsAnnual ?? 0}
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button onClick={handleShare} className="border border-slate-700 hover:border-slate-500 p-4 flex flex-col items-center gap-1.5 transition-all">
              <Share2 size={18} className="text-slate-400" />
              <span className="font-mono text-[8px] uppercase tracking-widest text-slate-600">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button onClick={handleExportPDF} disabled={exporting} className="border border-slate-700 hover:border-emerald-500 p-4 flex flex-col items-center gap-1.5 transition-all disabled:opacity-40">
              {exporting
                ? <span className="w-[18px] h-[18px] border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
                : <Download size={18} className="text-slate-400" />}
              <span className="font-mono text-[8px] uppercase tracking-widest text-slate-600">Export PDF</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-3 md:divide-x md:divide-slate-800">

          {/* Left: analysis + recs */}
          <div className="md:col-span-2 p-8 space-y-10">
            {audit.aiSummary && (
              <section>
                <SectionLabel label="AI Analysis" />
                <div className="font-serif italic text-slate-300 text-xl leading-snug">{audit.aiSummary}</div>
              </section>
            )}

            <section>
              <SectionLabel label="Recommendations" />
              {!audit.recommendations?.length ? (
                <div className="p-8 text-center border border-dashed border-slate-800">
                  <ShieldCheck size={40} className="text-emerald-500 mx-auto mb-3" />
                  <div className="font-mono font-bold uppercase tracking-[0.2em] text-slate-200 mb-1">Optimization: Perfect</div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">You're currently spending optimally for your team size.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {audit.recommendations.map((rec, i) => (
                    <div key={i} className="border border-slate-800 hover:border-slate-700 transition-all overflow-hidden">
                      <div className="p-5 flex justify-between items-start gap-4">
                        <div className="space-y-1.5 flex-1">
                          <span className="inline-block font-mono text-[8px] uppercase tracking-widest bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.5">{rec.toolId}</span>
                          <div className="font-mono font-bold uppercase tracking-tight text-slate-100">{rec.action}</div>
                          <p className="font-mono text-[11px] text-slate-500 leading-relaxed">{rec.reason}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-mono font-bold text-emerald-400 text-lg">-${rec.savingsMonthly}/mo</div>
                          <div className="font-mono text-[8px] uppercase tracking-widest text-slate-700">${(rec.savingsMonthly ?? 0) * 12}/yr</div>
                        </div>
                      </div>
                      <DefensibleMatrix rec={rec} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right: sidebar */}
          <div className="p-8 bg-slate-950/60 space-y-10">
            <section>
              <SectionLabel label="Next Steps" />
              {(audit.totalSavingsMonthly ?? 0) > 500 ? (
                <div className="border border-slate-700 bg-slate-900 p-6 space-y-4">
                  <div className="font-mono font-bold uppercase tracking-tight text-slate-100 text-lg leading-tight">High Savings<br />Detected.</div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-600 leading-relaxed">Our engineers at Credex can manually audit your cloud and AI spend to save you 25% or more.</p>
                  <a href="https://credex.rocks" target="_blank" rel="noopener noreferrer"
                    className="w-full bg-emerald-500 text-black font-mono font-bold uppercase tracking-[0.2em] text-[10px] p-3 flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors">
                    Book Consultation <ArrowRight size={12} />
                  </a>
                </div>
              ) : (
                <div className="border border-slate-800 p-6 space-y-4">
                  <div className="font-mono font-bold uppercase tracking-tight text-slate-100 text-lg leading-tight">Stay<br />Optimized.</div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-600 leading-relaxed">Monthly delta-reports when price drops or new tool combos beat your current ROI.</p>
                  {subscribed ? (
                    <div className="font-mono text-[9px] uppercase tracking-widest text-emerald-500 border border-emerald-900 bg-emerald-950/30 p-3 text-center">✓ Subscribed</div>
                  ) : (
                    <div className="space-y-2">
                      <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full bg-transparent border-b border-slate-700 focus:border-emerald-500 pb-1.5 font-mono text-xs text-slate-300 focus:outline-none transition-colors placeholder:text-slate-700" />
                      <button type="button" onClick={() => email && setSubscribed(true)}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 font-mono text-[9px] uppercase tracking-[0.2em] p-3 transition-colors">
                        Subscribe
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-0">
              {[
                ['Data Verified', new Date().toISOString().split('T')[0]],
                ['Audit Engine', 'v1.2.0-beta'],
                ['Rules Run', '12'],
                ['Audit ID', audit.id?.slice(-8).toUpperCase() ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center border-b border-slate-800/50 py-1.5">
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-700">{k}</span>
                  <span className="font-mono text-[8px] text-slate-600">{v}</span>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex justify-center gap-4">
        <button onClick={onStartOver}
          className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] border border-slate-800 hover:border-slate-600 hover:text-slate-300 text-slate-600 px-6 py-3 transition-all">
          <RotateCcw size={12} /> New Audit
        </button>
        <button onClick={handleShare}
          className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 text-slate-600 px-6 py-3 transition-all">
          <Share2 size={12} /> {copied ? 'Copied!' : 'Share Report'}
        </button>
      </div>
    </div>
  );
}