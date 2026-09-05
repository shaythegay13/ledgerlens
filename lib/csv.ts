import { SummaryRow, Transaction, Period } from "./types";

const aliases: Record<string, string[]> = {
  date: ["date", "transaction date", "posted date"], amount: ["amount", "value", "total"],
  category: ["category", "account", "class"], description: ["description", "memo", "details", "name"],
  counterparty: ["counterparty", "vendor", "customer", "payee", "merchant", "name"], type: ["type", "transaction type"]
};

function rows(text: string): string[][] {
  const result: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) { const char = text[i]; const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") i++; row.push(cell.trim()); if (row.some(Boolean)) result.push(row); row = []; cell = ""; }
    else cell += char;
  }
  row.push(cell.trim()); if (row.some(Boolean)) result.push(row); return result;
}
function field(headers: string[], key: string) { return headers.findIndex(h => aliases[key].includes(h.toLowerCase().trim())); }
function number(value: string | undefined) { return Number((value ?? "").replace(/[$,()]/g, m => m === "(" ? "-" : "")) || 0; }

export function parseSummary(text: string, sourceFile: string): SummaryRow[] {
  const data = rows(text); if (data.length < 2) throw new Error(`${sourceFile} needs a Category and Amount header plus data.`);
  const category = field(data[0], "category"); const amount = field(data[0], "amount");
  if (category < 0 || amount < 0) throw new Error(`${sourceFile} must include Category and Amount columns.`);
  return data.slice(1).map((row, index) => ({ category: row[category] || "Uncategorized", amount: number(row[amount]), sourceFile, sourceRow: index + 2 })).filter(row => row.category);
}

export function parseTransactions(text: string, sourceFile: string, period: Period): Transaction[] {
  const data = rows(text); if (data.length < 2) throw new Error(`${sourceFile} needs a header row and transactions.`);
  const headers = data[0]; const amount = field(headers, "amount"); const category = field(headers, "category");
  if (amount < 0 || category < 0) throw new Error(`${sourceFile} must include Amount and Category columns.`);
  const date = field(headers, "date"), description = field(headers, "description"), counterparty = field(headers, "counterparty"), type = field(headers, "type");
  return data.slice(1).map((row, index) => { const value = number(row[amount]); const explicitType = type >= 0 ? row[type]?.toLowerCase() : "";
    return { transactionId: `${period}-${index + 2}`, date: date >= 0 ? row[date] || "Unknown date" : "Unknown date", period, description: description >= 0 ? row[description] || "" : "", amount: value, category: row[category] || "Uncategorized", counterparty: counterparty >= 0 ? row[counterparty] || "Unknown counterparty" : "Unknown counterparty", type: explicitType.includes("revenue") || value > 0 ? "revenue" : explicitType.includes("expense") || value < 0 ? "expense" : "other", sourceFile, sourceRow: index + 2 };
  });
}
