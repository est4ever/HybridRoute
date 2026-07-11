FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py local_solvers.py code_exec.py local_llm.py .

# Default: NO bundled GGUF. The 4GB harness OOMs / times out loading ~1GB models.
# Deterministic solvers handle the proxy set at 0 tokens; Fireworks covers the rest.
ENV LOCAL_SOLVER_MODE=all \
    MAX_WORKERS=1 \
    MAX_MODEL_FALLBACKS=2 \
    ENABLE_POT=1 \
    ENABLE_LOCAL_LLM=0 \
    ENABLE_LOCAL_POT=0 \
    MODE=hybrid \
    TIME_BUDGET_SEC=420 \
    PYTHONUNBUFFERED=1

CMD ["python", "agent.py"]
