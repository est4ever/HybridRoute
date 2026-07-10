import argparse
import json

from config import load_settings
from router import route_task


def main() -> None:
    parser = argparse.ArgumentParser(description="Hybrid routing agent CLI")
    parser.add_argument("task", nargs="*", help="Task text to process")
    parser.add_argument("--json", action="store_true", help="Print full JSON output")
    args = parser.parse_args()

    task = " ".join(args.task).strip()
    if not task:
        task = input("Enter task: ").strip()
    if not task:
        raise SystemExit("Task is required.")

    settings = load_settings()
    result = route_task(task, settings)

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=True))
    else:
        print(result["answer"])
        print(
            f"route={result['route']} provider={result['provider']} "
            f"preflight_score={result['preflight']['score']} confidence={result['verification']['confidence']}"
        )
        if result["local"].get("model_used"):
            print(f"local_model={result['local']['model_used']} role={result['local'].get('model_role')}")
        print(f"reason={result['route_reason']}")
        print(f"estimated_remote_tokens_saved={result['estimated_remote_tokens_saved']}")


if __name__ == "__main__":
    main()
