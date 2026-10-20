const MODELS = [
  "deepseek/deepseek-chat",
  "meta-llama/llama-3.3-70b-instruct",
  "qwen/qwen-2.5-72b-instruct",
];

export interface LLMResult {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export interface LLMOptions {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
}

/**
 * Calls OpenRouter with an ordered model fallback (SPEC BR-5).
 * Falls through on HTTP 429 or empty content; throws only if every model fails.
 */
export async function completeWithFallback(opts: LLMOptions): Promise<LLMResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000);

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: opts.system },
            { role: "user", content: opts.user },
          ],
          temperature: opts.temperature ?? 0.7,
          ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        }),
      });

      clearTimeout(timeout);

      if (res.status === 429) {
        lastError = new Error(`${model}: rate-limited (429)`);
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        lastError = new Error(`${model}: HTTP ${res.status} ${body.slice(0, 300)}`);
        continue;
      }

      const data = await res.json();
      const text: string | undefined = data.choices?.[0]?.message?.content;
      if (!text || !text.trim()) {
        lastError = new Error(`${model}: returned empty content`);
        continue;
      }

      return {
        text,
        model,
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      };
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(
    `All models failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}
