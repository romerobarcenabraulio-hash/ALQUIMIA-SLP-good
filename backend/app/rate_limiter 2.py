"""Rate limiting for API endpoints."""

from typing import Optional, Dict, List
from datetime import datetime, timedelta
from collections import defaultdict
import threading
import time


class RateLimiter:
    """Simple in-memory rate limiter using token bucket algorithm.

    For production, use redis-based limiter (e.g., slowapi with Redis).
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests_per_second = requests_per_minute / 60.0
        self.buckets: Dict[str, List[float]] = defaultdict(list)
        self.lock = threading.Lock()

    def is_allowed(self, key: str) -> bool:
        """Check if request is allowed for this key (IP/user).

        Returns True if allowed, False if rate limit exceeded.
        """
        with self.lock:
            now = time.time()
            window_start = now - 60  # 1-minute window

            # Clean old requests
            if key in self.buckets:
                self.buckets[key] = [
                    ts for ts in self.buckets[key] if ts > window_start
                ]

            # Check limit
            if len(self.buckets[key]) < self.requests_per_minute:
                self.buckets[key].append(now)
                return True

            return False

    def get_remaining(self, key: str) -> int:
        """Get remaining requests for this key in current window."""
        with self.lock:
            now = time.time()
            window_start = now - 60

            if key in self.buckets:
                valid_requests = [
                    ts for ts in self.buckets[key] if ts > window_start
                ]
                return max(0, self.requests_per_minute - len(valid_requests))

            return self.requests_per_minute

    def reset(self, key: str):
        """Reset rate limit for a key."""
        with self.lock:
            if key in self.buckets:
                del self.buckets[key]

    def cleanup(self):
        """Remove old bucket entries to prevent memory leak."""
        with self.lock:
            now = time.time()
            window_start = now - 60

            keys_to_delete = []
            for key, requests in self.buckets.items():
                valid = [ts for ts in requests if ts > window_start]
                if not valid:
                    keys_to_delete.append(key)
                else:
                    self.buckets[key] = valid

            for key in keys_to_delete:
                del self.buckets[key]


# Global rate limiters for different endpoints
public_documents_limiter = RateLimiter(requests_per_minute=300)  # 5/second per IP
public_scraper_limiter = RateLimiter(requests_per_minute=100)    # ~1.67/second per IP
public_proposal_limiter = RateLimiter(requests_per_minute=60)    # 1/second per IP — landing/marketing
public_survey_limiter = RateLimiter(requests_per_minute=30)      # encuestas públicas por empresa/ciudadano


def get_client_ip(request) -> str:
    """Extract client IP from request, considering proxies."""
    # Check for proxy headers (X-Forwarded-For, CF-Connecting-IP, etc)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fall back to direct client connection
    if request.client:
        return request.client.host

    return "unknown"


def check_rate_limit(
    limiter: RateLimiter,
    client_ip: str,
    endpoint: str = ""
) -> tuple[bool, int]:
    """Check if request is allowed.

    Returns (is_allowed, remaining_requests)
    """
    key = f"{client_ip}:{endpoint}"
    allowed = limiter.is_allowed(key)
    remaining = limiter.get_remaining(key)
    return allowed, remaining
