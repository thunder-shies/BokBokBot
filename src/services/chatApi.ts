export interface AIResponse {
  response: string;
  metrics: {
    stupidity: number;
    conformity: number;
    polarization: number;
  };
  labels: string[];
}

const FALLBACK_RESPONSE: AIResponse = {
  response: "系統連線唔穩定，暫時用離線模式同你傾住先。",
  metrics: { stupidity: 0.5, conformity: 0.5, polarization: 0.5 },
  labels: ["離線模式", "降級回應"],
};

function normalizeMetrics(payload: Partial<AIResponse>): AIResponse["metrics"] {
  const metrics = payload.metrics ?? FALLBACK_RESPONSE.metrics;
  return {
    stupidity: Math.max(0, Math.min(1, Number(metrics.stupidity ?? 0.5))),
    conformity: Math.max(0, Math.min(1, Number(metrics.conformity ?? 0.5))),
    polarization: Math.max(0, Math.min(1, Number(metrics.polarization ?? 0.5))),
  };
}

function normalizeLabels(payload: Partial<AIResponse>): string[] {
  if (!Array.isArray(payload.labels) || payload.labels.length === 0) {
    return FALLBACK_RESPONSE.labels;
  }
  return payload.labels.map((item) => String(item)).filter(Boolean).slice(0, 3);
}

export async function getMeanResponse(userInput: string): Promise<AIResponse> {
  try {
    const response = await fetch('/api/chat/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const payload = (await response.json()) as Partial<AIResponse>;
    const responseText = String(payload.response ?? '').trim();
    if (!responseText) {
      throw new Error('Invalid payload from backend: missing response');
    }

    return {
      response: responseText,
      metrics: normalizeMetrics(payload),
      labels: normalizeLabels(payload),
    };
  } catch (error) {
    console.error('AI Error:', error);
    return FALLBACK_RESPONSE;
  }
}
