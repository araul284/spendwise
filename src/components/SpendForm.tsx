import React, { useState, useEffect } from 'react';
import { Trash2, ChevronRight, Sparkles, Users, Calculator } from 'lucide-react';
import type { AuditInput, ToolEntry, UseCase, ToolId } from '../types';
import { TOOLS } from '../data/tools';

const USE_CASES: { value: UseCase; label: string; desc: string }[] = [
  { value: 'coding',   label: 'Coding',   desc: 'Building software, code review' },
  { value: 'writing',  label: 'Writing',  desc: 'Content, docs, copy' },
  { value: 'data',     label: 'Data',     desc: 'Analysis, research, SQL' },
  { value: 'research', label: 'Research', desc: 'Synthesis, summarisation' },
  { value: 'mixed',    label: 'Mixed',    desc: 'Multiple workflows' },
];

const TEAM_SIZE_PRESETS = [
  { label: 'Solo', value: 1 },
  { label: '5',    value: 5 },
  { label: '10',   value: 10 },
  { label: '25',   value: 25 },
  { label: '50+',  value: 50 },
];

const STORAGE_KEY = 'sw_form_state';

interface SpendFormProps {
  onSubmit: (input: AuditInput) => void;
  isLoading?: boolean;
}

/* ── Section label: mono uppercase with ruled line ── */
function SectionLabel({ number, icon: Icon, label }: { number: string; icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">{number}.</span>
      <Icon size={11} className="text-slate-600" />
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">{label}</span>
      <div className="flex-1 h-px bg-slate-800 ml-1" />
    </div>
  );
}

/* ── Single tool row with editorial serif-italic plan selector ── */
function ToolRow({
  entry, index, onChange, onRemove,
}: {
  entry: ToolEntry; index: number;
  onChange: (e: ToolEntry) => void; onRemove: () => void;
}) {
  const tool = TOOLS.find(t => t.id === entry.toolId)!;
  const plans = tool.plans;
  const currentPlan = plans.find(p => p.id === entry.plan);
  const estimatedCost =
    entry.monthlySpend > 0 ? entry.monthlySpend
    : currentPlan ? (currentPlan.flatPrice ?? currentPlan.pricePerSeat * entry.seats) : 0;

  return (
    <div
      className="border-b border-slate-800/80 py-4 animate-fade-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both', opacity: 0 }}
    >
      <div className="flex items-start gap-4">
        {/* Tool icon */}
        <div
          className="w-9 h-9 flex items-center justify-center text-base flex-shrink-0 mt-0.5"
          style={{ background: `${tool.color}12`, color: tool.color, border: `1px solid ${tool.color}25` }}
        >
          {tool.logo}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400">{tool.name}</span>
              {estimatedCost > 0 && (
                <span className="font-mono text-[9px] text-brand-500 tracking-widest">${estimatedCost}/mo</span>
              )}
            </div>
            <button onClick={onRemove} className="text-slate-700 hover:text-red-400 transition-colors p-1" aria-label="Remove tool">
              <Trash2 size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {/* Plan — serif italic (editorial touch) */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block font-mono text-[8px] uppercase tracking-[0.18em] text-slate-600 mb-1.5">Plan</label>
              <select
                className="w-full bg-transparent border-b border-slate-700 pb-1 font-serif italic text-base text-slate-200 focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
                value={entry.plan}
                onChange={e => onChange({ ...entry, plan: e.target.value })}
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 not-italic font-sans text-sm">
                    {p.name}{p.pricePerSeat > 0 ? ` — $${p.pricePerSeat}/seat` : p.flatPrice ? ` — $${p.flatPrice}/mo` : ' — Custom'}
                  </option>
                ))}
              </select>
            </div>

            {/* Seats */}
            {!['anthropic_api', 'openai_api'].includes(entry.toolId) && (
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-[0.18em] text-slate-600 mb-1.5">Seats</label>
                <div className="relative">
                  <input
                    type="number" min={1} max={9999}
                    className="w-full bg-transparent border-b border-slate-700 pb-1 font-mono text-base text-slate-200 focus:outline-none focus:border-brand-500 transition-colors pr-8"
                    value={entry.seats}
                    onChange={e => onChange({ ...entry, seats: Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                  <span className="absolute right-0 top-0 font-mono text-[7px] uppercase tracking-widest text-slate-700">ppl</span>
                </div>
              </div>
            )}

            {/* Monthly spend override */}
            <div>
              <label className="block font-mono text-[8px] uppercase tracking-[0.18em] text-slate-600 mb-1.5">
                {['anthropic_api', 'openai_api'].includes(entry.toolId) ? 'Monthly $' : 'Override $'}
              </label>
              <div className="relative">
                <span className="absolute left-0 top-0 font-mono text-[9px] text-slate-600">$</span>
                <input
                  type="number" min={0}
                  placeholder={estimatedCost > 0 ? `~${estimatedCost}` : '0'}
                  className="w-full bg-transparent border-b border-slate-700 pb-1 font-mono text-base text-slate-200 focus:outline-none focus:border-brand-500 transition-colors pl-3"
                  value={entry.monthlySpend || ''}
                  onChange={e => onChange({ ...entry, monthlySpend: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SpendForm — main export
══════════════════════════════════════════════════ */
export default function SpendForm({ onSubmit, isLoading }: SpendFormProps) {
  const [teamSize, setTeamSize] = useState(5);
  const [useCase, setUseCase] = useState<UseCase>('mixed');
  const [tools, setTools] = useState<ToolEntry[]>([]);

  /* Persistence */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { teamSize: ts, useCase: uc, tools: tl } = JSON.parse(saved);
        if (ts) setTeamSize(ts);
        if (uc) setUseCase(uc);
        if (tl) setTools(tl);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ teamSize, useCase, tools }));
  }, [teamSize, useCase, tools]);

  const availableTools = TOOLS.filter(t => !tools.some(te => te.toolId === t.id));

  function addTool(toolId: ToolId) {
    const tool = TOOLS.find(t => t.id === toolId)!;
    const defaultPlan = tool.plans[tool.plans.length > 1 ? 1 : 0];
    setTools(prev => [...prev, { toolId, plan: defaultPlan.id, seats: teamSize, monthlySpend: 0 }]);
  }

  function updateTool(index: number, entry: ToolEntry) {
    setTools(prev => prev.map((t, i) => (i === index ? entry : t)));
  }

  function removeTool(index: number) {
    setTools(prev => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tools.length === 0) return;
    onSubmit({ tools, teamSize, useCase });
  }

  const totalEstimated = tools.reduce((sum, t) => {
    const tool = TOOLS.find(td => td.id === t.toolId);
    const plan = tool?.plans.find(p => p.id === t.plan);
    if (!plan) return sum;
    return sum + (t.monthlySpend || plan.flatPrice || plan.pricePerSeat * t.seats);
  }, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── 01. Context ─────────────────────────────── */}
      <div className="border border-slate-800 bg-slate-950/50 p-6">
        <SectionLabel number="01" icon={Users} label="Context" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Team size with quick-select presets */}
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-2.5">Team Size</label>
            {/* Quick-select pill buttons */}
            <div className="flex gap-1 mb-2">
              {TEAM_SIZE_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setTeamSize(preset.value)}
                  className={`flex-1 py-1.5 font-mono text-[9px] uppercase tracking-widest border transition-all duration-150 ${
                    teamSize === preset.value
                      ? 'bg-brand-500 border-brand-500 text-black font-bold'
                      : 'border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-300 bg-transparent'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {/* Manual input */}
            <div className="relative">
              <input
                type="number" min={1} max={9999}
                className="w-full bg-transparent border border-slate-800 focus:border-brand-500 p-2 font-mono text-sm text-slate-200 focus:outline-none transition-colors pr-14"
                value={teamSize}
                onChange={e => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[8px] uppercase tracking-widest text-slate-700">Seats</span>
            </div>
          </div>

          {/* Use case */}
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-2.5">Use Case</label>
            {/* Invisible spacer to align with preset row above */}
            <div className="mb-2 h-[30px]" />
            <select
              className="w-full bg-transparent border border-slate-800 focus:border-brand-500 p-2 font-mono text-sm text-slate-200 focus:outline-none transition-colors cursor-pointer h-[38px]"
              value={useCase}
              onChange={e => setUseCase(e.target.value as UseCase)}
            >
              {USE_CASES.map(uc => (
                <option key={uc.value} value={uc.value} className="bg-slate-900">
                  {uc.label} — {uc.desc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 02. Tool Stack ──────────────────────────── */}
      <div className="border border-slate-800 bg-slate-950/50 p-6">

        <div className="flex items-start justify-between">
          <SectionLabel number="02" icon={Calculator} label="Tool Stack" />
          {totalEstimated > 0 && (
            <div className="text-right flex-shrink-0 -mt-1 ml-4">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-600 mb-0.5">Est. Total/Mo</div>
              <div className="font-mono text-brand-400 font-bold text-xl">${totalEstimated.toFixed(0)}</div>
            </div>
          )}
        </div>

        {/* Tool toggle grid — click to add, click ✕ to remove */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-6">
          {TOOLS.map(tool => {
            const isAdded = tools.some(te => te.toolId === tool.id);
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => isAdded ? removeTool(tools.findIndex(te => te.toolId === tool.id)) : addTool(tool.id as ToolId)}
                className={`p-2.5 border font-mono text-[9px] uppercase tracking-[0.08em] transition-all duration-150 text-left flex items-center gap-1.5 ${
                  isAdded
                    ? 'border-brand-500/50 text-brand-400 bg-brand-500/8'
                    : 'border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-300 bg-transparent'
                }`}
              >
                <span className="text-sm" style={{ color: isAdded ? undefined : tool.color }}>{tool.logo}</span>
                <span className="truncate">{tool.name}</span>
                {isAdded && <span className="ml-auto text-[8px] text-brand-500">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Tool detail rows */}
        {tools.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-800">
            <p className="font-serif italic text-slate-600 text-lg">No tools selected. Use the grid above to start.</p>
          </div>
        ) : (
          <div>
            {tools.map((entry, i) => (
              <ToolRow
                key={`${entry.toolId}-${i}`}
                entry={entry}
                index={i}
                onChange={e => updateTool(i, e)}
                onRemove={() => removeTool(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Submit ──────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="submit"
          disabled={tools.length === 0 || isLoading}
          className="w-full bg-brand-500 text-black font-mono font-bold uppercase tracking-[0.2em] p-4 text-sm flex items-center justify-center gap-3 hover:bg-brand-400 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Decrypting Spend...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Run Audit Engine
              <ChevronRight size={16} />
            </>
          )}
        </button>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-700">
          Free · No account required · Results in seconds
        </p>
      </div>
    </form>
  );
}