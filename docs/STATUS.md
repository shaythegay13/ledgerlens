## Working

- Initial Next.js LedgerLens scaffold and polished single-page demo UI are in place and production build passes.
- CSV parsing normalizes summary and transaction inputs while preserving source file and row evidence.
- Deterministic analysis ranks category variances, counterparty drivers, contribution percentages, and period totals; its focused test passes.
- Evidence drawer shows supporting transaction rows, dates, counterparty, source file, and source row.
- Grounded deterministic follow-up Q&A and a two-period synthetic demo dataset are available without credentials.
- Local browser Business Memory saves vendor classifications and applies them to the next analysis.
- Optional API boundaries and environment-variable configuration were added for OpenAI interpretation and Supabase Business Memory. No credentials are committed.
- Environment configuration is prepared: `.env.example` contains only the required OpenAI and Supabase placeholders, and `.env.local` is explicitly ignored.

## In Progress

- Connect the UI memory flow to the optional Supabase endpoint, then verify persistence across browsers/deployments.

## Not Started

- Live PRISM exporter/instrumentation and verification with the hackathon PRISM project credentials.
- Deployment verification.

## Known Issues

- Node.js LTS is installed, but PowerShell execution policy blocks the `npm.ps1` shim. Use `npm.cmd` in this shell, or open a new terminal after installation.
- OpenAI explanations require `OPENAI_API_KEY`; the deterministic explanation remains available otherwise.
- Supabase requires the supplied schema and environment variables; until configured, memory is intentionally browser-local for the demo.

## Next Priority

Wire and verify Supabase persistence before PRISM tracing.
