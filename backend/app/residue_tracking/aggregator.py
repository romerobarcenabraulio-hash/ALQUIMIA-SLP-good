"""Municipal-level residue aggregation and calculation."""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models.generador import GeneratorResidueRecord, MunicipalResidueAggregate
from app.residue_tracking.analyzer import TrendAnalyzer, MaterialComposition


class MunicipalAggregator:
    """Aggregate residue data at municipality level."""

    @staticmethod
    def aggregate_for_date(
        db: Session,
        tenant_id: str,
        municipio: str,
        estado_mx: str,
        fecha: str,
    ) -> Optional[MunicipalResidueAggregate]:
        """Aggregate all residue records for a municipality on a specific date.

        fecha format: YYYY-MM-DD
        """

        # Get all records for this date
        records = db.query(GeneratorResidueRecord).filter(
            and_(
                GeneratorResidueRecord.tenant_id == tenant_id,
                GeneratorResidueRecord.fecha_generacion == fecha,
            )
        ).all()

        if not records:
            return None

        # Aggregate data
        total_tons = sum(r.cantidad_total_tons for r in records)
        total_generadores = len(records)
        promedio_generador = total_tons / total_generadores if total_generadores > 0 else 0

        # Aggregate material breakdown
        materiales_desglose = {}
        for record in records:
            for material, tons in (record.materiales_json or {}).items():
                if material not in materiales_desglose:
                    materiales_desglose[material] = {"tons": 0, "pct": 0}
                materiales_desglose[material]["tons"] += tons

        # Calculate percentages
        if total_tons > 0:
            for material in materiales_desglose:
                pct = (materiales_desglose[material]["tons"] / total_tons) * 100
                materiales_desglose[material]["pct"] = round(pct, 1)

        # Calculate completitud (% of generators that reported)
        # This would require knowing total active generators in municipality
        completitud_pct = 100.0  # Default to full coverage

        # Check if already exists
        existing = db.query(MunicipalResidueAggregate).filter(
            and_(
                MunicipalResidueAggregate.tenant_id == tenant_id,
                MunicipalResidueAggregate.municipio == municipio,
                MunicipalResidueAggregate.fecha == fecha,
                MunicipalResidueAggregate.periodo == "diario",
            )
        ).first()

        if existing:
            # Update existing
            existing.total_tons = total_tons
            existing.total_generadores = total_generadores
            existing.promedio_generador_tons = promedio_generador
            existing.materiales_desglose = materiales_desglose
            existing.completitud_pct = completitud_pct
            existing.updated_at = datetime.utcnow()
            db.commit()
            return existing

        # Create new aggregate
        agg = MunicipalResidueAggregate(
            tenant_id=tenant_id,
            municipio=municipio,
            estado_mx=estado_mx,
            fecha=fecha,
            periodo="diario",
            total_tons=total_tons,
            total_generadores=total_generadores,
            promedio_generador_tons=promedio_generador,
            materiales_desglose=materiales_desglose,
            completitud_pct=completitud_pct,
        )

        db.add(agg)
        db.commit()
        db.refresh(agg)
        return agg

    @staticmethod
    def aggregate_weekly(
        db: Session,
        tenant_id: str,
        municipio: str,
        estado_mx: str,
        start_date: str,  # YYYY-MM-DD
    ) -> Optional[MunicipalResidueAggregate]:
        """Aggregate residue data for a week."""

        # Get daily aggregates for the week
        daily_aggs = db.query(MunicipalResidueAggregate).filter(
            and_(
                MunicipalResidueAggregate.tenant_id == tenant_id,
                MunicipalResidueAggregate.municipio == municipio,
                MunicipalResidueAggregate.fecha >= start_date,
                MunicipalResidueAggregate.fecha < (
                    datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=7)
                ).strftime("%Y-%m-%d"),
                MunicipalResidueAggregate.periodo == "diario",
            )
        ).all()

        if not daily_aggs:
            return None

        # Aggregate
        total_tons = sum(a.total_tons for a in daily_aggs)
        avg_generadores = len(daily_aggs) > 0 and sum(a.total_generadores for a in daily_aggs) / len(daily_aggs) or 0

        # Material breakdown
        materiales_desglose = {}
        for agg in daily_aggs:
            for material, data in agg.materiales_desglose.items():
                if material not in materiales_desglose:
                    materiales_desglose[material] = {"tons": 0, "pct": 0}
                materiales_desglose[material]["tons"] += data.get("tons", 0)

        # Recalculate percentages
        if total_tons > 0:
            for material in materiales_desglose:
                pct = (materiales_desglose[material]["tons"] / total_tons) * 100
                materiales_desglose[material]["pct"] = round(pct, 1)

        week_end = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=6)).strftime("%Y-%m-%d")

        existing = db.query(MunicipalResidueAggregate).filter(
            and_(
                MunicipalResidueAggregate.tenant_id == tenant_id,
                MunicipalResidueAggregate.municipio == municipio,
                MunicipalResidueAggregate.fecha == start_date,
                MunicipalResidueAggregate.periodo == "semanal",
            )
        ).first()

        if existing:
            existing.total_tons = total_tons
            existing.total_generadores = avg_generadores
            existing.materiales_desglose = materiales_desglose
            existing.updated_at = datetime.utcnow()
            db.commit()
            return existing

        agg = MunicipalResidueAggregate(
            tenant_id=tenant_id,
            municipio=municipio,
            estado_mx=estado_mx,
            fecha=start_date,
            periodo="semanal",
            total_tons=total_tons,
            total_generadores=int(avg_generadores),
            materiales_desglose=materiales_desglose,
        )

        db.add(agg)
        db.commit()
        db.refresh(agg)
        return agg

    @staticmethod
    def calculate_trends(
        db: Session,
        tenant_id: str,
        municipio: str,
        days: int = 30,
    ) -> Dict[str, Any]:
        """Calculate trend statistics for municipality."""

        cutoff_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

        daily_aggs = db.query(MunicipalResidueAggregate).filter(
            and_(
                MunicipalResidueAggregate.tenant_id == tenant_id,
                MunicipalResidueAggregate.municipio == municipio,
                MunicipalResidueAggregate.periodo == "diario",
                MunicipalResidueAggregate.fecha >= cutoff_date,
            )
        ).order_by(MunicipalResidueAggregate.fecha).all()

        if not daily_aggs:
            return {
                "dias_con_datos": 0,
                "media_tons_diarios": 0,
                "proyeccion_mes_tons": 0,
                "tendencia": "insufficient_data",
                "cambio_semana_pct": None,
                "cambio_mes_pct": None,
            }

        daily_values = [a.total_tons for a in daily_aggs]
        trend_data = TrendAnalyzer.calculate_trend(daily_values)

        # Calculate week-over-week and month-over-month changes
        if len(daily_aggs) >= 7:
            ultima_semana = sum(a.total_tons for a in daily_aggs[-7:]) / 7
            semana_anterior = sum(a.total_tons for a in daily_aggs[-14:-7]) / 7
            cambio_semana_pct = ((ultima_semana - semana_anterior) / semana_anterior * 100) if semana_anterior > 0 else None
        else:
            cambio_semana_pct = None

        if len(daily_aggs) >= 30:
            ultimo_mes = sum(a.total_tons for a in daily_aggs[-30:]) / 30
            mes_anterior = sum(a.total_tons for a in daily_aggs[-60:-30]) / 30
            cambio_mes_pct = ((ultimo_mes - mes_anterior) / mes_anterior * 100) if mes_anterior > 0 else None
        else:
            cambio_mes_pct = None

        proyeccion_mes = TrendAnalyzer.project_monthly(trend_data["media_tons"], len(daily_aggs))

        return {
            "dias_con_datos": len(daily_aggs),
            "media_tons_diarios": trend_data["media_tons"],
            "desviacion_estandar": trend_data["desviacion_estandar"],
            "minimo_tons_diarios": trend_data["minimo_tons"],
            "maximo_tons_diarios": trend_data["maximo_tons"],
            "coef_variacion": trend_data["coef_variacion"],
            "proyeccion_mes_tons": proyeccion_mes,
            "tendencia": trend_data["tendencia"],
            "cambio_semana_pct": round(cambio_semana_pct, 1) if cambio_semana_pct else None,
            "cambio_mes_pct": round(cambio_mes_pct, 1) if cambio_mes_pct else None,
        }

    @staticmethod
    def generate_banobras_export(
        db: Session,
        tenant_id: str,
    ) -> Dict[str, Any]:
        """Generate municipal residue data in BANOBRAS-compatible format."""

        # Get all aggregates for last 30 days
        cutoff_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")

        aggs = db.query(MunicipalResidueAggregate).filter(
            and_(
                MunicipalResidueAggregate.tenant_id == tenant_id,
                MunicipalResidueAggregate.periodo == "diario",
                MunicipalResidueAggregate.fecha >= cutoff_date,
            )
        ).all()

        # Group by municipality
        by_municipio = {}
        for agg in aggs:
            if agg.municipio not in by_municipio:
                by_municipio[agg.municipio] = []
            by_municipio[agg.municipio].append(agg)

        # Export format
        export = {
            "fecha_generacion": datetime.utcnow().isoformat(),
            "periodo_datos": "ultimos_30_dias",
            "municipios": []
        }

        for municipio, aggs_list in by_municipio.items():
            total_tons = sum(a.total_tons for a in aggs_list)
            dias_con_datos = len(aggs_list)

            municipio_data = {
                "nombre": municipio,
                "total_residuos_tons": round(total_tons, 2),
                "promedio_diario_tons": round(total_tons / dias_con_datos, 2) if dias_con_datos > 0 else 0,
                "dias_reportados": dias_con_datos,
                "generadores_promedio": int(sum(a.total_generadores for a in aggs_list) / dias_con_datos) if dias_con_datos > 0 else 0,
            }

            export["municipios"].append(municipio_data)

        return export
