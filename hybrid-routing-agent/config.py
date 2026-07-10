import os
from dataclasses import dataclass

from dotenv import load_dotenv

# Task types that route to LOCAL_CODING_MODEL_NAME when set.
CODING_TASK_TYPES = frozenset({"coding", "debugging"})

# Task types that never escalate to Fireworks, regardless of verifier noise.
HARD_LOCKED_LOCAL_TYPES = frozenset({"classification", "extraction", "rewriting"})


@dataclass(frozen=True)
class Settings:
    local_model_provider: str
    local_model_name: str
    local_coding_model_name: str
    fireworks_api_key: str
    fireworks_base_url: str
    fireworks_model: str
    route_confidence_threshold: float
    use_gemma: bool
    local_timeout_seconds: int
    local_max_predict: int
    high_risk_keywords: tuple[str, ...]


def _parse_bool(value: str, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_float(value: str, default: float) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def resolve_local_model_name(task_type: str, settings: Settings) -> tuple[str, str]:
    """Return (model_name, model_role) for the given task type."""
    if task_type in CODING_TASK_TYPES and settings.local_coding_model_name:
        return settings.local_coding_model_name, "coding"
    return settings.local_model_name, "general"


def load_settings() -> Settings:
    load_dotenv(override=True)

    provider = os.getenv("LOCAL_MODEL_PROVIDER", os.getenv("LOCAL_MODEL", "placeholder")).strip().lower()
    if provider not in {"placeholder", "ollama"}:
        provider = "placeholder"

    high_risk_raw = os.getenv(
        "HIGH_RISK_KEYWORDS",
        "legal,medical,finance,security,compliance,privacy,password,pii,production outage",
    )
    high_risk_keywords = tuple(x.strip().lower() for x in high_risk_raw.split(",") if x.strip())

    return Settings(
        local_model_provider=provider,
        local_model_name=os.getenv("LOCAL_MODEL_NAME", "gemma3:1b"),
        local_coding_model_name=os.getenv("LOCAL_CODING_MODEL_NAME", "").strip(),
        fireworks_api_key=os.getenv("FIREWORKS_API_KEY", ""),
        fireworks_base_url=os.getenv("FIREWORKS_BASE_URL", "https://api.fireworks.ai/inference/v1"),
        fireworks_model=os.getenv("FIREWORKS_MODEL", "accounts/fireworks/models/gemma3-27b-it"),
        route_confidence_threshold=_parse_float(os.getenv("ROUTE_CONFIDENCE_THRESHOLD"), 0.72),
        use_gemma=_parse_bool(os.getenv("USE_GEMMA"), True),
        local_timeout_seconds=int(os.getenv("LOCAL_MODEL_TIMEOUT_SECONDS", "45")),
        local_max_predict=int(os.getenv("LOCAL_MAX_PREDICT", "512")),
        high_risk_keywords=high_risk_keywords,
    )
