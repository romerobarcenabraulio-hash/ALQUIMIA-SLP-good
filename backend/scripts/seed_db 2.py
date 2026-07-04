"""Seed the database with demo data for end-to-end testing.

Creates: 1 demo tenant, 5 generadores, 30 days of residue records each.
Idempotent: skips if the demo tenant already exists.

Run inside the backend container/venv:
    python scripts/seed_db.py
"""

import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.base import import_all_models  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402

import_all_models()

from app.models.generador import GeneradorEntity, GeneratorResidueRecord  # noqa: E402

DEMO_TENANT_ID = "00000000-0000-0000-0000-00000000demo"
DEMO_MUNICIPIO = "San Luis Potosí (Demo)"

TIPOS = ["empresa", "hospital", "comercio", "restaurante", "industria"]


def seed() -> None:
    db = SessionLocal()
    try:
        existing = (
            db.query(GeneradorEntity)
            .filter(GeneradorEntity.municipio == DEMO_MUNICIPIO)
            .first()
        )
        if existing:
            print("Demo data already present — nothing to do.")
            return

        for i in range(5):
            gen = GeneradorEntity(
                tenant_id=DEMO_TENANT_ID,
                nombre=f"Generador Demo {i + 1}",
                tipo=TIPOS[i],
                municipio=DEMO_MUNICIPIO,
                estado_mx="San Luis Potosí",
                source="manual",
                activo=True,
                verificado=True,
            )
            db.add(gen)
            db.flush()

            base = random.uniform(1.0, 4.0)
            for day in range(30):
                fecha = (datetime.utcnow() - timedelta(days=day)).strftime("%Y-%m-%d")
                total = round(base * random.uniform(0.7, 1.3), 2)
                db.add(GeneratorResidueRecord(
                    generador_id=gen.id,
                    tenant_id=DEMO_TENANT_ID,
                    fecha_generacion=fecha,
                    cantidad_total_tons=total,
                    materiales_json={
                        "organico": round(total * 0.5, 2),
                        "plastico": round(total * 0.3, 2),
                        "papel": round(total * 0.2, 2),
                    },
                ))

        db.commit()
        print(f"✓ Seeded 5 generadores + 150 residue records for {DEMO_MUNICIPIO}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
