from typing import Any

from config import HARD_LOCKED_LOCAL_TYPES, Settings
from fireworks_client import call_fireworks
from local_model import answer_with_local_model
from logger import log_route_event
from prompt_compressor import compress_prompt
from verifier import score_local_answer

SKIPPED_LOCAL = {
    "answer": "",
    "provider": "skipped",
    "skipped": True,
    "reason": "pre-flight score > 60; local inference skipped",
}


def route_task(task: str, settings: Settings) -> dict[str, Any]:
    analysis = _analyze_task(task, settings)
    preflight = _compute_preflight_workload_score(task, analysis)
    band = preflight["band"]
    hard_locked = analysis["task_type"] in HARD_LOCKED_LOCAL_TYPES

    local_result: dict[str, Any]
    verification: dict[str, Any]
    should_call_remote = False
    route_reason: list[str] = []
    route = "local_only"

    if hard_locked:
        local_result = answer_with_local_model(task, settings, analysis["task_type"])
        verification = score_local_answer(task, local_result.get("answer", ""))
        route = "local_hard_lock"
        route_reason.append(f"hard-locked local task type: {analysis['task_type']}")
        should_call_remote = False
    elif band == "local_only":
        local_result = answer_with_local_model(task, settings, analysis["task_type"])
        verification = score_local_answer(task, local_result.get("answer", ""))
        route = "local_only"
        route_reason.append("pre-flight workload score <= 35")
        should_call_remote = False
    elif band == "remote_after_compression":
        local_result = dict(SKIPPED_LOCAL)
        verification = {"confidence": 0.0, "signals": ["local_skipped"], "json_valid": False}
        route = "remote_after_compression"
        route_reason.append("pre-flight workload score > 60; skipping local inference")
        should_call_remote = True
    else:
        local_result = answer_with_local_model(task, settings, analysis["task_type"])
        verification = score_local_answer(task, local_result.get("answer", ""))
        escalation_signals = _escalation_signals(preflight, verification, local_result, analysis, settings)

        if _local_passes_verification(task, verification, settings):
            route = "local_with_verifier_passed"
            route_reason.append("gray band but local verification passed; no remote call")
            should_call_remote = False
        elif len(escalation_signals) >= 2:
            route = "local_with_verifier_remote_fallback"
            route_reason.append("gray band; 2+ escalation signals: " + ", ".join(escalation_signals))
            should_call_remote = True
        else:
            route = "local_with_verifier_passed"
            route_reason.append(
                "gray band; insufficient escalation signals (" + ", ".join(escalation_signals) + ")"
            )
            should_call_remote = False

    local_confidence = verification["confidence"]
    compressed = None
    remote_result = None
    fallback_error = None
    remote_tokens_used = 0

    if should_call_remote:
        compressed = compress_prompt(task)
        try:
            remote_result = call_fireworks(compressed, settings)
            answer = remote_result["answer"]
            provider = "fireworks"
            remote_tokens_used = _extract_remote_tokens(remote_result)
        except Exception as exc:  # noqa: BLE001
            remote_result = {"error": str(exc)}
            fallback_error = str(exc)
            if local_result.get("skipped"):
                # Demo/resilience path: still answer locally when remote is unavailable.
                local_result = answer_with_local_model(task, settings, analysis["task_type"])
                verification = score_local_answer(task, local_result.get("answer", ""))
                route = "fireworks_failed_local_return"
                answer = local_result.get("answer", "")
                provider = local_result.get("provider", "local")
                route_reason.append("remote failed; fell back to local inference")
            else:
                route = "fireworks_failed_local_return"
                answer = local_result.get("answer", "")
                provider = local_result.get("provider", "local")
                route_reason.append("remote failed; returned best available answer")
    else:
        answer = local_result.get("answer", "")
        provider = local_result.get("provider", "local")

    workload = _merge_workload(preflight, verification)
    estimated_original_tokens = _estimate_tokens(task)
    estimated_compressed_tokens = _estimate_tokens(compressed or "")
    estimated_remote_tokens_saved = max(0, estimated_original_tokens - estimated_compressed_tokens)

    result: dict[str, Any] = {
        "task": task,
        "answer": answer,
        "provider": provider,
        "route": route,
        "analysis": analysis,
        "preflight": preflight,
        "workload": workload,
        "local": local_result,
        "verification": verification,
        "route_reason": "; ".join(route_reason),
        "confidence_before_remote": local_confidence,
        "used_compressed_prompt": bool(compressed),
        "estimated_original_prompt_tokens": estimated_original_tokens,
        "estimated_compressed_prompt_tokens": estimated_compressed_tokens if compressed else 0,
        "estimated_remote_tokens_saved": estimated_remote_tokens_saved if compressed else 0,
        "remote_tokens_used": remote_tokens_used,
    }
    if compressed is not None:
        result["compressed_prompt"] = compressed
    if remote_result is not None:
        result["remote"] = remote_result

    log_route_event(
        {
            "task_preview": task[:120],
            "route": route,
            "provider": provider,
            "local_provider": local_result.get("provider"),
            "local_model": local_result.get("model_used"),
            "local_model_role": local_result.get("model_role"),
            "local_skipped": bool(local_result.get("skipped")),
            "local_confidence": local_confidence,
            "threshold": settings.route_confidence_threshold,
            "preflight_score": preflight["score"],
            "preflight_band": preflight["band"],
            "workload_score": workload["score"],
            "workload_reasons": workload["reasons"],
            "hard_locked_local": hard_locked,
            "is_high_risk": analysis["is_high_risk"],
            "local_error": local_result.get("error"),
            "fallback_error": fallback_error,
            "route_reason": result["route_reason"],
            "estimated_original_prompt_tokens": estimated_original_tokens,
            "estimated_compressed_prompt_tokens": estimated_compressed_tokens if compressed else 0,
            "estimated_remote_tokens_saved": estimated_remote_tokens_saved if compressed else 0,
            "remote_tokens_used": remote_tokens_used,
            "verifier_signals": verification.get("signals", []),
        }
    )
    return result


def _local_passes_verification(task: str, verification: dict[str, Any], settings: Settings) -> bool:
    """Strong pass blocks remote escalation to avoid false-remote token spend."""
    confidence = verification["confidence"]
    signals = set(verification.get("signals", []))
    if confidence < settings.route_confidence_threshold:
        return False
    if "invalid_json" in signals or "empty_answer" in signals:
        return False
    if "json" in task.lower():
        return verification.get("json_valid", False) or "valid_json" in signals
    return True


def _escalation_signals(
    preflight: dict[str, Any],
    verification: dict[str, Any],
    local_result: dict[str, Any],
    analysis: dict[str, Any],
    settings: Settings,
) -> list[str]:
    signals: list[str] = []
    verifier_signals = set(verification.get("signals", []))

    if local_result.get("error"):
        signals.append("local_error")
    if verification["confidence"] < settings.route_confidence_threshold:
        signals.append("low_confidence")
    if "invalid_json" in verifier_signals:
        signals.append("invalid_json")
    if analysis["is_high_risk"]:
        signals.append("high_risk_keyword")
    if "uncertain_language" in verifier_signals:
        signals.append("uncertain_language")
    if "empty_answer" in verifier_signals:
        signals.append("empty_answer")
    if preflight["score"] >= 50:
        signals.append("upper_gray_band")
    if analysis["requires_exact_json"] and not verification.get("json_valid", False):
        signals.append("strict_format_unmet")
    return signals


def _analyze_task(task: str, settings: Settings) -> dict[str, Any]:
    lowered = task.lower()
    matched = [kw for kw in settings.high_risk_keywords if kw in lowered]
    return {
        "is_high_risk": bool(matched),
        "matched_risk_keywords": matched,
        "task_type": _task_type(lowered),
        "requires_exact_json": "json" in lowered and any(k in lowered for k in {"valid", "strict", "exact"}),
        "requires_code": "code" in lowered,
        "contains_complex_keywords": any(
            k in lowered for k in {"step-by-step", "analyze", "compare", "debug", "optimize"}
        ),
        "is_ambiguous_or_multistep": _is_ambiguous_or_multistep(lowered),
    }


def _is_ambiguous_or_multistep(lowered_task: str) -> bool:
    if any(k in lowered_task for k in {" then ", " also ", "identify", "implementation plan"}):
        return True
    return lowered_task.count(" and ") >= 2


def _task_type(lowered_task: str) -> str:
    if "json" in lowered_task:
        return "structured_json"
    if "debug" in lowered_task:
        return "debugging"
    if "architecture" in lowered_task or "implementation plan" in lowered_task:
        return "planning_architecture"
    if "math" in lowered_task or "reason" in lowered_task or "why" in lowered_task:
        return "math_reasoning"
    if "code" in lowered_task:
        return "coding"
    if "summarize" in lowered_task or "summary" in lowered_task:
        return "summarization"
    if "rewrite" in lowered_task or "rephrase" in lowered_task:
        return "rewriting"
    if "extract" in lowered_task or "keyword" in lowered_task:
        return "extraction"
    if "classify" in lowered_task or "sentiment" in lowered_task or "yes/no" in lowered_task:
        return "classification"
    return "general"


def _compute_preflight_workload_score(task: str, analysis: dict[str, Any]) -> dict[str, Any]:
    """Task-only score used BEFORE any local inference."""
    score = 0
    reasons: list[str] = []

    base_scores = {
        "classification": 10,
        "extraction": 15,
        "summarization": 20,
        "rewriting": 20,
        "structured_json": 35,
        "coding": 45,
        "debugging": 50,
        "math_reasoning": 55,
        "long_context_analysis": 60,
        "planning_architecture": 60,
        "general": 25,
    }
    task_type = analysis["task_type"]
    base = base_scores.get(task_type, 25)
    score += base
    reasons.append(f"base:{task_type}+{base}")

    if len(task) > 3000:
        score += 20
        reasons.append("context_length>3000:+20")
    elif len(task) > 1000:
        score += 10
        reasons.append("context_length>1000:+10")

    if analysis["requires_exact_json"]:
        score += 20
        reasons.append("requires_exact_json:+20")
    if analysis["requires_code"]:
        score += 20
        reasons.append("requires_code:+20")
    if analysis["contains_complex_keywords"]:
        score += 15
        reasons.append("complex_instruction:+15")
    if analysis["is_ambiguous_or_multistep"]:
        score += 10
        reasons.append("many_constraints:+10")

    score = max(0, min(100, score))
    if score <= 35:
        band = "local_only"
    elif score <= 60:
        band = "local_with_verifier"
    else:
        band = "remote_after_compression"

    return {"score": score, "band": band, "reasons": reasons}


def _merge_workload(preflight: dict[str, Any], verification: dict[str, Any]) -> dict[str, Any]:
    """Post-local score for logging only; routing already decided pre-flight + verifier."""
    score = preflight["score"]
    reasons = list(preflight["reasons"])
    signals = set(verification.get("signals", []))

    if "uncertain_language" in signals:
        score += 15
        reasons.append("local_uncertain:+15")
    if "too_short" in signals or "empty_answer" in signals:
        score += 10
        reasons.append("local_too_short:+10")
    if "invalid_json" in signals:
        score += 30
        reasons.append("json_parse_failed:+30")

    score = max(0, min(100, score))
    return {"score": score, "band": preflight["band"], "reasons": reasons}


def _estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, (len(text) + 3) // 4)


def _extract_remote_tokens(remote_result: dict[str, Any]) -> int:
    raw = remote_result.get("raw", {})
    if isinstance(raw, dict):
        usage = raw.get("usage")
        if isinstance(usage, dict):
            total = usage.get("total_tokens")
            if isinstance(total, int):
                return total
    return 0
