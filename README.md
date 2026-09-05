# LedgerLens

**An AI financial investigator that tells you what changed, determines why it changed, and shows the transactions behind the answer.**

Built by **Shay Bouchles** for the MAXIMOR Money Operations track — prompt: *Explain the Change*.

Financial reports are good at telling you that numbers moved. Figuring out *why* still means opening transaction exports, grouping customers and vendors, hunting for outliers, and writing the narrative by hand. LedgerLens automates that investigation — and remembers how your business works, so every run is better informed than the last.

Instead of:

> Revenue increased 18%.

LedgerLens explains:

> Revenue increased 18%. Enterprise revenue grew, and three customers — Acme Corp, Globex, and Stark Industries — account for 64% of the increase. SMB revenue declined, partially offsetting the gain.

...and every number in that statement is traceable to a specific CSV row.

---

## The core idea: separate financial truth from language

The single most important design decision in LedgerLens is that **the LLM never does arithmetic and never invents a cause.**

```
Financial CSVs
  → normalized transactions (source file + row preserved)
  → deterministic analysis engine   ← all totals, variances, %, contributions, ranking
  → transaction-level evidence
  → Business Memory (Supabase)
  → LLM interpretation              ← qualitative wording only
  → validation gate
  → evidence-backed response
```

Every total, difference, percentage, contribution share, and materiality ranking is computed in TypeScript in [`lib/analysis.ts`](lib/analysis.ts). The model receives a compact, immutable **fact ledger** and is asked only to interpret it.

### The validation gate

Model output is rejected — not displayed — if it breaks any grounding rule ([`lib/ai-analysis.ts`](lib/ai-analysis.ts)):

- **No invented references.** Every cited change ID and evidence ID must exist in the fact ledger.
- **No numeric claims in prose.** Any digit, `$`, or `%` in model text is rejected; the UI renders figures from the deterministic layer instead.
- **No unsupported causal claims.** Phrases like *because*, *due to*, *driven by*, *reflecting*, *strategy*, *expansion* are rejected. A transaction change proves the financial driver, not the business reason.
- **No category sign-flips.** Revenue cannot be described as expense, or vice versa.

A rejected response is **repaired once** — the model is told the exact offending phrase and asked to rewrite — rather than the rule being relaxed. When the underlying business reason genuinely is not in the data, LedgerLens asks instead of guessing:

> I found higher transaction amounts for Amazon Web Services in Period B. What business activity accounts for that?

That answer becomes Business Memory.

---

## Business Memory

LedgerLens learns company-specific context across runs, persisted in Supabase.

The canonical demo — AWS is classified as *Software* by the accounting export, but this company treats it as *Infrastructure*:

| | Result |
|---|---|
| **Run 1** | `Software +$21,400` — AWS is 98% of the increase |
| **Teach** | "Amazon Web Services belongs under Infrastructure" → saved to Supabase |
| **Run 2** | `Infrastructure +$21,000` appears; Software drops out of the top five; the UI shows *"Memory applied: Amazon Web Services → Infrastructure"* |

The correction survives restarts and is applied automatically to later analyses. Memory can store vendor and customer classifications, recurring events, company terminology, accounting context, and user corrections.

LedgerLens keeps three tiers of knowledge distinct: **verified financial evidence**, **user-confirmed business context**, and **model inference**.

---

## Configurable AI provider

The LLM is interchangeable; the financial truth layer is not. Provider selection lives in exactly one file, [`lib/ai-provider.ts`](lib/ai-provider.ts).

| `AI_PROVIDER` | Model | Use |
|---|---|---|
| `groq` *(default)* | `openai/gpt-oss-120b` | Development — fast and free-tier friendly |
| `anthropic` | `claude-sonnet-5` | Final demo / recording |

Both providers run the identical prompt, structured-output schema, evidence IDs, validation pipeline, and Business Memory behavior. Switching providers changes the model and nothing else.

A missing key or unknown provider value **fails loudly with an actionable message**. LedgerLens never silently falls back between providers — a demo that quietly changes models is worse than one that fails visibly.

---

## Observability

Every `/api/interpret` call emits a live PRISM trace recording the active **provider and model**, the compact structured input, the validated output or a safe error, latency, attempt count, and a session ID — so the agent's real behavior is inspectable, not just a synthetic handshake.

---

## Getting started

**Requirements:** Node.js 20+, a Groq or Anthropic API key. Supabase and PRISM are optional but needed for Business Memory and tracing.

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev                  # http://localhost:3000
```

### Environment

```bash
AI_PROVIDER=groq             # or "anthropic" for the final demo
GROQ_API_KEY=                # required when AI_PROVIDER=groq
ANTHROPIC_API_KEY=           # required when AI_PROVIDER=anthropic

PRISMTRACE_API_KEY=
PRISMTRACE_PROJECT_ID=
PRISMTRACE_HOST=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Real credentials belong in `.env.local`, which is git-ignored. `.env.example` holds names and placeholders only. Neither API key is exposed to the browser — both are read server-side.

For Business Memory, run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL editor.

Provider selection is read at server start, so **restart after changing `AI_PROVIDER`**.

---

## Demo data

Four synthetic CSVs in [`public/demo-data/`](public/demo-data) — June 2026 (Period A) vs July 2026 (Period B):

| Upload slot | File |
|---|---|
| Period A summary | `period-a-summary.csv` |
| Period B summary | `period-b-summary.csv` |
| Period A transactions | `period-a-transactions.csv` |
| Period B transactions | `period-b-transactions.csv` |

62 transactions across 6 enterprise customers, 10 SMB customers, 5 software vendors, 3 contractors, and 3 marketing vendors. Transaction totals reconcile to the summary totals to the dollar, and the app also offers a **"Use demo data"** button and per-file download links as conveniences — the upload flow works independently.

**The story in the data:**

| Change | Amount | Drivers |
|---|---|---|
| Enterprise Revenue | +$42,300 (+42.3%) | Acme +$13,000, Globex +$8,000, Stark +$6,000 — **63.8% of the increase** |
| Software | +$21,400 | AWS +$21,000 (98.1%) — sets up the reclassification demo |
| Contractors | −$17,600 | BuildCo −$10,000, Halcyon −$4,600, Meridian −$3,000 |
| SMB Revenue | −$11,700 | Lakeside Books and Quartz Coffee churned; Bluebird Studio partly offsets |
| Marketing | +$9,000 | Northstar +$6,000, Google Ads +$2,200 |

Revenue $170,000 → $200,600 (**+18.0%**). All data is synthetic.

---

## Demo flow

1. Upload the four CSVs and click **Analyze changes**.
2. Read the executive summary and the ranked material changes.
3. Click any change to open the **evidence drawer** — contributors, dollar and percentage contribution, and the source transactions with file name and row number.
4. Click **Generate AI interpretation** for the grounded narrative.
5. Ask a follow-up question, answered from the analyzed dataset.
6. Teach it: *Amazon Web Services → Infrastructure*.
7. Re-analyze and watch Infrastructure replace Software.
8. Show the PRISM trace.

---

## Verification

```bash
npm test          # deterministic analysis, grounding, demo-data reconciliation, provider config
npm run build     # production build
npx tsx --env-file=.env.local scripts/verify-uploadable-demo.ts
```

The verify script prints the active provider and model, runs the full pipeline against the demo CSVs, and prints the validated report. **One run is one billed model request.**

The test suite covers the deterministic engine, the fact-ledger and validation rules, demo-data reconciliation and the intended story, memory application, and provider resolution — including a guard asserting the fact ledger and validation are byte-identical under both providers.

---

## Contributing

Changes go through a pull request — prelint reviews PRs, and work pushed straight to `master` is never seen by it.

```bash
git checkout -b my-change
npm test && npm run build
git push -u origin my-change   # then open the PR from the link git prints
```

---

## Project structure

```
app/api/interpret/   AI interpretation endpoint (+ PRISM tracing)
app/api/memory/      Business Memory read/write
components/          Single-page UI: upload, dashboard, evidence drawer, chat, teach
lib/analysis.ts      Deterministic engine — all financial math
lib/csv.ts           Parsing and normalization (preserves source file + row)
lib/ai-analysis.ts   Fact ledger, prompt, output schema, validation gate
lib/ai-provider.ts   Provider selection (the only provider-aware file)
lib/ai-report.ts     Generation + single repair retry
lib/business-memory.ts  Supabase persistence
lib/prism.ts         Trace emission
public/demo-data/    Four uploadable synthetic CSVs
```

---

## Status and known limits

- **Groq wording compliance is intermittent.** `gpt-oss-120b` sometimes reaches for banned causal phrasing; the repair retry usually recovers it, but a run can fail twice. Claude Sonnet 5 has passed on the first attempt in testing and is the recommended provider for the recording.
- **Groq free tier is 8,000 tokens/minute** and counts the output reservation. Leave ~40 seconds between interpretations. Anthropic has no such constraint here, but takes ~30s per interpretation versus ~9s.
- **Business Memory has no in-app reset.** To replay the two-run AWS demo from a clean state, delete the row from the Supabase `business_memory` table.
- Deployment has not been verified; the app runs locally.

See [`docs/STATUS.md`](docs/STATUS.md) for current detail and [`docs/PRD.md`](docs/PRD.md) for the full product spec.

---

## Non-goals

LedgerLens is an analysis and explanation system, not an autonomous accounting system. It does not move money, execute transactions, modify accounting records, or provide tax advice — and it does not present uncertain explanations as fact.

---

## Author

**Shay Bouchles** — [@shaythegay13](https://github.com/shaythegay13)
