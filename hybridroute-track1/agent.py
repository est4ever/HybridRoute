import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from openai import OpenAI

INPUT_PATH = os.environ.get("INPUT_PATH", "/input/tasks.json")
OUTPUT_PATH = os.environ.get("OUTPUT_PATH", "/output/results.json")
FALLBACK_ANSWER = "Unable to complete this task due to an inference error."
EMPTY_ANSWER = "No answer generated."

# Process-wide counters for local testing / logs (Fireworks usage only).
REMOTE_CALLS = 0
REMOTE_TOKENS = 0
LOCAL_SOLVES = 0

from local_solvers import try_local_solve  # noqa: E402

SYSTEM_PROMPTS = {
    "factual": "Answer accurately and concisely in one or two short sentences. No preamble.",
    "math": (
        "Solve carefully. Put the final numeric answer first, then brief calculation steps. "
        "Do not omit the final number."
    ),
    "sentiment": (
        "Classify sentiment as Positive, Negative, Neutral, or Mixed. "
        "Output exactly one line: <Label> - <short reason>."
    ),
    "summarization": (
        "Summarize exactly as requested. Obey all length, sentence, bullet, and format "
        "constraints. Do not add extra commentary."
    ),
    "ner": (
        'Extract named entities. Return valid JSON only: '
        '[{"text":"...","type":"PERSON|ORG|LOCATION|DATE|MONEY|PRODUCT|EVENT|OTHER"}].'
    ),
    "code_debugging": (
        "Identify the bug briefly and provide corrected code. Plain text only. "
        "Format: Bug: ... Corrected code: ..."
    ),
    "logic": (
        "Solve the constraints carefully. Give a clear final answer first, "
        "then short reasoning."
    ),
    "code_generation": (
        "Write correct code that satisfies the spec. "
        "Return only code unless an explanation is explicitly required. No markdown fences."
    ),
}

MODEL_PREFERENCES = {
    # Prefer widely available hosted models first to avoid slow NOT_FOUND retries.
    "code_generation": ["minimax-m3", "kimi-k2p7-code", "gemma-4-31b-it"],
    "code_debugging": ["minimax-m3", "kimi-k2p7-code", "gemma-4-31b-it"],
    "logic": ["minimax-m3", "kimi-k2p7-code", "gemma-4-31b-it"],
    "math": ["minimax-m3", "kimi-k2p7-code", "gemma-4-31b-it"],
    "factual": ["minimax-m3", "gemma-4-31b-it", "gemma-4-31b-it-nvfp4"],
    "summarization": ["minimax-m3", "gemma-4-31b-it", "gemma-4-26b-a4b-it"],
    "sentiment": ["minimax-m3", "gemma-4-26b-a4b-it", "gemma-4-31b-it-nvfp4"],
    "ner": ["minimax-m3", "gemma-4-26b-a4b-it", "gemma-4-31b-it-nvfp4"],
}


def load_env() -> tuple[str, str, list[str]]:
    missing = [name for name in ("FIREWORKS_API_KEY", "FIREWORKS_BASE_URL", "ALLOWED_MODELS") if not os.environ.get(name)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

    api_key = os.environ["FIREWORKS_API_KEY"]
    base_url = os.environ["FIREWORKS_BASE_URL"]
    allowed_models = [model.strip() for model in os.environ["ALLOWED_MODELS"].split(",") if model.strip()]
    if not allowed_models:
        raise RuntimeError("ALLOWED_MODELS must contain at least one model name.")
    return api_key, base_url, allowed_models


def load_tasks(path: str = INPUT_PATH) -> list[dict[str, str]]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("tasks.json must be a JSON array.")

    tasks: list[dict[str, str]] = []
    for index, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Task at index {index} must be an object.")
        if "task_id" not in item or "prompt" not in item:
            raise ValueError(f"Task at index {index} must include task_id and prompt.")
        tasks.append({"task_id": str(item["task_id"]), "prompt": str(item["prompt"])})
    return tasks


def classify_task(prompt: str) -> str:
    text = prompt.lower()

    sentiment_patterns = [
        r"\bsentiment\b",
        r"\bclassify the sentiment\b",
        r"\bpositive\b",
        r"\bnegative\b",
        r"\bneutral\b",
        r"\bmixed\b",
        r"\breview\b",
    ]
    if any(re.search(pattern, text) for pattern in sentiment_patterns):
        return "sentiment"

    summarization_patterns = [
        r"\bsummari[sz]e\b",
        r"\bsummary\b",
        r"\bcondense\b",
        r"\bin one sentence\b",
        r"\bbullet points?\b",
        r"\btl;dr\b",
    ]
    if any(re.search(pattern, text) for pattern in summarization_patterns):
        return "summarization"

    ner_patterns = [
        r"\bnamed entities\b",
        r"\bextract entities\b",
        r"\bextract names\b",
        r"\bperson\b",
        r"\borganization\b",
        r"\blocation\b",
        r"\bdates?\b",
        r"\bentities\b",
    ]
    if any(re.search(pattern, text) for pattern in ner_patterns):
        return "ner"

    code_debug_patterns = [
        r"\bdebug\b",
        r"\bbug\b",
        r"\btraceback\b",
        r"\berror\b",
        r"\bexception\b",
        r"\bfix this code\b",
        r"\bwhy does this code fail\b",
        r"\bcorrected implementation\b",
    ]
    if any(re.search(pattern, text) for pattern in code_debug_patterns):
        return "code_debugging"

    code_gen_patterns = [
        r"\bwrite a function\b",
        r"\bimplement\b",
        r"\bcreate a function\b",
        r"\bwrite code\b",
        r"\bgenerate code\b",
        r"\breturns\b",
        r"\binput/output spec\b",
    ]
    if any(re.search(pattern, text) for pattern in code_gen_patterns):
        return "code_generation"

    math_patterns = [
        r"\bcalculate\b",
        r"\bpercentage\b",
        r"\bpercent\b",
        r"\bratio\b",
        r"\bprobability\b",
        r"\baverage\b",
        r"\btotal\b",
        r"\binterest\b",
        r"\bprojection\b",
        r"\bword problem\b",
        r"\bhow much change\b",
        r"\bhow many\b",
        r"\bhow much\b",
    ]
    has_numbers = bool(re.search(r"\d", text))
    has_operators = bool(re.search(r"[\+\-\*/=]", prompt))
    asks_for_answer = any(
        word in text
        for word in ["how many", "how much", "what is", "compute", "solve", "change do you"]
    )
    if any(re.search(pattern, text) for pattern in math_patterns) or (
        has_numbers and has_operators and asks_for_answer
    ):
        return "math"

    logic_patterns = [
        r"\blogic\b",
        r"\bpuzzle\b",
        r"\bconstraint\b",
        r"\bdeduce\b",
        r"\bmust be\b",
        r"\bcannot be\b",
        r"\bexactly one\b",
        r"\bwho is\b",
        r"\border\b",
        r"\bseating\b",
        r"\bschedule\b",
    ]
    if any(re.search(pattern, text) for pattern in logic_patterns):
        return "logic"

    return "factual"


def pick_available_model(allowed_models: list[str], preferred_names: list[str]) -> str:
    lowered_allowed = {model.lower(): model for model in allowed_models}
    for preferred in preferred_names:
        preferred_lower = preferred.lower()
        for allowed_lower, original in lowered_allowed.items():
            if preferred_lower in allowed_lower:
                return original
    return allowed_models[0]


def choose_model(task_type: str, prompt: str, allowed_models: list[str]) -> str:
    _ = prompt
    preferred = MODEL_PREFERENCES.get(task_type, MODEL_PREFERENCES["factual"])
    return pick_available_model(allowed_models, preferred)


def ranked_models(task_type: str, allowed_models: list[str]) -> list[str]:
    preferred = MODEL_PREFERENCES.get(task_type, MODEL_PREFERENCES["factual"])
    lowered_allowed = {model.lower(): model for model in allowed_models}
    selected: list[str] = []
    for preferred_name in preferred:
        preferred_lower = preferred_name.lower()
        for allowed_lower, original in lowered_allowed.items():
            if preferred_lower in allowed_lower and original not in selected:
                selected.append(original)
    for model in allowed_models:
        if model not in selected:
            selected.append(model)
    return selected


def build_messages(task_type: str, prompt: str) -> list[dict[str, str]]:
    system_prompt = SYSTEM_PROMPTS.get(task_type, SYSTEM_PROMPTS["factual"])
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt},
    ]


def max_tokens_for_task(task_type: str, prompt: str) -> int:
    text = prompt.lower()
    if task_type == "sentiment":
        return 60
    if task_type == "summarization":
        if "bullet" in text or "detailed summary" in text or "paragraph" in text:
            return 220
        return 140
    if task_type == "ner":
        return 200
    if task_type == "factual":
        return 160
    if task_type == "math":
        return 200
    if task_type == "logic":
        return 280
    if task_type == "code_debugging":
        return 420
    if task_type == "code_generation":
        return 480
    return 180


def compress_user_prompt(prompt: str, task_type: str) -> str:
    """Light compression before remote calls to cut billed prompt tokens."""
    text = prompt.strip()
    # Collapse excess whitespace.
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    if task_type == "sentiment" and ":" in text:
        label, body = text.split(":", 1)
        if "sentiment" in label.lower():
            return f"Sentiment (Positive/Negative/Neutral/Mixed): {body.strip()}"
    if task_type in {"summarization", "ner"} and ":" in text:
        # Keep instruction short + passage.
        parts = text.split(":", 1)
        if len(parts[1].strip()) > 40:
            short_inst = {
                "summarization": "Summarize as requested",
                "ner": "Extract entities as JSON list",
            }[task_type]
            return f"{short_inst}: {parts[1].strip()}"
    return text


def resolve_api_model(model: str) -> str:
    """Map harness model names to Fireworks API identifiers when needed."""
    if model.startswith("accounts/"):
        return model
    return f"accounts/fireworks/models/{model}"


def call_fireworks(
    client: OpenAI,
    model: str,
    messages: list[dict[str, str]],
    max_tokens: int,
) -> str:
    global REMOTE_CALLS, REMOTE_TOKENS
    api_model = resolve_api_model(model)
    last_error: Exception | None = None
    for _ in range(2):
        try:
            response = client.chat.completions.create(
                model=api_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0,
            )
            REMOTE_CALLS += 1
            usage = getattr(response, "usage", None)
            if usage is not None:
                total = getattr(usage, "total_tokens", None)
                if isinstance(total, int):
                    REMOTE_TOKENS += total
            message = response.choices[0].message
            content = message.content
            if content is None or not str(content).strip():
                # Some models put text in reasoning_content with empty content.
                reasoning = getattr(message, "reasoning_content", None)
                if isinstance(reasoning, str) and reasoning.strip():
                    return reasoning
                return ""
            return content
        except Exception as exc:  # noqa: BLE001
            # Model-not-found is not transient; move to next candidate immediately.
            text = str(exc)
            if "NOT_FOUND" in text or "Model not found" in text or "404" in text:
                raise RuntimeError(f"model={api_model}: {exc}")
            last_error = exc
    raise RuntimeError(f"model={api_model}: {last_error}")


def clean_answer(answer: str, task_type: str) -> str:
    cleaned = answer.strip()
    cleaned = re.sub(r"^answer:\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace("\r\n", "\n")

    if task_type not in {"code_generation", "code_debugging"}:
        cleaned = _strip_decorative_markdown(cleaned)

    if task_type == "math":
        cleaned = _normalize_math_answer(cleaned)

    if task_type in {"code_debugging", "code_generation"}:
        # Remove fenced formatting so output is directly usable code/text.
        cleaned = re.sub(r"^```(?:\w+)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        # Lightweight typo repair observed in generated loops.
        cleaned = re.sub(r"\bfor\s+([A-Za-z_]\w*)\s+ins\b", r"for \1 in s", cleaned)
        cleaned = _normalize_indentation(cleaned)
        if task_type == "code_debugging":
            cleaned = _normalize_code_debugging_answer(cleaned)
        cleaned = cleaned.strip()

    if task_type == "ner":
        cleaned = _strip_ner_fences(cleaned)
        cleaned = cleaned.strip()
        try:
            parsed = json.loads(cleaned)
            cleaned = json.dumps(parsed, ensure_ascii=True)
        except json.JSONDecodeError:
            # Common failure mode: extra prose around a JSON list/object.
            bracket_match = re.search(r"(\[[\s\S]*\]|\{[\s\S]*\})", cleaned)
            if bracket_match:
                candidate = _strip_ner_fences(bracket_match.group(1).strip())
                try:
                    parsed = json.loads(candidate)
                    cleaned = json.dumps(parsed, ensure_ascii=True)
                except json.JSONDecodeError:
                    pass

    if not cleaned:
        if task_type == "sentiment":
            return "Neutral - Sentiment is unclear or balanced."
        return EMPTY_ANSWER
    return cleaned


def _strip_ner_fences(text: str) -> str:
    # Handles malformed fences like ``json ... `` and standard ```json ... ```
    text = re.sub(r"^\s*`{2,3}\s*(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*`{2,3}\s*$", "", text)
    return text.strip()


def _strip_decorative_markdown(text: str) -> str:
    # Remove common markdown emphasis wrappers while preserving content.
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"__(.+?)__", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    return text.strip()


def _normalize_math_answer(text: str) -> str:
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    if not lines:
        return text

    first = lines[0]
    lower = first.lower()
    if not (lower.startswith("change") or re.fullmatch(r"[$]?\d+(\.\d+)?", first)):
        # If we can detect a result amount in math output, place it first.
        money_match = re.search(r"\$\s?\d+(\.\d+)?", text)
        if money_match:
            first = f"Change: {money_match.group(0).replace(' ', '')}"
        else:
            number_match = re.search(r"\b\d+(\.\d+)?\b", text)
            if number_match:
                first = number_match.group(0)

    rest = [ln for ln in lines[1:] if ln.lower() not in {first.lower()}]
    if rest:
        return first + "\n\n" + "\n".join(rest[:3])
    return first


def _normalize_indentation(text: str) -> str:
    lines = text.split("\n")
    normalized: list[str] = []
    for ln in lines:
        ln = ln.replace("\t", "    ")
        # Preserve model-provided indentation (Python allows non-4-space indents),
        # only normalize tabs and trailing whitespace to avoid breaking code blocks.
        normalized.append(ln.rstrip())
    return "\n".join(normalized).strip()


def _normalize_code_debugging_answer(text: str) -> str:
    bug_match = re.search(r"(?is)\bbug:\s*(.+?)(?=\bcorrected code:|$)", text)
    code_match = re.search(r"(?is)\bcorrected code:\s*(.+)$", text)

    bug = bug_match.group(1).strip() if bug_match else "Issue identified in provided code."
    code = code_match.group(1).strip() if code_match else text.strip()

    # Remove accidental markdown fences inside extracted code region.
    code = re.sub(r"^```(?:\w+)?\s*", "", code, flags=re.IGNORECASE)
    code = re.sub(r"\s*```$", "", code)
    code = _normalize_indentation(code)

    return f"Bug: {bug}\n\nCorrected code:\n{code}".strip()


def process_task(
    task: dict[str, str],
    client: OpenAI,
    allowed_models: list[str],
    unavailable_models: set[str] | None = None,
) -> dict[str, str]:
    global LOCAL_SOLVES
    if unavailable_models is None:
        unavailable_models = set()

    task_type = classify_task(task["prompt"])

    # Zero-token path first (allowed by Track 1 rules).
    local_answer = try_local_solve(task_type, task["prompt"])
    if local_answer and _looks_valid_answer(local_answer, task_type, task["prompt"]):
        LOCAL_SOLVES += 1
        return {"task_id": task["task_id"], "answer": local_answer}

    model = choose_model(task_type, task["prompt"], allowed_models)
    candidates = ranked_models(task_type, allowed_models)
    if model in candidates:
        candidates.remove(model)
    candidates.insert(0, model)
    # Skip models already known unavailable in this container run.
    candidates = [
        c
        for c in candidates
        if c not in unavailable_models and resolve_api_model(c) not in unavailable_models
    ]
    if not candidates:
        candidates = list(allowed_models)

    max_tokens = max_tokens_for_task(task_type, task["prompt"])
    user_prompt = compress_user_prompt(task["prompt"], task_type)

    answer = FALLBACK_ANSWER
    max_fallbacks = int(os.environ.get("MAX_MODEL_FALLBACKS", "4"))
    max_fallbacks = max(1, min(max_fallbacks, len(candidates)))

    for attempt, candidate in enumerate(candidates[:max_fallbacks], start=1):
        try:
            messages = build_messages(task_type, user_prompt)
            if attempt > 1:
                messages[0]["content"] += (
                    " Previous answer quality was weak or format-invalid. "
                    "Retry and strictly satisfy the requested format."
                )
            raw_answer = call_fireworks(client, candidate, messages, max_tokens)
            cleaned = clean_answer(raw_answer, task_type)
            if _looks_valid_answer(cleaned, task_type, task["prompt"]):
                answer = cleaned
                break
            answer = cleaned
        except Exception as exc:
            text = str(exc)
            if "NOT_FOUND" in text or "Model not found" in text:
                unavailable_models.add(candidate)
                unavailable_models.add(resolve_api_model(candidate))
            print(f"[{task['task_id']}] {exc}", file=sys.stderr)

    if task_type == "sentiment" and (
        not _looks_valid_answer(answer, task_type, task["prompt"])
        or "unable to infer sentiment" in answer.lower()
    ):
        answer = _sentiment_fallback(task["prompt"])

    # If remote failed but a weaker local answer exists, use it.
    if (
        answer in {FALLBACK_ANSWER, EMPTY_ANSWER}
        and local_answer
        and str(local_answer).strip()
    ):
        answer = local_answer

    # Never return an empty answer object — harness expects task_id + answer.
    if not str(answer).strip():
        answer = FALLBACK_ANSWER if task_type != "sentiment" else _sentiment_fallback(task["prompt"])

    return {"task_id": task["task_id"], "answer": answer}


def _looks_valid_answer(answer: str, task_type: str, prompt: str) -> bool:
    text = answer.strip()
    if not text or text == EMPTY_ANSWER or text == FALLBACK_ANSWER:
        return False

    lowered = text.lower()
    prompt_lower = prompt.lower()
    if task_type == "sentiment":
        if "unable to infer sentiment" in lowered:
            return False
        return bool(re.search(r"\b(positive|negative|neutral|mixed)\b", lowered))

    if task_type == "ner":
        try:
            parsed = json.loads(text)
            return isinstance(parsed, list)
        except json.JSONDecodeError:
            return False

    if task_type == "summarization" and "exactly one sentence" in prompt_lower:
        sentences = re.findall(r"[^.!?]+[.!?]", text)
        return len(sentences) == 1

    if task_type == "math":
        return bool(re.search(r"\d", text))

    if task_type in {"code_generation", "code_debugging"}:
        return bool(
            re.search(r"\b(def|class|return|if|for|while|import)\b", text)
            or "\n" in text
        )

    return len(text) >= 8


def _sentiment_fallback(prompt: str) -> str:
    text = prompt.lower()
    positive_words = {
        "good",
        "great",
        "excellent",
        "love",
        "amazing",
        "satisfied",
        "fast",
        "helpful",
        "smooth",
        "best",
    }
    negative_words = {
        "bad",
        "poor",
        "terrible",
        "hate",
        "awful",
        "slow",
        "bug",
        "broken",
        "scratch",
        "issue",
        "problem",
        "worse",
    }
    pos = sum(1 for w in positive_words if re.search(rf"\b{re.escape(w)}\b", text))
    neg = sum(1 for w in negative_words if re.search(rf"\b{re.escape(w)}\b", text))

    if pos > 0 and neg > 0:
        return "Mixed - Contains both positive and negative signals."
    if pos > 0:
        return "Positive - Overall sentiment is favorable."
    if neg > 0:
        return "Negative - Overall sentiment is unfavorable."
    return "Neutral - Sentiment is unclear or balanced."


def write_results(results: list[dict[str, str]], path: str = OUTPUT_PATH) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=True, indent=2)


def main() -> int:
    """
    Always try to write /output/results.json with one entry per input task.
    Exit 0 when a complete results file is written so the harness can score
    instead of treating crashes/timeouts as INFRA_ERROR.
    """
    tasks: list[dict[str, str]] = []
    try:
        api_key, base_url, allowed_models = load_env()
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=90.0)
        tasks = load_tasks()

        max_workers = int(os.environ.get("MAX_WORKERS", "2"))
        max_workers = max(1, min(max_workers, 8))
        unavailable_models: set[str] = set()

        if max_workers == 1 or len(tasks) <= 1:
            results = [
                process_task(task, client, allowed_models, unavailable_models)
                for task in tasks
            ]
        else:
            results_map: dict[str, dict[str, str]] = {}
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_task_id = {
                    executor.submit(
                        process_task, task, client, allowed_models, unavailable_models
                    ): task["task_id"]
                    for task in tasks
                }
                for future in as_completed(future_to_task_id):
                    task_id = future_to_task_id[future]
                    try:
                        result = future.result()
                        results_map[result["task_id"]] = result
                    except Exception as exc:  # noqa: BLE001
                        print(f"[{task_id}] worker failed: {exc}", file=sys.stderr)
                        results_map[task_id] = {
                            "task_id": task_id,
                            "answer": FALLBACK_ANSWER,
                        }
            results = [
                results_map.get(
                    task["task_id"],
                    {"task_id": task["task_id"], "answer": FALLBACK_ANSWER},
                )
                for task in tasks
            ]

        write_results(results)
        print(
            f"Done. local_solves={LOCAL_SOLVES} remote_calls={REMOTE_CALLS} "
            f"remote_tokens={REMOTE_TOKENS}",
            file=sys.stderr,
        )
        return 0
    except Exception as exc:
        print(f"Fatal error: {exc}", file=sys.stderr)
        # Last resort: still emit valid schema so scoring can proceed.
        try:
            if tasks:
                write_results(
                    [{"task_id": t["task_id"], "answer": FALLBACK_ANSWER} for t in tasks]
                )
            else:
                # If input itself failed, write empty array only as absolute fallback.
                write_results([])
        except Exception:
            return 1
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
