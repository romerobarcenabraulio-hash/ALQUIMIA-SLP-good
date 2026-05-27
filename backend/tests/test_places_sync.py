"""Tests Google Places sync por municipio."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.centros_acopio.places_sync import fetch_places_for_municipio
from app.city.municipios_mx import MunicipioMxRow


@pytest.fixture
def muni_slp():
    return MunicipioMxRow(
        clave_inegi="24028",
        nombre="San Luis Potosí",
        estado_nombre="San Luis Potosí",
        estado_id="24",
        poblacion=900_000,
        generacion_rsu_dia=100.0,
        zm_simulator_id="SLP",
        municipio_simulator_id="slp",
        datos_estimados=False,
    )


@pytest.mark.asyncio
async def test_fetch_places_for_municipio_mock(muni_slp):
    fake_row = {
        "place_id": "ChIJtest",
        "name": "Recicladora Test",
        "formatted_address": "Calle 1, SLP",
        "geometry": {"location": {"lat": 22.15, "lng": -100.98}},
        "types": ["establishment"],
    }
    with patch("app.centros_acopio.places_sync.resolve_google_places_api_key", return_value="fake-key"):
        with patch("app.centros_acopio.places_sync.check_quota", return_value={"allowed": True}):
            with patch("app.centros_acopio.places_sync.search_places", new_callable=AsyncMock) as mock_search:
                mock_search.return_value = [fake_row]
                with patch("app.centros_acopio.places_sync._geocode_municipio_center", new_callable=AsyncMock) as mock_geo:
                    mock_geo.return_value = (22.15, -100.98)
                    centros = await fetch_places_for_municipio(muni_slp, db=None)
    assert len(centros) >= 1
    assert centros[0].fuente == "places_api"
    assert centros[0].clave_inegi == "24028"
