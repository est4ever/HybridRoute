FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py local_solvers.py code_exec.py local_llm.py .

# Pass-safe hybrid (hold ≥84.2%) + token cut vs the 3.5k run:
# - Same as known pass: NER via Fireworks (TRUST_LOCAL_NER=0)
# - Biggest token save: ENABLE_POT=0 (one CoT call, not PoT+retry)
# - Still local for verified sentiment/math/logic/code/facts only
ENV LOCAL_SOLVER_MODE=all \
    TRUST_LOCAL_NER=0 \
    MAX_WORKERS=1 \
    MAX_MODEL_FALLBACKS=2 \
    ENABLE_POT=0 \
    ENABLE_CODE_SMOKE=1 \
    ENABLE_LOCAL_LLM=0 \
    ENABLE_LOCAL_POT=0 \
    MODE=hybrid \
    TIME_BUDGET_SEC=480 \
    PYTHONUNBUFFERED=1

CMD ["python", "agent.py"]
