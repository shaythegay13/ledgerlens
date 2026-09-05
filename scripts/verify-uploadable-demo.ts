import { readFileSync } from "node:fs";
import { analyze } from "../lib/analysis";
import { parseSummary, parseTransactions } from "../lib/csv";
import { createModelInput } from "../lib/ai-analysis";
import { generateLedgerLensReport } from "../lib/ai-report";
import { requireAnalysisModel } from "../lib/ai-provider";

const read = (name: string) => readFileSync(`public/demo-data/${name}`, "utf8");
async function main() {
  const analysis = analyze(parseSummary(read("period-a-summary.csv"), "period-a-summary.csv"), parseSummary(read("period-b-summary.csv"), "period-b-summary.csv"), [...parseTransactions(read("period-a-transactions.csv"), "period-a-transactions.csv", "A"), ...parseTransactions(read("period-b-transactions.csv"), "period-b-transactions.csv", "B")], []);
  const input = createModelInput(analysis);
  const provider = requireAnalysisModel();
  console.log(`Provider: ${provider.label} (${provider.id}) | model: ${provider.modelId}`);
  const { report, attempts } = await generateLedgerLensReport(input, provider);
  console.log(JSON.stringify({ attempts, executiveSummary: report.executiveSummary, keyChanges: report.keyChanges.map(change => ({ title: change.title, explanation: change.explanation, confidence: change.confidence, evidenceCount: change.evidenceIds.length })), needsContext: report.needsContext }, null, 2));
  console.log("UPLOADABLE_DEMO_AI_OK");
}
void main();
