# HybridRoute — run demo (UI + backend)

## Terminal 1 — API (port 8002)

```powershell
cd C:\Users\GodBlessed\Hackathon\backend-api
..\hybrid-routing-agent\venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8002
```

Ensure `hybrid-routing-agent\.env` has a valid `FIREWORKS_API_KEY` and `LOCAL_MODEL_PROVIDER=ollama`.

## Terminal 2 — UI (Vite dev server)

```powershell
cd C:\Users\GodBlessed\Hackathon\UI
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). The Demo page is ChatGPT-style with sidebar chat history.

Default API target: `http://localhost:8002` (override with `VITE_API_BASE_URL`).

## Hackathon submission

| Piece | Location |
|-------|----------|
| Judged Docker agent | `hybridroute-track1/` → `docker.io/jesse0724/hybridroute-track1:latest` |
| Demo UI + routing story | `UI/` + `backend-api/` + `hybrid-routing-agent/` |

The demo shows hybrid local-first routing (Ollama + verifier + Fireworks fallback). Track 1 scoring uses the Docker agent only.
