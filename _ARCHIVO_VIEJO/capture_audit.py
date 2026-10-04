#!/usr/bin/env python3
"""Captura frontend ALQUIMIA y consolida PDF de auditoria."""
from __future__ import annotations

import asyncio
from pathlib import Path

from playwright.async_api import async_playwright
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


BASE_URL = "http://localhost:3000"
OUTPUT_PDF = Path("ALQUIMIA_AUDIT_FASE21.pdf")
CAPTURE_DIR = Path("audit_captures")
FALLBACK_CHROME_PATHS = [
    "/var/folders/9v/tn05rxr52md9t4n6qsq7nfy80000gn/T/cursor-sandbox-cache/e287a44c744419a47812624f6cd9aaea/playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-x64/chrome-headless-shell",
]

ROUTES = [
    ("dashboard", "/admin"),
    ("escenarios_13_1", "/simulator"),
    ("configuracion", "/ca-studio"),
    ("auth", "/login"),
]


async def capture() -> list[Path]:
    CAPTURE_DIR.mkdir(parents=True, exist_ok=True)
    images: list[Path] = []

    async with async_playwright() as p:
        browser = None
        launch_errors: list[str] = []
        try:
            browser = await p.chromium.launch(headless=True)
        except Exception as exc:
            launch_errors.append(f"default launch failed: {exc}")

        if browser is None:
            for path in FALLBACK_CHROME_PATHS:
                if not Path(path).exists():
                    continue
                try:
                    browser = await p.chromium.launch(headless=True, executable_path=path)
                    break
                except Exception as exc:
                    launch_errors.append(f"fallback {path} failed: {exc}")

        if browser is None:
            raise RuntimeError("No fue posible lanzar Chromium.\n" + "\n".join(launch_errors))
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()

        for name, route in ROUTES:
            url = f"{BASE_URL}{route}"
            print(f"[capture] {url}")
            await page.goto(url, wait_until="networkidle", timeout=120000)
            await page.wait_for_timeout(1500)
            image_path = CAPTURE_DIR / f"{name}.png"
            await page.screenshot(path=str(image_path), full_page=True)
            images.append(image_path)

        await context.close()
        await browser.close()

    return images


def to_pdf(images: list[Path]) -> None:
    if not images:
        raise RuntimeError("No se generaron imagenes para consolidar PDF.")
    pdf = canvas.Canvas(str(OUTPUT_PDF))
    for image_path in images:
        image = ImageReader(str(image_path))
        width, height = image.getSize()
        pdf.setPageSize((width, height))
        pdf.drawImage(image, 0, 0, width=width, height=height)
        pdf.showPage()
    pdf.save()


async def main() -> None:
    images = await capture()
    to_pdf(images)
    print(f"[ok] PDF generado: {OUTPUT_PDF.resolve()}")


if __name__ == "__main__":
    asyncio.run(main())
