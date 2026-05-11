# TESTS.md

## Running Tests

```bash
npm test          # Run all tests once (CI mode)
npm run test:watch  # Watch mode for development
```

All tests are in `tests/auditEngine.test.ts` and target the pure audit engine logic — no mocking, no network, no browser required.

---

## Test Coverage

### File: `tests/auditEngine.test.ts`

| # | Test name | What it covers | Expected outcome |
|---|---|---|---|
| 1 | `flags Cursor Business as overspending for a 2-person team` | Plan fit rule: Business plan ($40/seat) is overkill for <5 users; should downgrade to Pro ($20/seat) | `status: 'overspending'`, `monthlySavings: 40` |
| 2 | `marks Cursor Pro as optimal for a 5-person coding team` | Negative test: a well-matched plan should not be flagged | `status: 'optimal'`, `monthlySavings: 0` |
| 3 | `detects IDE overlap when Cursor and GitHub Copilot are both paid` | IDE overlap detection: two paid coding assistants = redundancy | At least 1 finding with `status: 'overspending'`, positive total savings |
| 4 | `flags Claude Team as overspending when only 2 seats are purchased` | Claude Team has a 5-seat minimum; 2-seat purchase should downgrade to Pro | `status: 'overspending'`, `monthlySavings: 20` |
| 5 | `marks Anthropic API as overspending and credexApplicable at $600/mo` | API spend > $500/mo triggers Credex recommendation and overspending flag | `status: 'overspending'`, `credexApplicable: true`, positive savings |
| 6 | `returns zero savings for a well-optimised single-tool stack` | Full optimal path: Cursor Pro for a 10-person coding team — no flags | `totalMonthlySavings: 0`, `isOptimal: true` |
| 7 | `calculates annual savings as exactly 12× monthly savings` | Math invariant: annual always = monthly × 12, no rounding drift | `totalAnnualSavings === totalMonthlySavings * 12` |
| 8 | `flags GitHub Copilot Enterprise as overspending for 2 seats` | Copilot Enterprise ($39/seat) for small teams should downgrade to Business ($19/seat) | `status: 'overspending'`, `monthlySavings: 40` |

---

## What is not tested (and why)

- **UI components** — Skipped for MVP speed. Would add with React Testing Library in week 2.
- **Supabase integration** — Requires live credentials; integration-tested manually. Would mock with `vi.mock` in week 2.
- **Anthropic API** — Falls back gracefully; fallback path tested manually. API itself tested by Anthropic.
- **Email capture** — Form validation tested manually; backend write tested via Supabase dashboard.