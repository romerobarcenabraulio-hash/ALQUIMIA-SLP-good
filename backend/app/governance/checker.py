"""Evaluador Fase 20: gobernanza, calidad y riesgo."""
from __future__ import annotations

from app.governance.schemas import (
    DoDItem,
    GovernanceRequest,
    GovernanceResponse,
    MetricaCalidad,
    RiesgoIdentificado,
    RiesgoNivel,
)


def _score(req: GovernanceRequest) -> float:
    score = 0.0
    if req.total_tests_passing >= 600:
        score += 15
    if req.tsc_clean:
        score += 15
    if req.has_rate_limiting:
        score += 15
    if req.has_security_headers:
        score += 15
    if req.has_health_endpoint:
        score += 15
    if req.has_access_control:
        score += 15
    if req.cobertura_modulos >= 9:
        score += 10
    return min(100.0, score)


def evaluate_governance(req: GovernanceRequest) -> GovernanceResponse:
    municipio_id = (req.municipio_id or "").strip()
    if not municipio_id:
        return GovernanceResponse(
            status="bloqueado",
            municipio_id=municipio_id,
            score_gobernanza=0.0,
            metricas=[],
            riesgos=[],
            dod=[],
            resumen="Score de gobernanza: 0/100. Estado: bloqueado. Define municipio_id para ejecutar evaluación.",
            blockers=["municipio_id es obligatorio para evaluar gobernanza."],
        )

    score = _score(req)
    if score >= 85:
        status = "aprobado"
    elif score >= 60:
        status = "observaciones"
    else:
        status = "bloqueado"

    metricas = [
        MetricaCalidad(
            nombre="tests_passing",
            valor_actual=float(req.total_tests_passing),
            umbral_minimo=600.0,
            unidad="tests",
            cumple=req.total_tests_passing >= 600,
            fuente="pytest backend",
        ),
        MetricaCalidad(
            nombre="cobertura_modulos",
            valor_actual=float(req.cobertura_modulos),
            umbral_minimo=9.0,
            unidad="módulos",
            cumple=req.cobertura_modulos >= 9,
            fuente="suite por módulo",
        ),
        MetricaCalidad(
            nombre="seguridad_headers",
            valor_actual=1.0 if req.has_security_headers else 0.0,
            umbral_minimo=1.0,
            unidad="binario",
            cumple=req.has_security_headers,
            fuente="middleware seguridad",
        ),
        MetricaCalidad(
            nombre="control_acceso",
            valor_actual=1.0 if req.has_access_control else 0.0,
            umbral_minimo=1.0,
            unidad="binario",
            cumple=req.has_access_control,
            fuente="middleware roles",
        ),
    ]

    riesgos = [
        RiesgoIdentificado(
            id="doble_conteo_rsu",
            descripcion="Riesgo de doble conteo de RSU al integrar macrogeneradores con flujo municipal.",
            nivel=RiesgoNivel.alto,
            modulo_origen="13.2 Macrogeneradores",
            mitigacion="excluir_del_conteo_domiciliario=True en macrogeneradores",
            estado="mitigado" if req.has_rate_limiting else "abierto",
        ),
        RiesgoIdentificado(
            id="residuos_regulados_no_rsu",
            descripcion="Clasificación incorrecta de residuos regulados como RSU ordinario.",
            nivel=RiesgoNivel.critico,
            modulo_origen="13.3 Portal Empresarial",
            mitigacion="proveedor autorizado SEMARNAT requerido",
            estado="mitigado" if req.has_security_headers else "abierto",
        ),
        RiesgoIdentificado(
            id="legal_gate_sin_base",
            descripcion="Acciones sancionatorias propuestas sin validación legal competente.",
            nivel=RiesgoNivel.alto,
            modulo_origen="12.4 Gate Legal",
            mitigacion="legal_validation_status validado antes de proponer sanción",
            estado="mitigado" if req.has_access_control else "abierto",
        ),
    ]

    dod = [
        DoDItem(
            criterio="Tests backend >= 600",
            cumplido=req.total_tests_passing >= 600,
            evidencia=f"total_tests_passing={req.total_tests_passing}",
        ),
        DoDItem(
            criterio="TypeScript limpio",
            cumplido=req.tsc_clean,
            evidencia=f"tsc_clean={req.tsc_clean}",
        ),
        DoDItem(
            criterio="Rate limiting activo",
            cumplido=req.has_rate_limiting,
            evidencia=f"has_rate_limiting={req.has_rate_limiting}",
        ),
        DoDItem(
            criterio="Headers de seguridad activos",
            cumplido=req.has_security_headers,
            evidencia=f"has_security_headers={req.has_security_headers}",
        ),
        DoDItem(
            criterio="Health endpoint operativo",
            cumplido=req.has_health_endpoint,
            evidencia=f"has_health_endpoint={req.has_health_endpoint}",
        ),
        DoDItem(
            criterio="Control de acceso operativo",
            cumplido=req.has_access_control,
            evidencia=f"has_access_control={req.has_access_control}",
        ),
    ]

    resumen = f"Score de gobernanza: {score:.0f}/100. Estado: {status}."
    if status != "aprobado":
        resumen = f"{resumen} Priorizar cierre de controles y cumplimiento DoD antes de liberar."

    return GovernanceResponse(
        status=status,
        municipio_id=municipio_id,
        score_gobernanza=score,
        metricas=metricas,
        riesgos=riesgos,
        dod=dod,
        resumen=resumen,
        blockers=[] if status != "bloqueado" else [],
    )
