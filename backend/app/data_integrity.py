"""Data integrity and consistency checking utilities."""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta

logger = logging.getLogger("app.data_integrity")


class IntegrityChecker:
    """Check and repair data consistency issues."""

    @staticmethod
    def check_generador_residue_consistency(
        db: Session, generador_id: str
    ) -> Dict[str, Any]:
        """Check for inconsistencies in residue records for a generador."""

        from app.models.generador import GeneratorResidueRecord

        records = db.query(GeneratorResidueRecord).filter(
            GeneratorResidueRecord.generador_id == generador_id
        ).all()

        issues = {
            "total_records": len(records),
            "zero_quantity_records": 0,
            "negative_quantity_records": 0,
            "material_sum_mismatch": 0,
            "duplicate_dates": 0,
        }

        seen_dates = {}

        for record in records:
            # Check for zero/negative quantities
            if record.cantidad_total_tons <= 0:
                issues["zero_quantity_records"] += 1

            if record.cantidad_total_tons < 0:
                issues["negative_quantity_records"] += 1

            # Check material sum vs total
            material_sum = sum(record.materiales_json.values())
            if material_sum > 0:
                diff_pct = abs(material_sum - record.cantidad_total_tons) / record.cantidad_total_tons * 100
                if diff_pct > 10:
                    issues["material_sum_mismatch"] += 1

            # Check for duplicate dates
            date = record.fecha_generacion
            if date in seen_dates:
                issues["duplicate_dates"] += 1
            else:
                seen_dates[date] = record.id

        return issues

    @staticmethod
    def check_municipal_aggregate_gaps(
        db: Session, tenant_id: str, municipio: str, days: int = 30
    ) -> Dict[str, Any]:
        """Check for gaps in daily municipal aggregates."""

        from app.models.generador import MunicipalResidueAggregate

        cutoff_date = (datetime.utcnow() - timedelta(days=days)).date()

        aggregates = db.query(MunicipalResidueAggregate).filter(
            and_(
                MunicipalResidueAggregate.tenant_id == tenant_id,
                MunicipalResidueAggregate.municipio == municipio,
                MunicipalResidueAggregate.periodo == "diario",
            )
        ).order_by(MunicipalResidueAggregate.fecha).all()

        if not aggregates:
            return {
                "municipio": municipio,
                "total_expected_days": days,
                "total_actual_days": 0,
                "missing_days": days,
                "completitud_pct": 0.0,
                "missing_dates": [],
            }

        # Build set of actual dates
        actual_dates = set(a.fecha for a in aggregates)

        # Find missing dates
        current = cutoff_date
        missing_dates = []
        while current <= datetime.utcnow().date():
            date_str = current.strftime("%Y-%m-%d")
            if date_str not in actual_dates:
                missing_dates.append(date_str)
            current = current.replace(day=current.day + 1) if current.day < 28 else \
                      current.replace(month=current.month + 1, day=1)

        completitud_pct = (len(actual_dates) / max(1, days)) * 100

        return {
            "municipio": municipio,
            "total_expected_days": days,
            "total_actual_days": len(aggregates),
            "missing_days": len(missing_dates),
            "completitud_pct": round(completitud_pct, 1),
            "missing_dates": missing_dates[:10] if missing_dates else None,  # Show first 10
        }

    @staticmethod
    def check_outlier_detection_coverage(
        db: Session, tenant_id: str, days: int = 7
    ) -> Dict[str, Any]:
        """Check if outlier detection has been run on recent records."""

        from app.models.generador import GeneratorResidueRecord

        cutoff_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

        recent_records = db.query(GeneratorResidueRecord).filter(
            and_(
                GeneratorResidueRecord.tenant_id == tenant_id,
                GeneratorResidueRecord.fecha_generacion >= cutoff_date,
            )
        ).all()

        outlier_checked = sum(1 for r in recent_records if r.es_outlier is not None)
        without_check = len(recent_records) - outlier_checked

        return {
            "total_recent_records": len(recent_records),
            "with_outlier_check": outlier_checked,
            "without_outlier_check": without_check,
            "outlier_coverage_pct": round((outlier_checked / max(1, len(recent_records))) * 100, 1),
        }

    @staticmethod
    def check_all_system_integrity(
        db: Session, tenant_id: str
    ) -> Dict[str, Any]:
        """Comprehensive data integrity check for entire system."""

        from app.models.generador import GeneradorEntity, GeneratorResidueRecord

        generadores = db.query(GeneradorEntity).filter(
            and_(
                GeneradorEntity.tenant_id == tenant_id,
                GeneradorEntity.deleted_at.is_(None),
            )
        ).all()

        status = {
            "timestamp": datetime.utcnow().isoformat(),
            "tenant_id": str(tenant_id),
            "total_generadores": len(generadores),
            "generadores_with_data": 0,
            "generadores_with_issues": [],
            "average_records_per_generador": 0,
        }

        total_records = 0

        for gen in generadores:
            records = db.query(GeneratorResidueRecord).filter(
                GeneratorResidueRecord.generador_id == gen.id
            ).count()

            total_records += records

            if records > 0:
                status["generadores_with_data"] += 1

                # Check for issues
                issues = IntegrityChecker.check_generador_residue_consistency(db, str(gen.id))
                if any(v > 0 for k, v in issues.items() if k != "total_records"):
                    status["generadores_with_issues"].append({
                        "generador_id": str(gen.id),
                        "nombre": gen.nombre,
                        "issues": issues,
                    })

        status["average_records_per_generador"] = round(
            total_records / max(1, status["generadores_with_data"]), 1
        )

        return status
