import { Analysis, Driver, Insight, MemoryFact, SummaryRow, Transaction, Variance } from "./types";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const isRevenue = (category: string) => /revenue|sales|income/i.test(category);
const sum = (items: number[]) => items.reduce((total, value) => total + value, 0);

function groupedTransactions(transactions: Transaction[], period: "A" | "B") {
  const map = new Map<string, number>();
  transactions.filter(t => t.period === period).forEach(t => map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount)));
  return map;
}
function groupedSummary(rows: SummaryRow[]) { const map = new Map<string, number>(); rows.forEach(row => map.set(row.category, (map.get(row.category) ?? 0) + Math.abs(row.amount))); return map; }

export function analyze(summaryA: SummaryRow[], summaryB: SummaryRow[], transactions: Transaction[], memories: MemoryFact[]): Analysis {
  const txA = groupedTransactions(transactions, "A"); const txB = groupedTransactions(transactions, "B");
  const sourceA = txA.size ? txA : groupedSummary(summaryA); const sourceB = txB.size ? txB : groupedSummary(summaryB);
  const categories = new Set([...sourceA.keys(), ...sourceB.keys()]);
  const variances: Variance[] = [...categories].map(category => { const periodA = sourceA.get(category) ?? 0; const periodB = sourceB.get(category) ?? 0; const change = periodB - periodA; return { category, periodA, periodB, change, percentChange: periodA === 0 ? null : (change / periodA) * 100 }; }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const revenues = variances.filter(v => isRevenue(v.category)); const expenses = variances.filter(v => !isRevenue(v.category));
  const revenueA = sum(revenues.map(v => v.periodA)), revenueB = sum(revenues.map(v => v.periodB)); const expenseA = sum(expenses.map(v => v.periodA)), expenseB = sum(expenses.map(v => v.periodB));
  const insights = variances.slice(0, 5).map(variance => insightFor(variance, transactions));
  const delta = revenueB - revenueA; const expenseDelta = expenseB - expenseA;
  const summary = `Revenue ${delta >= 0 ? "increased" : "decreased"} ${money(Math.abs(delta))} (${revenueA ? `${Math.abs(delta / revenueA * 100).toFixed(1)}%` : "new activity"}). Expenses ${expenseDelta >= 0 ? "increased" : "decreased"} ${money(Math.abs(expenseDelta))}. ${insights[0] ? `${insights[0].variance.category} was the largest category movement.` : "Upload transaction detail to investigate drivers."}`;
  return { totals: { periodA: revenueA - expenseA, periodB: revenueB - expenseB, change: (revenueB - expenseB) - (revenueA - expenseA), percentChange: revenueA - expenseA === 0 ? null : (((revenueB - expenseB) - (revenueA - expenseA)) / Math.abs(revenueA - expenseA)) * 100, revenueA, revenueB, expenseA, expenseB }, variances, insights, summary, appliedMemories: memories };
}

function insightFor(variance: Variance, transactions: Transaction[]): Insight {
  const relevant = transactions.filter(t => t.category === variance.category); const counterparties = new Map<string, { a: number; b: number; transactions: Transaction[] }>();
  relevant.forEach(transaction => { const entry = counterparties.get(transaction.counterparty) ?? { a: 0, b: 0, transactions: [] }; if (transaction.period === "A") entry.a += Math.abs(transaction.amount); else entry.b += Math.abs(transaction.amount); entry.transactions.push(transaction); counterparties.set(transaction.counterparty, entry); });
  const drivers: Driver[] = [...counterparties.entries()].map(([counterparty, value]) => ({ counterparty, periodA: value.a, periodB: value.b, change: value.b - value.a, contributionPercent: variance.change === 0 ? 0 : ((value.b - value.a) / variance.change) * 100, transactions: value.transactions })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3);
  return { variance, drivers, confidence: relevant.length ? "High" : "Needs Context", evidence: relevant };
}

export function formatMoney(value: number) { return money(value); }
export function formatPercent(value: number | null) { return value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`; }

export function answerQuestion(question: string, analysis: Analysis): string {
  const lower = question.toLowerCase(); const revenue = analysis.insights.filter(i => /revenue|sales|income/i.test(i.variance.category)); const expenses = analysis.insights.filter(i => !/revenue|sales|income/i.test(i.variance.category));
  const selected = lower.includes("revenue") || lower.includes("customer") ? revenue : lower.includes("expense") || lower.includes("vendor") ? expenses : analysis.insights;
  const strongest = selected[0] ?? analysis.insights[0]; if (!strongest) return "I need uploaded financial data before I can investigate that.";
  const direction = strongest.variance.change >= 0 ? "increased" : "decreased"; const drivers = strongest.drivers.length ? ` The largest transaction-level contributors were ${strongest.drivers.map(d => `${d.counterparty} (${d.change >= 0 ? "+" : "−"}${money(Math.abs(d.change))})`).join(", ")}.` : " No transaction-level detail is available for this category.";
  return `${strongest.variance.category} ${direction} by ${money(Math.abs(strongest.variance.change))}.${drivers} This is supported by the uploaded data; it does not establish an underlying business cause without additional context.`;
}
