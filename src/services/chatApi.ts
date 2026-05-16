import type { AppLocale } from '../i18n';
import { chatFallback } from '../i18n';

export interface AIResponse {
  response: string;
  metrics: {
    stupidity: number;
    conformity: number;
    polarization: number;
  };
  labels: string[];
}

function buildFallbackResponse(locale: AppLocale): AIResponse {
  const fallback = chatFallback[locale];
  return {
    response: fallback.response,
    metrics: { stupidity: 0.5, conformity: 0.5, polarization: 0.5 },
    labels: [...fallback.labels],
  };
}

function normalizeMetrics(payload: Partial<AIResponse>, locale: AppLocale): AIResponse["metrics"] {
  const metrics = payload.metrics ?? buildFallbackResponse(locale).metrics;
  return {
    stupidity: Math.max(0, Math.min(1, Number(metrics.stupidity ?? 0.5))),
    conformity: Math.max(0, Math.min(1, Number(metrics.conformity ?? 0.5))),
    polarization: Math.max(0, Math.min(1, Number(metrics.polarization ?? 0.5))),
  };
}

function normalizeLabels(payload: Partial<AIResponse>, locale: AppLocale): string[] {
  if (!Array.isArray(payload.labels) || payload.labels.length === 0) {
    return buildFallbackResponse(locale).labels;
  }
  return payload.labels.map((item) => String(item)).filter(Boolean).slice(0, 3);
}

export async function getMeanResponse(userInput: string, locale: AppLocale = 'zh-HK'): Promise<AIResponse> {
  const fallbackResponse = buildFallbackResponse(locale);

  try {
    const response = await fetch('/api/chat/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput, locale }),
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
      metrics: normalizeMetrics(payload, locale),
      labels: normalizeLabels(payload, locale),
    };
  } catch (error) {
    console.error('AI Error:', error);
    return fallbackResponse;
  }
}
