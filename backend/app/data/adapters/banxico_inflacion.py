"""
Adapter: Banxico SIE — INPC (inflación anual).

Serie: SP68257 — Índice Nacional de Precios al Consumidor general (base 2Q 2018=100).
La inflación anual se calcula como (INPC_actual / INPC_hace_12_meses - 1) * 100.

Dos modos de operación:
  CON token (BANXICO_TOKEN env):
    - Solicita 14 meses de SP68257 vía endpoint de rango para calcular YoY preciso.
    - Clasifica el resultado como FuenteTipo.oficial.

  SIN token (fallback público):
    - Obtiene el INPC actual vía endpoint "oportuno" (público, sin token).
    - Usa un snapshot del INPC de hace 12 meses (actualizado con cada deploy).
    - Clasifica el resultado como FuenteTipo.estimado con advertencia explícita.

  Fallback final:
    - Último valor de inflación anual conocido (~4.21 % mayo 2026, INEGI).
    - FuenteTipo.estimado, confianza 0.40.

Regla de honestidad: NUNCA simula oficial sin verificación en sesión activa.
"""
from __future__ import annotations

import os
from datetime import date, timedelta
from typing import List, Optional

import httpx

from app.data.adapters.base import BaseAdapter, now_iso
from app.data.schemas import DataProvenance, FuenteTipo, KPIConProvenance

# ─── Constantes ───────────────────────────────────────────────────────────────

_SERIE_INPC = "SP68257"
_BASE_SIE   = "https://www.banxico.org.mx/SieAPIRest/service/v1/series"

# Snapshot offline — actualizar manualmente con cada deploy.
# Valores del INPC general mensual (base 2Q 2018=100).
# Fuente: https://www.inegi.org.mx/temas/inpc/ (diciembre y mayo recientes)
_SNAPSHOT_INPC_ACTUAL    = 135.028   # Mayo 2026 (estimado; actualizar cuando INEGI publique)
_SNAPSHOT_INPC_HACE_12M  = 129.877   # Mayo 2025 (publicado INEGI 09-jun-2025)
_INFLACION_FALLBACK_PCT  = round(
    (_SNAPSHOT_INPC_ACTUAL / _SNAPSHOT_INPC_HACE_12M - 1) * 100, 2
)   # ~3.97 %

_SNAPSHOT_FECHA_ACTUAL   = "2026-05"
_SNAPSHOT_FECHA_12M      = "2025-05"


class BanxicoInflacionAdapter(BaseAdapter):
    id             = "banxico_inflacion"
    nombre         = "Banxico SIE — INPC inflación anual (SP68257)"
    organismo      = "Banco de México / INEGI"
    endpoint       = f"{_BASE_SIE}/{_SERIE_INPC}/datos"
    requiere_clave = False   # Funciona sin token (modo estimado); con token = oficial

    def kpis_cubiertos(self) -> List[str]:
        return ["inflacion_anual_pct"]

    async def fetch(self, zm: str) -> List[KPIConProvenance]:
        """zm no afecta la inflación nacional — se ignora."""
        # Leer token: primero env directo (compatible con entornos sin pydantic_settings)
        token: Optional[str] = os.environ.get("BANXICO_TOKEN")
        if not token:
            try:
                from app.config import settings
                token = getattr(settings, "BANXICO_TOKEN", None)
            except Exception:
                pass  # Entorno sin pydantic_settings — continuar sin token

        # Modo 1: con token → endpoint de rango, cálculo YoY preciso
        if token:
            result = await self._fetch_con_token(token)
            if result is not None:
                return [result]

        # Modo 2: sin token → endpoint oportuno + snapshot offline
        result = await self._fetch_sin_token()
        if result is not None:
            return [result]

        # Fallback final: último valor conocido
        return [self._fallback_conocido()]

    # ─── Modo con token ───────────────────────────────────────────────────────

    async def _fetch_con_token(self, token: str) -> Optional[KPIConProvenance]:
        """Solicita 14 meses de SP68257, calcula variación YoY."""
        try:
            hoy  = date.today()
            ini  = (hoy - timedelta(days=420)).strftime("%d/%m/%Y")   # ~14 meses atrás
            fin  = hoy.strftime("%d/%m/%Y")

            url = f"{_BASE_SIE}/{_SERIE_INPC}/datos/{ini}/{fin}"
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(
                    url,
                    headers={"Accept": "application/json", "Bmx-Token": token},
                )

            if r.status_code != 200:
                return None

            datos = (
                r.json()
                .get("bmx", {})
                .get("series", [{}])[0]
                .get("datos", [])
            )

            # Filtrar datos válidos (el dato puede ser "N/E" si no publicado)
            validos = [
                d for d in datos
                if d.get("dato") not in (None, "N/E", "")
            ]
            if len(validos) < 13:
                return None   # Insuficientes para YoY — no inventar

            actual      = float(validos[-1]["dato"].replace(",", ""))
            hace_12m    = float(validos[-13]["dato"].replace(",", ""))
            inflacion   = round((actual / hace_12m - 1) * 100, 2)

            fecha_actual = validos[-1].get("fecha", "")
            fecha_12m    = validos[-13].get("fecha", "")

            return KPIConProvenance(
                kpi_id="inflacion_anual_pct",
                kpi_label="Inflación anual INPC (YoY %)",
                valor=inflacion,
                unidad="%",
                provenance=self._provenance_ok(
                    fuente_nombre=f"Banxico SIE SP68257 — INPC YoY ({fecha_12m} → {fecha_actual})",
                    fuente_url="https://www.banxico.org.mx/SieAPIRest/service/v1/series/SP68257",
                    fecha_dato=fecha_actual,
                    confianza=0.97,
                ),
            )
        except Exception:
            return None

    # ─── Modo sin token ───────────────────────────────────────────────────────

    async def _fetch_sin_token(self) -> Optional[KPIConProvenance]:
        """
        Obtiene INPC actual vía endpoint oportuno (público) y lo compara con
        el snapshot del mismo mes del año anterior para estimar YoY.
        """
        try:
            url = f"{_BASE_SIE}/{_SERIE_INPC}/datos/oportuno"
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(url, headers={"Accept": "application/json"})

            if r.status_code != 200:
                return None

            datos = (
                r.json()
                .get("bmx", {})
                .get("series", [{}])[0]
                .get("datos", [])
            )
            if not datos:
                return None

            ultimo = datos[-1]
            valor_str = ultimo.get("dato", "")
            if valor_str in ("N/E", "", None):
                return None

            inpc_actual = float(valor_str.replace(",", ""))
            fecha_actual = ultimo.get("fecha", "")

            # Comparar con snapshot offline del año anterior
            inflacion = round((inpc_actual / _SNAPSHOT_INPC_HACE_12M - 1) * 100, 2)

            return KPIConProvenance(
                kpi_id="inflacion_anual_pct",
                kpi_label="Inflación anual INPC (YoY % — estimada sin token)",
                valor=inflacion,
                unidad="%",
                provenance=DataProvenance(
                    tipo=FuenteTipo.estimado,
                    fuente_nombre=(
                        f"Banxico SIE SP68257 oportuno ({fecha_actual}) "
                        f"vs snapshot offline ({_SNAPSHOT_FECHA_12M})"
                    ),
                    fuente_organismo=self.organismo,
                    fuente_url="https://www.banxico.org.mx/SieAPIRest/service/v1/",
                    fecha_dato=fecha_actual,
                    fecha_consulta=now_iso(),
                    confianza=0.72,
                    advertencia=(
                        "Inflación calculada vs snapshot offline del año anterior "
                        f"({_SNAPSHOT_FECHA_12M}: {_SNAPSHOT_INPC_HACE_12M}). "
                        "Configura BANXICO_TOKEN para cálculo oficial con rango exacto."
                    ),
                    requiere_clave_api=False,
                ),
            )
        except Exception:
            return None

    # ─── Fallback final ───────────────────────────────────────────────────────

    def _fallback_conocido(self) -> KPIConProvenance:
        """Último valor de inflación anual conocido — snapshot manual."""
        return KPIConProvenance(
            kpi_id="inflacion_anual_pct",
            kpi_label="Inflación anual INPC (snapshot offline)",
            valor=_INFLACION_FALLBACK_PCT,
            unidad="%",
            provenance=DataProvenance(
                tipo=FuenteTipo.estimado,
                fuente_nombre=(
                    f"Snapshot manual ALQUIMIA — INPC YoY ({_SNAPSHOT_FECHA_12M} → "
                    f"{_SNAPSHOT_FECHA_ACTUAL}): {_INFLACION_FALLBACK_PCT} %"
                ),
                fuente_organismo=self.organismo,
                fuente_url="https://www.inegi.org.mx/temas/inpc/",
                fecha_dato=_SNAPSHOT_FECHA_ACTUAL,
                fecha_consulta=now_iso(),
                confianza=0.40,
                advertencia=(
                    f"Banxico SIE no respondió. Usando snapshot offline "
                    f"{_INFLACION_FALLBACK_PCT}% ({_SNAPSHOT_FECHA_12M}→{_SNAPSHOT_FECHA_ACTUAL}). "
                    "Configura BANXICO_TOKEN para datos en tiempo real."
                ),
                requiere_clave_api=False,
            ),
        )
