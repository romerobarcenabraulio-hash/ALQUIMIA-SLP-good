-- ALQUIMIA — migraciones manuales (plan Render FREE, sin Alembic local)
-- Ejecutar con DBeaver, TablePlus, Postgres.app o psql + External Database URL
--
-- Si ya tienes tablas de proyecto vivo, ejecuta SOLO la sección "0002_research".
-- Si la base está vacía, ejecuta TODO el archivo.

BEGIN;

-- ── Control Alembic ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
);

-- ── 0001_initial (omitir si clientes ya existe) ─────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    municipio_id VARCHAR(50) NOT NULL,
    zm VARCHAR(20) NOT NULL,
    estado_mx VARCHAR(100),
    plan VARCHAR(50) NOT NULL DEFAULT 'diagnostico',
    consultor_asignado VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS proyectos_municipales (
    id VARCHAR(36) PRIMARY KEY,
    cliente_id VARCHAR(36) NOT NULL REFERENCES clientes(id),
    municipio_id VARCHAR(50) NOT NULL,
    zm VARCHAR(20) NOT NULL,
    nombre VARCHAR(300) NOT NULL DEFAULT 'Programa de Circularidad Municipal',
    estado VARCHAR(30) NOT NULL DEFAULT 'draft',
    negociacion VARCHAR(50) NOT NULL DEFAULT 'municipal_directo',
    fecha_inicio TIMESTAMPTZ,
    fecha_objetivo TIMESTAMPTZ,
    horizonte_semanas INTEGER NOT NULL DEFAULT 52,
    campeon_nombre VARCHAR(200),
    campeon_cargo VARCHAR(200),
    campeon_email VARCHAR(200),
    is_showcase BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_proyectos_municipio_id ON proyectos_municipales (municipio_id);
CREATE INDEX IF NOT EXISTS ix_proyectos_estado ON proyectos_municipales (estado);

CREATE TABLE IF NOT EXISTS revisiones_proyecto (
    id VARCHAR(36) PRIMARY KEY,
    proyecto_id VARCHAR(36) NOT NULL REFERENCES proyectos_municipales(id),
    numero INTEGER NOT NULL DEFAULT 0,
    scenario_id VARCHAR(36),
    snapshot_kpis JSONB,
    research_findings JSONB,
    cost_overrides JSONB,
    simulate_result JSONB,
    ton_rsu_modeladas DOUBLE PRECISION,
    ton_rsu_medidas DOUBLE PRECISION,
    nota TEXT,
    generado_por VARCHAR(100) NOT NULL DEFAULT 'sistema',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actividades_proyecto (
    id VARCHAR(36) PRIMARY KEY,
    proyecto_id VARCHAR(36) NOT NULL REFERENCES proyectos_municipales(id),
    gantt_task_id VARCHAR(50) NOT NULL,
    nombre VARCHAR(300) NOT NULL,
    descripcion TEXT,
    fase VARCHAR(100) NOT NULL DEFAULT 'Diseño',
    ejecutor VARCHAR(30) NOT NULL DEFAULT 'municipio',
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    semana_inicio INTEGER NOT NULL DEFAULT 1,
    duracion_semanas INTEGER NOT NULL DEFAULT 2,
    semana_real_inicio INTEGER,
    semana_real_fin INTEGER,
    es_critica BOOLEAN NOT NULL DEFAULT FALSE,
    costo_mxn DOUBLE PRECISION NOT NULL DEFAULT 0,
    responsable VARCHAR(200),
    nota_completado TEXT,
    completado_en TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_actividades_estado ON actividades_proyecto (estado);

CREATE TABLE IF NOT EXISTS alertas_proyecto (
    id VARCHAR(36) PRIMARY KEY,
    proyecto_id VARCHAR(36) NOT NULL REFERENCES proyectos_municipales(id),
    tipo VARCHAR(50) NOT NULL,
    severidad VARCHAR(20) NOT NULL DEFAULT 'advertencia',
    titulo VARCHAR(300) NOT NULL,
    descripcion TEXT NOT NULL,
    accion_sugerida TEXT,
    resuelta BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resuelta_en TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_alertas_resuelta ON alertas_proyecto (resuelta);
CREATE INDEX IF NOT EXISTS ix_alertas_severidad ON alertas_proyecto (severidad);

CREATE TABLE IF NOT EXISTS mapa_actores (
    id VARCHAR(36) PRIMARY KEY,
    proyecto_id VARCHAR(36) NOT NULL REFERENCES proyectos_municipales(id),
    nombre VARCHAR(200) NOT NULL,
    cargo VARCHAR(200) NOT NULL,
    organizacion VARCHAR(200),
    tipo VARCHAR(50) NOT NULL DEFAULT 'interno',
    influencia VARCHAR(20) NOT NULL DEFAULT 'media',
    sentimiento VARCHAR(20) NOT NULL DEFAULT 'neutral',
    interes VARCHAR(20) NOT NULL DEFAULT 'medio',
    preocupacion_principal TEXT,
    tactica_engagement TEXT,
    ultimo_contacto TIMESTAMPTZ,
    es_campeon BOOLEAN NOT NULL DEFAULT FALSE,
    es_bloqueador BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS impacto_real (
    id VARCHAR(36) PRIMARY KEY,
    proyecto_id VARCHAR(36) NOT NULL REFERENCES proyectos_municipales(id),
    periodo VARCHAR(20) NOT NULL,
    ton_rsu_generadas DOUBLE PRECISION,
    ton_rsu_desviadas DOUBLE PRECISION,
    ton_rsu_disposicion DOUBLE PRECISION,
    tasa_desvio_pct DOUBLE PRECISION,
    co2e_evitadas_ton DOUBLE PRECISION,
    ingreso_materiales_mxn DOUBLE PRECISION,
    ahorro_disposicion_mxn DOUBLE PRECISION,
    valor_capturado_mxn DOUBLE PRECISION,
    empleos_generados INTEGER,
    fuente VARCHAR(100) NOT NULL DEFAULT 'auto_reporte',
    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_impacto_periodo ON impacto_real (periodo);
CREATE INDEX IF NOT EXISTS ix_impacto_verificado ON impacto_real (verificado);

CREATE TABLE IF NOT EXISTS benchmark_municipal (
    id VARCHAR(36) PRIMARY KEY,
    zm VARCHAR(20) NOT NULL,
    rango_poblacion VARCHAR(50) NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    tasa_desvio_promedio_pct DOUBLE PRECISION,
    tasa_desvio_p75_pct DOUBLE PRECISION,
    tasa_desvio_p25_pct DOUBLE PRECISION,
    tir_promedio_pct DOUBLE PRECISION,
    capex_per_capita_mxn DOUBLE PRECISION,
    ingreso_per_ton_mxn DOUBLE PRECISION,
    semanas_a_primera_oleada DOUBLE PRECISION,
    n_municipios INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_benchmark_zm_periodo ON benchmark_municipal (zm, periodo);

CREATE TABLE IF NOT EXISTS checkpoint_costos (
    id VARCHAR(36) PRIMARY KEY,
    proyecto_id VARCHAR(36) NOT NULL REFERENCES proyectos_municipales(id),
    revision_id VARCHAR(36),
    supuestos JSONB NOT NULL,
    completado BOOLEAN NOT NULL DEFAULT FALSE,
    completado_por VARCHAR(200),
    completado_en TIMESTAMPTZ,
    n_supuestos_total INTEGER NOT NULL DEFAULT 5,
    n_supuestos_ajustados INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 0002_research (nuevo — caché Serper) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS research_items (
    id VARCHAR(36) PRIMARY KEY,
    municipio_id VARCHAR(50),
    zm_id VARCHAR(10),
    categoria VARCHAR(40) NOT NULL,
    material VARCHAR(20),
    query_text TEXT,
    fuente_url TEXT NOT NULL,
    fuente_titulo VARCHAR(300),
    fuente_dominio VARCHAR(100),
    tier_confianza INTEGER,
    confianza DOUBLE PRECISION,
    valor_numerico DOUBLE PRECISION,
    unidad VARCHAR(30),
    snippet TEXT,
    motor_extraccion VARCHAR(20) NOT NULL DEFAULT 'serper',
    fecha_publicacion DATE,
    fecha_consulta TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hash_canonico VARCHAR(64) NOT NULL,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_research_items_hash UNIQUE (hash_canonico)
);
CREATE INDEX IF NOT EXISTS ix_research_items_municipio ON research_items (municipio_id);
CREATE INDEX IF NOT EXISTS ix_research_items_categoria ON research_items (categoria);

CREATE TABLE IF NOT EXISTS price_series (
    id VARCHAR(36) PRIMARY KEY,
    material VARCHAR(20) NOT NULL,
    precio_mxn DOUBLE PRECISION,
    precio_usd DOUBLE PRECISION,
    fecha DATE NOT NULL,
    fuente_url TEXT,
    tier_confianza INTEGER,
    zm_id VARCHAR(10),
    municipio_id VARCHAR(50),
    research_item_id VARCHAR(36),
    CONSTRAINT uq_price_series_mat_fecha_mun UNIQUE (material, fecha, municipio_id)
);
CREATE INDEX IF NOT EXISTS ix_price_series_material ON price_series (material);

CREATE TABLE IF NOT EXISTS regulatory_sources (
    id VARCHAR(36) PRIMARY KEY,
    municipio_id VARCHAR(50) NOT NULL,
    titulo VARCHAR(200),
    tipo VARCHAR(40),
    dof_fecha DATE,
    estado_vigencia VARCHAR(20),
    fuente_url TEXT,
    notas TEXT,
    fecha_carga TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_regulatory_municipio ON regulatory_sources (municipio_id);

CREATE TABLE IF NOT EXISTS model_calibrations (
    id VARCHAR(36) PRIMARY KEY,
    scope VARCHAR(20) NOT NULL,
    scope_id VARCHAR(50) NOT NULL,
    parametro VARCHAR(60) NOT NULL,
    valor DOUBLE PRECISION NOT NULL,
    unidad VARCHAR(30),
    confianza DOUBLE PRECISION,
    fuente_primaria VARCHAR(200),
    metodologia TEXT,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_calibracion DATE,
    fecha_expiracion DATE
);
CREATE INDEX IF NOT EXISTS ix_calibration_scope ON model_calibrations (scope_id, parametro);

DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) VALUES ('0002_research');

COMMIT;
