export interface RouteResponse {
  selected_route:
    | 'local_only'
    | 'local_hard_lock'
    | 'local_with_verifier_passed'
    | 'remote_after_compression';
  provider: 'ollama' | 'fireworks';
  model: string;
  local_model_role: 'general' | 'coding';
  reason: string;
  complexity: 'local_only' | 'local_with_verifier' | 'remote_after_compression';
  preflight_score: number;
  task_type: string;
  confidence: number;
  remote_tokens_used: number;
  estimated_tokens_saved: number;
  estimated_original_prompt_tokens: number;
  response: string;
}