FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
# Prebuilt CPU wheel — no compiler needed in the image.
RUN pip install --no-cache-dir \
    --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu \
    -r requirements.txt

COPY agent.py local_solvers.py code_exec.py local_llm.py .
COPY models/model.gguf ./models/model.gguf

ENV LOCAL_SOLVER_MODE=all \
    MAX_WORKERS=1 \
    MAX_MODEL_FALLBACKS=2 \
    ENABLE_POT=1 \
    ENABLE_LOCAL_LLM=1 \
    LOCAL_MODEL_PATH=/app/models/model.gguf \
    LOCAL_N_CTX=2048 \
    LOCAL_N_THREADS=2 \
    TIME_BUDGET_SEC=480 \
    PYTHONUNBUFFERED=1

CMD ["python", "agent.py"]
