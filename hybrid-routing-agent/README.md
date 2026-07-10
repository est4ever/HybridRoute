# Hybrid Routing Agent (Local First)

Local-first router for token-efficient inference:

1. Analyze task risk.
2. Run a local model first (`placeholder` or `ollama`).
3. Verify local answer confidence.
4. Return local answer when confidence is high.
5. Fallback to Fireworks/Gemma when confidence is low or task is high-risk.
6. Log route decisions to `logs/routes.jsonl`.

## Setup

```bash
pip install -r requirements.txt
copy .env.example .env
```

## Environment Variables

- `LOCAL_MODEL_PROVIDER=placeholder|ollama`
- `LOCAL_MODEL_NAME=<local model name>`
- `FIREWORKS_API_KEY=<secret>`
- `FIREWORKS_MODEL=<fireworks model id>`
- `ROUTE_CONFIDENCE_THRESHOLD=0.72`

## Stage 1 (placeholder mode)

```bash
python main.py "Summarize this text"
python eval_runner.py --tasks examples/sample_tasks.json
```

## Stage 2 (Ollama local model)

1. Install [Ollama](https://ollama.com/).
2. Pull a small model (example): `ollama pull gemma3:1b`
3. Set:
   - `LOCAL_MODEL_PROVIDER=ollama`
   - `LOCAL_MODEL_NAME=gemma3:1b`
4. Run `python main.py "Your task here"`.

## Stage 3 (Fireworks fallback)

Set `FIREWORKS_API_KEY` and `FIREWORKS_MODEL`.  
Router will call Fireworks only when:

- local confidence `< ROUTE_CONFIDENCE_THRESHOLD`, or
- task is marked high-risk by keyword analysis, or
- local model call fails.

## Workload Scoring Router (Pre-Flight)

The router computes a **pre-flight workload score from task text only** before deciding whether to run local inference:

`pre-flight score = task difficulty + format/context risk` (no model calls)

Score bands:

- `0-35`: local only (never Fireworks)
- `36-60`: local first + verifier; remote only if **2+ escalation signals** and verification did not pass
- `61-100`: skip local, compress prompt, Fireworks/Gemma only

Hard-locked local types (never escalate): `classification`, `extraction`, `rewriting`

### Multiple local models

Set a general model and an optional coding specialist:

- `LOCAL_MODEL_NAME` — default local model (e.g. `gemma3:1b`)
- `LOCAL_CODING_MODEL_NAME` — used for `coding` and `debugging` tasks (e.g. `deepseek-coder:1.3b`)

If `LOCAL_CODING_MODEL_NAME` is empty, coding tasks use the general model.

Each response includes route reason, confidence, and token estimates:

- `estimated_original_prompt_tokens`
- `estimated_compressed_prompt_tokens`
- `estimated_remote_tokens_saved`

Batch eval prints a judge-friendly table:

`Task | Route | RemoteTokens | Reason`
