import type { AuditResult } from '../types';

export async function generateAISummary(audit: AuditResult): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    return generateFallbackSummary(audit);
  }

  const { findings, totalMonthlySavings, totalAnnualSavings, input } = audit;
  const overItems = findings.filter(f => f.status === 'overspending').map(f => f.toolName);
  const subItems = findings.filter(f => f.status === 'suboptimal').map(f => f.toolName);

  const prompt = `You are an AI spend advisor at SpendWise. Write a concise, personalized 80-100 word summary paragraph for an AI spend audit.

Audit context:
- Team size: ${input.teamSize} people
- Primary use case: ${input.useCase}
- Tools audited: ${findings.map(f => f.toolName).join(', ')}
- Overspending on: ${overItems.length > 0 ? overItems.join(', ') : 'nothing'}
- Suboptimal plans: ${subItems.length > 0 ? subItems.join(', ') : 'none'}
- Total monthly savings potential: $${totalMonthlySavings.toFixed(0)}
- Total annual savings potential: $${totalAnnualSavings.toFixed(0)}

Write in second person ("your team", "you're"). Be specific to their stack. Be direct and actionable. No fluff. Do not start with "Your" or use generic openers. Max 100 words.`;

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
    // Direct API call as fallback (CORS may block in browser — that's expected)
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
          max_tokens: 200,
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
  const { findings, totalMonthlySavings, input } = audit;
  const overspending = findings.filter(f => f.status === 'overspending');
  const suboptimal = findings.filter(f => f.status === 'suboptimal');

  if (audit.isOptimal) {
    return `Impressive stack hygiene — your ${input.teamSize}-person team is running a lean AI toolset for ${input.useCase} work. No significant overspend detected across ${findings.length} tool${findings.length !== 1 ? 's' : ''}. Keep an eye on API costs as usage grows, and revisit quarterly as vendor pricing evolves.`;
  }

  if (overspending.length > 0 && suboptimal.length > 0) {
    return `Your ${input.teamSize}-person team is leaving $${totalMonthlySavings.toFixed(0)}/month on the table. The biggest wins are on ${overspending.map(f => f.toolName).join(' and ')} — plan mismatches for your team size. ${suboptimal.map(f => f.toolName).join(' and ')} could also be better matched to your ${input.useCase} workflow. Acting on these recommendations saves $${(totalMonthlySavings * 12).toFixed(0)} annually.`;
  }

  if (overspending.length > 0) {
    return `Clear overspend detected: ${overspending.map(f => f.toolName).join(' and ')} are on plans that don't fit your ${input.teamSize}-person team's scale. Rightsizing these tools saves $${totalMonthlySavings.toFixed(0)}/month — $${(totalMonthlySavings * 12).toFixed(0)}/year — without losing any capability your team actively uses.`;
  }

  return `Mostly healthy stack, but ${suboptimal.map(f => f.toolName).join(' and ')} could be better optimised for your ${input.useCase} focus. With some plan adjustments, your ${input.teamSize}-person team could save $${totalMonthlySavings.toFixed(0)}/month and reduce cognitive overhead from overlapping tools.`;
}