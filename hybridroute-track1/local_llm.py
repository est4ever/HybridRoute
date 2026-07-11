"""Optional bundled GGUF local LLM (zero Fireworks tokens)."""

from __future__ import annotations

import os
import threading
from typing import Any

_LOCK = threading.Lock()
_LLM: Any = None
_LOAD_ATTEMPTED = False

SYSTEM_BY_TYPE = {
    "factual": "Answer accurately in 1-2 short sentences. No preamble.",
    "math": "Solve the math. Put the final number first, then brief steps.",
    "sentiment": "Classify as Positive, Negative, Neutral, or Mixed. One line: Label - reason.",
    "summarization": "Summarize exactly as requested. Output only the summary.",
    "ner": 'Extract entities as JSON only: [{"text":"...","type":"PERSON|ORG|LOCATION|DATE|..."}].',
    "logic": "Solve the puzzle. Answer first, then short reasoning.",
    "code_generation": "Return only the requested Python function. No markdown fences.",
    "code_debugging": "Return corrected Python function only. No markdown fences.",
}


def local_llm_available() -> bool:
    path = os.environ.get("LOCAL_MODEL_PATH", "/app/models/model.gguf")
    return bool(path) and os.path.isfile(path)


def _get_llm():
    global _LLM, _LOAD_ATTEMPTED
    with _LOCK:
        if _LOAD_ATTEMPTED:
            return _LLM
        _LOAD_ATTEMPTED = True
        path = os.environ.get("LOCAL_MODEL_PATH", "/app/models/model.gguf")
        if not path or not os.path.isfile(path):
            _LLM = None
            return None
        try:
            from llama_cpp import Llama

            n_ctx = int(os.environ.get("LOCAL_N_CTX", "2048"))
            n_threads = int(os.environ.get("LOCAL_N_THREADS", "2"))
            _LLM = Llama(
                model_path=path,
                n_ctx=n_ctx,
                n_threads=n_threads,
                n_batch=256,
                verbose=False,
            )
        except Exception as exc:  # noqa: BLE001
            print(f"[local_llm] load failed: {exc}", flush=True)
            _LLM = None
        return _LLM


def answer_with_local_llm(task_type: str, prompt: str, max_tokens: int = 256) -> str | None:
    """Generate a local answer. Returns None if model missing/failed."""
    if os.environ.get("ENABLE_LOCAL_LLM", "1") in {"0", "false", "no"}:
        return None
    llm = _get_llm()
    if llm is None:
        return None
    system = SYSTEM_BY_TYPE.get(task_type, SYSTEM_BY_TYPE["factual"])
    # Prefer chat API when available.
    try:
        with _LOCK:
            if hasattr(llm, "create_chat_completion"):
                resp = llm.create_chat_completion(
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.0,
                    max_tokens=max_tokens,
                )
                content = resp["choices"][0]["message"]["content"]
            else:
                full = f"System: {system}\nUser: {prompt}\nAssistant:"
                resp = llm(
                    full,
                    temperature=0.0,
                    max_tokens=max_tokens,
                    stop=["User:", "System:"],
                )
                content = resp["choices"][0]["text"]
        text = (content or "").strip()
        return text or None
    except Exception as exc:  # noqa: BLE001
        print(f"[local_llm] generate failed: {exc}", flush=True)
        return None
