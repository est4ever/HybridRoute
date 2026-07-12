FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py local_solvers.py code_exec.py local_llm.py .

# Token cut vs 2337/89.5%: cheaper language models, tighter caps, gated theme summaries.
# Keep hybrid escalate for hard math/logic/code. Rank = tokens after ≥80% gate.
ENV LOCAL_SOLVER_MODE=all \
    TRUST_LOCAL_NER=1 \
    MAX_WORKERS=1 \
    MAX_MODEL_FALLBACKS=1 \
    ENABLE_POT=0 \
    ENABLE_CODE_SMOKE=1 \
    ENABLE_LOCAL_LLM=0 \
    ENABLE_LOCAL_POT=0 \
    MODE=hybrid \
    TIME_BUDGET_SEC=480 \
    PYTHONUNBUFFERED=1

CMD ["python", "agent.py"]
