# hybridroute-track1

Dockerized Python agent for **AMD Developer Hackathon Track 1: General-Purpose AI Agent**.

## What it does

1. Reads batch tasks from `/input/tasks.json`
2. Classifies each task locally with rule-based heuristics (no model call)
3. Selects an allowed Fireworks model based on task type
4. Makes **one Fireworks call per task** with tight `max_tokens`
5. Writes `/output/results.json` and exits

Supported task categories:

- Factual knowledge
- Mathematical reasoning
- Sentiment classification
- Text summarization
- Named entity recognition
- Code debugging
- Logical / deductive reasoning
- Code generation

## Required environment variables

The evaluation harness injects:

- `FIREWORKS_API_KEY`
- `FIREWORKS_BASE_URL`
- `ALLOWED_MODELS` (comma-separated exact model names)

Optional:

- `MAX_WORKERS` (default `4`)

**Do not** bundle a `.env` file in the Docker image. **Do not** hardcode API keys.

## Input format

`/input/tasks.json`

```json
[
  {
    "task_id": "t1",
    "prompt": "Summarise the following text in one sentence: ..."
  }
]
```

## Output format

`/output/results.json`

```json
[
  {
    "task_id": "t1",
    "answer": "..."
  }
]
```

Each object contains exactly `task_id` and `answer`.

## Local Docker build

```bash
docker build -t hybridroute-track1 .
```

## Local Docker run (PowerShell)

```powershell
docker run --rm `
  -e FIREWORKS_API_KEY="YOUR_LOCAL_KEY" `
  -e FIREWORKS_BASE_URL="https://api.fireworks.ai/inference/v1" `
  -e ALLOWED_MODELS="minimax-m3,kimi-k2p7-code,gemma-4-31b-it,gemma-4-26b-a4b-it,gemma-4-31b-it-nvfp4" `
  -v ${PWD}/sample:/input `
  -v ${PWD}/output:/output `
  hybridroute-track1
```

## Public linux/amd64 build and push

```bash
docker buildx build --platform linux/amd64 -t YOUR_USERNAME/hybridroute-track1:latest --push .
```

## Notes

- Model selection always uses an exact value from `ALLOWED_MODELS`.
- All Fireworks calls use `FIREWORKS_BASE_URL` from the environment.
- No debug metadata is written to `results.json`.
- Container exits with code `0` on success.
