import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, Sparkles, Info, Users, Calculator } from 'lucide-react';
import type { AuditInput, ToolEntry, UseCase, ToolId } from '../types';
import { TOOLS } from '../data/tools';

const USE_CASES: { value: UseCase; label: string; desc: string }[] = [
  { value: 'coding', label: 'Coding', desc: 'Building software, code review' },
  { value: 'writing', label: 'Writing', desc: 'Content, docs, copy' },
  { value: 'data', label: 'Data', desc: 'Analysis, research, SQL' },
  { value: 'research', label: 'Research', desc: 'Synthesis, summarisation' },
  { value: 'mixed', label: 'Mixed', desc: 'Multiple workflows' },
];

const TEAM_PRESETS = [1, 5, 10, 25, 50] as const;

const STORAGE_KEY = 'sw_form_state';

interface SpendFormProps {
  onSubmit: (input: AuditInput) => void;
  isLoading?: boolean;
}

function ToolRow({
  entry,
  index,
  onChange,
  onRemove,
}: {
  entry: ToolEntry;
  index: number;
  onChange: (e: ToolEntry) => void;
  onRemove: () => void;
}) {
  const tool = TOOLS.find(t => t.id === entry.toolId)!;
  const plans = tool.plans;
  const currentPlan = plans.find(p => p.id === entry.plan);
  const estimatedCost =
    entry.monthlySpend > 0
      ? entry.monthlySpend
      : currentPlan
      ? (currentPlan.flatPrice ?? currentPlan.pricePerSeat * entry.seats)
      : 0;

  return (
    <div
      className="border border-surface-border bg-surface-muted animate-fade-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both', opacity: 0 }}
    >
      {/* Tool header strip */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border"
        style={{ background: `${tool.color}0a` }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base" style={{ color: tool.color }}>{tool.logo}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{tool.name}</span>
        </div>
        <button
          onClick={onRemove}
          className="text-slate-700 hover:text-red-400 transition-colors p-1"
          aria-label="Remove tool"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Plan */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[9px] uppercase font-mono tracking-widest text-slate-600 mb-1.5">Plan</label>
          <select
            className="select-field text-sm font-mono"
            value={entry.plan}
            onChange={e => onChange({ ...entry, plan: e.target.value })}
          >
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}{p.pricePerSeat > 0 ? ` — $${p.pricePerSeat}/seat` : p.flatPrice ? ` — $${p.flatPrice}/mo` : ' — Custom'}
              </option>
            ))}
          </select>
        </div>

        {/* Seats */}
        {!['anthropic_api', 'openai_api'].includes(entry.toolId) && (
          <div>
            <label className="block text-[9px] uppercase font-mono tracking-widest text-slate-600 mb-1.5">Seats</label>
            <input
              type="number"
              min={1}
              max={9999}
              className="input-field text-sm font-mono"
              value={entry.seats}
              onChange={e => onChange({ ...entry, seats: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>
        )}

        {/* Monthly spend override */}
        <div>
          <label className="block text-[9px] uppercase font-mono tracking-widest text-slate-600 mb-1.5">
            {['anthropic_api', 'openai_api'].includes(entry.toolId) ? 'Monthly spend ($)' : 'Override ($)'}
          </label>
          <input
            type="number"
            min={0}
            placeholder={estimatedCost > 0 ? `~$${estimatedCost}` : '0'}
            className="input-field text-sm font-mono"
            value={entry.monthlySpend || ''}
            onChange={e => onChange({ ...entry, monthlySpend: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      {estimatedCost > 0 && (
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-mono">
            <Info size={11} />
            <span>Est. cost</span>
          </div>
          <span className="font-mono text-brand-400 text-sm font-bold">${estimatedCost}/mo</span>
        </div>
      )}
    </div>
  );
}

export default function SpendForm({ onSubmit, isLoading }: SpendFormProps) {
  const [teamSize, setTeamSize] = useState(5);
  const [useCase, setUseCase] = useState<UseCase>('mixed');
  const [tools, setTools] = useState<ToolEntry[]>([]);
  const [addingTool, setAddingTool] = useState(false);

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
    setTools(prev => [
      ...prev,
      { toolId, plan: defaultPlan.id, seats: teamSize, monthlySpend: 0 },
    ]);
    setAddingTool(false);
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
    const cost = t.monthlySpend || plan.flatPrice || plan.pricePerSeat * t.seats;
    return sum + cost;
  }, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Team context */}
      <div className="border border-surface-border bg-surface-muted/40">
        {/* Section label — brutalist mono header */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border">
          <Users size={12} className="text-slate-600" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">01. Context</span>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Team size with quick-select presets */}
          <div>
            <label className="block text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-2">Team Size</label>
            {/* Quick-select preset buttons */}
            <div className="flex gap-1 mb-2">
              {TEAM_PRESETS.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTeamSize(size)}
                  className="flex-1 py-1.5 text-[9px] font-mono border transition-all duration-150"
                  style={{
                    borderColor: teamSize === size ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.08)',
                    background: teamSize === size ? 'rgba(16,185,129,0.12)' : 'transparent',
                    color: teamSize === size ? '#10b981' : '#64748b',
                  }}
                >
                  {size === 1 ? 'Solo' : size === 50 ? '50+' : size}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={9999}
                className="input-field font-mono pr-14"
                value={teamSize}
                onChange={e => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-600 uppercase">Seats</span>
            </div>
          </div>

          {/* Use case */}
          <div>
            <label className="block text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-2">Primary Use Case</label>
            {/* Empty row to align with preset buttons */}
            <div className="mb-2 h-[30px]" />
            <select
              className="select-field font-mono"
              value={useCase}
              onChange={e => setUseCase(e.target.value as UseCase)}
            >
              {USE_CASES.map(uc => (
                <option key={uc.value} value={uc.value}>
                  {uc.label} — {uc.desc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tool list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Calculator size={12} className="text-slate-600" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">02. Tool Stack</span>
          {totalEstimated > 0 && (
            <span className="ml-auto font-mono text-brand-400 font-bold text-sm">${totalEstimated.toFixed(0)}/mo total</span>
          )}
        </div>

        {tools.length === 0 && !addingTool && (
          <div className="border border-dashed border-surface-border p-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600 italic">
              No tools selected. Add the AI tools your team pays for.
            </p>
          </div>
        )}

        {tools.map((entry, i) => (
          <ToolRow
            key={`${entry.toolId}-${i}`}
            entry={entry}
            index={i}
            onChange={e => updateTool(i, e)}
            onRemove={() => removeTool(i)}
          />
        ))}

        {/* Add tool */}
        {!addingTool ? (
          <button
            type="button"
            onClick={() => setAddingTool(true)}
            disabled={availableTools.length === 0}
            className="btn-ghost w-full justify-center py-3 border-dashed disabled:opacity-40 disabled:cursor-not-allowed font-mono text-xs uppercase tracking-widest"
          >
            <Plus size={14} />
            Add a tool {availableTools.length > 0 ? `(${availableTools.length} available)` : '(all added)'}
          </button>
        ) : (
          <div className="border border-surface-border bg-surface-muted/40 p-4">
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-3">Select a tool to add</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {availableTools.map(tool => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => addTool(tool.id)}
                  className="flex items-center gap-2 px-3 py-2 border border-surface-border hover:border-brand-500/40 text-slate-400 hover:text-slate-100 transition-all duration-150 text-left"
                  style={{ background: 'transparent' }}
                >
                  <span style={{ color: tool.color }}>{tool.logo}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider">{tool.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAddingTool(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-400 text-[10px] font-mono uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="submit"
          disabled={tools.length === 0 || isLoading}
          className="btn-primary w-full sm:w-auto sm:px-10 py-4 text-sm justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none font-mono uppercase tracking-widest"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Decrypting spend…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Run Audit Engine
              <ChevronRight size={16} />
            </>
          )}
        </button>
        <p className="text-[10px] font-mono text-slate-700 uppercase tracking-widest">Free · No account required · Results in seconds</p>
      </div>
    </form>
  );
}