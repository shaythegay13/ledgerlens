import { NextResponse } from "next/server";

const config = () => ({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY });
export async function GET() {
  const { url, key } = config(); if (!url || !key) return NextResponse.json({ configured: false, memories: [] });
  const response = await fetch(`${url}/rest/v1/business_memory?select=*&order=created_at.asc`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
  if (!response.ok) return NextResponse.json({ configured: true, error: "Unable to load Supabase Business Memory." }, { status: 502 });
  return NextResponse.json({ configured: true, memories: await response.json() });
}
export async function POST(request: Request) {
  const { url, key } = config(); if (!url || !key) return NextResponse.json({ configured: false }, { status: 503 });
  const body = await request.json(); const response = await fetch(`${url}/rest/v1/business_memory`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(body) });
  if (!response.ok) return NextResponse.json({ configured: true, error: "Unable to save Supabase Business Memory." }, { status: 502 });
  return NextResponse.json({ configured: true, memory: (await response.json())[0] });
}
