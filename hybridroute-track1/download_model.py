"""Download the bundled local GGUF used by the Docker image."""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from huggingface_hub import hf_hub_download

REPO = "bartowski/Qwen2.5-1.5B-Instruct-GGUF"
FILE = "Qwen2.5-1.5B-Instruct-Q4_K_M.gguf"
DEST = Path(__file__).resolve().parent / "models" / "model.gguf"


def main() -> int:
    DEST.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {REPO}/{FILE} ...")
    path = hf_hub_download(repo_id=REPO, filename=FILE)
    shutil.copyfile(path, DEST)
    print(f"Saved {DEST} ({DEST.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
