"""Submission self-check: schema, IDs, non-empty answers, no remote needed for public set."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from agent import classify_task, accept_local_answer, load_tasks  # noqa: E402
from local_solvers import try_local_solve  # noqa: E402


def main() -> int:
    os.environ.setdefault("MODE", "hybrid")
    os.environ.setdefault("TRUST_LOCAL_NER", "1")
    os.environ.setdefault("ENABLE_POT", "0")

    path = ROOT / "public_validation.json"
    tasks = json.loads(path.read_text(encoding="utf-8"))
    results = []
    for t in tasks:
        prompt = t["prompt"]
        tt = classify_task(prompt)
        ans = try_local_solve(tt, prompt)
        if not accept_local_answer(tt, prompt, ans):
            print(f"FAIL {t['task_id']}: local not accepted ({tt})", file=sys.stderr)
            return 1
        results.append({"task_id": t["task_id"], "answer": ans})

    # Schema checks matching harness expectations.
    assert isinstance(results, list)
    assert len(results) == len(tasks)
    for r, t in zip(results, tasks):
        assert set(r) >= {"task_id", "answer"}
        assert r["task_id"] == t["task_id"]
        assert isinstance(r["answer"], str) and r["answer"].strip()

    out = ROOT / "_selfcheck_results.json"
    out.write_text(json.dumps(results, ensure_ascii=True, indent=2), encoding="utf-8")
    print(f"SELFCHECK_OK tasks={len(results)} file={out.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
