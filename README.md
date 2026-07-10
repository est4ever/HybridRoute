# HybridRoute

Hybrid token-efficient routing for the **AMD Developer Hackathon Track 1**.

Simple prompts stay on a local model (Ollama). Harder work escalates to Fireworks hosted models. A React demo UI shows route, model, runtime, and token usage in the same chat thread.

## Repository layout

| Path | Purpose |
|------|---------|
| `hybridroute-track1/` | **Judged** Docker batch agent (`docker.io/jesse0724/hybridroute-track1:latest`) |
| `hybrid-routing-agent/` | Local-first router (Ollama + verifier + Fireworks fallback) |
| `backend-api/` | FastAPI bridge: `POST /api/route` |
| `UI/` | React/Vite ChatGPT-style demo |
| `RUN-DEMO.md` | Short local demo checklist |

## Quick start (local demo)

**Prerequisites:** Python 3.11+, Node 18+, [Ollama](https://ollama.com/) with `gemma3:1b` pulled, and a Fireworks API key.

```powershell
# 1. Configure secrets (never commit this file)
cd hybrid-routing-agent
copy .env.example .env
# Edit .env and set FIREWORKS_API_KEY

python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
cd ..\backend-api
..\hybrid-routing-agent\venv\Scripts\pip install -r requirements.txt

# 2. API on port 8002
..\hybrid-routing-agent\venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8002

# 3. UI (second terminal)
cd ..\UI
npm install
npm run dev
```

Open http://localhost:5173/demo

See [RUN-DEMO.md](./RUN-DEMO.md) for the same steps in short form.

## Track 1 submission

Judging uses the Docker agent only (not the UI):

```bash
docker pull docker.io/jesse0724/hybridroute-track1:latest
```

Details: [hybridroute-track1/README.md](./hybridroute-track1/README.md)

## Public / hosted demo

A static UI host alone is not enough — the API needs a server and `FIREWORKS_API_KEY`.

1. **API** — Deploy `backend-api` + `hybrid-routing-agent` to Railway, Render, or Fly.io.
   - Set `FIREWORKS_API_KEY`, `FIREWORKS_BASE_URL`, `FIREWORKS_MODEL`.
   - For cloud without Ollama, set `LOCAL_MODEL_PROVIDER=placeholder` (or keep Ollama only on a machine that has it).
2. **UI** — Deploy `UI/` to Vercel/Netlify with:
   ```bash
   VITE_API_BASE_URL=https://your-api.example.com
   ```
3. Do **not** put API keys in the frontend.

Local laptop demo remains the best path for hackathon presentation.

## Security

- Copy `hybrid-routing-agent/.env.example` → `.env` and keep `.env` out of git.
- If a key was ever committed or pasted in chat, **rotate it** in the Fireworks console.
