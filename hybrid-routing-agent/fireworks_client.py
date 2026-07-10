from typing import Any

from openai import OpenAI

from config import Settings


def call_fireworks(prompt: str, settings: Settings) -> dict[str, Any]:
    if not settings.fireworks_api_key:
        raise RuntimeError("FIREWORKS_API_KEY is not set.")

    client = OpenAI(
        api_key=settings.fireworks_api_key,
        base_url=settings.fireworks_base_url,
    )
    response = client.chat.completions.create(
        model=settings.fireworks_model,
        temperature=0.2,
        max_tokens=900,
        timeout=20.0,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant. Return concise, accurate answers.",
            },
            {"role": "user", "content": prompt},
        ],
    )

    choice = response.choices[0]
    message = choice.message
    answer = (message.content or "").strip()
    if not answer:
        # Some models may return text in reasoning_content while content is empty.
        reasoning = getattr(message, "reasoning_content", None)
        if isinstance(reasoning, str):
            answer = reasoning.strip()
    return {"answer": answer, "raw": response.model_dump()}
