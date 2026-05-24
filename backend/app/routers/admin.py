from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from typing import List
import logging

from app.routers.auth import get_current_user, UserInfo, hash_password, DEMO_USERS

router = APIRouter()
logger = logging.getLogger(__name__)


def require_admin(user: UserInfo = Depends(get_current_user)) -> UserInfo:
    if user.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo admins")
    return user


class CreateUserRequest(BaseModel):
    nombre:   str
    email:    str
    password: str
    rol:      str = "analista"
    zm:       str = "SLP"

    @field_validator("email")
    @classmethod
    def _email_shape(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("email inválido")
        return value


@router.get("/users", response_model=List[UserInfo])
async def list_users(_: UserInfo = Depends(require_admin)):
    return [
        UserInfo(id=str(u["id"]), nombre=u["nombre"], email=u["email"], rol=u["rol"], zm=u["zm"])
        for u in DEMO_USERS.values()
    ]


@router.post("/users")
async def create_user(req: CreateUserRequest, _: UserInfo = Depends(require_admin)):
    if req.email in DEMO_USERS:
        raise HTTPException(status_code=409, detail="Usuario ya existe")
    new_id = str(max(int(u["id"]) for u in DEMO_USERS.values()) + 1)
    DEMO_USERS[req.email] = {
        "id": new_id,
        "nombre": req.nombre,
        "email": req.email,
        "hashed_password": hash_password(req.password),
        "rol": req.rol,
        "zm": req.zm,
    }
    logger.info(f"Usuario creado: {req.email} por admin")
    return {"ok": True, "id": new_id}


@router.delete("/users/{email}")
async def delete_user(email: str, _: UserInfo = Depends(require_admin)):
    if email not in DEMO_USERS:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if DEMO_USERS[email]["rol"] == "admin":
        raise HTTPException(status_code=400, detail="No se puede eliminar el admin")
    del DEMO_USERS[email]
    return {"ok": True}


@router.get("/logs")
async def get_logs(_: UserInfo = Depends(require_admin)):
    return [
        {"ts": "2025-04-27 09:14", "usuario": "carlos@slp.gob.mx", "accion": "Generó plan", "zm": "SLP", "estado": "completado"},
        {"ts": "2025-04-26 15:30", "usuario": "maria@qro.gob.mx",  "accion": "Generó plan", "zm": "QRO", "estado": "completado"},
    ]


@router.get("/agentes")
async def get_agentes(_: UserInfo = Depends(require_admin)):
    return [
        {"nombre": a, "estado": "idle", "ultima": "2025-04-27"}
        for a in ["Director", "Arquitecto", "Ghostwriter", "Comparador", "Mapeador", "Validador", "Humanizador"]
    ]
