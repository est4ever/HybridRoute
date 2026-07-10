// Seed prompts for quick demo — aligned with backend task types
export const SEED_PROMPTS = [
  {
    text: 'Summarize the key benefits of using vector databases for semantic search in production environments',
    label: 'Summarization',
  },
  {
    text: 'Write a Python function to validate and sanitize user email input using regex',
    label: 'Coding',
  },
  {
    text: 'Classify this review as positive, negative, or neutral: The product arrived on time but the packaging was damaged',
    label: 'Classification',
  },
  {
    text: 'Extract structured JSON from this text: Order #12345 from Acme Corp for 3 units of Widget-A at $49.99 each, shipped to 123 Main St, due 2025-06-01',
    label: 'Structured JSON',
  },
  {
    text: 'Explain what a pre-flight workload analyzer does in an AI routing system and why it matters for cost efficiency',
    label: 'Explanation',
  },
  {
    text: 'Debug this error: TypeError: Cannot read properties of undefined (reading \'map\') in React component rendering a list from an API response',
    label: 'Debugging',
  },
  {
    text: 'What time is it?',
    label: 'Trivial',
  },
  {
    text: 'Draft a technical comparison between Apache Kafka and RabbitMQ for a real-time event streaming platform handling 100K messages per second',
    label: 'Complex analysis',
  },
  {
    text: 'Write a bash script to recursively find all files larger than 100MB and move them to an archive directory',
    label: 'Coding',
  },
  {
    text: 'Hello, how are you?',
    label: 'Greeting',
  },
];

// Get a random seed prompt
export function getRandomSeedPrompt(): string {
  return SEED_PROMPTS[Math.floor(Math.random() * SEED_PROMPTS.length)].text;
}