/**
 * Minimal OpenRouter client — one chat completion with a strict JSON schema.
 *
 * Same spirit as maileroo.ts: the one call we need, no SDK. The pinned choices
 * here are the ones that matter for this product:
 *
 *  - `temperature: 0` and a strict `json_schema`, because the output is parsed,
 *    validated and stored, never read as prose;
 *  - `allow_fallbacks: false` and `data_collection: "deny"`, because a silent
 *    hop to a provider that retains prompts is the failure mode that ends a
 *    pilot about employee welzijn;
 *  - `usage: { include: true }`, so what a round costs is a stored fact.
 */

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Verify the slug against OpenRouter's model list before a real round: model
 * ids move, and "latest" is exactly what this product must not pin to.
 */
export const DEFAULT_MODEL = "openai/gpt-5.6-terra";

export type CallResult<T> = {
  data: T;
  model: string;
  raw: unknown;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  latencyMs: number;
};

export class OpenRouterError extends Error {}

export async function callJson<T>(input: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  schemaName: string;
  model?: string;
  apiKey: string;
  referer?: string;
}): Promise<CallResult<T>> {
  const model = input.model || DEFAULT_MODEL;
  const started = Date.now();

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
      ...(input.referer ? { "HTTP-Referer": input.referer, "X-Title": "Namber Welzijn" } : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: input.schemaName, strict: true, schema: input.schema },
      },
      provider: { require_parameters: true, allow_fallbacks: false, data_collection: "deny" },
      usage: { include: true },
    }),
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new OpenRouterError(`OpenRouter ${response.status}: ${text.slice(0, 400)}`);
  }

  let body: {
    model?: string;
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
  };
  try {
    body = JSON.parse(text);
  } catch {
    throw new OpenRouterError(`OpenRouter gaf geen JSON terug: ${text.slice(0, 200)}`);
  }

  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new OpenRouterError("OpenRouter gaf een leeg antwoord terug.");

  let data: T;
  try {
    data = JSON.parse(content) as T;
  } catch {
    throw new OpenRouterError(`Antwoord was geen geldige JSON: ${content.slice(0, 200)}`);
  }

  return {
    data,
    model: body.model ?? model,
    raw: body,
    promptTokens: body.usage?.prompt_tokens,
    completionTokens: body.usage?.completion_tokens,
    costUsd: body.usage?.cost,
    latencyMs: Date.now() - started,
  };
}
