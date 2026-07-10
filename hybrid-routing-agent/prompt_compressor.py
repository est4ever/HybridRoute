def compress_prompt(task: str, max_chars: int = 600) -> str:
    compact = " ".join(task.split())
    lowered = compact.lower()

    required_format = "plain text"
    if "json" in lowered:
        required_format = "valid JSON"
    elif "code" in lowered:
        required_format = "code"
    elif "table" in lowered:
        required_format = "table"

    if ":" in compact:
        task_head, task_body = compact.split(":", 1)
        task_body = task_body.strip()
    else:
        task_head = "Complete the task"
        task_body = compact

    compressed = (
        f"Task: {task_head.strip()}.\n"
        f"Required output: {required_format}.\n"
        f"Input: {task_body}"
    )
    compressed = " ".join(compressed.split())

    if len(compressed) > len(compact):
        compressed = compact

    if len(compressed) <= max_chars:
        return compressed
    return compressed[: max_chars - 3].rstrip() + "..."
