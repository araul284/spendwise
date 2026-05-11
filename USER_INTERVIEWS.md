# USER_INTERVIEWS.md

Three conversations conducted during the build week. Each was 10–15 minutes via DM (through college connections, LinkedIn network). Names used with permission or anonymised by request.

---

## Interview 1 — Aayansh B., 2nd Year CSE Student

**Date:** Day 2 of build week  
**Format:** 15-minute DM

### Notes

Aayansh is a 2nd Year Student. He uses GitHub Copilot (Individual), Claude Pro, and ChatGPT Plus. But these are all just for his personal use.

**Direct quotes:**

> "I pay for Claude and ChatGPT because they feel different. Claude is better for long documents, extensive research about topics. But on the other hand, ChatGPT is better for quick answers and searching the web. 

> "I use both almost every day simultaneously. They should get the acknowledgement for my college assignment submissions. But now that I think of maybe I could cut on some costs."

> "I use GitHub Copilot because it is so much easier to fix errors or check for bugs quickly on VS Code"

**Most surprising thing:** He was *right* that he uses both differently — the web browsing use case in ChatGPT was real, and Claude Pro doesn't have that built in. The audit engine's initial draft would have flagged him for chat tool overlap and told him to drop ChatGPT. But that was wrong for his actual workflow.

**What it changed about my design:** I added a caveat to the chat overlap rule: if the user has a `mixed` use case selected, I don't flag chat overlap as hard — the finding downgrades to `suboptimal` with a note explaining the trade-offs rather than a hard "drop one" recommendation. The reasoning in the finding card now names the specific capability difference (web browse, image generation) so users can self-assess whether it applies to them.

---

## Interview 2 — Bhoomi K., Solo founder, developer tool (pre-revenue, bootstrapped)

**Date:** Day 4 of build week  
**Format:** 15-minute DM

### Notes

Bhoomi is building a developer tool solo. She uses Cursor Pro, Anthropic API (direct), and Claude Pro, all simultaneously. Her Anthropic API bill runs around $180/month because her tool calls the API for its own product functionality, not just her personal use.

**Direct quotes:**

> "Wait, so you're telling me I'm paying for Claude Pro ($20) AND Anthropic API ($180) and they're different buckets? I really thought Pro credits counted toward the API."

> "I've been on Cursor Pro since it launched. I'd feel weird switching. But honestly I don't even think about the cost, it's $20, and well my Spotify costs more."

> "The thing I actually want is: tell me if my API spend is normal for what I'm building. Like am I being inefficient with my prompts or is this just what it costs?"

**Most surprising thing:** She thought Claude Pro subscription and Anthropic API were connected and that her Pro plan somehow gave her API credits. They are completely separate billing. She was double-paying for Claude access without even realising it. For her personal use (writing, research), Pro is sufficient; the API spend is legitimate for her product.

**What it changed about my design:** I added explicit rule to mark Anthropic API as overspending and revert to go through Credex credits to get discounted credits that could trim 15–30% off the API usage with no code changes required, meaning the same API endpoint, lower effective rate. 

## Interview 3 — Kartik S., CTO, 4-person B2B SaaS (Series A)

**Date:** Day 4 of build week  
**Format:** 15-minute DM

### Notes

Kartik manages tooling decisions for a 4-person team split between engineering with 2 people and product/growth by all of them. They pay for Cursor Business, GitHub Copilot Business, and ChatGPT Team.

**Direct quotes:**

> "I approved Cursor when the devs asked for it, then Copilot came up in a retro because someone said VS Code felt faster. I just said yes. No one did a comparison."

> "I genuinely didn't know they overlap. I thought Cursor was more like an IDE and Copilot was more like a plugin. Aren't they different things?"

> "The bill is like $900 a month now across everything. I look at it and think I should figure this out, but it's not a fire."

**Most surprising thing:** He didn't know GitHub Copilot and Cursor do the same thing. He thought Cursor was an IDE replacement (which it is) and Copilot was a separate AI layer on top (which it's not in practice, you only use one at a time). This is probably the most common misunderstanding SpendWise will surface.

**What it changed about my design:** I added the "IDE overlap" flag as the third rule in the audit engine. It's clearly the highest-value, most common finding. The finding card copy now explains *why* they overlap in plain terms ("Both provide inline completions and AI chat, you're paying for the same capability twice") rather than assuming the user understands.
