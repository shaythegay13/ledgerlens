import test from "node:test";
import assert from "node:assert/strict";
import { applyMemory } from "../lib/memory";
import type { MemoryFact, Transaction } from "../lib/types";

const aws: Transaction = { transactionId: "B-aws", date: "2026-08-05", period: "B", description: "AWS cloud", amount: -33400, category: "Software", counterparty: "Amazon Web Services", type: "expense", sourceFile: "august.csv", sourceRow: 2 };
const classification: MemoryFact = { id: "aws-infrastructure", type: "vendor_classification", subject: "Amazon Web Services", fact: "Classify as Infrastructure", source: "user_confirmed", createdAt: "2026-07-31T00:00:00.000Z" };

test("applies a user-confirmed Supabase vendor classification to a later transaction", () => {
  const result = applyMemory([aws], [classification]);
  assert.equal(result[0].category, "Infrastructure"); assert.equal(result[0].counterparty, "Amazon Web Services");
});
