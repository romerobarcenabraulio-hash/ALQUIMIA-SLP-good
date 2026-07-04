"""Path-aware in-memory rate limiter middleware."""
from __future__ import annotations

import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Tighter limit on unauthenticated public-facing endpoints.
PUBLIC_RATE_LIMIT_PREFIXES = (
    "/api/v1/survey",
    "/api/v1/propuesta",
    "/encuesta",
)
PUBLIC_RATE_LIMIT = 20
PUBLIC_RATE_WINDOW = 60


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests_by_key: dict[str, list[float]] = defaultdict(list)
        self._request_counter = 0

    def _cleanup(self, now: float) -> None:
        cutoff = now - max(self.window_seconds, PUBLIC_RATE_WINDOW)
        for key in list(self.requests_by_key.keys()):
            timestamps = [ts for ts in self.requests_by_key[key] if ts >= cutoff]
            if timestamps:
                self.requests_by_key[key] = timestamps
            else:
                self.requests_by_key.pop(key, None)

    def _check(self, bucket: str, limit: int, window: int, now: float) -> bool:
        """Return True if within limit, False if exceeded."""
        timestamps = self.requests_by_key[bucket]
        cutoff = now - window
        timestamps[:] = [ts for ts in timestamps if ts >= cutoff]
        timestamps.append(now)
        return len(timestamps) <= limit

    async def dispatch(self, request: Request, call_next):
        now = time.time()
        self._request_counter += 1
        if self._request_counter % 10 == 0:
            self._cleanup(now)

        ip = request.client.host if request.client else "unknown"
        path = request.url.path

        is_public = any(path.startswith(prefix) for prefix in PUBLIC_RATE_LIMIT_PREFIXES)
        if is_public and not self._check(f"{ip}:public", PUBLIC_RATE_LIMIT, PUBLIC_RATE_WINDOW, now):
            return Response(
                content='{"detail":"Rate limit exceeded — public endpoint"}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(PUBLIC_RATE_WINDOW)},
            )

        if not self._check(f"{ip}:global", self.limit, self.window_seconds, now):
            return Response(
                content='{"detail":"Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(self.window_seconds)},
            )

        return await call_next(request)
