import { z } from "zod";
import type { Analysis, Transaction } from "./types";

export const aiAnalysisSchema = z.object({
  executiveSummary: z.string().min(1).max(900),
  keyChanges: z.array(z.object({
    changeId: z.string(), title: z.string().min(1).max(140), explanation: z.string().min(1).max(600), evidenceIds: z.array(z.string()).min(1).max(12), confidence: z.enum(["high", "medium", "needs_context"])
  })).max(5),
  drivers: z.array(z.object({ changeId: z.string(), evidenceIds: z.array(z.string()).min(1).max(8) })).max(12),
  needsContext: z.array(z.object({ topic: z.string().min(1).max(160), question: z.string().min(1).max(300) })).max(5)
});

export type AiAnalysisReport = z.infer<typeof aiAnalysisSchema>;
export type ModelInput = {
  periods: { periodA: string; periodB: string };
  overall: Analysis["totals"];
  materialChanges: Array<{ id: string; category: string; kind: "revenue" | "expense"; periodA: number; periodB: number; change: number; percentChange: number | null; confidence: string; drivers: Array<{ counterparty: string; change: number; contributionPercent: number; evidenceIds: string[] }> }>;
  evidence: Array<{ id: string; changeId: string; date: string; counterparty: string; category: string; amount: number; sourceFile: string; sourceRow: number }>;
  businessContext: Array<{ subject: string; fact: string; source: string }>;
};

export const LEDGERLENS_SYSTEM_PROMPT = `You are LedgerLens, an evidence-first financial analysis assistant for founders and finance operators.

Select the material changes and evidence that matter, then give concise qualitative interpretation. The supplied JSON is an immutable deterministic fact ledger. Never recalculate, alter, round, or invent its numerical values. Never invent transactions, categories, customers, vendors, counterparties, evidence IDs, or business causes. Cite only supplied change IDs and evidence IDs. Do not write any numbers, currency symbols, percentages, transaction IDs, evidence IDs, or derived values in any text field; LedgerLens renders those directly from the fact ledger. Never call an expense category revenue or vice versa; use the supplied kind. A change in a transaction or category proves the financial driver, not the underlying business event. Do not say or imply terms such as "because of", "reflecting", "caused by", "due to a strategy", "investment", "customer mix", "expansion", or any motivation. If businessContext is empty, add one concise needsContext question for each material change whose underlying business reason is unknown. Prioritize material changes. Be concise, grounded, and do not give investment, tax, legal, or accounting advice.

Write descriptively, never causally. Never use any of these words or phrases in any text field: because, due to, driven by, drove, caused by, reflecting, resulting from, as a result of, thanks to, owing to, attributable to, stemming from, fueled by, boosted by, on the back of. Never describe magnitude in words that imply arithmetic, such as doubled, tripled, halved, or a fraction of. Describe only what the ledger shows and name the counterparties it lists. Good: "Enterprise revenue increased. The largest contributors were Acme Corp, Globex, and Stark Industries." Bad: "Enterprise revenue increased because of expansion, driven by Acme Corp." Put every unknown business reason in needsContext instead of asserting it.`;

// The ledger stays small enough for a single request on the tightest provider budget
// (the Groq free tier): each driver contributes its
// largest row per period. The UI still renders every supporting transaction from the
// deterministic analysis, so nothing the user sees depends on this cap.
function representativeRows(transactions: Transaction[]): Transaction[] {
  const largest = (period: "A" | "B") => transactions.filter(transaction => transaction.period === period).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
  return [largest("A"), largest("B")].filter((transaction): transaction is Transaction => Boolean(transaction));
}

export function createModelInput(analysis: Analysis): ModelInput {
  const evidence: ModelInput["evidence"] = [];
  const materialChanges: ModelInput["materialChanges"] = analysis.insights.map((insight, index) => {
    const id = `change-${index + 1}`;
    const drivers = insight.drivers.map(driver => {
      const rows = representativeRows(driver.transactions);
      rows.forEach(transaction => evidence.push({ id: `transaction-${transaction.transactionId}`, changeId: id, date: transaction.date, counterparty: transaction.counterparty, category: transaction.category, amount: transaction.amount, sourceFile: transaction.sourceFile, sourceRow: transaction.sourceRow }));
      return { counterparty: driver.counterparty, change: driver.change, contributionPercent: driver.contributionPercent, evidenceIds: rows.map(transaction => `transaction-${transaction.transactionId}`) };
    });
    return { id, category: insight.variance.category, kind: /revenue|sales|income/i.test(insight.variance.category) ? "revenue" : "expense", periodA: insight.variance.periodA, periodB: insight.variance.periodB, change: insight.variance.change, percentChange: insight.variance.percentChange, confidence: insight.confidence, drivers };
  });
  return { periods: { periodA: "Period A", periodB: "Period B" }, overall: analysis.totals, materialChanges, evidence, businessContext: analysis.appliedMemories.map(memory => ({ subject: memory.subject, fact: memory.fact, source: memory.source })) };
}

export function validateAiAnalysis(value: unknown, input: ModelInput): AiAnalysisReport {
  const report = aiAnalysisSchema.parse(value); const changeIds = new Set(input.materialChanges.map(change => change.id)); const evidenceIds = new Set(input.evidence.map(evidence => evidence.id));
  const validateReferences = (changeId: string, ids: string[]) => { if (!changeIds.has(changeId)) throw new Error("The model returned an unknown change reference."); if (ids.some(id => !evidenceIds.has(id))) throw new Error("The model returned an unknown evidence reference."); };
  const text = [report.executiveSummary, ...report.keyChanges.flatMap(change => [change.title, change.explanation]), ...report.needsContext.flatMap(item => [item.topic, item.question])].join(" ");
  const numeric = text.match(/[\d$%]/);
  if (numeric) throw new Error(`The model included an unverified numerical claim (the character "${numeric[0]}").`);
  const causal = text.match(/\b(because|reflecting|caused by|due to|driven by|drove|resulting from|as a result|thanks to|owing to|attributable to|stemming from|fueled by|boosted by|investment|customer mix|strategy|expansion)\b/i);
  if (causal) throw new Error(`The model included an unsupported causal claim (the phrase "${causal[0]}").`);
  report.keyChanges.forEach(change => validateReferences(change.changeId, change.evidenceIds)); report.drivers.forEach(driver => validateReferences(driver.changeId, driver.evidenceIds)); return report;
}
