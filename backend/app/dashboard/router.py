"""Router Fase 13.7: dashboard municipal."""
from __future__ import annotations

from fastapi import APIRouter

from app.dashboard.aggregator import build_dashboard
from app.dashboard.schemas import DashboardRequest, DashboardResponse

router = APIRouter()


@router.post("/summary", response_model=DashboardResponse)
def get_dashboard_summary(req: DashboardRequest):
    return build_dashboard(req)
