# LedgerLens — Agent Instructions

You are working on **LedgerLens**, a one-day hackathon project for the MAXIMOR Money Operations track.

## Source of Truth

Before making changes:

1. Read `docs/PRD.md` completely.
2. Read `docs/STATUS.md`.
3. Inspect the existing repository before assuming anything is missing.
4. Continue from the current implementation rather than rebuilding working features.

The PRD is the authoritative product specification.

If the code and PRD disagree, preserve working code long enough to understand the discrepancy, then make the smallest change necessary to bring the implementation back into alignment with the PRD.

---

# Primary Objective

Ship a reliable, polished hackathon demo of LedgerLens.

LedgerLens must answer:

* What changed?
* Why did it change?
* What is driving it?
* What evidence supports the explanation?

The product should also learn relevant business context across runs.

A complete working P0 demo is more important than production-scale architecture.

---

# Priority Rules

Work in this order:

1. **P0 requirements**
2. Reliability and demo readiness
3. PRISM observability
4. UX polish
5. P1 features
6. P2 features only if explicitly requested

Do not work on P1 or P2 functionality while a P0 requirement is broken or incomplete.

Do not add unnecessary infrastructure, abstractions, frameworks, or dependencies.

---

# Core Technical Principles

## Deterministic Finance First

Financial calculations must be performed in deterministic application code whenever reasonably possible.

Examples include:

* Period totals
* Absolute changes
* Percentage changes
* Category variance
* Customer/vendor variance
* Contribution percentages
* Materiality rankings

Do not ask an LLM to calculate values that application code can calculate reliably.

The LLM should interpret structured results, explain them, and answer grounded questions.

---

## Evidence Before Explanation

Every important financial claim should be traceable to supporting data.

Preserve source information such as:

* Source file
* Source row
* Transaction
* Counterparty
* Category
* Period
* Calculated contribution

Do not generate unsupported causal explanations.

If the data identifies **what** changed but not **why the business event happened**, label the explanation accordingly or request additional context.

Never invent transactions, customers, vendors, amounts, or business events.

---

## Business Memory

LedgerLens must be capable of learning relevant company-specific context across runs.

Examples:

* Vendor classifications
* Customer classifications
* Company terminology
* Recurring expenses
* User corrections
* Known business events

Use Supabase for persistent Business Memory unless the PRD or user explicitly changes this decision.

Previously stored information should be reused when relevant.

Do not repeatedly ask for information the system already knows.

User-confirmed facts must remain distinguishable from facts inferred from transaction data.

---

# AI Architecture

Prefer one primary LedgerLens financial-analysis agent supported by deterministic tools.

Do not introduce a multi-agent architecture unless explicitly requested.

Keep prompts and model interactions simple, inspectable, and easy to demo.

Structured data should normally flow:

Raw input
→ normalized data
→ deterministic calculations
→ evidence objects
→ relevant Business Memory
→ AI interpretation
→ user-facing explanation

---

# Framework and Stack

Default stack:

* Next.js
* React
* TypeScript
* Tailwind CSS
* OpenAI SDK
* Vercel AI SDK where useful
* Supabase
* PRISM
* Vercel deployment

Use existing project dependencies before adding alternatives.

Do not introduce LangChain, LangGraph, or another orchestration framework unless there is a concrete need and the user approves it.

---

# PRISM Tracing

This project uses PRISM for AI observability.

Once PRISM instrumentation exists:

* Do not remove or bypass it.
* Keep new model calls and relevant agent/tool entry points traced.
* Preserve session IDs so related calls can be grouped into trajectories.
* Keep PRISM credentials in environment variables.
* Never hard-code or commit PRISM secrets.

If adding or changing a model call, agent, tool, retriever, or AI entry point, verify whether PRISM tracing also needs to be updated.

A successful handshake is not equivalent to a real live application trace.

---

# Tavily

Tavily is optional and should only be added after the core financial-analysis workflow works.

Its role is **external context**, not primary financial evidence.

LedgerLens must clearly distinguish:

* Evidence from uploaded financial data
* Stored business context
* External information retrieved from the web

Do not present correlation from external information as proven causation.

---

# ElevenLabs

ElevenLabs is a polish feature.

Preferred use:

**Hear Executive Briefing**

Convert the final executive financial summary into spoken audio.

Do not prioritize voice functionality over core P0 requirements.

Do not turn LedgerLens into a voice agent unless explicitly requested.

---

# Data Handling

Do not commit:

* API keys
* Database credentials
* Tokens
* Secrets
* Private financial data

Use `.env.local` or equivalent untracked environment files for secrets.

Keep variable names only in `.env.example`.

Prefer synthetic hackathon datasets unless real data is explicitly provided and approved for use.

Do not send unnecessary financial rows, secrets, or personally identifiable information to external services.

---

# Coding Rules

* Inspect before editing.
* Prefer small, reviewable changes.
* Preserve working functionality.
* Do not perform unrelated refactors.
* Do not rename files or restructure the project without a clear reason.
* Avoid duplicate implementations.
* Reuse existing utilities and components where appropriate.
* Keep TypeScript types meaningful.
* Handle obvious errors and invalid input.
* Add loading and error states for demo-critical flows.
* Do not silently swallow errors.
* Keep the application runnable throughout development whenever practical.

---

# Validation

Do not declare a feature complete merely because files were edited.

For each meaningful milestone:

1. Run relevant tests if they exist.
2. Run type checking/linting where practical.
3. Run or exercise the affected application path.
4. Verify calculations against expected results.
5. Fix errors caused by your changes.
6. Report anything that could not be verified.

For financial calculations, manually sanity-check representative outputs.

---

# Git Discipline

Do not overwrite another agent's working implementation without first understanding it.

Before major work:

* Inspect `git status`
* Inspect recent relevant changes when useful

Do not commit secrets.

Do not force-push, rewrite history, or delete substantial working code unless explicitly instructed.

Keep changes easy for another coding agent to continue.

---

# STATUS.md Handoff

After every meaningful milestone, update `docs/STATUS.md`.

Maintain these sections:

## Working

Features that have been implemented and verified.

## In Progress

Work currently underway.

## Not Started

Remaining P0/P1 items.

## Known Issues

Current bugs, limitations, or setup blockers.

## Next Priority

The single highest-priority next task.

Do not mark something as **Working** unless it has been reasonably verified.

This file is essential because development may switch between Codex and Claude Code.

---

# When Taking Over From Another Agent

When beginning a new session:

1. Read `docs/PRD.md`.
2. Read `docs/STATUS.md`.
3. Inspect current code.
4. Inspect `git status`.
5. Determine what is already working.
6. Do not recreate existing working features.
7. Continue from the highest-priority incomplete P0 task.

Before making major edits, briefly state:

* What is already complete
* What remains
* What you are working on next

---

# Hackathon Demo Protection

The core demonstration must remain functional:

1. Upload multiple financial periods.
2. Parse and normalize the data.
3. Calculate meaningful variances.
4. Identify transaction-level drivers.
5. Generate concise evidence-backed AI explanations.
6. Allow follow-up questions.
7. Save business context or corrections.
8. Demonstrate a later run using previously learned context.
9. Show PRISM observing real agent activity.

Do not jeopardize this flow for optional features.

When time is limited, simplify rather than expand scope.
