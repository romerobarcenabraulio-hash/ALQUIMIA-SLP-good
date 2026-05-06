"""Orquestación paralela Claude + ZIP en memoria (Q-023)."""

from __future__ import annotations

import asyncio
import io
import logging
import re
import unicodedata
import zipfile
from datetime import date
from typing import Awaitable, Callable

from anthropic import AsyncAnthropic

try:
    from anthropic import APIError as AnthropicAPIError
except ImportError:
    from anthropic import APIStatusError as AnthropicAPIError  # type: ignore[assignment]

from app.config import settings

from app.legal.agora_export_disclaimers import wrap_agora_markdown

from .prompts import PROMPTS_BY_FILENAME
from .schemas import PlanRequest

logger = logging.getLogger(__name__)

CLAUDE_MODEL = settings.ANTHROPIC_MODEL

# Inyectable en pruebas: async (PlanRequest, str user_prompt, str fname) -> str
CompletionFn = Callable[[PlanRequest, str, str], Awaitable[str]]
_completion_runner: CompletionFn | None = None


def set_completion_runner(fn: CompletionFn | None) -> None:
    """Sólo uso en tests — restaurar a None después."""
    global _completion_runner  # noqa: PLW0603
    _completion_runner = fn


def _sanitize_base_filename(municipio: str, when: date | None = None) -> str:
    when = when or date.today()
    nk = unicodedata.normalize("NFKD", municipio)
    ascii_slug = nk.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", ascii_slug.strip()).strip("_").lower()
    slug = slug or "municipio"
    slug = slug[:80]
    return f"alquimia_plan_{slug}_{when.isoformat()}.zip"


async def _default_claude_call(_req: PlanRequest, user_prompt: str, fname: str) -> str:
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key or api_key.strip() in {"", "tu_anthropic_api_key_aqui"}:
        raise RuntimeError(
            "ANTHROPIC_API_KEY no configurada para el pipeline ÁGORA. "
            "Defina la variable en el entorno o .env antes de llamar POST /generate-plan."
        )
    client = AsyncAnthropic(api_key=api_key.strip())
    try:
        mess = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=8192,
            temperature=0.25,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except AnthropicAPIError as e:
        logger.exception("Anthropic failure generando %s", fname)
        raise RuntimeError(f"Fallo llamada Anthropic ({fname}): {e}") from e

    chunks: list[str] = []
    for block in mess.content:
        if getattr(block, "type", None) == "text":
            chunks.append(block.text)
    text = "\n".join(chunks).strip()
    if not text:
        raise RuntimeError(f"Anthropic devolvió contenido vacío para {fname}")
    return text


async def _one_doc(fname: str, builder, req: PlanRequest) -> tuple[str, str]:
    prompt = builder(req)
    runner = _completion_runner or _default_claude_call
    body = await runner(req, prompt, fname)
    return fname, body


async def generate_all_markdown_documents(req: PlanRequest) -> dict[str, str]:
    tasks = [_one_doc(fname, builder, req) for fname, builder in PROMPTS_BY_FILENAME]
    pairs = await asyncio.gather(*tasks)
    out: dict[str, str] = {}
    for name, txt in pairs:
        out[name] = txt
    return out


def build_zip_bytes(docs: dict[str, str], municipio: str, when: date | None = None) -> tuple[bytes, str]:
    archive_name = _sanitize_base_filename(municipio, when)
    buf = io.BytesIO()
    ordered = list(PROMPTS_BY_FILENAME)
    expected = {fn for fn, _ in ordered}
    if set(docs.keys()) != expected:
        raise ValueError("el conjunto de archivos generados no coincide con los 7 documentos ÁGORA")
    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for fname, _ in ordered:
            zf.writestr(fname, wrap_agora_markdown(docs[fname]).encode("utf-8"))
    return buf.getvalue(), archive_name


async def generate_plan_zip(req: PlanRequest) -> tuple[bytes, str]:
    docs = await generate_all_markdown_documents(req)
    return build_zip_bytes(docs, req.municipio)
