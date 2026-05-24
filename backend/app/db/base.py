"""
Base declarativa SQLAlchemy.

Importar este módulo garantiza que todos los modelos estén registrados
en Base.metadata antes de llamar create_all().
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def import_all_models() -> None:
    """Registra modelos en Base.metadata sin import circular con proyecto.py."""
    import app.models.proyecto  # noqa: F401
    import app.models.research  # noqa: F401
    import app.models.planning_evm  # noqa: F401
    import app.models.user_account  # noqa: F401
