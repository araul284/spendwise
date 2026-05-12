# REFLECTION.md

## 1. The hardest bug I hit this week

The most frustrating bug was the container overflow on mobile. My audit cards looked fine on desktop, but on mobile everything broke. Text like 'Cursor (Pro) is costing $100/mo — Running two AI coding assistants in parallel adds cost without proportional benefit.' (AI analysis) refused to wrap and pushed the card holder wider than the viewport. The whole page got horizontal scroll'

My first hypothesis: the `text-8xl` was too big for 320px screens. I was adding styles without any prefix which applied to all screen sizes without trigerring any modifications upon screen size changes. I then added responsive modifiers, like `sm: text-7xl` and `md:text-8xl`, to apply styles at specific screen widths. Styles applied when I viewed them on medium screen but the small screen view was still not responding to the changes.

Second hypothesis: Flexbox parent weren't allowing children to shrink due to `max-w-3xl`. I tried to throw `overflow-hidden` but that clipped content so the users couldn't see the full savings number. I added `min-w-0` to every flex child. Still no changes.

Third hypothesis: Long unbroken strings (like in the AI analysis or tool recommendation) had no wrap points. So I tried to add `break-words` and `break-all` on those texts but that still didn't fix the issue on small screens.

The fix: In the `index.css` file I had no width or `min-width: 0` set on html/body/div#root, and that's why they all overflowed. The fixes with `break-words` + `min-w-0` were correct. They just couldn't override the root overflow. The CSS fixed the root, so all the component fixes worked finally.

What made this hard was that while trying to debug I kept thinking that the issue was in `AuditResults.tsx`. Only when I opened the DevTools and ran `[...document.querySelectorAll('*')].filter(el => el.scrollWidth > document.documentElement.clientWidth)` did I found that the main problem was at the root level, and that the `html`, `body`, `div#root ` were ALL overflowing.

---

## 2. A decision I reversed mid-week

On Day 2, I built the audit engine to return a `recommendation: string` and a separate `action: 'downgrade' | 'switch' | 'drop' | 'keep'` field, planning to use the action enum to drive different UI treatments per finding card.

By Day 3, when I was building the results UI, I realised the action enum was redundant, the `status: 'overspending' | 'suboptimal' | 'optimal'` field already captured the urgency, and the specific action was always more clearly expressed in the recommendation string itself. Having both created a maintenance burden: any new audit rule needed to set both consistently, and they'd inevitably drift.

I removed the `action` field from `AuditFinding` entirely. The UI doesn't lose anything, the status badge conveys urgency, the recommendation string conveys the specific action, and the finding card renders cleanly without needing to switch on an action enum. The interface got simpler and the audit rules got easier to write.

What made me reverse it: seeing the actual component code for `FindingCard` and noticing I was checking `finding.action` in zero places, I'd been using `finding.status` for all conditional rendering. The action field was dead code from day one.

---

## 3. What I'd build in week 2

Three things, in priority order:

**First — a Vercel Edge Function proxy for the Anthropic API.** Currently the API key ships to the browser via `VITE_ANTHROPIC_API_KEY`. For a real launch this is unacceptable, anyone can extract it from network requests. A 30-line Edge Function at `/api/summarise` that accepts the audit context and returns the summary would fix this. The fallback flow already handles API errors gracefully, so this is a drop-in with no UX change.

**Second — a benchmark mode.** The third user interview surfaced a real need: "Is my API spend normal for what I'm building?" The current audit compares against plan pricing, not against industry benchmarks. I'd collect aggregate (anonymised) data from completed audits to show: "Your team spends $X per developer per month — teams your size average $Y." This requires enough audit volume to be meaningful, which is why it's week 2 not week 1.

**Third — embeddable widget.** A `<script>` tag that a blogger or newsletter writer could drop into a "what's your AI bill?" post. It renders a minimal version of the spend form inline, generates the audit, and redirects to the full result on spendwise.vercel.app. This is a distribution play — every embed is a new acquisition channel — and technically it's a constrained version of the existing form.

---

## 4. How I used AI tools

I used 3 AI tools, each for different jobs. I didn't trust any of them blindly (speaking from experience).

1. **Google AI Studio**

*What I used it for:* Generate the first iteration of the frontend design by reading the MVP to get an overall idea of how each components would be communicating with each other in my product. I fed it with design inspirations and it gave me the `App.tsx`, `main.tsx`, and `index.css` in ~5 minutes. Saved hours of writing CSS to get the vibe I was looking for.

*What I didn't trust it with:* Creating the fully functioning product at once. It produced error for importing the ressults to PDF and that was my call to put a halt into the usage and start working on refining other aspects.

2. **Claude (Sonnet)**

*What I used it for:* Frontend integration from AI Studio's JSX with my pages without compromising the architecture, SQL schema review, writing PROMPTS.md, researching for the entrepreneurial files, and ECONOMICS.md sanity-checking on conversion funnel math.

*What I didn't trust it with:* Audit engine business logic. The rules for whether a plan is "justified" for a given team size required actual pricing page research and genuine judgment calls. I wrote every rule in `auditEngine.ts` manually and then unit-tested them. AI-suggested rules would have been plausible-sounding but unverified.

3. **MetaAI**

*What I used it for:* Debugging errors. Any terminal error, deployment error, test errors, that I couldn't understand I used this to explain the cause and why it occured and how to solve that.

**One specific time the AI was wrong and I caught it:** When asking Claude to help draft the Supabase RLS policies, it suggested: `create policy "Public can read audits" on audits for select using (auth.role() = 'anon')`. This is wrong — `auth.role() = 'anon'` checks the JWT role claim, which is only set for authenticated users. For truly anonymous (unauthenticated) access, the correct pattern is `using (true)` with no condition, relying on anon key restrictions at the client level. If I'd shipped the AI's version, all shared audit URLs would have returned 403 errors for unauthenticated visitors. I caught it by testing the share URL in an incognito window before deploying.

---

## 5. Self-rating

**Discipline: 8/10**  
I committed code on all 7 days and wrote DEVLOG entries daily. I lost about 2 hours on Day 1 to the Tailwind v4/v3 confusion that better research would have prevented. Otherwise consistent.

**Code quality: 7/10**  
The audit engine is clean, well-typed, and fully tested. The React components are functional but have some rough edges — `AuditResults.tsx` is doing too much and should be split into sub-components. I'd refactor `FindingCard` into its own file in week 2.

**Design sense: 7/10**  
The Swiss-grid UI layout with editorial style design works and feels appropriate for a developer-facing tool. The savings hero number is visually strong. The results page is the one that gets screenshotted and I think it earns that. Lighthouse performane at 87, accessibility at 94, and best practices at 100 is good.

**Problem-solving: 8/10**  
The user interviews genuinely changed the product, the chat overlap rule and the Claude Pro / API confusion case came directly from conversations. I also made the right call on not using AI for the audit logic itself, which the assignment explicitly tests for.

**Entrepreneurial thinking: 7/10**  
The GTM is specific and the distribution channel (Credex existing customers) is genuinely unfair and non-obvious. The economics are honest, I showed that paid ads don't work at current LTV and why. I could have gone deeper on the benchmark mode opportunity surfaced in the interviews, but ran out of time to build it.