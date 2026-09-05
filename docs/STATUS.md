## Working

- Initial Next.js LedgerLens scaffold and polished single-page demo UI are in place and production build passes.
- CSV parsing normalizes summary and transaction inputs while preserving source file and row evidence.
- Deterministic analysis ranks category variances, counterparty drivers, contribution percentages, and period totals; its focused test passes.
- Evidence drawer shows supporting transaction rows, dates, counterparty, source file, and source row.
- **Uploadable synthetic demo dataset** lives in `public/demo-data/` as four real CSVs (June 2026 vs July 2026): 30 and 32 transactions across 6 enterprise customers, 10 SMB customers, 5 software vendors, 3 contractors, and 3 marketing vendors. Transaction totals reconcile exactly to the summary CSVs, and `tests/demo-data.test.ts` asserts the reconciliation, the intended story, and the AWS reclassification.
- **The demo no longer depends on hard-coded TSX data.** Verified in a real headless browser (CDP): all four CSVs upload through the actual file inputs, "Analyze changes" produces the correct deterministic dashboard, the evidence drawer shows real source rows, and grounded follow-up Q&A answers from the analysis. The hero also offers a "Use demo data" button and four download links, which are conveniences on top of a working upload flow.
- **Business Memory verified live against Supabase through the UI.** Run 1 showed `Software +$21,400`; teaching `Amazon Web Services → Infrastructure` saved to Supabase; run 2 showed `Infrastructure +$21,000`, dropped Software out of the top five, and displayed "Memory applied: Amazon Web Services → Infrastructure." The demo row was deleted afterwards so the two-run demo starts un-reclassified.
- **The AI provider is configurable.** `AI_PROVIDER` selects the model: `groq` (development default, `openai/gpt-oss-120b`) or `anthropic` (final demo, `claude-sonnet-5`). All provider selection lives in `lib/ai-provider.ts`; nothing else in the codebase branches on provider. Both providers run the identical deterministic pipeline, prompt, structured-output schema, evidence IDs, validation, and Business Memory behavior — only the model changes. Missing or unknown configuration fails loudly with an actionable message; LedgerLens never silently falls back between providers.
- **Grounded AI interpretation is working on Groq through the provider abstraction.** Two consecutive live `POST /api/interpret` requests returned `200` with validated, evidence-backed reports containing no numeric or causal claims (8.5s on a first-attempt pass; 43s when the repair retry was used).
- PRISM live HTTP tracing is wired to the real `/api/interpret` call and records the **active provider and model**, compact structured input, validated output or safe error, latency, attempt count, and a LedgerLens session ID. Verified after the provider refactor: the trace emitted successfully on a live request and through `lib/prism.ts` directly.
- Environment configuration is prepared: `.env.example` documents `AI_PROVIDER`, both provider keys, PRISM, and Supabase as placeholders only, and `.env.local` is explicitly git-ignored. Neither API key is exposed to the browser (no `NEXT_PUBLIC_` prefix; both are read server-side only).

## In Progress

- **Anthropic path is configured and compiles, but has never made a live request** — no `ANTHROPIC_API_KEY` exists on this machine yet. Everything else is in place: `@ai-sdk/anthropic@4.0.49` is installed (same major line as `@ai-sdk/groq@4.0.37`, both pair with `ai@7`), the provider resolves `claude-sonnet-5`, and the provider's structured-output support was confirmed by inspection (native `output_format` under `auto` mode, with a JSON-tool fallback), so `Output.object` needs no extra configuration.
- Groq wording compliance is intermittent. `openai/gpt-oss-120b` still sometimes reaches for banned causal phrasing ("reflecting", "due to"); the single repair retry recovers it, but a run can still fail twice. Claude Sonnet 5 is expected to follow the constraint more reliably, which is a second reason to record the final demo on Anthropic.

## Not Started

- Deployment verification.

## Known Issues

- **Groq free tier is 8,000 tokens/minute and counts the `max_tokens` reservation.** The compact fact ledger was cut from 62 evidence rows / ~3,900 tokens to 28 rows / ~2,169 tokens so one request fits, but two requests inside the same minute (an interpretation plus a repair retry, or two demo runs back to back) can still hit the limit. Leave ~40 seconds between AI interpretations during the demo. Do not set `maxOutputTokens` on this reasoning model: 2,500 truncated the JSON mid-object.
- Node.js LTS is installed, but PowerShell execution policy blocks the `npm.ps1` shim, and `npm`/`npx` are not on PATH in this shell. Use the full path: `& "C:\Program Files\nodejs\npm.cmd"`.
- Business Memory has no in-app reset. To re-run the two-run demo from a clean state, delete the row from the Supabase `business_memory` table first.
- The selected provider requires its own key (`GROQ_API_KEY` or `ANTHROPIC_API_KEY`); missing keys, unknown `AI_PROVIDER` values, rate limits, provider failures, and invalid/ungrounded model output produce visible errors without exposing credentials.
- One PRISM emission failed with a transient network `fetch failed` during a 43-second request; the next request traced normally and a direct emission check passed. Watch for it, but it is not a code fault.

## Switching AI providers

Development (default) — keep `.env.local` as:

```
AI_PROVIDER=groq
GROQ_API_KEY=<your groq key>
```

Final demo / video / submission — set:

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=<your anthropic key>
```

Then restart the app (`npm run dev`), because provider selection is read from the server environment. Verify the switch without touching the UI:

```
npx tsx --env-file=.env.local scripts/verify-uploadable-demo.ts
```

It prints the active provider and model before calling it, then prints the validated report and `UPLOADABLE_DEMO_AI_OK`. One run is one billed Anthropic request.

## Next Priority

Return to P0 feature work. The AI provider abstraction is complete; the remaining P0 gap is a single live Anthropic smoke test once a key is available (one command, above).
