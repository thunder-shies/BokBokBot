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
  response: "連我嘅系統都頂你唔順，你嘅愚蠢已經超越咗邏輯。",
  metrics: { stupidity: 1, conformity: 1, polarization: 1 },
  labels: ["系統崩潰級愚蠢", "無可救藥"],
};

export async function getMeanResponse(userInput: string): Promise<AIResponse> {
  try {
    const response = await fetch("/api/chat/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userInput }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const payload = (await response.json()) as Partial<AIResponse>;
    if (!payload.response || !payload.metrics || !payload.labels) {
      throw new Error("Invalid payload from backend");
    }

    return {
      response: payload.response,
      metrics: {
        stupidity: Number(payload.metrics.stupidity ?? 0.5),
        conformity: Number(payload.metrics.conformity ?? 0.5),
        polarization: Number(payload.metrics.polarization ?? 0.5),
      },
      labels: Array.isArray(payload.labels) ? payload.labels.slice(0, 3) : FALLBACK_RESPONSE.labels,
    };
  } catch (error) {
    console.error("AI Error:", error);
    return FALLBACK_RESPONSE;
  }
}
