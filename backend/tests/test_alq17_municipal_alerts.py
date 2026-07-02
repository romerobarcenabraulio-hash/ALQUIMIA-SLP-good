"""Tests para ALQ-17: Alertas municipales"""
import pytest
import json
from datetime import datetime
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.db.base import Base
from app.models.municipal_alert import MunicipalAlertModel, AlertSubscriptionModel
from app.services.municipal_alert_service import MunicipalAlertService, AlertSubscriptionService
from app.national.alerts import (
    MunicipalAlert,
    AlertType,
    AlertSeverity,
    evaluate_coverage_change,
    evaluate_kpi_threshold,
    generate_municipio_unlocked_alert,
    generate_breach_alert,
)


@pytest.fixture
def db():
    """SQLite in-memory database for testing"""
    engine = create_engine("sqlite:///:memory:")
    # Only create tables for this test (avoid JSONB columns from other tables)
    MunicipalAlertModel.__table__.create(engine, checkfirst=True)
    AlertSubscriptionModel.__table__.create(engine, checkfirst=True)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    yield db
    db.close()


class TestAlertGeneration:
    """Test generación de alertas según reglas"""

    def test_coverage_change_downgrade_critical(self):
        """Verificado → Bloqueado genera CRITICAL"""
        alert = evaluate_coverage_change("25001", "verificado", "bloqueado")
        assert alert is not None
        assert alert.alert_type == AlertType.COVERAGE_CHANGED
        assert alert.severity == AlertSeverity.CRITICAL
        assert alert.municipio_id == "25001"

    def test_coverage_change_downgrade_high(self):
        """Verificado → Estimado genera HIGH"""
        alert = evaluate_coverage_change("25001", "verificado", "estimado")
        assert alert is not None
        assert alert.severity == AlertSeverity.HIGH

    def test_coverage_change_no_alert_if_same(self):
        """Sin cambio → Sin alerta"""
        alert = evaluate_coverage_change("25001", "verificado", "verificado")
        assert alert is None

    def test_kpi_threshold_below_minimum(self):
        """RSU ton/día bajo mínimo genera alerta HIGH"""
        alert = evaluate_kpi_threshold("25001", "rsu_ton_dia", Decimal("2.0"))
        assert alert is not None
        assert alert.alert_type == AlertType.KPI_THRESHOLD_EXCEEDED
        assert alert.severity == AlertSeverity.HIGH

    def test_kpi_threshold_above_maximum(self):
        """RSU ton/día sobre máximo genera alerta MEDIUM"""
        alert = evaluate_kpi_threshold("25001", "rsu_ton_dia", Decimal("600.0"))
        assert alert is not None
        assert alert.severity == AlertSeverity.MEDIUM

    def test_kpi_threshold_within_range(self):
        """RSU ton/día dentro de rango → sin alerta"""
        alert = evaluate_kpi_threshold("25001", "rsu_ton_dia", Decimal("50.0"))
        assert alert is None

    def test_municipio_unlocked_alert(self):
        """Desbloqueado genera alerta HIGH"""
        alert = generate_municipio_unlocked_alert("25001", "Brechas cerradas")
        assert alert.alert_type == AlertType.MUNICIPIO_UNLOCKED
        assert alert.severity == AlertSeverity.HIGH

    def test_breach_opened_alert(self):
        """Brecha abierta genera CRITICAL/HIGH"""
        alert = generate_breach_alert("25001", "city_baseline", is_opened=True)
        assert alert.alert_type == AlertType.BREACH_OPENED
        assert alert.severity == AlertSeverity.HIGH

    def test_breach_closed_alert(self):
        """Brecha cerrada genera MEDIUM"""
        alert = generate_breach_alert("25001", "city_baseline", is_opened=False)
        assert alert.alert_type == AlertType.BREACH_CLOSED
        assert alert.severity == AlertSeverity.MEDIUM


class TestMunicipalAlertService:
    """Test CRUD de alertas"""

    def test_record_alert(self, db):
        """Registra y persiste una alerta"""
        alert = MunicipalAlert(
            municipio_id="25001",
            alert_type=AlertType.COVERAGE_CHANGED,
            severity=AlertSeverity.HIGH,
            title="Cobertura cambió",
            description="Verificado → Estimado",
            old_value="verificado",
            new_value="estimado",
        )
        recorded = MunicipalAlertService.record_alert(db, alert)
        assert recorded.id is not None
        assert recorded.municipio_id == "25001"
        assert recorded.severity == AlertSeverity.HIGH

    def test_list_alerts_all(self, db):
        """Lista todas las alertas"""
        for i in range(5):
            alert = MunicipalAlert(
                municipio_id=f"2500{i}",
                alert_type=AlertType.COVERAGE_CHANGED,
                severity=AlertSeverity.HIGH,
                title=f"Alert {i}",
                description=f"Description {i}",
            )
            MunicipalAlertService.record_alert(db, alert)

        alerts, total = MunicipalAlertService.list_alerts(db)
        assert len(alerts) == 5
        assert total == 5

    def test_list_alerts_filter_municipio(self, db):
        """Filtra alertas por municipio"""
        for i in range(3):
            alert = MunicipalAlert(
                municipio_id="25001" if i < 2 else "25002",
                alert_type=AlertType.COVERAGE_CHANGED,
                severity=AlertSeverity.HIGH,
                title=f"Alert {i}",
                description=f"Description {i}",
            )
            MunicipalAlertService.record_alert(db, alert)

        alerts, total = MunicipalAlertService.list_alerts(db, municipio_id="25001")
        assert len(alerts) == 2
        assert all(a.municipio_id == "25001" for a in alerts)

    def test_list_alerts_filter_severity(self, db):
        """Filtra alertas por severidad"""
        for severity in [AlertSeverity.CRITICAL, AlertSeverity.HIGH, AlertSeverity.MEDIUM]:
            alert = MunicipalAlert(
                municipio_id="25001",
                alert_type=AlertType.COVERAGE_CHANGED,
                severity=severity,
                title=f"Alert {severity}",
                description=f"Description {severity}",
            )
            MunicipalAlertService.record_alert(db, alert)

        alerts, total = MunicipalAlertService.list_alerts(db, severity=AlertSeverity.CRITICAL)
        assert len(alerts) == 1
        assert alerts[0].severity == AlertSeverity.CRITICAL

    def test_acknowledge_alert(self, db):
        """Marca alerta como leída"""
        alert = MunicipalAlert(
            municipio_id="25001",
            alert_type=AlertType.COVERAGE_CHANGED,
            severity=AlertSeverity.HIGH,
            title="Alert",
            description="Description",
        )
        recorded = MunicipalAlertService.record_alert(db, alert)
        assert recorded.acknowledged == 0

        acknowledged = MunicipalAlertService.acknowledge_alert(db, recorded.id)
        assert acknowledged.acknowledged != 0

    def test_resolve_alert(self, db):
        """Marca alerta como resuelta"""
        alert = MunicipalAlert(
            municipio_id="25001",
            alert_type=AlertType.COVERAGE_CHANGED,
            severity=AlertSeverity.HIGH,
            title="Alert",
            description="Description",
        )
        recorded = MunicipalAlertService.record_alert(db, alert)
        assert recorded.resolved == 0

        resolved = MunicipalAlertService.resolve_alert(db, recorded.id)
        assert resolved.resolved != 0

    def test_count_unresolved_by_municipio(self, db):
        """Cuenta alertas abiertas por severidad"""
        for severity in [AlertSeverity.CRITICAL, AlertSeverity.HIGH, AlertSeverity.HIGH]:
            alert = MunicipalAlert(
                municipio_id="25001",
                alert_type=AlertType.COVERAGE_CHANGED,
                severity=severity,
                title=f"Alert {severity}",
                description=f"Description {severity}",
            )
            MunicipalAlertService.record_alert(db, alert)

        # Resolve the CRITICAL alert
        alerts, _ = MunicipalAlertService.list_alerts(db, municipio_id="25001")
        critical_alert = next((a for a in alerts if a.severity == AlertSeverity.CRITICAL), None)
        if critical_alert:
            MunicipalAlertService.resolve_alert(db, critical_alert.id)

        summary = MunicipalAlertService.count_unresolved_by_municipio(db, "25001")
        assert summary["total"] == 2  # 3 - 1 resolved
        assert summary["critical"] == 0  # resolved
        assert summary["high"] == 2


class TestAlertSubscriptionService:
    """Test suscripciones a alertas"""

    def test_create_subscription(self, db):
        """Crea una suscripción"""
        sub = AlertSubscriptionService.create_subscription(
            db,
            user_id="user123",
            alert_types=["COVERAGE_CHANGED", "BREACH_OPENED"],
            municipios=["25001", "25002"],
            min_severity=AlertSeverity.HIGH,
        )
        assert sub.user_id == "user123"
        assert json.loads(sub.alert_types) == ["COVERAGE_CHANGED", "BREACH_OPENED"]
        assert json.loads(sub.municipios) == ["25001", "25002"]

    def test_get_subscriptions_for_alert_matches_type(self, db):
        """Obtiene suscriptores que coinciden con tipo de alerta"""
        sub = AlertSubscriptionService.create_subscription(
            db,
            user_id="user123",
            alert_types=["COVERAGE_CHANGED"],
            min_severity=AlertSeverity.HIGH,
        )

        alert_model = MunicipalAlertModel(
            municipio_id="25001",
            alert_type=AlertType.COVERAGE_CHANGED,
            severity=AlertSeverity.HIGH,
            title="Alert",
            description="Description",
        )

        matching = AlertSubscriptionService.get_subscriptions_for_alert(db, alert_model)
        assert len(matching) == 1
        assert matching[0].user_id == "user123"

    def test_get_subscriptions_for_alert_filters_severity(self, db):
        """Filtra por severidad mínima"""
        sub = AlertSubscriptionService.create_subscription(
            db,
            user_id="user123",
            alert_types=["COVERAGE_CHANGED"],
            min_severity=AlertSeverity.CRITICAL,  # Solo CRITICAL
        )

        alert_model = MunicipalAlertModel(
            municipio_id="25001",
            alert_type=AlertType.COVERAGE_CHANGED,
            severity=AlertSeverity.HIGH,  # Pero es HIGH
            title="Alert",
            description="Description",
        )

        matching = AlertSubscriptionService.get_subscriptions_for_alert(db, alert_model)
        assert len(matching) == 0  # No match: HIGH < CRITICAL

    def test_get_subscriptions_for_alert_filters_municipios(self, db):
        """Filtra por municipios específicos"""
        sub = AlertSubscriptionService.create_subscription(
            db,
            user_id="user123",
            alert_types=["COVERAGE_CHANGED"],
            municipios=["25001"],  # Solo 25001
            min_severity=AlertSeverity.HIGH,
        )

        alert_model = MunicipalAlertModel(
            municipio_id="25002",  # Pero es 25002
            alert_type=AlertType.COVERAGE_CHANGED,
            severity=AlertSeverity.HIGH,
            title="Alert",
            description="Description",
        )

        matching = AlertSubscriptionService.get_subscriptions_for_alert(db, alert_model)
        assert len(matching) == 0  # No match: municipio diferente
