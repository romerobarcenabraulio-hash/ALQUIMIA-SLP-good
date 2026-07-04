"""E2 — Per-path rate limiting on public endpoints."""
from __future__ import annotations

import time
from collections import defaultdict

from app.middleware.rate_limit import (
    RateLimitMiddleware,
    PUBLIC_RATE_LIMIT,
    PUBLIC_RATE_LIMIT_PREFIXES,
    PUBLIC_RATE_WINDOW,
)


def _fresh() -> RateLimitMiddleware:
    mw = RateLimitMiddleware.__new__(RateLimitMiddleware)
    mw.limit = 100
    mw.window_seconds = 60
    mw.requests_by_key = defaultdict(list)
    mw._request_counter = 0
    return mw


def test_public_prefix_constants_cover_survey_and_propuesta():
    assert "/api/v1/survey" in PUBLIC_RATE_LIMIT_PREFIXES
    assert "/api/v1/propuesta" in PUBLIC_RATE_LIMIT_PREFIXES
    assert "/encuesta" in PUBLIC_RATE_LIMIT_PREFIXES
    assert PUBLIC_RATE_LIMIT < 100  # tighter than global


def test_public_endpoint_blocked_after_limit():
    mw = _fresh()
    now = time.time()
    for _ in range(PUBLIC_RATE_LIMIT):
        assert mw._check("ip1:public", PUBLIC_RATE_LIMIT, PUBLIC_RATE_WINDOW, now)
    assert not mw._check("ip1:public", PUBLIC_RATE_LIMIT, PUBLIC_RATE_WINDOW, now)


def test_global_bucket_independent_of_public_bucket():
    mw = _fresh()
    now = time.time()
    for _ in range(PUBLIC_RATE_LIMIT + 1):
        mw._check("ip2:public", PUBLIC_RATE_LIMIT, PUBLIC_RATE_WINDOW, now)
    # Global bucket for same IP unaffected
    assert mw._check("ip2:global", 100, 60, now)


def test_non_public_path_only_subject_to_global_limit():
    mw = _fresh()
    now = time.time()
    for i in range(PUBLIC_RATE_LIMIT + 1):
        result = mw._check("ip3:global", 100, 60, now)
    assert result  # 21 hits against limit 100 is fine


def test_cleanup_removes_expired_entries():
    mw = _fresh()
    past = time.time() - 120
    mw.requests_by_key["ip4:global"] = [past, past]
    mw._cleanup(time.time())
    assert "ip4:global" not in mw.requests_by_key


def test_rate_limit_429_has_retry_after_header():
    from starlette.responses import Response
    resp = Response(
        content='{"detail":"Rate limit exceeded — public endpoint"}',
        status_code=429,
        media_type="application/json",
        headers={"Retry-After": str(PUBLIC_RATE_WINDOW)},
    )
    assert resp.status_code == 429
    assert resp.headers["Retry-After"] == str(PUBLIC_RATE_WINDOW)
