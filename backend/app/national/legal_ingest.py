"""Ingesta incremental de perfiles municipales."""
from __future__ import annotations

from app.national.catalog import add_or_update_profile
from app.national.schemas import MunicipioProfile


def upsert_municipio_profile(profile: MunicipioProfile) -> MunicipioProfile:
    return add_or_update_profile(profile)

