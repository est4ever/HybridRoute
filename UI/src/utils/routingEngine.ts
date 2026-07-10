export interface RoutingResult {
  route: 'local' | 'remote';
  model: string;
  reason: string;
  latency: number;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  response: string;
  scores: {
    complexity: number;
    keywordScore: number;
    tokenScore: number;
    total: number;
  };
}

const LOCAL_MODEL = 'Phi-3 Mini';
const REMOTE_MODEL = 'Qwen 2.5 72B (Fireworks)';

const COMPLEXITY_WEIGHT = 0.4;
const TOKEN_WEIGHT = 0.3;
const KEYWORD_WEIGHT = 0.3;
const REMOTE_THRESHOLD = 0.45;

const COMPLEX_KEYWORDS = [
  'explain', 'analyze', 'compare', 'contrast', 'write code', 'generate',
  'architecture', 'review', 'design', 'implement', 'refactor', 'debug',
  'optimize', 'evaluate', 'synthesize', 'architect', 'compose', 'outline',
  'critique', 'summarize', 'diagram', 'architectural', 'workflow', 'pipeline',
  'algorithm', 'schema', 'integration', 'deploy', 'migrate', 'scale',
];

export function estimateTokens(text: string): number {
  if (!text.trim()) return 0;
  return Math.max(1, Math.ceil(text.split(/\s+/).length * 1.3));
}

function calculateComplexity(text: string): number {
  const lower = text.trim();
  if (!lower) return 0;

  const length = lower.length;
  const hasCodeBlocks = lower.includes('```') || (lower.includes('{') && lower.includes('}') && lower.length > 50);
  const hasSpecialChars = /[#$%^&*+=<>|\\]/.test(lower);
  const hasNumbers = /\d{3,}/.test(lower);
  const hasTechnicalTerms = /(function|class|interface|import|export|const|let|var|async|await|promise|api|endpoint|database|server|client|config|schema)/i.test(lower);

  let score = 0;
  if (length > 100) score += 0.15;
  if (length > 250) score += 0.15;
  if (length > 500) score += 0.15;
  if (hasCodeBlocks) score += 0.25;
  if (hasSpecialChars) score += 0.1;
  if (hasNumbers) score += 0.05;
  if (hasTechnicalTerms) score += 0.15;

  return Math.min(score, 1);
}

function calculateKeywordScore(text: string): number {
  const lower = text.toLowerCase();
  const matches = COMPLEX_KEYWORDS.filter((kw) => lower.includes(kw));
  const score = matches.length * 0.15;
  return Math.min(score, 1);
}

function calculateTokenScore(text: string): number {
  const tokens = estimateTokens(text);
  if (tokens > 300) return 1;
  if (tokens > 150) return 0.75;
  if (tokens > 75) return 0.5;
  if (tokens > 30) return 0.25;
  return 0;
}

function generateReason(
  scores: { complexity: number; keywordScore: number; tokenScore: number; total: number },
  inputTokens: number,
  route: 'local' | 'remote'
): string {
  const parts: string[] = [];

  if (scores.complexity > 0) {
    parts.push(`complexity ${(scores.complexity * 100).toFixed(0)}%`);
  }
  if (scores.keywordScore > 0) {
    parts.push(`keyword match ${(scores.keywordScore * 100).toFixed(0)}%`);
  }
  if (scores.tokenScore > 0 || inputTokens > 0) {
    parts.push(`${inputTokens} tokens`);
  }

  const detail = parts.length > 0 ? ` (${parts.join(', ')})` : '';

  if (route === 'local') {
    return `Prompt is simple and low-cost${detail} → routed to local model`;
  }
  return `High complexity or specialized task detected${detail} → routed to remote model`;
}

function estimateLatency(route: 'local' | 'remote', inputTokens: number, outputTokens: number): number {
  if (route === 'local') {
    // Local model: fast (0.2-0.8s)
    return 0.2 + Math.random() * 0.3 + inputTokens * 0.001;
  }
  // Remote model: slower (1.0-3.5s) due to network + compute
  return 1.0 + Math.random() * 1.5 + inputTokens * 0.003;
}

function estimateCost(route: 'local' | 'remote', inputTokens: number, outputTokens: number): number {
  if (route === 'local') {
    // Phi-3 Mini: ~$0.0001/1K tokens (run locally, essentially free for demo)
    return (inputTokens + outputTokens) * 0.00000015;
  }
  // Qwen 2.5 72B (Fireworks): ~$0.90/1M input, $0.90/1M output (or similar)
  return inputTokens * 0.0000009 + outputTokens * 0.0000009;
}

function generateMockResponse(prompt: string, route: 'local' | 'remote'): string {
  const promptLower = prompt.toLowerCase();

  if (route === 'local') {
    // Short, concise local responses
    const localResponses = [
      `Based on my analysis, the answer is straightforward. ${prompt.length > 30 ? prompt.slice(0, 40) + '...' : prompt} relates to a simple concept that can be addressed directly. The key point here is that efficiency comes from matching task complexity to model capability.`,
      `Sure! Here's a quick response: The concept you're asking about is relatively simple. In short, intelligent routing saves costs by not over-allocating compute resources to trivial tasks. Let me know if you need more detail!`,
      `Quick answer: This is a simple request that doesn't require extensive computation. The estimated output is concise and to the point. For more complex analysis, the system would route to a larger model.`,
    ];
    return localResponses[Math.floor(Math.random() * localResponses.length)];
  }

  // Rich, detailed remote responses
  const remoteResponses = [
    `I've performed a thorough analysis of your request. This is a complex topic that benefits from the full capacity of the Qwen 2.5 72B model.\n\n**Analysis:**\nThe prompt "${prompt.slice(0, 60)}..." involves multiple interconnected concepts that require deep reasoning. Here's a comprehensive breakdown:\n\n1. **Context Understanding**: The request touches on nuanced technical considerations that require large-scale language understanding.\n2. **Detailed Reasoning**: Several layers of analysis are needed to provide a complete answer.\n3. **Recommendations**: Based on your input, I recommend a phased approach that considers the trade-offs between cost, latency, and output quality.\n\nThis level of analysis is precisely why the routing agent chose to use the remote model — matching task complexity with appropriate compute resources.`,

    `Here's a detailed response using the full Qwen 2.5 72B model capabilities:\n\n---\n\n**Comprehensive Analysis:**\n\nYour prompt requires multi-step reasoning and domain expertise. Let me break this down systematically:\n\n### Key Findings\n- The underlying patterns suggest a sophisticated understanding is needed\n- Multiple variables interact in non-trivial ways\n- Edge cases must be considered for a robust solution\n\n### Technical Deep Dive\nThe architecture of intelligent routing systems relies on several key principles: (1) prompt complexity estimation, (2) cost-benefit analysis, (3) latency requirements, and (4) quality thresholds. By weighting these factors, the system makes optimal routing decisions in real-time.\n\n### Conclusion\nThis complex request was correctly routed to the remote model, saving ~65% cost compared to using a large model for all requests.`,

    `I've processed your complex request. Here's my comprehensive response:\n\n**Executive Summary:**\nThe query requires deep analytical processing that exceeds the capabilities of smaller local models.\n\n**Detailed Breakdown:**\n1. **Initial Assessment**: The prompt contains technical terminology and requires contextual understanding.\n2. **Deep Analysis**: Multiple reasoning paths were evaluated to determine the optimal response.\n3. **Synthesis**: The key insights have been synthesized into actionable recommendations.\n\n**Key Insights:**\n- The routing algorithm correctly identified this as a remote-model task\n- Using the Qwen 2.5 72B model ensures high-quality output\n- Cost savings are realized by reserving this model for complex requests only\n\nThis demonstrates the core value proposition of intelligent token-efficient routing.`,
  ];
  return remoteResponses[Math.floor(Math.random() * remoteResponses.length)];
}

export function routePrompt(prompt: string): RoutingResult {
  const complexity = calculateComplexity(prompt);
  const keywordScore = calculateKeywordScore(prompt);
  const tokenScore = calculateTokenScore(prompt);

  const total = complexity * COMPLEXITY_WEIGHT + keywordScore * KEYWORD_WEIGHT + tokenScore * TOKEN_WEIGHT;
  const route: 'local' | 'remote' = total > REMOTE_THRESHOLD ? 'remote' : 'local';

  const inputTokens = estimateTokens(prompt);
  const outputTokens = route === 'local'
    ? Math.floor(30 + Math.random() * 40)
    : Math.floor(80 + Math.random() * 160);

  // Small random jitter so identical prompts don't always give the same result
  const jitteredTotal = route === 'local'
    ? total * (1 - Math.random() * 0.05)
    : total * (1 + Math.random() * 0.05);

  const finalRoute: 'local' | 'remote' = jitteredTotal > REMOTE_THRESHOLD ? 'remote' : 'local';

  return {
    route: finalRoute,
    model: finalRoute === 'local' ? LOCAL_MODEL : REMOTE_MODEL,
    reason: generateReason(
      { complexity, keywordScore, tokenScore, total: jitteredTotal },
      inputTokens,
      finalRoute
    ),
    latency: estimateLatency(finalRoute, inputTokens, outputTokens),
    cost: estimateCost(finalRoute, inputTokens, outputTokens),
    inputTokens,
    outputTokens,
    response: generateMockResponse(prompt, finalRoute),
    scores: {
      complexity: Math.round(complexity * 100) / 100,
      keywordScore: Math.round(keywordScore * 100) / 100,
      tokenScore: Math.round(tokenScore * 100) / 100,
      total: Math.round(jitteredTotal * 100) / 100,
    },
  };
}