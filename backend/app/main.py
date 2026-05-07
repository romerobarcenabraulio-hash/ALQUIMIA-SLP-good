from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from contextlib import asynccontextmanager
import logging
import os
import time
from collections import defaultdict

from app.routers import auth, simulate, generate_plan, hub, admin
from app.legal.router import router as legal_router
from app.data.router import router as data_router
from app.market.router import router as market_router
from app.macros.router import router as macros_router
from app.reasoning.router import router as reasoning_router
from app.national.router import router as national_router
from app.operations.router import router as operations_router
from app.city.router import router as city_router
from app.education.router import router as education_router
from app.implementation.router import router as implementation_router
from app.infrastructure.router import router as infrastructure_router
from app.organizations.router import router as organizations_router
from app.waste_flows.router import router as waste_flows_router
from app.roadmap.router import router as roadmap_router
from app.export.router import router as export_router
from app.dashboard.router import router as dashboard_router
from app.scenarios.router import router as scenarios_router
from app.alerts.router import router as alerts_router
from app.governance.router import router as governance_router
from app.predios.router import router as predios_router
from app.launch.router import router as launch_router
from app.empresa.router import router as empresa_router
from app.city.api_v1 import router as cities_v1_router
from app.agora.router import router as agora_router
from app.agents.dna_loader import load_slp_dna

logger = logging.getLogger(__name__)

# Orígenes CORS por defecto (staging Vercel + producción declarada en blueprint 17.1)
_DEFAULT_CORS_ORIGINS: tuple[str, ...] = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://alquimia.mx",
    "https://alquimia-slp.vercel.app",
    # dominio de producción definitivo
    "https://alquimiaplatform.com",
    "https://www.alquimiaplatform.com",
)


def _cors_allow_origins() -> list[str]:
    origins = list(_DEFAULT_CORS_ORIGINS)
    extra = os.getenv("ALLOWED_ORIGINS", "").strip()
    if not extra:
        return origins
    for part in extra.split(","):
        o = part.strip()
        if o and o not in origins:
            origins.append(o)
    return origins


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests_by_ip: dict[str, list[float]] = defaultdict(list)
        self._request_counter = 0

    def _cleanup(self, now: float) -> None:
        cutoff = now - self.window_seconds
        for ip in list(self.requests_by_ip.keys()):
            timestamps = [ts for ts in self.requests_by_ip[ip] if ts >= cutoff]
            if timestamps:
                self.requests_by_ip[ip] = timestamps
            else:
                self.requests_by_ip.pop(ip, None)

    async def dispatch(self, request: Request, call_next):
        now = time.time()
        self._request_counter += 1
        if self._request_counter % 10 == 0:
            self._cleanup(now)

        ip = request.client.host if request.client else "unknown"
        timestamps = self.requests_by_ip[ip]
        cutoff = now - self.window_seconds
        timestamps[:] = [ts for ts in timestamps if ts >= cutoff]
        timestamps.append(now)

        if len(timestamps) > self.limit:
            return Response(
                content='{"detail":"Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
            )

        return await call_next(request)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cargar ADN SLP al arrancar (solo lectura)
    try:
        await load_slp_dna()
        logger.info("ADN SLP cargado correctamente")
    except Exception as e:
        logger.warning(f"ADN SLP no pudo cargarse (modo offline): {e}")
    yield

app = FastAPI(
    title="ALQUIMIA API",
    description="Backend de la plataforma ALQUIMIA — circularidad municipal México",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allow_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Cache-Control"] = "no-store"
    return response

app.include_router(auth.router,          prefix="/auth",     tags=["auth"])
app.include_router(simulate.router,      prefix="/simulate", tags=["simulate"])
app.include_router(generate_plan.router, prefix="/generate", tags=["generate"])
app.include_router(hub.router,           prefix="/hub",       tags=["hub"])
app.include_router(admin.router,         prefix="/admin",     tags=["admin"])
app.include_router(legal_router,         prefix="/legal",     tags=["legal"])
app.include_router(data_router,          tags=["data-provenance"])
app.include_router(market_router,        prefix="/market",    tags=["market"])
app.include_router(macros_router,        prefix="/macros",    tags=["macros"])
app.include_router(reasoning_router,     prefix="/reasoning", tags=["reasoning"])
app.include_router(national_router,      prefix="/national",  tags=["national"])
app.include_router(operations_router,    prefix="/operations", tags=["operations"])
app.include_router(city_router,          prefix="/city",       tags=["city"])
app.include_router(education_router,     prefix="/education",  tags=["education"])
app.include_router(implementation_router, prefix="/implementation", tags=["implementation"])
app.include_router(infrastructure_router, prefix="/infrastructure", tags=["infrastructure"])
app.include_router(organizations_router, prefix="/organizations", tags=["organizations"])
app.include_router(waste_flows_router, prefix="/waste-flows", tags=["waste_flows"])
app.include_router(roadmap_router, prefix="/roadmap", tags=["roadmap"])
app.include_router(export_router, prefix="/export", tags=["export"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
app.include_router(scenarios_router, prefix="/scenarios", tags=["scenarios"])
app.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
app.include_router(governance_router, prefix="/governance", tags=["governance"])
app.include_router(launch_router, prefix="/launch", tags=["launch"])
app.include_router(predios_router, tags=["predios"])
app.include_router(empresa_router)
app.include_router(agora_router, prefix="/api/v1/agora", tags=["agora"])
app.include_router(cities_v1_router, prefix="/api/v1", tags=["cities"])

@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "development")),
    }
