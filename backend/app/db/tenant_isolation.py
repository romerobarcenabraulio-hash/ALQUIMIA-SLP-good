"""ORM-level tenant isolation via SQLAlchemy do_orm_execute + with_loader_criteria.

Usage:
  1. Models that must be tenant-scoped should inherit HasTenantId.
  2. Call install_tenant_filter() once at app startup (done in session.py).
  3. FastAPI endpoints use Depends(require_tenant_context) to set the current tenant
     for the duration of the request; the filter is applied automatically to all
     ORM SELECT queries on HasTenantId subclasses.
"""
from __future__ import annotations

from contextvars import ContextVar, Token
from typing import Optional, Type

_current_tenant_id: ContextVar[Optional[str]] = ContextVar(
    "current_tenant_id", default=None
)


def set_tenant_context(tenant_id: str) -> Token:
    return _current_tenant_id.set(tenant_id)


def clear_tenant_context(token: Token) -> None:
    _current_tenant_id.reset(token)


def get_current_tenant_id() -> Optional[str]:
    return _current_tenant_id.get()


from sqlalchemy import String
from sqlalchemy.orm import declared_attr, mapped_column, Mapped


class HasTenantId:
    """Mixin marking a model as tenant-scoped.

    Defines `tenant_id` via declared_attr so with_loader_criteria can access it
    on the mixin class proxy. Concrete models must NOT redeclare tenant_id.
    """

    @declared_attr
    def tenant_id(cls) -> Mapped[str]:
        return mapped_column(String(64), index=True, nullable=False)


def install_tenant_filter(session_class: Type) -> None:
    """Register the do_orm_execute listener on `session_class`.

    Call once after the sessionmaker is created.
    """
    from sqlalchemy import event
    from sqlalchemy.orm import with_loader_criteria

    @event.listens_for(session_class, "do_orm_execute")
    def _apply_tenant_filter(state):
        if not (state.is_select and not state.is_column_load and not state.is_relationship_load):
            return
        tid = _current_tenant_id.get()
        if tid is None:
            return
        state.statement = state.statement.options(
            with_loader_criteria(
                HasTenantId,
                lambda cls: cls.tenant_id == tid,
                include_aliases=True,
            )
        )
