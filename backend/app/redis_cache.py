"""Distributed cache layer with Redis support and in-memory fallback."""

import json
import logging
import os
from functools import wraps
from typing import Any, Callable, Optional, Union
import pickle
import hashlib

logger = logging.getLogger(__name__)

_redis_client = None
_redis_available = False
_fallback_cache: dict[str, tuple[Any, float]] = {}


def _get_redis_url() -> Optional[str]:
    """Get Redis connection URL from config or environment."""
    try:
        from app.config import settings
        if settings.REDIS_URL:
            return settings.REDIS_URL
    except Exception:
        pass
    return os.getenv("REDIS_URL") or os.getenv("REDIS_URI")


async def init_redis() -> bool:
    """Initialize Redis connection on app startup."""
    global _redis_client, _redis_available

    redis_url = _get_redis_url()
    if not redis_url:
        logger.info("REDIS_URL not configured, using in-memory cache")
        return False

    try:
        import aioredis
        _redis_client = await aioredis.from_url(redis_url, decode_responses=False)
        # Test connection
        await _redis_client.ping()
        _redis_available = True
        logger.info("Redis connected successfully")
        return True
    except Exception as e:
        logger.warning(f"Redis connection failed, falling back to in-memory cache: {e}")
        _redis_available = False
        return False


async def close_redis() -> None:
    """Close Redis connection on app shutdown."""
    global _redis_client, _redis_available
    if _redis_client:
        try:
            await _redis_client.close()
            _redis_available = False
        except Exception as e:
            logger.warning(f"Error closing Redis connection: {e}")


def generate_cache_key(func_name: str, args: tuple, kwargs: dict) -> str:
    """Generate cache key from function signature."""
    key_data = f"{func_name}:{str(args)}:{json.dumps(kwargs, sort_keys=True, default=str)}"
    return hashlib.md5(key_data.encode()).hexdigest()


async def redis_get(key: str) -> Optional[Any]:
    """Get value from Redis with automatic deserialization."""
    if not _redis_available or not _redis_client:
        return _fallback_cache.get(key, (None, 0))[0] if key in _fallback_cache else None

    try:
        data = await _redis_client.get(key)
        if data:
            return pickle.loads(data)
        return None
    except Exception as e:
        logger.warning(f"Redis get failed for key {key}: {e}")
        return None


async def redis_set(key: str, value: Any, ttl: int) -> bool:
    """Set value in Redis with TTL."""
    if not _redis_available or not _redis_client:
        from datetime import datetime, timezone, timedelta
        _fallback_cache[key] = (value, (datetime.now(timezone.utc) + timedelta(seconds=ttl)).timestamp())
        return True

    try:
        data = pickle.dumps(value)
        await _redis_client.setex(key, ttl, data)
        return True
    except Exception as e:
        logger.warning(f"Redis set failed for key {key}: {e}")
        return False


async def redis_delete(key: str) -> bool:
    """Delete key from Redis."""
    if not _redis_available or not _redis_client:
        _fallback_cache.pop(key, None)
        return True

    try:
        await _redis_client.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Redis delete failed for key {key}: {e}")
        return False


async def redis_invalidate_pattern(pattern: str) -> int:
    """Invalidate cache entries matching a pattern."""
    if not _redis_available or not _redis_client:
        keys_to_delete = [k for k in _fallback_cache.keys() if pattern in k]
        for k in keys_to_delete:
            del _fallback_cache[k]
        return len(keys_to_delete)

    try:
        keys = await _redis_client.keys(f"*{pattern}*")
        if keys:
            await _redis_client.delete(*keys)
        return len(keys)
    except Exception as e:
        logger.warning(f"Redis pattern invalidation failed: {e}")
        return 0


async def clear_all_cache() -> None:
    """Clear all cached data."""
    global _fallback_cache

    if _redis_available and _redis_client:
        try:
            await _redis_client.flushdb()
        except Exception as e:
            logger.warning(f"Redis flush failed: {e}")

    _fallback_cache.clear()


def distributed_cached(ttl_seconds: int = 300, cache_key: Optional[Callable] = None):
    """Decorator for distributed caching with Redis fallback.

    Args:
        ttl_seconds: Time to live for cached response (default 5 minutes)
        cache_key: Optional custom key function (receives *args, **kwargs)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            if cache_key:
                key = cache_key(*args, **kwargs)
            else:
                key = generate_cache_key(func.__name__, args, kwargs)

            # Try to get from cache
            cached_value = await redis_get(key)
            if cached_value is not None:
                return cached_value

            # Call function and cache result
            result = await func(*args, **kwargs)
            await redis_set(key, result, ttl_seconds)

            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # For sync functions, we still use fallback cache
            if cache_key:
                key = cache_key(*args, **kwargs)
            else:
                key = generate_cache_key(func.__name__, args, kwargs)

            # Check fallback cache
            from datetime import datetime, timezone
            if key in _fallback_cache:
                value, expiry = _fallback_cache[key]
                if datetime.now(timezone.utc).timestamp() < expiry:
                    return value
                else:
                    del _fallback_cache[key]

            # Call function and cache result
            result = func(*args, **kwargs)
            from datetime import datetime, timezone, timedelta
            expiry = (datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)).timestamp()
            _fallback_cache[key] = (result, expiry)

            return result

        # Return appropriate wrapper
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


class DistributedCacheInvalidationContext:
    """Context manager for distributed cache invalidation."""

    def __init__(self, pattern: str):
        self.pattern = pattern

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            await redis_invalidate_pattern(self.pattern)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            # Sync context - can't await, just use fallback
            keys_to_delete = [k for k in _fallback_cache.keys() if self.pattern in k]
            for k in keys_to_delete:
                del _fallback_cache[k]
