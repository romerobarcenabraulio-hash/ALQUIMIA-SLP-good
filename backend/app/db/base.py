"""
Base declarativa SQLAlchemy.

Importar este módulo garantiza que todos los modelos estén registrados
en Base.metadata antes de llamar create_all().
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Importaciones de modelos — mantener aquí para que create_all() los encuentre
from app.models.proyecto import (  # noqa: E402, F401
    Cliente,
    ProyectoMunicipal,
    RevisionProyecto,
    ActividadProyecto,
    AlertaProyecto,
    MapaActor,
    ImpactoReal,
    BenchmarkMunicipal,
    CheckpointCostos,
)
