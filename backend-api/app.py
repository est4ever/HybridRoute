import sys
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
AGENT_DIR = ROOT / "hybrid-routing-agent"
sys.path.insert(0, str(AGENT_DIR))

load_dotenv(AGENT_DIR / ".env")

from config import load_settings  # noqa: E402
from router import route_task  # noqa: E402

app = FastAPI(title="HybridRoute Demo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RouteRequest(BaseModel):
    prompt: str = Field(min_length=1)


UiRoute = Literal[
    "local_only",
    "local_hard_lock",
    "local_with_verifier_passed",
    "remote_after_compression",
]
UiProvider = Literal["ollama", "fireworks"]
UiComplexity = Literal["local_only", "local_with_verifier", "remote_after_compression"]


def _format_model_name(name: str) -> str:
    prefix = "accounts/fireworks/models/"
    if name.startswith(prefix):
        return name[len(prefix) :]
    return name


def _to_ui_response(result: dict[str, Any], settings: Any | None = None) -> dict[str, Any]:
    provider_raw = str(result.get("provider", "local"))
    route_raw = str(result.get("route", "local_only"))
    remote_attempted_routes = {
        "local_with_verifier_remote_fallback",
        "fireworks_failed_no_local_fallback",
    }
    if provider_raw == "fireworks":
        provider: UiProvider = "fireworks"
    elif route_raw == "fireworks_failed_local_return":
        provider = "ollama"
    elif route_raw in remote_attempted_routes:
        provider = "fireworks"
    else:
        provider = "ollama"

    route_map: dict[str, UiRoute] = {
        "local_with_verifier_remote_fallback": (
            "remote_after_compression" if provider == "fireworks" else "local_with_verifier_passed"
        ),
        "fireworks_failed_local_return": "local_with_verifier_passed",
        "fireworks_failed_no_local_fallback": "remote_after_compression",
    }
    selected_route: UiRoute = route_map.get(route_raw, route_raw)  # type: ignore[assignment]
    if selected_route not in {
        "local_only",
        "local_hard_lock",
        "local_with_verifier_passed",
        "remote_after_compression",
    }:
        selected_route = "local_only" if provider == "ollama" else "remote_after_compression"

    preflight = result.get("preflight", {})
    analysis = result.get("analysis", {})
    verification = result.get("verification", {})
    local = result.get("local", {})

    complexity_raw = str(preflight.get("band", "local_only"))
    complexity: UiComplexity = (
        complexity_raw  # type: ignore[assignment]
        if complexity_raw in {"local_only", "local_with_verifier", "remote_after_compression"}
        else "local_with_verifier"
    )

    model_name = local.get("model_used")
    if provider == "fireworks":
        model_name = settings.fireworks_model if settings else model_name or "fireworks"
    remote = result.get("remote", {})
    remote_error = str(remote.get("error", "")).strip()
    if remote_error and "invalid" in remote_error.lower():
        reason = str(result.get("route_reason", ""))
        if reason:
            reason += "; fireworks key invalid or expired"
        result = dict(result)
        result["route_reason"] = reason
    response_text = str(result.get("answer", "")).strip()
    if not response_text:
        if remote_error:
            response_text = (
                "Remote model call failed for this request. "
                f"Details: {remote_error}"
            )
        else:
            response_text = (
                "No answer was generated. Check FIREWORKS_API_KEY, model access, "
                "and local model availability (Ollama)."
            )

    return {
        "selected_route": selected_route,
        "provider": provider,
        "model": _format_model_name(str(model_name or "unknown")),
        "local_model_role": local.get("model_role", "general"),
        "reason": str(result.get("route_reason", "")),
        "complexity": complexity,
        "preflight_score": int(preflight.get("score", 0)),
        "task_type": str(analysis.get("task_type", "general")),
        "confidence": float(verification.get("confidence", 0.0)),
        "remote_tokens_used": int(result.get("remote_tokens_used", 0)),
        "estimated_tokens_saved": int(result.get("estimated_remote_tokens_saved", 0)),
        "estimated_original_prompt_tokens": int(result.get("estimated_original_prompt_tokens", 0)),
        "response": response_text,
    }


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "hybridroute-demo-api"}


@app.post("/api/route")
def route_prompt(request: RouteRequest) -> dict[str, Any]:
    settings = load_settings()
    result = route_task(request.prompt, settings)
    return _to_ui_response(result, settings)
