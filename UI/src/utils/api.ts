import { API_BASE_URL } from '../constants/config';
import type { RouteResponse } from '../types/api';

export async function routePrompt(prompt: string): Promise<RouteResponse> {
  const res = await fetch(`${API_BASE_URL}/api/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<RouteResponse>;
}