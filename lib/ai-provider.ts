import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

// The only place LedgerLens decides which LLM runs. Everything else — deterministic
// analysis, evidence IDs, validation, Business Memory, PRISM — is provider-agnostic.
export type ProviderId = "groq" | "anthropic";

export type ProviderConfig = {
  id: ProviderId;
  label: string;
  modelId: string;
  apiKeyVariable: string;
};

type ProviderDefinition = ProviderConfig & { createModel: (modelId: string) => LanguageModel };

const PROVIDERS: Record<ProviderId, ProviderDefinition> = {
  // Development default: fast and free-tier friendly.
  groq: { id: "groq", label: "Groq", modelId: "openai/gpt-oss-120b", apiKeyVariable: "GROQ_API_KEY", createModel: modelId => groq(modelId) },
  // Final demo/video/submission provider.
  anthropic: { id: "anthropic", label: "Anthropic", modelId: "claude-sonnet-5", apiKeyVariable: "ANTHROPIC_API_KEY", createModel: modelId => anthropic(modelId) }
};

export const DEFAULT_PROVIDER_ID: ProviderId = "groq";
export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

function definitionFor(raw: string | undefined): ProviderDefinition {
  const requested = (raw ?? "").trim().toLowerCase();
  if (!requested) return PROVIDERS[DEFAULT_PROVIDER_ID];
  const definition = PROVIDERS[requested as ProviderId];
  // An unrecognised value is a configuration mistake, not a reason to guess a provider.
  if (!definition) throw new Error(`AI_PROVIDER="${raw}" is not supported. Set AI_PROVIDER to one of: ${PROVIDER_IDS.join(", ")}.`);
  return definition;
}

/** Which provider is selected, without requiring its credential. Safe for tracing metadata and error reporting. */
export function getProviderConfig(raw: string | undefined = process.env.AI_PROVIDER): ProviderConfig {
  const { id, label, modelId, apiKeyVariable } = definitionFor(raw);
  return { id, label, modelId, apiKeyVariable };
}

/**
 * The configured provider plus a ready language model. Throws an explicit, actionable error
 * when the selected provider has no API key — LedgerLens never silently falls back to another
 * provider, because a demo that quietly changes models is worse than one that fails loudly.
 */
export function requireAnalysisModel(raw: string | undefined = process.env.AI_PROVIDER): ProviderConfig & { model: LanguageModel } {
  const definition = definitionFor(raw);
  const apiKey = process.env[definition.apiKeyVariable];
  if (!apiKey) throw new Error(`AI_PROVIDER is "${definition.id}" but ${definition.apiKeyVariable} is not configured. Add ${definition.apiKeyVariable} to .env.local and restart the app.`);
  const { id, label, modelId, apiKeyVariable } = definition;
  return { id, label, modelId, apiKeyVariable, model: definition.createModel(modelId) };
}
