import argparse
import json
from pathlib import Path

from config import load_settings
from router import route_task


def run_eval(tasks_path: str) -> list[dict]:
    settings = load_settings()
    data = json.loads(Path(tasks_path).read_text(encoding="utf-8-sig"))

    results = []
    for item in data:
        result = route_task(item["task"], settings)
        results.append({"id": item["id"], **result})
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Batch evaluate routing decisions")
    parser.add_argument("--tasks", default="examples/sample_tasks.json", help="Path to tasks JSON file")
    parser.add_argument("--out", default="logs/eval_results.json", help="Path to output JSON")
    args = parser.parse_args()

    results = run_eval(args.tasks)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(results, indent=2, ensure_ascii=True), encoding="utf-8")

    local_count = sum(1 for x in results if x["provider"] != "fireworks")
    remote_count = len(results) - local_count
    remote_tokens = sum(int(x.get("remote_tokens_used", 0)) for x in results)
    print(f"Completed {len(results)} tasks. local={local_count} remote={remote_count}")
    print(f"Total remote tokens used={remote_tokens}")
    print(f"Saved to {out_path}")
    print("Task\tRoute\tRemoteTokens\tReason")
    for row in results:
        print(
            f"{row.get('id','?')}\t{row.get('route','?')}\t{row.get('remote_tokens_used',0)}\t"
            f"{row.get('route_reason','')[:80]}"
        )


if __name__ == "__main__":
    main()
