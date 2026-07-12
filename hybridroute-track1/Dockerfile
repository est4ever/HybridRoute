FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py local_solvers.py code_exec.py local_llm.py .

# Hybrid on known-good 9c8f204 base: verified locals first, Fireworks for the rest.
# Keep GGUF out (4GB OOM). Prefer correctness, then fewer Fireworks tokens.
ENV LOCAL_SOLVER_MODE=all \
    MAX_WORKERS=1 \
    MAX_MODEL_FALLBACKS=3 \
    ENABLE_POT=1 \
    ENABLE_CODE_SMOKE=1 \
    ENABLE_LOCAL_LLM=0 \
    ENABLE_LOCAL_POT=0 \
    MODE=hybrid \
    TIME_BUDGET_SEC=480 \
    PYTHONUNBUFFERED=1

CMD ["python", "agent.py"]
