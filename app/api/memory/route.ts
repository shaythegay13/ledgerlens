import { NextResponse } from "next/server";
import { getRelevantBusinessMemory, saveBusinessMemory } from "../../../lib/business-memory";
import type { MemoryType } from "../../../lib/types";

const types: MemoryType[] = ["vendor_classification", "customer_classification", "company_terminology", "recurring_financial_event", "known_business_event", "user_correction"];
export async function GET(request: Request) {
  try { const subjects = new URL(request.url).searchParams.get("subjects")?.split(",") ?? []; return NextResponse.json({ memories: await getRelevantBusinessMemory(subjects) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load Supabase Business Memory." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try { const body = await request.json() as { type?: MemoryType; subject?: string; fact?: string; source?: "user_confirmed" | "inferred" }; if (!body.type || !types.includes(body.type) || !body.subject || !body.fact || body.source !== "user_confirmed") return NextResponse.json({ error: "A user-confirmed memory type, subject, and fact are required." }, { status: 400 }); return NextResponse.json({ memory: await saveBusinessMemory({ type: body.type, subject: body.subject, fact: body.fact, source: body.source }) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save Supabase Business Memory." }, { status: 503 }); }
}
