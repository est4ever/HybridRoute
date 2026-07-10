export interface MessageRouteMeta {
  provider: 'ollama' | 'fireworks';
  model: string;
  remote_tokens_used: number;
  estimated_tokens_saved: number;
  runtime_ms: number;
  preflight_score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  route?: MessageRouteMeta;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
