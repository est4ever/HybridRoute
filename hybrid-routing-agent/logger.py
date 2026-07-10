import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def log_route_event(event: dict[str, Any], log_file: str = "logs/runs.jsonl") -> None:
    path = Path(log_file)
    path.parent.mkdir(parents=True, exist_ok=True)

    enriched = {"timestamp": datetime.now(timezone.utc).isoformat(), **event}
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(enriched, ensure_ascii=True) + "\n")
