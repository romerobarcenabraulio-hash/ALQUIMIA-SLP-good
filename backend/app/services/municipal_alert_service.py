"""Servicio de alertas municipales para ALQ-17"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
import json

from sqlalchemy.orm import Session
from sqlalchemy import select, desc, and_

from app.models.municipal_alert import MunicipalAlertModel, AlertSubscriptionModel
from app.national.alerts import MunicipalAlert, AlertType, AlertSeverity


class MunicipalAlertService:
    """Servicio CRUD para alertas municipales"""

    @staticmethod
    def record_alert(db: Session, alert: MunicipalAlert) -> MunicipalAlertModel:
        """Registra una nueva alerta en la BD"""
        model = MunicipalAlertModel(
            municipio_id=alert.municipio_id,
            alert_type=alert.alert_type,
            severity=alert.severity,
            title=alert.title,
            description=alert.description,
            changed_field=alert.changed_field,
            old_value=alert.old_value,
            new_value=alert.new_value,
            metadata_json=json.dumps(alert.metadata) if alert.metadata else None,
            triggered_by=alert.triggered_by,
        )
        db.add(model)
        db.commit()
        db.refresh(model)
        return model

    @staticmethod
    def list_alerts(
        db: Session,
        municipio_id: Optional[str] = None,
        alert_type: Optional[AlertType] = None,
        severity: Optional[AlertSeverity] = None,
        unresolved_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[List[MunicipalAlertModel], int]:
        """Lista alertas con filtros opcionales"""
        query = db.query(MunicipalAlertModel)

        if municipio_id:
            query = query.filter(MunicipalAlertModel.municipio_id == municipio_id)

        if alert_type:
            query = query.filter(MunicipalAlertModel.alert_type == alert_type)

        if severity:
            query = query.filter(MunicipalAlertModel.severity == severity)

        if unresolved_only:
            query = query.filter(MunicipalAlertModel.resolved == 0)

        # Total count
        total = query.count()

        # Paginated results (newest first)
        alerts = query.order_by(desc(MunicipalAlertModel.created_at)).limit(limit).offset(offset).all()

        return alerts, total

    @staticmethod
    def get_alert(db: Session, alert_id: int) -> Optional[MunicipalAlertModel]:
        """Obtiene una alerta por ID"""
        return db.query(MunicipalAlertModel).filter(MunicipalAlertModel.id == alert_id).first()

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: int) -> Optional[MunicipalAlertModel]:
        """Marca una alerta como leída"""
        alert = db.query(MunicipalAlertModel).filter(MunicipalAlertModel.id == alert_id).first()
        if alert:
            alert.acknowledged = int(datetime.now(timezone.utc).timestamp())
            db.commit()
            db.refresh(alert)
        return alert

    @staticmethod
    def resolve_alert(db: Session, alert_id: int) -> Optional[MunicipalAlertModel]:
        """Marca una alerta como resuelta"""
        alert = db.query(MunicipalAlertModel).filter(MunicipalAlertModel.id == alert_id).first()
        if alert:
            alert.resolved = int(datetime.now(timezone.utc).timestamp())
            db.commit()
            db.refresh(alert)
        return alert

    @staticmethod
    def count_unresolved_by_municipio(db: Session, municipio_id: str) -> dict:
        """Cuenta alertas abiertas por severidad para un municipio"""
        alerts = db.query(MunicipalAlertModel).filter(
            and_(
                MunicipalAlertModel.municipio_id == municipio_id,
                MunicipalAlertModel.resolved == 0,
            )
        ).all()

        counts = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "total": len(alerts),
        }

        for alert in alerts:
            counts[alert.severity.value] += 1

        return counts


class AlertSubscriptionService:
    """Servicio para gestionar suscripciones a alertas"""

    @staticmethod
    def create_subscription(
        db: Session,
        user_id: str,
        alert_types: List[str],
        municipios: Optional[List[str]] = None,
        min_severity: AlertSeverity = AlertSeverity.MEDIUM,
        notify_via_email: bool = True,
        notify_via_dashboard: bool = True,
    ) -> AlertSubscriptionModel:
        """Crea una nueva suscripción"""
        subscription = AlertSubscriptionModel(
            user_id=user_id,
            alert_types=json.dumps(alert_types),
            municipios=json.dumps(municipios) if municipios else None,
            min_severity=min_severity,
            notify_via_email=1 if notify_via_email else 0,
            notify_via_dashboard=1 if notify_via_dashboard else 0,
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        return subscription

    @staticmethod
    def get_subscriptions_for_alert(
        db: Session,
        alert: MunicipalAlertModel,
    ) -> List[AlertSubscriptionModel]:
        """Obtiene suscriptores interesados en una alerta"""
        subscriptions = db.query(AlertSubscriptionModel).all()
        matching = []

        for sub in subscriptions:
            alert_types = json.loads(sub.alert_types)
            if alert.alert_type.value not in alert_types:
                continue

            # Verificar severidad mínima
            if sub.min_severity.value > alert.severity.value:
                continue

            # Verificar filtro de municipios
            if sub.municipios:
                municipios = json.loads(sub.municipios)
                if alert.municipio_id not in municipios:
                    continue

            matching.append(sub)

        return matching
