import json
from typing import Any


def score_local_answer(task: str, answer: str) -> dict[str, Any]:
    if not answer or not answer.strip():
        return {"confidence": 0.0, "signals": ["empty_answer"], "json_valid": False}

    signals: list[str] = []
    confidence = 0.58
    json_requested = "json" in task.lower()
    json_valid = False

    task_len = len(task.split())
    answer_len = len(answer.split())
    if answer_len >= max(4, int(task_len * 0.25)):
        confidence += 0.2
        signals.append("length_ok")
    else:
        signals.append("too_short")

    if json_requested:
        try:
            json.loads(answer)
            confidence += 0.24
            signals.append("valid_json")
            json_valid = True
        except json.JSONDecodeError:
            confidence -= 0.2
            signals.append("invalid_json")

    if any(word in answer.lower() for word in {"i don't know", "cannot", "unsure"}):
        confidence -= 0.2
        signals.append("uncertain_language")

    confidence = max(0.0, min(1.0, round(confidence, 3)))
    return {"confidence": confidence, "signals": signals, "json_valid": json_valid}
