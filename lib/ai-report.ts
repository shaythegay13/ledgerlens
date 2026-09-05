import { generateText, Output } from "ai";
import type { LanguageModel } from "ai";
import { aiAnalysisSchema, LEDGERLENS_SYSTEM_PROMPT, validateAiAnalysis } from "./ai-analysis";
import type { AiAnalysisReport, ModelInput } from "./ai-analysis";
import { requireAnalysisModel } from "./ai-provider";
import type { ProviderConfig } from "./ai-provider";

// The ban list is repeated as the last thing the model reads, because that is where
// wording constraints are followed most reliably. It is provider-independent.
const BANNED = "because, due to, driven by, drove, caused by, reflect, reflecting, resulting from, as a result, thanks to, owing to, attributable, stemming from, fueled by, boosted by, investment, customer mix, strategy, expansion";
const basePrompt = (input: ModelInput) => `Return only the requested structured analysis for this immutable deterministic fact ledger:\n${JSON.stringify(input)}\n\nHARD CONSTRAINT: the response is rejected automatically if any text field contains a digit, a currency symbol, a percent sign, or any of these substrings (case-insensitive): ${BANNED}. Write plain descriptive sentences that state what the ledger shows and name its counterparties.`;

export type LedgerLensUsage = { inputTokens: number; outputTokens: number };

/**
 * Runs the configured provider against the deterministic fact ledger and returns a report that
 * has passed the same validation pipeline regardless of which model produced it. The validator is
 * the product guarantee, so a rejected response is repaired once with the specific reason rather
 * than relaxed or shown to the user.
 */
export async function generateLedgerLensReport(input: ModelInput, provider: ProviderConfig & { model: LanguageModel } = requireAnalysisModel()): Promise<{ report: AiAnalysisReport; attempts: number; provider: ProviderConfig; usage: LedgerLensUsage }> {
  let rejection = "";
  // Usage accumulates across a repair attempt so PRISM reports what the request actually cost.
  const usage: LedgerLensUsage = { inputTokens: 0, outputTokens: 0 };
  for (let attempt = 1; attempt <= 2; attempt++) {
    const prompt = rejection ? `${basePrompt(input)}\n\nYour previous response was rejected. ${rejection} Rewrite every text field without that word or any synonym of it. Keep the same grounded content and the same evidence IDs. State only what the ledger shows, never why it happened, and never write a digit, currency symbol, or percent sign.` : basePrompt(input);
    // Sampling stays at the provider default on purpose: a capped output truncated Groq's
    // reasoning JSON, temperature 0 would make a rejected wording repeat verbatim on the repair
    // attempt, and Claude Sonnet 5 rejects temperature/top_p outright.
    const result = await generateText({ model: provider.model, system: LEDGERLENS_SYSTEM_PROMPT, prompt, output: Output.object({ schema: aiAnalysisSchema }) });
    usage.inputTokens += result.usage?.inputTokens ?? 0; usage.outputTokens += result.usage?.outputTokens ?? 0;
    try { return { report: validateAiAnalysis(result.output, input), attempts: attempt, provider, usage }; }
    catch (error) { rejection = error instanceof Error ? error.message : "The response failed validation."; }
  }
  throw new Error(`${provider.label} output failed LedgerLens validation twice. Last rejection: ${rejection}`);
}
