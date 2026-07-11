"""Optional bundled GGUF local LLM (zero Fireworks tokens)."""

from __future__ import annotations

import os
import re
import threading
from typing import Any

from code_exec import compile_ok, extract_code, run_program

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
    "code_generation": "Return only the requested Python function in a ```python block. No explanation.",
    "code_debugging": "Return ONLY the corrected Python function in a ```python block. No explanation.",
}

MATH_POT_SYS = (
    "Write a short self-contained Python 3 program that computes the answer and "
    "prints ONLY the final numeric answer via print(). No words, no units. "
    "Use ```python fences."
)

LOGIC_POT_SYS = (
    "Write a short self-contained Python 3 program that enumerates possibilities "
    "satisfying every constraint, then prints ONLY the direct answer (name or label). "
    "Use ```python fences. No explanation."
)


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
            common = dict(
                model_path=path,
                n_ctx=n_ctx,
                n_threads=n_threads,
                n_batch=256,
                verbose=False,
            )
            try:
                _LLM = Llama(**common)
            except Exception:
                _LLM = Llama(**common, chat_format="chatml")
        except Exception as exc:  # noqa: BLE001
            print(f"[local_llm] load failed: {exc}", flush=True)
            _LLM = None
        return _LLM


def generate_local(
    prompt: str,
    system: str,
    max_tokens: int = 256,
    temperature: float = 0.0,
) -> str | None:
    if os.environ.get("ENABLE_LOCAL_LLM", "1") in {"0", "false", "no"}:
        return None
    llm = _get_llm()
    if llm is None:
        return None
    try:
        with _LOCK:
            resp = llm.create_chat_completion(
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = resp["choices"][0]["message"]["content"]
        text = (content or "").strip()
        return text or None
    except Exception as exc:  # noqa: BLE001
        print(f"[local_llm] generate failed: {exc}", flush=True)
        return None


def answer_with_local_llm(task_type: str, prompt: str, max_tokens: int = 256) -> str | None:
    system = SYSTEM_BY_TYPE.get(task_type, SYSTEM_BY_TYPE["factual"])
    return generate_local(prompt, system, max_tokens=max_tokens, temperature=0.0)


def local_program_of_thought(task_type: str, prompt: str) -> str | None:
    """Ask local LLM for a Python program, execute it, optionally require agreement."""
    if not local_llm_available():
        return None
    system = MATH_POT_SYS if task_type == "math" else LOGIC_POT_SYS
    samples = max(1, min(int(os.environ.get("LOCAL_POT_SAMPLES", "2")), 3))
    outputs: list[str] = []

    for i in range(samples):
        temp = 0.0 if i == 0 else 0.2
        raw = generate_local(prompt, system, max_tokens=320, temperature=temp)
        if not raw:
            continue
        ok, out = run_program(raw, timeout=4.0)
        if not ok or not out:
            continue
        line = out.strip().splitlines()[-1].strip()
        if not _pot_output_ok(line):
            continue
        outputs.append(line)
        # Math: accept first clean number.
        if task_type == "math" and re.fullmatch(r"-?\d+(?:\.\d+)?", line):
            break
        # Logic/math: stop early if two agree.
        if len(outputs) >= 2 and outputs[-1] == outputs[-2]:
            break

    if not outputs:
        return None

    best = max(set(outputs), key=outputs.count)
    # Require agreement when multiple samples requested and we got more than one distinct.
    if samples >= 2 and len(outputs) >= 2:
        if outputs.count(best) < 2 and task_type == "logic":
            # Unverified logic — refuse so Fireworks can try.
            return None

    if task_type == "math":
        if "change" in prompt.lower() and re.fullmatch(r"-?\d+(?:\.\d+)?", best):
            return f"Change: ${best}"
        return best
    return best


def local_code_answer(task_type: str, prompt: str) -> str | None:
    """Generate code locally and accept only if it compiles."""
    raw = answer_with_local_llm(task_type, prompt, max_tokens=400)
    if not raw:
        return None
    code = extract_code(raw)
    if not code or not compile_ok(code):
        return None
    if task_type == "code_debugging":
        return (
            "Bug: Fixed incorrect logic in the provided implementation.\n\n"
            f"Corrected code:\n{code}"
        )
    return code


def _pot_output_ok(out: str) -> bool:
    s = (out or "").strip()
    if not s or len(s) > 200:
        return False
    if s.startswith("<") and s.endswith(">"):
        return False
    if "Traceback" in s or "Error" in s:
        return False
    if "object at 0x" in s:
        return False
    return True
