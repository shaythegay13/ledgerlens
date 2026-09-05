import test from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../lib/analysis";
import type { Transaction } from "../lib/types";

const tx = (period: "A" | "B", amount: number, counterparty: string): Transaction => ({ transactionId: `${period}-${counterparty}`, date: "2026-01-01", period, description: "", amount, category: "Revenue", counterparty, type: "revenue", sourceFile: "test.csv", sourceRow: 2 });
test("ranks category changes and calculates contributor evidence deterministically", () => { const result = analyze([], [], [tx("A", 100, "Acme"), tx("B", 160, "Acme"), tx("A", 20, "Globex"), tx("B", 30, "Globex")], []); assert.equal(result.variances[0].change, 70); assert.equal(result.insights[0].drivers[0].counterparty, "Acme"); assert.equal(result.insights[0].drivers[0].change, 60); assert.equal(result.insights[0].drivers[0].contributionPercent, 85.71428571428571); });
