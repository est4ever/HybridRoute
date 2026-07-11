"""Sandboxed Python execution for verified answers."""

from __future__ import annotations

import os
import re
import subprocess
import sys
import tempfile
import textwrap

_CODE_BLOCK_RE = re.compile(r"```(?:python|py)?\s*\n(.*?)```", re.DOTALL | re.IGNORECASE)
_DEF_RE = re.compile(r"(?m)^(def\s+\w+\s*\(.*)", re.DOTALL)

# Soft CPU cap only — do NOT set RLIMIT_AS (can OOM/kill oddly in 4GB harness boxes).
_GUARD = textwrap.dedent(
    """
    try:
        import resource
        resource.setrlimit(resource.RLIMIT_CPU, (3, 3))
    except Exception:
        pass
    """
)


def extract_code(text: str) -> str:
    """Pull the first fenced Python block, else first def..., else raw text."""
    if not text:
        return ""
    m = _CODE_BLOCK_RE.search(text)
    if m:
        return m.group(1).strip()
    corrected = re.search(r"(?is)corrected code:\s*(.+)$", text)
    if corrected:
        body = corrected.group(1).strip()
        body = re.sub(r"^```(?:\w+)?\s*", "", body)
        body = re.sub(r"\s*```$", "", body)
        return body.strip()
    def_m = _DEF_RE.search(text)
    if def_m:
        return text[def_m.start() :].strip()
    return text.strip()


def extract_function_name(prompt: str, code: str = "") -> str | None:
    patterns = [
        r"\bfunction\s+called\s+(\w+)",
        r"\bdef\s+(\w+)\s*\(",
        r"\b(?:function|method)\s+(\w+)\s*\(",
        r"\bwrite\s+(?:a\s+)?(?:python\s+)?function\s+(\w+)",
        r"\bimplement\s+(\w+)\s*\(",
        r"\bcalled\s+(\w+)\s*\(",
    ]
    for pat in patterns:
        m = re.search(pat, prompt, re.I)
        if m:
            return m.group(1)
    if code:
        m = re.search(r"(?m)^def\s+(\w+)\s*\(", code)
        if m:
            return m.group(1)
    return None


def _subprocess_env() -> dict[str, str]:
    env = {
        "PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
        "PYTHONHASHSEED": "0",
        "HOME": os.environ.get("HOME", "/tmp"),
        "LANG": os.environ.get("LANG", "C.UTF-8"),
        "LC_ALL": os.environ.get("LC_ALL", "C.UTF-8"),
    }
    # Windows local testing only.
    if os.name == "nt":
        for key in ("SYSTEMROOT", "SYSTEMDRIVE", "WINDIR", "TEMP", "TMP"):
            if key in os.environ:
                env[key] = os.environ[key]
    return env


def _run(script: str, timeout: float = 4.0) -> tuple[bool, str]:
    path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        ) as f:
            f.write(_GUARD + "\n" + script)
            path = f.name
        proc = subprocess.run(
            [sys.executable, "-I", path],
            capture_output=True,
            text=True,
            timeout=timeout,
            env=_subprocess_env(),
        )
        if proc.returncode == 0:
            return True, (proc.stdout or "").strip()
        return False, ((proc.stderr or proc.stdout) or "").strip()
    except subprocess.TimeoutExpired:
        return False, "TIMEOUT"
    except Exception as exc:  # noqa: BLE001
        return False, f"EXEC_ERROR: {exc}"
    finally:
        if path:
            try:
                os.unlink(path)
            except OSError:
                pass


def run_program(code: str, timeout: float = 4.0) -> tuple[bool, str]:
    code = extract_code(code)
    if not code:
        return False, "NO_CODE"
    return _run(code, timeout=timeout)


def compile_ok(code: str) -> bool:
    code = extract_code(code)
    if not code:
        return False
    try:
        compile(code, "<generated>", "exec")
        return True
    except SyntaxError:
        return False


def smoke_call(code: str, function_name: str | None, timeout: float = 3.0) -> bool:
    """Confirm the function exists and is loadable."""
    code = extract_code(code)
    if not code or not compile_ok(code):
        return False
    if not function_name:
        return True
    harness = code + "\n" + f"assert callable({function_name})\n" + "print('OK')\n"
    ok, out = _run(harness, timeout=timeout)
    return ok and out.endswith("OK")
