# PROMPTS.md

## AI Summary Prompt

Used in `src/lib/anthropicAPI.ts` → `generateAISummary()`.

### System context (passed as user message — no system prompt to keep token count low)

```
You are an AI spend advisor at SpendWise. Write a concise, personalized 80-100 word summary paragraph for an AI spend audit.

Audit context:
- Team size: {teamSize} people
- Primary use case: {useCase}
- Tools audited: {toolNames}
- Overspending on: {overspendingTools or "nothing"}
- Suboptimal plans: {suboptimalTools or "none"}
- Total monthly savings potential: ${totalMonthlySavings}
- Total annual savings potential: ${totalAnnualSavings}

Write in second person ("your team", "you're"). Be specific to their stack. Be direct and actionable. No fluff. Do not start with "Your" or use generic openers. Max 100 words.
```

### Design rationale

**Why no system prompt?** The Anthropic API charges per token on both input and output. Consolidating context into the user message saves ~20 tokens per call. At scale this matters.

**Why second person?** "You're paying $XX too much" is more actionable than "The team is paying...". Audit reports that feel personal get acted on.

**Why "Do not start with 'Your'"?** Without this constraint, the model defaults to "Your team is overspending on..." for every response — generic, indistinguishable. Constraining the opener forces more creative, specific leads.

**Why max 100 words?** The summary sits above the detailed findings table. It should be scannable in 15 seconds, not replace the findings. Longer summaries compete with the data.

### What I tried that didn't work

1. **Separate system + user messages** — The model responded with more templated language, less specific to the tool names. Merging into one user message produced more idiomatic, specific output.

2. **Asking for bullet points** — A bulleted summary competed visually with the findings table below it. Prose paragraph worked better for the layout.

3. **Asking for "one key insight"** — Model would pick the largest saving (obvious from the numbers) rather than synthesising cross-tool observations. The current prompt produces more interesting multi-tool synthesis.

4. **No word limit** — Model produced 180-word summaries. The UI only has room for ~80-100 words before the findings cards. Hard limit in the prompt solved this.

### Fallback template

When the API is unavailable, `generateFallbackSummary()` uses conditional logic to produce a reasonable paragraph:
- Optimal stack → acknowledge and encourage quarterly review
- Overspend only → name tools and headline saving
- Suboptimal only → name tools and note workflow mismatch
- Mixed → acknowledge both, name tools

The fallback is intentionally less polished than the API output — this creates a real incentive to configure the API key.