export type Period = "A" | "B";

export type Transaction = {
  transactionId: string;
  date: string;
  period: Period;
  description: string;
  amount: number;
  category: string;
  counterparty: string;
  account?: string;
  type: "revenue" | "expense" | "other";
  sourceFile: string;
  sourceRow: number;
};

export type SummaryRow = { category: string; amount: number; sourceFile: string; sourceRow: number };
export type Variance = { category: string; periodA: number; periodB: number; change: number; percentChange: number | null };
export type Driver = { counterparty: string; periodA: number; periodB: number; change: number; contributionPercent: number; transactions: Transaction[] };
export type Insight = { variance: Variance; drivers: Driver[]; confidence: "High" | "Needs Context"; evidence: Transaction[] };
export type Analysis = {
  totals: { periodA: number; periodB: number; change: number; percentChange: number | null; revenueA: number; revenueB: number; expenseA: number; expenseB: number };
  variances: Variance[];
  insights: Insight[];
  summary: string;
  appliedMemories: MemoryFact[];
};
export type MemoryType = "vendor_classification" | "customer_classification" | "company_terminology" | "recurring_financial_event" | "known_business_event" | "user_correction";
export type MemoryFact = { id: string; type: MemoryType; subject: string; fact: string; source: "user_confirmed" | "inferred"; createdAt: string };
