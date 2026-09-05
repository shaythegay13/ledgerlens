import test from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../lib/analysis";
import { createModelInput, validateAiAnalysis } from "../lib/ai-analysis";
import type { Transaction } from "../lib/types";

const transaction = (period: "A" | "B", amount: number): Transaction => ({ transactionId: `${period}-acme`, date: "2026-01-01", period, description: "Subscription", amount, category: "Revenue", counterparty: "Acme Corp", type: "revenue", sourceFile: "demo.csv", sourceRow: 2 });

test("creates compact deterministic model input and rejects invented evidence IDs", () => {
  const analysis = analyze([], [], [transaction("A", 100), transaction("B", 160)], []); const input = createModelInput(analysis);
  assert.equal(input.materialChanges[0].id, "change-1"); assert.deepEqual(input.evidence.map(item => item.id), ["transaction-A-acme", "transaction-B-acme"]);
  assert.throws(() => validateAiAnalysis({ executiveSummary: "Revenue increased.", keyChanges: [{ changeId: "change-1", title: "Revenue", explanation: "Revenue increased.", evidenceIds: ["invented"], confidence: "high" }], drivers: [], needsContext: [] }, input), /unknown evidence/);
});
