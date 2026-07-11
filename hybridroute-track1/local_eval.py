"""Local accuracy harness against eval_set.json (Joker-style graders)."""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

# Allow importing agent modules from this directory.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from code_exec import extract_code  # noqa: E402
from openai import OpenAI  # noqa: E402

import agent  # noqa: E402


def _num(s: str):
    m = re.findall(r"-?\d+(?:\.\d+)?", (s or "").replace(",", ""))
    return float(m[-1]) if m else None


def grade(answer: str, check: dict) -> bool:
    a = answer or ""
    al = a.lower()
    t = check["type"]
    if t == "numeric":
        n = _num(a)
        return n is not None and abs(n - float(check["value"])) < 1e-6
    if t == "contains_all":
        return all(str(v).lower() in al for v in check["values"])
    if t == "contains_any":
        return any(str(v).lower() in al for v in check["values"])
    if t == "regex":
        return re.search(check["pattern"], a) is not None
    if t == "code_tests":
        # Prefer extracted code body for harnesses that ignore prose.
        code = extract_code(a) or a
        ok, _ = _run_tests(code, check["function_name"], check["tests"])
        return ok
    return False


def _run_tests(code: str, function_name: str, tests: list) -> tuple[bool, str]:
    # Inline minimal runner using code_exec.run_program style harness.
    from code_exec import _run

    harness = (
        code
        + "\n\n"
        + f"_tests = {tests!r}\n"
        + f"_fn = {function_name}\n"
        + "_ok = True\n"
        + "for _t in _tests:\n"
        + "    try:\n"
        + "        _r = _fn(*_t['args'])\n"
        + "        if _r != _t['expected']:\n"
        + "            _ok = False\n"
        + "    except Exception:\n"
        + "        _ok = False\n"
        + "print('PASS' if _ok else 'FAIL')\n"
    )
    ok, out = _run(harness, timeout=10.0)
    return (ok and out.endswith("PASS")), out


def main() -> int:
    eval_path = Path(__file__).with_name("eval_set.json")
    tasks = json.loads(eval_path.read_text(encoding="utf-8"))

    api_key = os.environ.get("FIREWORKS_API_KEY")
    base_url = os.environ.get(
        "FIREWORKS_BASE_URL", "https://api.fireworks.ai/inference/v1"
    )
    allowed = [
        m.strip()
        for m in os.environ.get(
            "ALLOWED_MODELS",
            "minimax-m3,kimi-k2p7-code,gemma-4-31b-it,gemma-4-26b-a4b-it,gemma-4-31b-it-nvfp4",
        ).split(",")
        if m.strip()
    ]
    if not api_key:
        print("FIREWORKS_API_KEY required", file=sys.stderr)
        return 1

    client = OpenAI(api_key=api_key, base_url=base_url, timeout=90.0)
    unavailable: set[str] = set()

    rows = []
    for task in tasks:
        result = agent.process_task(
            {"task_id": task["task_id"], "prompt": task["prompt"]},
            client,
            allowed,
            unavailable,
        )
        answer = result["answer"]
        ok = grade(answer, task["check"])
        cat = task.get("category", "?")
        rows.append((task["task_id"], cat, ok, answer.replace("\n", " ")[:70]))
        print(f"{'OK' if ok else 'XX'} {task['task_id']:4} {cat:16} {answer.replace(chr(10), ' ')[:70]}")

    total = sum(1 for r in rows if r[2])
    n = len(rows)
    print(f"\nAccuracy: {total}/{n} = {total/n*100:.1f}%")
    print(f"local_solves={agent.LOCAL_SOLVES} remote_calls={agent.REMOTE_CALLS} tokens={agent.REMOTE_TOKENS}")
    return 0 if total / n >= 0.8 else 1


if __name__ == "__main__":
    raise SystemExit(main())
