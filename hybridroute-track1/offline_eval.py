"""Offline coverage check: local solvers only (no Fireworks)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from agent import classify_task  # noqa: E402
from code_exec import extract_code, _run  # noqa: E402
from local_solvers import try_local_solve  # noqa: E402


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
    if t == "code_tests":
        code = extract_code(a) or a
        harness = (
            code
            + "\n\n"
            + f"_tests = {check['tests']!r}\n"
            + f"_fn = {check['function_name']}\n"
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
        ok, out = _run(harness, timeout=5.0)
        return ok and out.endswith("PASS")
    return False


def main() -> int:
    tasks = json.loads(Path(__file__).with_name("eval_set.json").read_text(encoding="utf-8"))
    local_ok = 0
    need_remote = []
    for t in tasks:
        cat = classify_task(t["prompt"])
        ans = try_local_solve(cat, t["prompt"])
        if not ans:
            print(f"-- {t['task_id']:4} {cat:16} NEED_REMOTE")
            need_remote.append(t["task_id"])
            continue
        ok = grade(ans, t["check"])
        print(
            f"{'OK' if ok else 'XX'} {t['task_id']:4} {cat:16} LOCAL {ans.replace(chr(10), ' ')[:70]}"
        )
        if ok:
            local_ok += 1
        else:
            need_remote.append(t["task_id"])
    n = len(tasks)
    print(f"\nLocal exact: {local_ok}/{n} = {local_ok/n*100:.1f}%")
    print(f"Need remote / failed local: {need_remote}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
