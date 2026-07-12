FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py local_solvers.py code_exec.py local_llm.py .

# Zero-token moonshot: deterministic solvers only (no Fireworks, no GGUF).
# Top of leaderboard is 0 tokens + ~84%+ accuracy; hybrid spends tokens and loses rank.
ENV LOCAL_SOLVER_MODE=all \
    MAX_WORKERS=1 \
    MAX_MODEL_FALLBACKS=1 \
    ENABLE_POT=0 \
    ENABLE_LOCAL_LLM=0 \
    ENABLE_LOCAL_POT=0 \
    MODE=moonshot \
    TIME_BUDGET_SEC=480 \
    PYTHONUNBUFFERED=1

CMD ["python", "agent.py"]
