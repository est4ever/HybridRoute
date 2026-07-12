FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py local_solvers.py code_exec.py local_llm.py .

# INFRA-safe token cut on 2253/94.7%: keep minimax-first + 2 fallbacks + no PoT/GGUF.
# Only trim caps/prompts and avoid needless second calls on soft tasks.
ENV LOCAL_SOLVER_MODE=all \
    TRUST_LOCAL_NER=1 \
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
