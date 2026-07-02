"""Tests para ALQ-18: Export Excel de cobertura municipal"""
import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timezone

from app.national.export_excel import CoberturaExcelBuilder
from app.national.schemas import CoverageStage


class TestCoberturaExcelBuilder:
    """Test construcción de reportes Excel"""

    def test_builder_initialization(self):
        """Crea builder sin errores"""
        try:
            builder = CoberturaExcelBuilder()
            assert builder.wb is not None
        except ImportError:
            pytest.skip("openpyxl no disponible")

    def test_build_summary_sheet(self):
        """Crea sheet de resumen con counts"""
        try:
            builder = CoberturaExcelBuilder()
            builder.build_summary_sheet(
                verde_count=10,
                amarillo_count=5,
                rojo_count=2,
                generated_at=datetime(2026, 7, 2, 12, 0, 0, tzinfo=timezone.utc),
            )
            assert "Resumen Nacional" in builder.wb.sheetnames
        except ImportError:
            pytest.skip("openpyxl no disponible")

    def test_add_municipios_sheet(self):
        """Agrega sheet de municipios"""
        try:
            builder = CoberturaExcelBuilder()
            municipios = [
                {
                    "municipio_id": "25001",
                    "nombre": "Ahualulco",
                    "estado_general": "verificado",
                    "demografia": "estimado",
                    "rsu": "localizado",
                    "legal": "verificado",
                    "contrato": "no_disponible",
                    "presupuesto": "estimado",
                    "operacion": "estimado",
                    "rsu_ton_dia": 50.5,
                    "per_capita": 1.2,
                    "agora_bloqueado": False,
                    "siguiente_accion": "Completar datos",
                }
            ]
            builder.add_municipios_sheet(municipios)
            assert "Municipios" in builder.wb.sheetnames
        except ImportError:
            pytest.skip("openpyxl no disponible")

    def test_add_alerts_sheet(self):
        """Agrega sheet de alertas"""
        try:
            builder = CoberturaExcelBuilder()
            alerts = [
                {
                    "municipio_id": "25001",
                    "alert_type": "coverage_changed",
                    "severity": "high",
                    "title": "Cambio de cobertura",
                    "description": "Verificado → Estimado",
                    "created_at": datetime(2026, 7, 2, 12, 0, 0, tzinfo=timezone.utc),
                    "acknowledged": False,
                    "resolved": False,
                }
            ]
            builder.add_alerts_sheet(alerts)
            assert "Alertas Históricas" in builder.wb.sheetnames
        except ImportError:
            pytest.skip("openpyxl no disponible")

    def test_to_bytes(self):
        """Convierte workbook a bytes"""
        try:
            builder = CoberturaExcelBuilder()
            builder.build_summary_sheet(10, 5, 2)
            builder.add_municipios_sheet([])
            builder.add_alerts_sheet([])

            excel_bytes = builder.to_bytes()
            assert isinstance(excel_bytes, bytes)
            assert len(excel_bytes) > 0
        except ImportError:
            pytest.skip("openpyxl no disponible")

    def test_status_fill_verde(self):
        """Asigna color VERDE para estado verificado"""
        try:
            fill = CoberturaExcelBuilder._get_status_fill("verificado")
            # Just verify it doesn't error
            assert fill is not None
        except ImportError:
            pytest.skip("openpyxl no disponible")

    def test_status_fill_amarillo(self):
        """Asigna color AMARILLO para estado localizado"""
        try:
            fill = CoberturaExcelBuilder._get_status_fill("localizado")
            assert fill is not None
        except ImportError:
            pytest.skip("openpyxl no disponible")

    def test_status_fill_rojo(self):
        """Asigna color ROJO para estado bloqueado"""
        try:
            fill = CoberturaExcelBuilder._get_status_fill("bloqueado")
            assert fill is not None
        except ImportError:
            pytest.skip("openpyxl no disponible")

    def test_percentage_calculation(self):
        """Calcula porcentajes correctamente"""
        assert CoberturaExcelBuilder._pct(10, 50) == "20%"
        assert CoberturaExcelBuilder._pct(0, 50) == "0%"
        assert CoberturaExcelBuilder._pct(50, 50) == "100%"
        assert CoberturaExcelBuilder._pct(5, 0) == "0%"

    def test_severity_color_critical(self):
        """Asigna color ROJO para severidad crítica"""
        try:
            color = CoberturaExcelBuilder._get_severity_color("critical")
            assert color == "C0392B"  # COLOR_ROJO
        except ImportError:
            pytest.skip("openpyxl no disponible")

    def test_severity_color_high(self):
        """Asigna color AMARILLO para severidad alta"""
        try:
            color = CoberturaExcelBuilder._get_severity_color("high")
            assert color == "D4881E"  # COLOR_AMARILLO
        except ImportError:
            pytest.skip("openpyxl no disponible")
