import json
import re
import urllib.error
import urllib.request
from typing import Any

from config import Settings, resolve_local_model_name

# Tiny models sometimes emit replacement chars / broken emoji tails (e.g. "e???").
_BROKEN_EMOJI_TAIL = re.compile(r"(?:\s*[eE]\?{2,}|\s*\?{3,})\s*$")


def _clean_local_answer(text: str) -> str:
    cleaned = text.replace("\ufffd", "").strip()
    cleaned = _BROKEN_EMOJI_TAIL.sub("", cleaned).strip()
    return cleaned


def answer_with_local_model(task: str, settings: Settings, task_type: str = "general") -> dict[str, Any]:
    model_name, model_role = resolve_local_model_name(task_type, settings)
    if settings.local_model_provider == "ollama":
        result = _answer_with_ollama(
            task,
            model_name,
            settings.local_timeout_seconds,
            settings.local_max_predict,
        )
    else:
        result = _answer_with_placeholder(task, task_type)
    result["model_used"] = model_name
    result["model_role"] = model_role
    return result


def _answer_with_placeholder(task: str, task_type: str) -> dict[str, Any]:
    lowered = task.lower()
    if task_type == "classification" or "sentiment" in lowered:
        answer = "neutral"
    elif "json" in lowered:
        answer = '{"topic":"inference","difficulty":"medium"}'
    elif "summarize" in lowered:
        answer = "AI agents automate repetitive work by planning, tool use, and self-checks."
    elif task_type in {"coding", "debugging"}:
        answer = "def solve():\n    return None"
    else:
        answer = f"Local placeholder answer: {task[:160]}"

    return {"answer": answer, "provider": "placeholder", "raw": {"mode": "placeholder"}}


def _answer_with_ollama(
    task: str,
    model_name: str,
    timeout_seconds: int,
    max_predict: int,
) -> dict[str, Any]:
    payload = {
        "model": model_name,
        "prompt": task,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": max(64, max_predict),
        },
    }
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout_seconds) as response:
            data = json.loads(response.read().decode("utf-8"))
            answer = _clean_local_answer(str(data.get("response", "")))
            if not answer:
                raise RuntimeError("Ollama returned an empty response.")
            return {"answer": answer, "provider": "ollama", "raw": data}
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, RuntimeError) as exc:
        return {
            "answer": "",
            "provider": "ollama",
            "error": str(exc),
            "raw": {"mode": "ollama", "error": str(exc)},
        }
