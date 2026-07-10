import { routePrompt } from './api';

export async function generateChatTitle(firstMessage: string): Promise<string> {
  const prompt = `Create a short, concise 2-5 word title for a chat that starts with this message. Respond with only the title, no quotes or extra text: "${firstMessage}"`;

  try {
    const result = await routePrompt(prompt);
    let title = result.response
      .split('\n')[0]
      .trim()
      .replace(/^["']|["']$/g, '')
      .trim();
    if (title.length > 0 && title.length <= 100) {
      return title;
    }
  } catch {
    // API unavailable or returned unexpected content — fall back to snippet
  }

  const fallback = firstMessage.trim();
  if (fallback.length === 0) return 'New chat';
  return fallback.length > 30 ? fallback.slice(0, 30) + '...' : fallback;
}
