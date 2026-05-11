# METRICS.md

## North Star Metric

**Credex consultations booked per week.**

Why this, not DAU or audits completed: SpendWise exists to generate qualified leads for Credex. An audit that doesn't produce a consultation is a nice UX experience but not a business outcome. Consultations booked is the metric that directly connects the free tool to Credex revenue. It's also hard to game — a consultation requires a real human to book time with a real salesperson.

DAU is a terrible metric here. Someone who used SpendWise three months ago and never came back might be a perfect Credex customer who's already been onboarded. DAU as a metric would push us toward "bring people back to re-audit" engagement loops that don't serve the actual goal.

---

## 3 Input Metrics That Drive the North Star

**1. Audit completion rate** (audits completed ÷ landing page visitors)

This measures whether the form is the right length and friction level. Target: 25%. Below 15% = form is too long or the tool feels untrustworthy. Above 35% = we might be attracting wrong-intent traffic that completes but never qualifies.

**2. Email capture rate** (emails captured ÷ audits completed)

This measures whether the audit results show enough value that people want the report. Target: 20–30%. Below 15% = results page isn't compelling enough (savings too small, design not trustworthy). Above 40% = possibly showing the gate too early and capturing low-intent emails.

**3. High-savings audit rate** (audits with >$300/mo savings ÷ total audits)

This measures whether we're attracting the right users — teams that are actually overspending, not solo devs on free tiers. Target: 30–40% of audits. Below 20% = traffic is too low-intent or too small-scale. Above 50% = excellent targeting, but check that audit logic isn't being too aggressive.

---

## What We'd Instrument First

1. **Audit completion funnel** — page load → first tool added → form submitted. Where do people drop? (Likely: "add a tool" is unclear, or seats input is confusing.)

2. **Per-tool add frequency** — which tools get added most? This tells us where real spend is concentrated and which audit rules fire most.

3. **Email gate conversion** — did the user scroll to the email form? Did they start filling it? Did they submit? Each micro-step matters.

4. **Share link clicks** — are people actually sharing? This is the viral loop. Zero share clicks = the results page isn't screenshot-worthy.

5. **Credex CTA clicks** — how many users with >$500/mo savings click "Book a Credex consultation"? This is the direct conversion funnel.

Implementation: Plausible Analytics (privacy-first, no cookie banner needed) for page-level events. Custom `track()` calls using Plausible's API for funnel events. No third-party data sharing.

---

## The Number That Triggers a Pivot

**If consultation booking rate from email leads drops below 5% after 100+ email captures**, we have a product-market fit problem in one of two places:

- The audit is attracting the wrong users (too small, already optimal, not buying AI credits)
- The Credex offer isn't matching what the audit surfaces (audit flags Cursor, Credex doesn't sell Cursor credits)

At that point: interview the non-converters. Are they not booking because the savings estimate feels wrong? Because they don't trust Credex? Because the friction to book is too high? Answers determine whether to fix the audit logic, the Credex product, or the CTA copy.

Do not pivot the tool itself until this data is in hand. "Not enough consultations" has multiple root causes — diagnosing before acting is the move.