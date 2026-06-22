"""Real web scrapers for DOF, SEMARNAT, COFEMER, INEGI, ASF sources.

Each scraper makes actual HTTP requests and parses HTML/JSON.
Requires: aiohttp, beautifulsoup4, lxml, pdfplumber
"""

import asyncio
import hashlib
import re
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from urllib.parse import urljoin, urlencode

from app.pdf_intake import OcrUnavailableError, extract_pdf_text_with_fallback

logger = logging.getLogger(__name__)


class ScrapedDocumentInfo:
    def __init__(self, titulo: str, url: str, descripcion: str = "",
                 fecha_publicacion: Optional[str] = None, contenido_text: str = ""):
        self.titulo = titulo
        self.url = url
        self.descripcion = descripcion
        self.fecha_publicacion = fecha_publicacion
        self.contenido_text = contenido_text
        self.pdf_hash = hashlib.sha256((url + titulo).encode()).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "titulo": self.titulo, "url": self.url,
            "descripcion": self.descripcion, "fecha_publicacion": self.fecha_publicacion,
            "contenido_text": self.contenido_text, "pdf_hash": self.pdf_hash,
        }


async def _get_html(url: str, timeout: int = 20) -> Optional[str]:
    """Fetch HTML from URL with timeout and error handling."""
    try:
        import aiohttp
        headers = {"User-Agent": "Mozilla/5.0 (compatible; ALQUIMIA-bot/1.0)"}
        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
                if resp.status == 200:
                    return await resp.text(encoding="utf-8", errors="replace")
                logger.warning(f"HTTP {resp.status} for {url}")
                return None
    except Exception as e:
        logger.error(f"Error fetching {url}: {e}")
        return None


async def _get_json(url: str, timeout: int = 20) -> Optional[dict]:
    """Fetch JSON from URL."""
    try:
        import aiohttp
        headers = {"User-Agent": "Mozilla/5.0 (compatible; ALQUIMIA-bot/1.0)"}
        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
                if resp.status == 200:
                    return await resp.json(content_type=None)
                return None
    except Exception as e:
        logger.error(f"Error fetching JSON {url}: {e}")
        return None


async def extract_text_from_pdf_url(pdf_url: str) -> str:
    """Download PDF and extract text with CID-safe OCR fallback."""
    try:
        import aiohttp

        async with aiohttp.ClientSession() as session:
            async with session.get(pdf_url, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                if resp.status != 200:
                    return ""
                pdf_bytes = await resp.read()

        try:
            force_ocr = bool(re.search(r"(dof|diario|periodico|per[ií]odico|gaceta)", pdf_url, re.IGNORECASE))
            text, direct, _ocr = extract_pdf_text_with_fallback(
                pdf_bytes,
                source=pdf_url,
                force_ocr_for_official=force_ocr,
            )
            if direct.suspicious:
                logger.info(
                    "PDF direct extraction suspicious for %s (%s chars, %s words); OCR fallback attempted",
                    pdf_url,
                    direct.char_count,
                    direct.word_count,
                )
            return text[:50000]
        except OcrUnavailableError as exc:
            logger.warning("OCR required but unavailable for %s: %s", pdf_url, exc)
            return ""
        except Exception as exc:
            logger.error("Error extracting PDF text for %s: %s", pdf_url, exc)
            return ""

    except Exception as e:
        logger.error(f"Error extracting PDF {pdf_url}: {e}")
        return ""


def _parse_date_mx(date_str: str) -> Optional[str]:
    """Parse Spanish date string to YYYY-MM-DD."""
    MONTHS = {
        "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
        "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
        "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12",
    }
    try:
        # Try "15 de enero de 2024" or "15/01/2024"
        m = re.search(r"(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})", date_str.lower())
        if m:
            day, month_name, year = m.groups()
            month = MONTHS.get(month_name, "01")
            return f"{year}-{month}-{int(day):02d}"

        m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", date_str)
        if m:
            day, month, year = m.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"

    except Exception:
        pass
    return None


# ─── DOF Scraper ─────────────────────────────────────────────────────────────

class DOFScraper:
    """Scraper for Diario Oficial de la Federación."""

    BASE_URL = "https://www.dof.gob.mx"

    async def search_documents(self, keywords: List[str], days_back: int = 7) -> List[ScrapedDocumentInfo]:
        """Search DOF for documents matching keywords from last N days."""
        documents = []
        since = (datetime.now() - timedelta(days=days_back)).strftime("%d/%m/%Y")
        until = datetime.now().strftime("%d/%m/%Y")

        for keyword in keywords[:3]:  # Limit to 3 keywords to avoid overload
            try:
                url = f"{self.BASE_URL}/index.php?action=busqueda&lang=es&texto={keyword}&fInicial={since}&fFinal={until}"
                html = await _get_html(url)
                if not html:
                    continue

                try:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(html, "lxml")

                    # DOF search results have links with class "ligas"
                    for link in soup.find_all("a", href=True)[:20]:
                        href = link.get("href", "")
                        text = link.get_text(strip=True)

                        if not text or len(text) < 10:
                            continue

                        if "nota_detalle" in href or "nota_detalle_popup" in href:
                            full_url = urljoin(self.BASE_URL, href)
                            doc = ScrapedDocumentInfo(
                                titulo=text[:500],
                                url=full_url,
                                descripcion=f"DOF — búsqueda: {keyword}",
                                fecha_publicacion=None,
                            )
                            documents.append(doc)

                except ImportError:
                    logger.warning("BeautifulSoup not installed, returning empty DOF results")

            except Exception as e:
                logger.error(f"DOF scraper error for keyword {keyword}: {e}")

        return documents


# ─── SEMARNAT Scraper ─────────────────────────────────────────────────────────

class SEMARNATScraper:
    """Scraper for SEMARNAT publications via gob.mx."""

    BASE_URL = "https://www.gob.mx"

    async def search_documents(self, keywords: List[str], days_back: int = 7) -> List[ScrapedDocumentInfo]:
        """Search gob.mx for SEMARNAT waste/residue publications."""
        documents = []

        try:
            # gob.mx has a search API
            for keyword in keywords[:2]:
                url = f"{self.BASE_URL}/busqueda?utf8=%E2%9C%93&query={keyword}&dependencia=semarnat"
                html = await _get_html(url)
                if not html:
                    continue

                try:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(html, "lxml")

                    for result in soup.find_all("div", class_="search-result")[:10]:
                        title_el = result.find("h2") or result.find("h3")
                        link_el = result.find("a", href=True)

                        if not title_el or not link_el:
                            continue

                        title = title_el.get_text(strip=True)
                        href = link_el.get("href", "")
                        full_url = urljoin(self.BASE_URL, href)

                        desc_el = result.find("p")
                        desc = desc_el.get_text(strip=True)[:300] if desc_el else ""

                        doc = ScrapedDocumentInfo(
                            titulo=title[:500],
                            url=full_url,
                            descripcion=desc,
                            fecha_publicacion=None,
                        )
                        documents.append(doc)

                except ImportError:
                    logger.warning("BeautifulSoup not installed")

        except Exception as e:
            logger.error(f"SEMARNAT scraper error: {e}")

        return documents


# ─── COFEMER Scraper ─────────────────────────────────────────────────────────

class COFEMERScraper:
    """Scraper for COFEMER regulatory impact documents."""

    BASE_URL = "https://www.gob.mx/cofemer"

    async def search_documents(self, keywords: List[str], days_back: int = 7) -> List[ScrapedDocumentInfo]:
        """Search COFEMER for MIR/regulatory docs related to waste."""
        documents = []
        try:
            url = f"{self.BASE_URL}/articulos"
            html = await _get_html(url)
            if html:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html, "lxml")
                for link in soup.find_all("a", href=True)[:15]:
                    text = link.get_text(strip=True)
                    href = link.get("href", "")
                    if len(text) > 15 and any(kw.lower() in text.lower() for kw in keywords):
                        documents.append(ScrapedDocumentInfo(
                            titulo=text[:500],
                            url=urljoin(self.BASE_URL, href),
                            descripcion="COFEMER — regulación",
                        ))
        except Exception as e:
            logger.error(f"COFEMER scraper error: {e}")
        return documents


# ─── INEGI Scraper ─────────────────────────────────────────────────────────

class INEGIScraper:
    """Scraper for INEGI data and publications."""

    BASE_URL = "https://www.inegi.org.mx"
    DENUE_API = "https://www.inegi.org.mx/app/api/denue/v1"

    async def search_documents(self, keywords: List[str], days_back: int = 7) -> List[ScrapedDocumentInfo]:
        """Search INEGI for statistical publications."""
        documents = []
        try:
            for keyword in keywords[:2]:
                url = f"{self.BASE_URL}/app/buscador/default.html?q={keyword}"
                html = await _get_html(url)
                if html:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(html, "lxml")
                    for link in soup.find_all("a", href=True)[:10]:
                        text = link.get_text(strip=True)
                        href = link.get("href", "")
                        if len(text) > 15:
                            documents.append(ScrapedDocumentInfo(
                                titulo=text[:500],
                                url=urljoin(self.BASE_URL, href),
                                descripcion="INEGI — estadística",
                            ))
        except Exception as e:
            logger.error(f"INEGI scraper error: {e}")
        return documents

    async def get_municipio_generators_count(self, estado: str, municipio: str, token: str) -> Optional[int]:
        """Query INEGI DENUE API for economic units in municipality."""
        try:
            # DENUE API v1 — requires token (INEGI_DENUE_TOKEN env var)
            url = f"{self.DENUE_API}/actividades/{municipio}/0/0/100/json?token={token}"
            data = await _get_json(url)
            if data and isinstance(data, list):
                return len(data)
        except Exception as e:
            logger.error(f"INEGI DENUE error: {e}")
        return None


# ─── ASF Scraper ─────────────────────────────────────────────────────────

class ASFScraper:
    """Scraper for ASF audit reports."""

    BASE_URL = "https://www.asf.gob.mx"

    async def search_documents(self, keywords: List[str], days_back: int = 7) -> List[ScrapedDocumentInfo]:
        """Search ASF for audit reports related to waste management."""
        documents = []
        try:
            # ASF audit list
            url = f"{self.BASE_URL}/Trans/Investigacion/buscador.aspx"
            html = await _get_html(url)
            if html:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html, "lxml")
                for link in soup.find_all("a", href=True)[:10]:
                    text = link.get_text(strip=True)
                    href = link.get("href", "")
                    if len(text) > 15 and any(kw.lower() in text.lower() for kw in keywords):
                        documents.append(ScrapedDocumentInfo(
                            titulo=text[:500],
                            url=urljoin(self.BASE_URL, href),
                            descripcion="ASF — auditoría",
                        ))
        except Exception as e:
            logger.error(f"ASF scraper error: {e}")
        return documents


# ─── Multi-Source Orchestrator ─────────────────────────────────────────────

class MultiSourceScraper:
    """Orchestrates scraping across all sources."""

    def __init__(self):
        self.dof = DOFScraper()
        self.semarnat = SEMARNATScraper()
        self.cofemer = COFEMERScraper()
        self.inegi = INEGIScraper()
        self.asf = ASFScraper()

    async def scrape_all_sources(self, keywords: List[str], days_back: int = 7) -> Dict[str, List[ScrapedDocumentInfo]]:
        """Scrape all sources in parallel with timeout protection."""
        tasks = {
            "dof": self.dof.search_documents(keywords, days_back),
            "semarnat": self.semarnat.search_documents(keywords, days_back),
            "cofemer": self.cofemer.search_documents(keywords, days_back),
            "inegi": self.inegi.search_documents(keywords, days_back),
            "asf": self.asf.search_documents(keywords, days_back),
        }

        results = {}
        for source, coro in tasks.items():
            try:
                results[source] = await asyncio.wait_for(coro, timeout=30)
            except asyncio.TimeoutError:
                logger.warning(f"Scraper timeout for source: {source}")
                results[source] = []
            except Exception as e:
                logger.error(f"Scraper error for source {source}: {e}")
                results[source] = []

        return results

    async def scrape_specific_source(self, source: str, keywords: List[str], days_back: int = 7) -> List[ScrapedDocumentInfo]:
        scrapers = {
            "dof": self.dof,
            "semarnat": self.semarnat,
            "cofemer": self.cofemer,
            "inegi": self.inegi,
            "asf": self.asf,
        }
        scraper = scrapers.get(source.lower())
        if not scraper:
            raise ValueError(f"Unknown source: {source}")

        try:
            return await asyncio.wait_for(
                scraper.search_documents(keywords, days_back),
                timeout=30,
            )
        except asyncio.TimeoutError:
            logger.warning(f"Timeout scraping {source}")
            return []


def classify_document(titulo: str, contenido: str) -> Dict[str, Any]:
    """Classify document by theme and applicability."""
    titulo_lower = titulo.lower()
    contenido_lower = (contenido or "").lower()

    text = titulo_lower + " " + contenido_lower

    # Theme detection
    if any(w in text for w in ["rsu", "residuos sólidos", "urbanos", "municipales", "lgpgir"]):
        tema = "residuos"
    elif any(w in text for w in ["construcción", "rcd", "escombros", "nom-083"]):
        tema = "construccion"
    elif any(w in text for w in ["agua", "drenaje", "conagua"]):
        tema = "agua"
    elif any(w in text for w in ["hospital", "salud", "nom-087"]):
        tema = "salud"
    else:
        tema = "regulacion"

    aplicable_rsu = any(w in text for w in ["rsu", "residuos sólidos", "municipales", "lgpgir"])
    aplicable_rcd = any(w in text for w in ["rcd", "construcción", "escombros", "demolición"])

    return {
        "ambito": "federal",
        "tema": tema,
        "aplicable_rsu": aplicable_rsu,
        "aplicable_rcd": aplicable_rcd,
    }
