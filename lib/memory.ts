import { MemoryFact, Transaction } from "./types";

export function applyMemory(transactions: Transaction[], memories: MemoryFact[]) {
  return transactions.map(transaction => { const match = memories.find(memory => memory.type === "vendor_classification" && memory.subject.toLowerCase() === transaction.counterparty.toLowerCase()); const category = match?.fact.replace(/^Classify as\s+/i, ""); return category ? { ...transaction, category } : transaction; });
}
