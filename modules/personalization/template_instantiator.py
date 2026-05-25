"""Instanciador de plantillas municipales con datos del perfil."""
from __future__ import annotations

from pathlib import Path

from modules.personalization.profile_loader import load_profile, repo_root


def _replacements(municipio_key: str) -> dict[str, str]:
    profile = load_profile(municipio_key)
    infra = profile.get("infraestructura_objetivo", {})
    concesionario = profile.get("concesionario", {})
    gobierno = profile.get("gobierno", {})
    reg = profile.get("reglamento_vigente", {})
    dep = profile.get("dependencia_municipal", {})
    precios = profile.get("precios_locales", {})
    cifras = profile.get("cifras_canonicas_coherencia", {})

    mid = profile.get("municipio_id", municipio_key).lower()
    return {
        "{{MUNICIPIO_ID}}": mid,
        "{{MUNICIPIO_ID_UPPER}}": mid.upper(),
        "{{NOMBRE_MUNICIPIO}}": profile.get("municipio", ""),
        "{{NOMBRE_ESTADO}}": profile.get("estado", ""),
        "{{ZM_NOMBRE}}": profile.get("zm_nombre", profile.get("zm_simulator_id", "")),
        "{{VIVIENDAS}}": f"{cifras.get('viviendas', profile.get('viviendas_universo', 0)):,}",
        "{{RSU_TON_DIA}}": str(profile.get("generacion_rsu_ton_dia", 0)),
        "{{CENTROS_ACOPIO}}": str(cifras.get("centros_acopio", infra.get("centros_acopio", 0))),
        "{{RECICLADORAS}}": str(
            cifras.get("recicladoras", infra.get("recicladoras_por_giro", 0))
        ),
        "{{TON_DIA_ANIO_3}}": str(
            cifras.get("ton_dia_anio_3", infra.get("tonelaje_objetivo_anio_3_t_dia", 0))
        ),
        "{{CONCESIONARIO}}": concesionario.get("nombre", ""),
        "{{RELACION_CONCESIONARIO}}": concesionario.get("relacion", ""),
        "{{DEPENDENCIA}}": dep.get("nombre", ""),
        "{{REGLAMENTO_NOMBRE}}": reg.get("nombre", ""),
        "{{REGLAMENTO_ANIO}}": str(reg.get("anio_version", "")),
        "{{CABILDO_APOYO}}": profile.get("cabildo_apoyo", ""),
        "{{PARTIDO}}": gobierno.get("partido", ""),
        "{{MESES_RESTANTES}}": str(gobierno.get("meses_restantes", "")),
        "{{PRECIO_PET}}": str(precios.get("PET", 0)),
        "{{PRECIO_PAPEL}}": str(precios.get("papel", 0)),
        "{{PRECIO_VIDRIO}}": str(precios.get("vidrio", 0)),
        "{{PRECIO_ALUMINIO}}": str(precios.get("aluminio", 0)),
        "{{ARTICULO}}": "",
        "{{FECHA}}": profile.get("meta", {}).get("actualizado", ""),
    }


def instantiate_template(
    template_name: str,
    municipio_key: str,
    *,
    output_path: Path | None = None,
) -> str:
    """
    Lee plantilla de /data/municipalities/templates/ y sustituye placeholders.
    """
    templates_dir = repo_root() / "data" / "municipalities" / "templates"
    template_path = templates_dir / template_name
    if not template_path.is_file():
        raise FileNotFoundError(f"Plantilla no encontrada: {template_path}")

    content = template_path.read_text(encoding="utf-8")
    reps = _replacements(municipio_key)
    for token, value in reps.items():
        content = content.replace(token, value)

    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(content, encoding="utf-8")

    return content
