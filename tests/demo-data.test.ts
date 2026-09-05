import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyze } from "../lib/analysis";
import { parseSummary, parseTransactions } from "../lib/csv";
import { applyMemory } from "../lib/memory";
import type { MemoryFact } from "../lib/types";

const read = (name: string) => readFileSync(`public/demo-data/${name}`, "utf8");
const load = () => {
  const summaryA = parseSummary(read("period-a-summary.csv"), "period-a-summary.csv");
  const summaryB = parseSummary(read("period-b-summary.csv"), "period-b-summary.csv");
  const transactions = [...parseTransactions(read("period-a-transactions.csv"), "period-a-transactions.csv", "A"), ...parseTransactions(read("period-b-transactions.csv"), "period-b-transactions.csv", "B")];
  return { summaryA, summaryB, transactions };
};
const driver = (analysis: ReturnType<typeof analyze>, category: string, counterparty: string) => analysis.insights.find(insight => insight.variance.category === category)?.drivers.find(item => item.counterparty === counterparty);

test("uploadable demo transaction CSVs reconcile to the summary CSVs", () => {
  const { summaryA, summaryB, transactions } = load();
  const categoryTotal = (period: "A" | "B", category: string) => transactions.filter(transaction => transaction.period === period && transaction.category === category).reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  [...summaryA.map(row => ["A", row] as const), ...summaryB.map(row => ["B", row] as const)].forEach(([period, row]) => assert.equal(categoryTotal(period, row.category), row.amount, `${period} ${row.category} should reconcile`));
  assert.equal(summaryA.length, 5); assert.equal(summaryB.length, 5);
});

test("uploadable demo CSVs produce the intended period-over-period story", () => {
  const { summaryA, summaryB, transactions } = load();
  const result = analyze(summaryA, summaryB, transactions, []);
  assert.equal(result.totals.revenueA, 170000); assert.equal(result.totals.revenueB, 200600);
  assert.equal(result.totals.revenueB - result.totals.revenueA, 30600);
  assert.equal(Number((((result.totals.revenueB - result.totals.revenueA) / result.totals.revenueA) * 100).toFixed(1)), 18);
  assert.equal(result.totals.expenseA, 66000); assert.equal(result.totals.expenseB, 78800);
  assert.deepEqual(result.insights.map(insight => insight.variance.category), ["Enterprise Revenue", "Software", "Contractors", "SMB Revenue", "Marketing"]);
  assert.deepEqual(result.insights.map(insight => insight.variance.change), [42300, 21400, -17600, -11700, 9000]);
  result.insights.forEach(insight => assert.equal(insight.confidence, "High", `${insight.variance.category} should have transaction evidence`));
});

test("enterprise growth is concentrated in three named customers", () => {
  const { summaryA, summaryB, transactions } = load();
  const result = analyze(summaryA, summaryB, transactions, []);
  const enterprise = result.insights.find(insight => insight.variance.category === "Enterprise Revenue");
  assert.ok(enterprise);
  assert.deepEqual(enterprise.drivers.map(item => item.counterparty), ["Acme Corp", "Globex", "Stark Industries"]);
  assert.deepEqual(enterprise.drivers.map(item => item.change), [13000, 8000, 6000]);
  const topThreeShare = enterprise.drivers.reduce((total, item) => total + item.contributionPercent, 0);
  assert.equal(Number(topThreeShare.toFixed(0)), 64, "top three enterprise customers should drive about 64% of the increase");
  assert.ok(enterprise.evidence.length >= 18, "enterprise variance needs transaction-level evidence rows");
});

test("SMB decline, contractor decline, and software increase have transaction-level drivers", () => {
  const { summaryA, summaryB, transactions } = load();
  const result = analyze(summaryA, summaryB, transactions, []);
  assert.equal(driver(result, "SMB Revenue", "Lakeside Books")?.change, -6300);
  assert.equal(driver(result, "SMB Revenue", "Quartz Coffee")?.change, -5400);
  assert.equal(driver(result, "Contractors", "BuildCo Engineering")?.change, -10000);
  const aws = driver(result, "Software", "Amazon Web Services");
  assert.equal(aws?.change, 21000);
  assert.equal(Number(aws!.contributionPercent.toFixed(1)), 98.1);
  assert.equal(aws!.transactions.length, 5, "AWS needs itemized rows in both periods for evidence");
});

test("stored AWS memory reclassifies Software spend into Infrastructure on a second run", () => {
  const { summaryA, summaryB, transactions } = load();
  const memory: MemoryFact[] = [{ id: "aws", type: "vendor_classification", subject: "Amazon Web Services", fact: "Classify as Infrastructure", source: "user_confirmed", createdAt: "2026-07-31T00:00:00.000Z" }];
  const result = analyze(summaryA, summaryB, applyMemory(transactions, memory), memory);
  const infrastructure = result.variances.find(variance => variance.category === "Infrastructure");
  assert.ok(infrastructure, "Infrastructure should exist only after the stored correction is applied");
  assert.equal(infrastructure.periodA, 10000); assert.equal(infrastructure.periodB, 31000); assert.equal(infrastructure.change, 21000);
  assert.equal(result.variances.find(variance => variance.category === "Software")?.change, 400);
  assert.deepEqual(result.insights.map(insight => insight.variance.category), ["Enterprise Revenue", "Infrastructure", "Contractors", "SMB Revenue", "Marketing"]);
  assert.equal(result.totals.revenueB - result.totals.revenueA, 30600, "reclassification must not change revenue");
  assert.equal(result.totals.expenseB - result.totals.expenseA, 12800, "reclassification must not change total expenses");
});
