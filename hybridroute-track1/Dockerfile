FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py local_solvers.py code_exec.py local_llm.py .

# Accuracy-first hybrid aiming for ≥16/19, then token golf.
# Self-gating locals + Fireworks (strong CoT / cheap language / code tier).
# TRUST_LOCAL_NER=0: NER always via cheap Fireworks (partial local NER fails judges).
ENV LOCAL_SOLVER_MODE=all \
    TRUST_LOCAL_NER=0 \
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
