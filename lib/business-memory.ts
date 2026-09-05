import type { MemoryFact, MemoryType } from "./types";

const BUSINESS_ID = "ledgerlens-demo";
const requiredConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase Business Memory is not configured.");
  return { url, key };
};
const headers = (key: string, extra: Record<string, string> = {}) => ({ apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra });
type DatabaseMemory = { memory_id: string; type: MemoryType; subject: string; fact: string; source: "user_confirmed" | "inferred"; created_at: string };
const mapMemory = (memory: DatabaseMemory): MemoryFact => ({ id: memory.memory_id, type: memory.type, subject: memory.subject, fact: memory.fact, source: memory.source, createdAt: memory.created_at });

async function request(path: string, init?: RequestInit) {
  const { url, key } = requiredConfig(); const response = await fetch(`${url}/rest/v1/business_memory${path}`, { ...init, headers: { ...headers(key), ...(init?.headers ?? {}) }, cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 404 ? "Business Memory table is missing. Run supabase/schema.sql in the Supabase SQL Editor." : "Supabase Business Memory request failed.");
  return response;
}

export async function getRelevantBusinessMemory(subjects: string[] = []): Promise<MemoryFact[]> {
  const response = await request(`?business_id=eq.${BUSINESS_ID}&select=*&order=updated_at.desc`); const rows = await response.json() as DatabaseMemory[];
  const wanted = new Set(subjects.map(subject => subject.trim().toLowerCase()).filter(Boolean));
  return rows.map(mapMemory).filter(memory => wanted.size === 0 || wanted.has(memory.subject.toLowerCase()));
}

export async function saveBusinessMemory(input: { type: MemoryType; subject: string; fact: string; source: "user_confirmed" | "inferred" }): Promise<MemoryFact> {
  const subject = input.subject.trim(); const fact = input.fact.trim(); if (!subject || !fact) throw new Error("Business Memory needs both a subject and fact.");
  const existing = (await getRelevantBusinessMemory([subject])).find(memory => memory.type === input.type && memory.subject.toLowerCase() === subject.toLowerCase());
  const body = { business_id: BUSINESS_ID, type: input.type, subject, fact, source: input.source, updated_at: new Date().toISOString() };
  const response = existing ? await request(`?memory_id=eq.${existing.id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) }) : await request("", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(body) });
  const rows = await response.json() as DatabaseMemory[]; if (!rows[0]) throw new Error("Supabase did not return the saved Business Memory."); return mapMemory(rows[0]);
}

export async function updateBusinessMemory(id: string, fact: string): Promise<MemoryFact> {
  const response = await request(`?memory_id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ fact: fact.trim(), updated_at: new Date().toISOString() }) }); const rows = await response.json() as DatabaseMemory[];
  if (!rows[0]) throw new Error("Business Memory record was not found."); return mapMemory(rows[0]);
}
