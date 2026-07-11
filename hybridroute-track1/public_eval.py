"""Grade local solvers against official public validation examples."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from agent import classify_task  # noqa: E402
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
    if t == "sentiment_mixed_ok":
        if re.search(r"\bnegative\b", al) and not re.search(
            r"\b(mixed|neutral|positive)\b", al
        ):
            return False
        if not re.search(r"\b(mixed|neutral|positive)\b", al):
            return False
        # Must acknowledge both sides somehow.
        neg_side = bool(re.search(r"problem|late|damage|dent|missing|complaint|delay", al))
        pos_side = bool(
            re.search(r"positive|perfect|flawless|support|worked|outcome|good", al)
        )
        return neg_side and pos_side
    if t == "two_sentences_both_sides":
        sents = re.findall(r"[^.!?]+[.!?]", a)
        if len(sents) != 2:
            return False
        return all(any(v in al for v in check["values"][:2]) for _ in [0]) or (
            any(v in al for v in ("diagnos", "health", "monitor", "image"))
            and any(v in al for v in ("bias", "privacy", "regulat", "liab", "interpret"))
        )
    if t == "three_bullets_15":
        bullets = [ln for ln in a.splitlines() if re.match(r"^\s*[-*•]", ln.strip())]
        if len(bullets) != 3:
            return False
        for b in bullets:
            words = re.sub(r"^[-*•]\s*", "", b.strip()).split()
            if len(words) > 15:
                return False
        return all(any(v in al for v in [val]) for val in check["values"]) or (
            "flex" in al and "collabor" in al and ("office" in al or "tool" in al)
        )
    if t == "ner_entities":
        try:
            parsed = json.loads(a)
        except json.JSONDecodeError:
            return False
        blob = json.dumps(parsed).lower()
        for text, typ in check["values"]:
            if text.lower() not in blob:
                return False
            if typ.lower() not in blob and (
                typ != "ORGANIZATION" or "organization" not in blob and "org" not in blob
            ):
                # require type nearby - loose: type string present in json
                if typ.upper() == "ORGANIZATION" and "organization" not in blob:
                    return False
                if typ.upper() != "ORGANIZATION" and typ.lower() not in blob:
                    return False
        return "sundar pichai" in blob and "google" in blob and "eth zurich" in blob
    return False


def main() -> int:
    tasks = json.loads(
        Path(__file__).with_name("public_validation.json").read_text(encoding="utf-8")
    )
    ok_n = 0
    for t in tasks:
        cat = classify_task(t["prompt"])
        ans = try_local_solve(cat, t["prompt"])
        ok = bool(ans) and grade(ans, t["check"])
        print(
            f"{'OK' if ok else 'XX'} {t['task_id']:4} {cat:16} "
            f"{(ans or 'NONE').replace(chr(10), ' ')[:90]}"
        )
        ok_n += int(ok)
    print(f"\nPublic validation local: {ok_n}/{len(tasks)}")
    return 0 if ok_n == len(tasks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
