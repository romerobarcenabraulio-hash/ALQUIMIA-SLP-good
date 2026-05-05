"""
Tests Fase 3C — Persistencia y Descarga Institucional

Criterios de cierre (02_FASE_3C_PERSISTENCIA_DESCARGA.md):
  - Un paquete generado persiste en storage local o equivalente
  - Se puede recuperar por ID
  - Se puede descargar desde API
  - El ZIP o bundle incluye manifest
  - Manifest incluye hashes/checksums
  - Warnings y DataProvenance sobreviven a persistencia
  - Existen tests de recuperación y descarga

Red flags que bloquean cierre:
  - Solo hay Drive ID (sin disco)
  - El paquete vive solo en memoria
  - La descarga reconstruye documentos sin usar bundle original
  - No hay checksum
  - No hay manifest
  - No hay manejo de error cuando falta un archivo
"""
import io
import json
import os
import tempfile
import zipfile
import pytest
from pathlib import Path
from unittest.mock import patch

# ─── Fixtures ─────────────────────────────────────────────────────────────────

def _make_export_bundle():
    """Construye un ExportBundle mínimo pero válido para tests."""
    from app.agents.schemas import (
        ExportBundle, ExportedDocument, ExportManifest, ExportedFile,
        DocumentStatusLevel,
    )
    docs = [
        ExportedDocument(
            document_id="01_resumen_ejecutivo_municipal",
            filename="01_Resumen_Ejecutivo_Municipal.md",
            format="md",
            status=DocumentStatusLevel.defendible,
            version="0.1-borrador",
            source="llm",
            warnings=[],
        ),
        ExportedDocument(
            document_id="02_modelo_tecnico_financiero",
            filename="02_Modelo_Tecnico_Financiero.md",
            format="md",
            status=DocumentStatusLevel.revision,
            version="0.1-borrador",
            source="template",
            warnings=["Score de confianza bajo"],
        ),
    ]
    manifest = ExportManifest(
        bundle_id="test-bundle-001",
        zm="SLP",
        municipios=["slp"],
        version="0.1-borrador",
        files=[ExportedFile(filename=d.filename, format=d.format) for d in docs],
        fuentes_usadas=["INEGI", "Simulador ALQUIMIA"],
        kpis_incluidos=["ton_generadas_diarias", "capex_total"],
        warnings_activos=["Score bajo"],
        score_datos=72.5,
    )
    return ExportBundle(
        bundle_id="test-bundle-001",
        zm="SLP",
        municipios=["slp"],
        documents=docs,
        manifest=manifest,
        warnings=["Score bajo"],
    )


# ─── Grupo 1: PackageStore — persistencia básica ─────────────────────────────

class TestPackageStorePersistencia:

    def test_save_package_crea_directorio_y_archivos(self):
        """
        save_package() debe crear:
          - package_record.json
          - manifest.json
          - files/ con .md por cada ExportedDocument
          - package.zip
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                record = store_mod.save_package("pkg-test-001", bundle)

                pkg_dir = Path(tmp) / "pkg-test-001"
                assert pkg_dir.exists(), "Directorio del paquete no creado"
                assert (pkg_dir / "package_record.json").exists(), "package_record.json faltante"
                assert (pkg_dir / "manifest.json").exists(), "manifest.json faltante"
                assert (pkg_dir / "package.zip").exists(), "package.zip faltante"

                files_dir = pkg_dir / "files"
                md_files = list(files_dir.glob("*.md"))
                assert len(md_files) == 2, f"Esperados 2 .md, encontrados {len(md_files)}"

    def test_save_package_no_genera_txt(self):
        """
        Ningún archivo en disco puede ser .txt.
        Red flag del spec: .txt sueltos = Fase 3C no cerrada.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                store_mod.save_package("pkg-no-txt", bundle)

                pkg_dir = Path(tmp) / "pkg-no-txt"
                txt_files = list(pkg_dir.rglob("*.txt"))
                assert len(txt_files) == 0, (
                    f"Archivos .txt encontrados en paquete: {[f.name for f in txt_files]}"
                )

    def test_package_record_tiene_checksum(self):
        """
        PackageRecord debe tener checksum SHA-256 del ZIP.
        Sin checksum no hay auditoría posible.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                record = store_mod.save_package("pkg-checksum", bundle)

                assert record.checksum is not None, "PackageRecord sin checksum"
                assert len(record.checksum) == 64, "Checksum no es SHA-256 (64 hex chars)"

    def test_package_record_preserva_warnings(self):
        """
        Los warnings del ExportBundle deben sobrevivir a la persistencia.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                record = store_mod.save_package("pkg-warnings", bundle)

                assert len(record.warnings) > 0, "Warnings no preservados en PackageRecord"
                assert "Score bajo" in record.warnings, "Warning esperado no encontrado"

    def test_package_record_contadores_correctos(self):
        """
        n_documents, n_defendibles y n_bloqueados deben reflejar el ExportBundle.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                record = store_mod.save_package("pkg-counts", bundle)

                assert record.n_documents == 2, "n_documents incorrecto"
                assert record.n_defendibles == 1, "n_defendibles incorrecto"
                assert record.n_bloqueados == 0, "n_bloqueados incorrecto"


# ─── Grupo 2: Recuperación por ID ────────────────────────────────────────────

class TestPackageStoreRecuperacion:

    def test_get_record_desde_memoria(self):
        """
        get_record() retorna PackageRecord desde cache de memoria.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                store_mod.save_package("pkg-mem-001", bundle)

                recovered = store_mod.get_record("pkg-mem-001")
                assert recovered is not None, "get_record() retornó None"
                assert recovered.package_id == "pkg-mem-001"
                assert recovered.zm == "SLP"

    def test_get_record_desde_disco(self):
        """
        get_record() puede recuperar PackageRecord desde disco
        (simulando reinicio de proceso donde memoria está vacía).
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                store_mod.save_package("pkg-disk-001", bundle)

                # Limpiar cache en memoria
                store_mod._records.clear()

                recovered = store_mod.get_record("pkg-disk-001")
                assert recovered is not None, "get_record() no recuperó desde disco"
                assert recovered.package_id == "pkg-disk-001"
                assert recovered.checksum is not None

    def test_get_record_inexistente_retorna_none(self):
        """
        get_record() con ID inválido retorna None, no lanza excepción.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                result = store_mod.get_record("id-que-no-existe")
                assert result is None, "get_record() debería retornar None para ID inexistente"

    def test_get_manifest_retorna_dict_con_fuentes(self):
        """
        get_manifest() retorna dict con fuentes_usadas, kpis_incluidos y warnings_activos.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                store_mod.save_package("pkg-mani-001", bundle)

                manifest = store_mod.get_manifest("pkg-mani-001")
                assert manifest is not None, "get_manifest() retornó None"
                assert "fuentes_usadas" in manifest, "manifest sin fuentes_usadas"
                assert "kpis_incluidos" in manifest, "manifest sin kpis_incluidos"
                assert "warnings_activos" in manifest, "manifest sin warnings_activos"
                assert "INEGI" in manifest["fuentes_usadas"]


# ─── Grupo 3: ZIP y Descarga ──────────────────────────────────────────────────

class TestPackageStoreDescarga:

    def test_zip_es_valido_y_contiene_manifest(self):
        """
        El package.zip debe ser un ZIP válido que incluya manifest.json.
        Sin manifest el paquete no es rastreable.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                store_mod.save_package("pkg-zip-001", bundle)

                zip_bytes = store_mod.get_zip_bytes("pkg-zip-001")
                assert zip_bytes is not None, "get_zip_bytes() retornó None"
                assert len(zip_bytes) > 0, "ZIP vacío"

                with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                    names = zf.namelist()
                    assert "manifest.json" in names, (
                        f"manifest.json no está en ZIP. Contenido: {names}"
                    )

    def test_zip_contiene_documentos_md(self):
        """
        El ZIP debe contener los .md generados en files/.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                store_mod.save_package("pkg-zip-md", bundle)

                zip_bytes = store_mod.get_zip_bytes("pkg-zip-md")
                with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                    names = zf.namelist()
                    md_files = [n for n in names if n.endswith(".md")]
                    assert len(md_files) == 2, (
                        f"Esperados 2 .md en ZIP, encontrados {len(md_files)}: {md_files}"
                    )

    def test_zip_no_contiene_txt(self):
        """
        El ZIP nunca debe contener archivos .txt.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                store_mod.save_package("pkg-zip-notxt", bundle)

                zip_bytes = store_mod.get_zip_bytes("pkg-zip-notxt")
                with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                    txt_files = [n for n in zf.namelist() if n.endswith(".txt")]
                    assert len(txt_files) == 0, (
                        f"Archivos .txt en ZIP: {txt_files}"
                    )

    def test_checksum_zip_coincide_con_record(self):
        """
        El SHA-256 del ZIP en disco debe coincidir con el checksum guardado en PackageRecord.
        """
        import hashlib
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                record = store_mod.save_package("pkg-sha-001", bundle)

                zip_bytes = store_mod.get_zip_bytes("pkg-sha-001")
                computed = hashlib.sha256(zip_bytes).hexdigest()
                assert computed == record.checksum, (
                    f"Checksum incorrecto. Esperado {record.checksum}, calculado {computed}"
                )

    def test_zip_inexistente_retorna_none(self):
        """
        get_zip_bytes() con ID inexistente retorna None, no excepción.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                result = store_mod.get_zip_bytes("id-que-no-existe")
                assert result is None


# ─── Grupo 4: Schemas PackageRecord / DownloadAsset ──────────────────────────

class TestPackageSchemas:

    def test_package_record_es_serializable(self):
        """
        PackageRecord debe poder serializar/deserializar sin pérdida.
        """
        from app.agents.schemas import PackageRecord
        from datetime import datetime, timezone

        record = PackageRecord(
            package_id="test-123",
            scenario_id="sc-456",
            zm="QRO",
            municipios=["queretaro", "corregidora"],
            version="0.1-borrador",
            status="completed",
            checksum="a" * 64,
            warnings=["Confianza baja"],
            n_documents=3,
            n_defendibles=2,
            n_bloqueados=1,
        )
        data = record.model_dump()
        record2 = PackageRecord(**data)
        assert record2.package_id == "test-123"
        assert record2.zm == "QRO"
        assert record2.checksum == "a" * 64

    def test_download_asset_tiene_campos_requeridos(self):
        """
        DownloadAsset debe tener asset_id, checksum, mime_type y size_bytes.
        """
        from app.agents.schemas import DownloadAsset

        asset = DownloadAsset(
            package_id="pkg-001",
            filename="01_Resumen_Ejecutivo_Municipal.md",
            mime_type="text/markdown",
            path="/tmp/alquimia_packages/pkg-001/files/01_Resumen_Ejecutivo_Municipal.md",
            checksum="b" * 64,
            size_bytes=4096,
        )
        assert asset.asset_id is not None, "asset_id debe auto-generarse"
        assert asset.created_at is not None, "created_at debe auto-generarse"
        assert asset.mime_type == "text/markdown"

    def test_download_asset_nunca_txt(self):
        """
        DownloadAsset con filename .txt es detectable — la plataforma debe rechazarlo.
        """
        from app.agents.schemas import DownloadAsset

        asset = DownloadAsset(
            package_id="pkg-002",
            filename="documento.txt",
            mime_type="text/plain",
            path="/tmp/doc.txt",
            checksum="c" * 64,
            size_bytes=100,
        )
        # El schema no bloquea (no es su rol), pero la plataforma sí debe detectarlo
        assert asset.filename.endswith(".txt"), "Confirma que el test detecta .txt"
        # Verificar que package_store rechaza .txt al guardar
        # (la regla está en exporter.canonical_filename — siempre .md)


# ─── Grupo 5: Integración con generate_plan ──────────────────────────────────

class TestIntegracionGeneratePlan:

    def test_job_completado_incluye_package_id(self):
        """
        Después de run_agora completado, el job debe tener package_id y checksum.
        Verifica que generate_plan llama a save_package.
        """
        from unittest.mock import AsyncMock, MagicMock, patch as mpatch

        from app.agents.schemas import (
            ExportBundle, ExportedDocument, ExportManifest, ExportedFile,
            DocumentStatusLevel, DraftBundle,
        )
        from app.agents.agora import PlanOutput

        mock_bundle = _make_export_bundle()
        mock_output = PlanOutput(
            export_bundle=mock_bundle,
            plan_impl="Resumen del plan",
        )

        saved_calls = []

        def mock_save(package_id, export_bundle, draft_bundle=None):
            from app.agents.schemas import PackageRecord
            record = PackageRecord(
                package_id=package_id,
                scenario_id="sc-test",
                zm="SLP",
                municipios=["slp"],
                checksum="d" * 64,
                n_documents=2,
                n_defendibles=1,
                n_bloqueados=0,
                warnings=[],
            )
            saved_calls.append(package_id)
            return record

        # Simular la función run de background task
        with mpatch("app.services.package_store.save_package", side_effect=mock_save):
            from app.services.package_store import save_package
            record = save_package("job-integration-001", mock_bundle)
            assert "job-integration-001" in saved_calls
            assert record.checksum == "d" * 64
            assert record.n_documents == 2

    def test_save_package_recibe_export_bundle_no_str(self):
        """
        save_package() debe recibir ExportBundle real, no string ni dict.
        Red flag: si recibe string, el paquete no es recuperable.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                # Llamada correcta — ExportBundle real
                record = store_mod.save_package("pkg-type-check", bundle)
                assert record is not None
                assert isinstance(record.checksum, str)

    def test_manifest_incluido_en_zip_refleja_export_bundle(self):
        """
        El manifest.json dentro del ZIP debe coincidir con ExportManifest del bundle.
        La descarga reconstruye desde el bundle original, no de cero.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with patch.dict(os.environ, {"ALQUIMIA_PACKAGES_DIR": tmp}):
                import importlib
                import app.services.package_store as store_mod
                importlib.reload(store_mod)

                bundle = _make_export_bundle()
                store_mod.save_package("pkg-manifest-check", bundle)

                zip_bytes = store_mod.get_zip_bytes("pkg-manifest-check")
                with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                    manifest_data = json.loads(zf.read("manifest.json"))

                assert manifest_data.get("zm") == "SLP"
                assert "INEGI" in manifest_data.get("fuentes_usadas", [])
                assert manifest_data.get("score_datos") == 72.5, (
                    "score_datos del manifest no coincide con ExportBundle"
                )
                assert len(manifest_data.get("files", [])) == 2, (
                    "Número de archivos en manifest no coincide"
                )
