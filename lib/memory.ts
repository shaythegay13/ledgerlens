import { MemoryFact, Transaction } from "./types";

const KEY = "ledgerlens-business-memory-v1";
export function readMemory(): MemoryFact[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as MemoryFact[]; } catch { return []; } }
export function saveVendorClassification(subject: string, category: string): MemoryFact {
  const fact: MemoryFact = { id: crypto.randomUUID(), type: "vendor_classification", subject: subject.trim(), fact: `Classify as ${category.trim()}`, source: "user_confirmed", createdAt: new Date().toISOString() };
  const existing = readMemory().filter(item => item.subject.toLowerCase() !== fact.subject.toLowerCase()); localStorage.setItem(KEY, JSON.stringify([...existing, fact])); return fact;
}
export function applyMemory(transactions: Transaction[], memories: MemoryFact[]) {
  return transactions.map(transaction => { const match = memories.find(memory => memory.subject.toLowerCase() === transaction.counterparty.toLowerCase()); const category = match?.fact.replace(/^Classify as\s+/i, ""); return category ? { ...transaction, category } : transaction; });
}
