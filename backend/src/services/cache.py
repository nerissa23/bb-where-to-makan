import os
import json
from typing import Any, Optional

REDIS_URL = os.getenv("REDIS_URL")
CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", "1800"))

redis_client = None
if REDIS_URL:
    try:
        import redis
        redis_client = redis.from_url(REDIS_URL)
    except Exception:
        redis_client = None


def get_cached(key: str) -> Optional[Any]:
    if not redis_client:
        return None
    v = redis_client.get(key)
    if not v:
        return None
    try:
        return json.loads(v)
    except Exception:
        return None


def set_cached(key: str, value: Any, ttl: int = CACHE_TTL) -> None:
    if not redis_client:
        return
    try:
        redis_client.set(key, json.dumps(value), ex=ttl)
    except Exception:
        pass
