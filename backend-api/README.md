# HybridRoute Demo API

FastAPI bridge between the UI (`../UI`) and the routing engine (`../hybrid-routing-agent`).

## Run

```powershell
cd C:\Users\GodBlessed\Hackathon\backend-api
..\hybrid-routing-agent\venv\Scripts\python.exe -m pip install -r requirements.txt
..\hybrid-routing-agent\venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8002
```

Set env vars in `../hybrid-routing-agent/.env` (or shell):

- `FIREWORKS_API_KEY`
- `FIREWORKS_BASE_URL`
- `FIREWORKS_MODEL`
- `LOCAL_MODEL_PROVIDER=ollama` (optional)
- `LOCAL_MODEL_NAME=gemma3:1b` (optional)

## UI

In another terminal:

```powershell
cd C:\Users\GodBlessed\Hackathon\UI
npm install
npm run dev
```

UI calls `POST http://localhost:8002/api/route` (override with `VITE_API_BASE_URL`).

## Track 1 submission

Judged Docker agent remains separate in `../hybridroute-track1`.
