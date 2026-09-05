import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  const { analysis, question } = await request.json() as { analysis: unknown; question?: string };
  const prompt = `You are LedgerLens, an evidence-first financial analyst. Use only the deterministic analysis JSON below. Do not recalculate figures, invent transactions, or assert an unprovided business cause. State when the data shows what changed but needs context for why. Write a concise executive explanation${question ? ` answering this question: ${question}` : ""}.\n\nANALYSIS JSON:\n${JSON.stringify(analysis)}`;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini", input: prompt, max_output_tokens: 450 }) });
    if (!response.ok) return NextResponse.json({ error: "The interpretation service could not complete this request." }, { status: 502 });
    const payload = await response.json() as { output_text?: string };
    // PRISM credentials remain environment-only. Add the provider's SDK/exporter here
    // once the hackathon PRISM project configuration is supplied.
    console.info("ledgerlens.ai_interpretation", { sessionId: request.headers.get("x-ledgerlens-session"), hasPrismConfig: Boolean(process.env.PRISM_API_KEY), question: Boolean(question) });
    return NextResponse.json({ text: payload.output_text ?? "No interpretation was returned." });
  } catch {
    return NextResponse.json({ error: "The interpretation service is unavailable." }, { status: 502 });
  }
}
