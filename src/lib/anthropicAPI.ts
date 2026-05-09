import type { AuditResult } from '../types';

export async function generateAISummary(audit: AuditResult): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    return generateFallbackSummary(audit);
  }

  const { findings, totalMonthlySavings, totalAnnualSavings, input } = audit;
  const overItems = findings.filter(f => f.status === 'overspending');
  const subItems  = findings.filter(f => f.status === 'suboptimal');

  // Build a detailed per-tool breakdown for the prompt
  const toolBreakdown = findings.map(f => {
    const savingsNote = f.monthlySavings > 0
      ? `saves $${f.monthlySavings.toFixed(0)}/mo`
      : 'no savings';
    return `- ${f.toolName} (${f.currentPlan}, $${f.currentSpend}/mo): ${f.status}. ${f.recommendation} (${savingsNote})`;
  }).join('\n');

  const prompt = `You are a sharp AI spend advisor at SpendWise. Write a concise, personalized 90-110 word summary paragraph for an AI spend audit.

Team context:
- Team size: ${input.teamSize} people
- Primary use case: ${input.useCase}

Per-tool findings:
${toolBreakdown}

- Total monthly savings potential: $${totalMonthlySavings.toFixed(0)}
- Total annual savings potential: $${totalAnnualSavings.toFixed(0)}

Rules:
- Write in second person ("your team", "you're")
- Reference specific tool names and dollar amounts from the findings above
- Explain WHY each issue is a problem (e.g. "Cursor Business adds SSO you don't need at 8 seats")
- Be direct, no filler phrases
- Do NOT start with "Your" or "The"
- Max 110 words, one paragraph only`;

  try {
    const response = await fetch('/api/anthropic-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) throw new Error('API call failed');
    const data = await response.json();
    return data.summary || generateFallbackSummary(audit);
  } catch {
    // Direct browser call with the dangerous-allow header
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 250,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('Direct API call failed');
      const data = await response.json();
      return data.content?.[0]?.text || generateFallbackSummary(audit);
    } catch {
      return generateFallbackSummary(audit);
    }
  }
}

export function generateFallbackSummary(audit: AuditResult): string {
  const { findings, totalMonthlySavings, totalAnnualSavings, input } = audit;
  const overspending = findings.filter(f => f.status === 'overspending');
  const suboptimal   = findings.filter(f => f.status === 'suboptimal');

  if (audit.isOptimal) {
    return `Solid stack hygiene across ${findings.length} tool${findings.length !== 1 ? 's' : ''} — no significant overspend for a ${input.teamSize}-person ${input.useCase} team. Keep an eye on API costs as usage scales, and revisit quarterly as vendor pricing evolves.`;
  }

  const parts: string[] = [];

  // Per-tool overspend callouts
  for (const f of overspending) {
    parts.push(`${f.toolName} (${f.currentPlan}) is costing $${f.currentSpend}/mo — ${f.reason.split('.')[0]}.`);
  }

  // Per-tool suboptimal callouts
  for (const f of suboptimal) {
    parts.push(`${f.toolName} is suboptimal for your ${input.useCase} workflow — ${f.reason.split('.')[0]}.`);
  }

  // Savings summary
  parts.push(
    `Acting on ${overspending.length + suboptimal.length} recommendation${overspending.length + suboptimal.length !== 1 ? 's' : ''} saves $${totalMonthlySavings.toFixed(0)}/mo ($${totalAnnualSavings.toFixed(0)}/yr) with no capability loss.`
  );

  return parts.join(' ');
}