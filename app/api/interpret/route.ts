import { NextResponse } from "next/server";
import { createModelInput } from "../../../lib/ai-analysis";
import type { ModelInput } from "../../../lib/ai-analysis";
import { requireAnalysisModel } from "../../../lib/ai-provider";
import { generateLedgerLensReport } from "../../../lib/ai-report";
import { emitPrismTrace } from "../../../lib/prism";
import type { Analysis } from "../../../lib/types";

function isAnalysis(value: unknown): value is Analysis { return typeof value === "object" && value !== null && Array.isArray((value as Analysis).insights) && (value as Analysis).insights.length > 0; }
function errorResponse(error: unknown, providerLabel: string) { const statusCode = typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : undefined; if (statusCode === 429) return NextResponse.json({ error: `${providerLabel} is rate-limiting requests. Please try again in a moment.` }, { status: 429 }); return NextResponse.json({ error: `LedgerLens could not validate the ${providerLabel} analysis response. Please try again.` }, { status: 502 }); }
// Provider selection and its credential are resolved once per request and never guessed.
function resolveProvider() { try { return { ok: true as const, provider: requireAnalysisModel() }; } catch (error) { return { ok: false as const, message: error instanceof Error ? error.message : "The LedgerLens AI provider is not configured." }; } }

export async function POST(request: Request) {
  const configured = resolveProvider();
  if (!configured.ok) return NextResponse.json({ error: configured.message }, { status: 503 });
  const provider = configured.provider;
  const sessionId = request.headers.get("x-ledgerlens-session") ?? crypto.randomUUID();
  const startedAt = performance.now(); let input: ModelInput | undefined;
  try {
    const body = await request.json() as { analysis?: unknown };
    if (!isAnalysis(body.analysis)) return NextResponse.json({ error: "Analyze at least one material change before requesting an AI explanation." }, { status: 400 });
    input = createModelInput(body.analysis);
    const { report, attempts } = await generateLedgerLensReport(input, provider);
    try { await emitPrismTrace({ model: provider.modelId, provider: provider.id, input, output: report, latencyMs: Math.round(performance.now() - startedAt), sessionId, attempts }); } catch (traceError) { console.error("LedgerLens PRISM trace emission failed", traceError instanceof Error ? traceError.message : "Unknown PRISM error"); }
    return NextResponse.json({ report });
  } catch (error) {
    try { await emitPrismTrace({ model: provider.modelId, provider: provider.id, input, output: { status: "error" }, latencyMs: Math.round(performance.now() - startedAt), sessionId, error: error instanceof Error ? error.message : "Unknown analysis error" }); } catch (traceError) { console.error("LedgerLens PRISM trace emission failed", traceError instanceof Error ? traceError.message : "Unknown PRISM error"); }
    return errorResponse(error, provider.label);
  }
}
