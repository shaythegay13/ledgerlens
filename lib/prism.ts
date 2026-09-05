type PrismTrace = {
  model: string;
  provider?: string;
  input: unknown;
  output: unknown;
  latencyMs: number;
  sessionId: string;
  attempts?: number;
  error?: string;
};

const host = () => process.env.PRISMTRACE_HOST ?? "https://prism-api-prod.up.railway.app";

export async function emitPrismTrace(trace: PrismTrace): Promise<void> {
  const apiKey = process.env.PRISMTRACE_API_KEY;
  const projectId = process.env.PRISMTRACE_PROJECT_ID;
  if (!apiKey || !projectId) return;
  const response = await fetch(`${host()}/api/traces`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-PRISMtrace-Key": apiKey },
    body: JSON.stringify({
      project_id: projectId,
      model: trace.model,
      input_messages: [{ role: "user", content: JSON.stringify(trace.input) }],
      output_message: JSON.stringify(trace.output),
      latency_ms: trace.latencyMs,
      session_id: trace.sessionId,
      metadata: { application: "LedgerLens", route: "/api/interpret", provider: trace.provider, attempts: trace.attempts, error: trace.error }
    })
  });
  if (!response.ok) throw new Error(`PRISM ingest returned ${response.status}.`);
}
