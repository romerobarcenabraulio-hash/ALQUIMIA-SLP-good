"""API response caching for performance optimization."""

from functools import wraps
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Optional, Dict
import json
import hashlib

# In-memory cache (production should use Redis)
_cache: Dict[str, tuple[Any, datetime]] = {}


def clear_cache():
    """Clear all cached responses."""
    global _cache
    _cache.clear()


def invalidate_cache_pattern(pattern: str):
    """Invalidate cache entries matching a pattern."""
    global _cache
    keys_to_delete = [k for k in _cache.keys() if pattern in k]
    for k in keys_to_delete:
        del _cache[k]


def generate_cache_key(func_name: str, args: tuple, kwargs: dict) -> str:
    """Generate a cache key from function signature."""
    key_data = f"{func_name}:{str(args)}:{json.dumps(kwargs, sort_keys=True, default=str)}"
    return hashlib.md5(key_data.encode()).hexdigest()


def cached_response(ttl_seconds: int = 300, cache_key: Optional[str] = None):
    """
    Decorator for caching API responses.

    Args:
        ttl_seconds: Time to live for cached response (default 5 minutes)
        cache_key: Custom cache key function (receives args/kwargs)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            if cache_key:
                key = cache_key(*args, **kwargs)
            else:
                key = generate_cache_key(func.__name__, args, kwargs)

            # Check cache
            if key in _cache:
                cached_value, cached_time = _cache[key]
                if datetime.now(timezone.utc) - cached_time < timedelta(seconds=ttl_seconds):
                    return cached_value
                else:
                    del _cache[key]

            # Call function and cache result
            result = await func(*args, **kwargs)
            _cache[key] = (result, datetime.now(timezone.utc))

            # Cleanup old entries
            now = datetime.now(timezone.utc)
            expired_keys = [
                k for k, (_, t) in _cache.items()
                if now - t > timedelta(seconds=ttl_seconds * 2)
            ]
            for k in expired_keys:
                del _cache[k]

            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key
            if cache_key:
                key = cache_key(*args, **kwargs)
            else:
                key = generate_cache_key(func.__name__, args, kwargs)

            # Check cache
            if key in _cache:
                cached_value, cached_time = _cache[key]
                if datetime.now(timezone.utc) - cached_time < timedelta(seconds=ttl_seconds):
                    return cached_value
                else:
                    del _cache[key]

            # Call function and cache result
            result = func(*args, **kwargs)
            _cache[key] = (result, datetime.now(timezone.utc))

            # Cleanup old entries
            now = datetime.now(timezone.utc)
            expired_keys = [
                k for k, (_, t) in _cache.items()
                if now - t > timedelta(seconds=ttl_seconds * 2)
            ]
            for k in expired_keys:
                del _cache[k]

            return result

        # Return appropriate wrapper based on function type
        if hasattr(func, '__code__') and 'async' in func.__code__.co_names:
            return async_wrapper
        return sync_wrapper

    return decorator


class CacheInvalidationContext:
    """Context manager for cache invalidation on specific events."""

    def __init__(self, pattern: str):
        self.pattern = pattern

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:  # Only invalidate on success
            invalidate_cache_pattern(self.pattern)
