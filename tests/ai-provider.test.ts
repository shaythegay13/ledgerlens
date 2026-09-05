import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PROVIDER_ID, getProviderConfig, requireAnalysisModel } from "../lib/ai-provider";
import { analyze } from "../lib/analysis";
import { createModelInput, validateAiAnalysis } from "../lib/ai-analysis";
import type { Transaction } from "../lib/types";

const withEnv = (values: Record<string, string | undefined>, run: () => void) => {
  const previous = Object.keys(values).map(key => [key, process.env[key]] as const);
  Object.entries(values).forEach(([key, value]) => { if (value === undefined) delete process.env[key]; else process.env[key] = value; });
  try { run(); } finally { previous.forEach(([key, value]) => { if (value === undefined) delete process.env[key]; else process.env[key] = value; }); }
};

test("Groq is the default provider and Anthropic is opt-in by environment", () => {
  assert.equal(DEFAULT_PROVIDER_ID, "groq");
  [undefined, "", "   "].forEach(value => {
    const config = getProviderConfig(value);
    assert.equal(config.id, "groq"); assert.equal(config.modelId, "openai/gpt-oss-120b"); assert.equal(config.apiKeyVariable, "GROQ_API_KEY");
  });
  ["anthropic", "Anthropic", " ANTHROPIC "].forEach(value => {
    const config = getProviderConfig(value);
    assert.equal(config.id, "anthropic"); assert.equal(config.modelId, "claude-sonnet-5"); assert.equal(config.apiKeyVariable, "ANTHROPIC_API_KEY");
  });
});

test("an unsupported AI_PROVIDER fails loudly instead of falling back", () => {
  assert.throws(() => getProviderConfig("openai"), /AI_PROVIDER="openai" is not supported.*groq, anthropic/s);
});

test("a selected provider without its API key reports exactly what is missing", () => {
  withEnv({ ANTHROPIC_API_KEY: undefined }, () => {
    assert.throws(() => requireAnalysisModel("anthropic"), /AI_PROVIDER is "anthropic" but ANTHROPIC_API_KEY is not configured/);
  });
  withEnv({ GROQ_API_KEY: undefined }, () => {
    assert.throws(() => requireAnalysisModel("groq"), /AI_PROVIDER is "groq" but GROQ_API_KEY is not configured/);
  });
});

test("each provider resolves a language model bound to its configured model id", () => {
  withEnv({ ANTHROPIC_API_KEY: "test-anthropic-key", GROQ_API_KEY: "test-groq-key" }, () => {
    const anthropicProvider = requireAnalysisModel("anthropic");
    assert.equal(anthropicProvider.modelId, "claude-sonnet-5"); assert.ok(anthropicProvider.model, "Anthropic model should be constructed");
    const groqProvider = requireAnalysisModel("groq");
    assert.equal(groqProvider.modelId, "openai/gpt-oss-120b"); assert.ok(groqProvider.model, "Groq model should be constructed");
  });
});

test("the deterministic grounding pipeline is identical under both providers", () => {
  const transaction = (period: "A" | "B", amount: number): Transaction => ({ transactionId: `${period}-acme`, date: "2026-01-01", period, description: "Subscription", amount, category: "Revenue", counterparty: "Acme Corp", type: "revenue", sourceFile: "demo.csv", sourceRow: 2 });
  const analysis = analyze([], [], [transaction("A", 100), transaction("B", 160)], []);
  const report = { executiveSummary: "Revenue increased.", keyChanges: [{ changeId: "change-1", title: "Revenue", explanation: "Revenue increased. The largest contributor was Acme Corp.", evidenceIds: ["transaction-A-acme"], confidence: "high" as const }], drivers: [], needsContext: [] };
  const inputs = ["groq", "anthropic"].map(provider => { let captured!: ReturnType<typeof createModelInput>; withEnv({ AI_PROVIDER: provider }, () => { captured = createModelInput(analysis); }); return captured; });
  assert.deepEqual(inputs[0], inputs[1], "the fact ledger must not depend on the provider");
  const validated = inputs.map(input => validateAiAnalysis(report, input));
  assert.deepEqual(validated[0], validated[1], "validation must not depend on the provider");
  inputs.forEach(input => assert.throws(() => validateAiAnalysis({ ...report, executiveSummary: "Revenue rose because of expansion." }, input), /unsupported causal claim/));
  inputs.forEach(input => assert.throws(() => validateAiAnalysis({ ...report, keyChanges: [{ ...report.keyChanges[0], evidenceIds: ["invented"] }] }, input), /unknown evidence/));
});
