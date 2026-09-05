# LedgerLens — Claude Code Instructions

You are working on **LedgerLens**, a one-day hackathon project for the MAXIMOR Money Operations track.

## Read First

Before changing code:

1. Read `docs/PRD.md` completely.
2. Read `docs/STATUS.md`.
3. Inspect the repository and existing implementation.
4. Run `git status`.
5. Continue from existing work rather than recreating functionality.

Another coding agent, including Codex, may have worked on this repository before you.

Treat the repository, PRD, and STATUS file as the shared source of truth.

---

# Mission

Ship the strongest reliable P0 LedgerLens hackathon demo possible.

LedgerLens should:

* Compare financial periods
* Identify material variances
* Drill into transaction-level drivers
* Explain what changed and why
* Show evidence
* Answer grounded follow-up questions
* Learn relevant business context across runs

A complete working demo is more valuable than sophisticated architecture.

---

# Work Priority

Always prioritize:

1. Broken P0 functionality
2. Missing P0 functionality
3. Demo reliability
4. PRISM observability
5. UX polish
6. P1
7. P2 only when explicitly requested

Do not spend time polishing optional functionality while core analysis, memory, evidence, or tracing is incomplete.

---

# Financial Analysis Rules

Perform objective financial calculations in code, not through the LLM.

This includes:

* Totals
* Absolute differences
* Percentage changes
* Category variances
* Customer/vendor variances
* Contribution calculations
* Materiality ranking

The model should interpret calculated results rather than invent or recalculate them.

Manually sanity-check representative calculations.

---

# Evidence Rules

Every important financial conclusion should have evidence behind it.

Preserve references to:

* Source file
* Source row
* Transaction
* Date
* Amount
* Category
* Counterparty
* Period

Never invent financial facts.

Do not claim a causal business reason unless the available evidence or stored business context supports it.

If data only supports correlation, say so.

If information is missing, acknowledge the gap or ask for context.

---

# Business Memory

Use Supabase for persistent LedgerLens Business Memory unless instructed otherwise.

Useful memory includes:

* Vendor classifications
* Customer classifications
* Company terminology
* User corrections
* Recurring financial events
* Known business events
* Accounting context

Retrieve relevant memory before generating an analysis.

Persist useful user-confirmed corrections.

Do not ask repeatedly for information already stored.

Preserve the distinction between:

* Verified financial evidence
* User-confirmed business context
* Model inference

---

# AI Design

Prefer one primary financial-analysis agent plus deterministic tools.

Do not create unnecessary agent hierarchies.

Preferred flow:

Financial files
→ normalized data
→ deterministic analysis
→ transaction evidence
→ Business Memory
→ LLM interpretation
→ evidence-backed response

Keep prompts inspectable and responses structured where useful.

---

# Approved Default Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* OpenAI SDK
* Vercel AI SDK where appropriate
* Supabase
* PRISM
* Vercel

Avoid introducing additional orchestration frameworks unless a concrete requirement justifies them.

---

# PRISM

LedgerLens uses PRISM for AI observability.

Once PRISM has been installed:

* Never remove its instrumentation.
* Trace newly added model/agent entry points where required.
* Preserve conversation/session IDs.
* Never commit PRISM credentials.
* Use environment variables.
* Verify real application traces after meaningful AI changes when practical.

PRISM should observe actual LedgerLens behavior, not merely a synthetic handshake.

If a later PRISM setup brief adds more specific standing instructions, preserve those instructions here.

---

# Prelint

The PRD is intended to be reviewable against the implementation.

Avoid product drift.

When implementation decisions intentionally differ from `docs/PRD.md`, document the reason rather than silently changing product behavior.

---

# Tavily

Tavily is an optional external-context tool.

Do not use Tavily as a substitute for uploaded financial evidence.

Clearly distinguish external research from LedgerLens calculations and internal Business Memory.

Do not infer causation solely because an external event coincides with a financial change.

Add Tavily only after the core P0 flow works.

---

# ElevenLabs

ElevenLabs is optional polish.

Preferred feature:

**Hear Executive Briefing**

Use it to read the final executive summary aloud.

Do not prioritize voice functionality over P0.

---

# Secrets and Data

Never commit:

* API keys
* Tokens
* Supabase credentials
* PRISM credentials
* External service secrets
* Sensitive user data

Real secrets belong in `.env.local` or equivalent untracked configuration.

`.env.example` contains variable names/placeholders only.

Prefer synthetic demo data unless real data is explicitly provided and approved.

Minimize financial data sent to third-party services.

---

# Coding Behavior

* Inspect existing code before editing.
* Keep changes small and reviewable.
* Avoid unrelated refactoring.
* Preserve working functionality.
* Reuse existing code where reasonable.
* Avoid duplicate utilities and components.
* Keep TypeScript types clear.
* Add reasonable error handling.
* Do not silently suppress failures.
* Keep demo-critical flows runnable.
* Do not introduce unnecessary complexity for hypothetical scale.

If there are multiple acceptable implementations, choose the simplest one that reliably satisfies the PRD.

---

# Verification

Before claiming completion:

1. Run relevant tests if available.
2. Run type checking/linting where practical.
3. Exercise the affected user flow.
4. Verify representative calculations.
5. Fix errors introduced by your changes.
6. Explicitly state anything you could not verify.

File edits alone do not prove functionality.

---

# Shared-Agent Handoff

Codex may take over this repository after you, or you may be taking over from Codex.

Do not assume prior work is wrong because it was produced by another model.

Understand existing implementation before replacing it.

After every meaningful milestone, update `docs/STATUS.md` with:

## Working

## In Progress

## Not Started

## Known Issues

## Next Priority

Only mark verified functionality as Working.

Keep STATUS concise and current.

---

# Starting a New Claude Code Session

At the beginning of a session:

1. Read PRD.
2. Read STATUS.
3. Inspect the relevant files.
4. Inspect git status.
5. Determine current P0 completion.
6. Identify the highest-priority unfinished task.

Then briefly report:

**Already working:**
...

**Remaining P0:**
...

**Next task:**
...

Then proceed with implementation unless a genuinely blocking decision requires user input.

---

# Protect the Demo

The final LedgerLens demo should reliably show:

1. Financial data upload
2. Parsing/normalization
3. Period comparison
4. Material variance detection
5. Transaction-level driver analysis
6. Evidence-backed AI explanation
7. Follow-up financial Q&A
8. Business Memory
9. A second run that uses previously learned context
10. Real PRISM traces

Never sacrifice this sequence to implement an optional sponsor feature.

When time becomes constrained, reduce scope and stabilize the demo.

## PRISM tracing (do not remove)

This project sends traces to PRISM. Env vars: `PRISMTRACE_API_KEY`,
`PRISMTRACE_PROJECT_ID`, `PRISMTRACE_HOST`.

Tracing is currently wired at: `app/api/interpret/route.ts` and `lib/prism.ts`

**Standing rule.** Whenever you add or change an agent, chain, graph, tool,
retriever, or any entry point that calls a model, wire it to PRISM before you
finish. Unwired code is invisible in the dashboard. If you are unsure whether
something is covered, assume it is not and wire it.
