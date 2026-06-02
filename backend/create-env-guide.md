**OSM / Places key**
- **No key (dev):** Use public Nominatim (OpenStreetMap) — no API key required but strict rate limits and mandatory polite usage (set `User-Agent` or `email`).
  - Quick test:
    curl "https://nominatim.openstreetmap.org/search?q=Bangsar+Kuala+Lumpur&format=jsonv2&email=you@example.com"
- **Hosted OSM-like providers (prod / better rate limits):** Sign up at LocationIQ, Geoapify, OpenCage, or Mapbox and copy the key. Use that as `OSM_PLACES_API_KEY`.
  - Example (LocationIQ): create account → Dashboard → Generate API key.
  - Quick test (LocationIQ):
    curl "https://us1.locationiq.com/v1/search.php?key=YOUR_KEY&q=Bangsar+Kuala+Lumpur&format=json"
- **Recommendation:** For local dev use Nominatim; for production use a hosted provider and put the key in `OSM_PLACES_API_KEY`.

**Database URL**
- **SQLite (dev, easiest):**
  - Example: `DATABASE_URL=sqlite+aiosqlite:///./backend/db/bb.db`
  - Ensure `./backend/db` exists; the DB file is created on first connection.
  - Quick check:
    python - <<PY
    import sqlite3
    sqlite3.connect('./backend/db/bb.db').execute('SELECT sqlite_version()').close()
    print('OK')
    PY
- **Postgres (production / multi-service):**
  - Create DB/user (psql):
    psql -U postgres -c "CREATE USER bb_user WITH PASSWORD 'strongpassword'; CREATE DATABASE bb_db OWNER bb_user;"
  - Example URL: `DATABASE_URL=postgresql+asyncpg://bb_user:strongpassword@db:5432/bb_db`
  - Quick check:
    psql "postgresql://bb_user:strongpassword@localhost:5432/bb_db" -c '\l'
- **Pick the format that matches your SQLAlchemy/async driver.**

**Redis URL**
- **Local dev (no auth):** `REDIS_URL=redis://localhost:6379/0`
- **With password:** `REDIS_URL=redis://:yourpassword@localhost:6379/0`
- **Docker Compose (service hostname):** `REDIS_URL=redis://redis:6379/0`
- **Quick test (if redis-cli installed):**
  redis-cli -h localhost -p 6379 ping
  # expects PONG
- **Python quick test:**
  python - <<PY
  import redis
  r = redis.from_url("redis://localhost:6379/0")
  r.set("x","1"); print(r.get("x"))
  PY

**LLM API key**
- **Managed providers:** Create key in provider dashboard (OpenAI, Anthropic, Cohere, etc.) and set `LLM_API_KEY=sk_...` (or provider-specific).
  - Quick test (OpenAI-style):
    curl -H "Authorization: Bearer $LLM_API_KEY" https://api.openai.com/v1/models
- **Local / Ollama:** No API key — set `OLLAMA_HOST=http://host.docker.internal:11434` instead (already in `.env.example`).
- **Recommendation:** Use provider key for cloud LLMs; use `OLLAMA_HOST` for local models.

**Example `.env` (starter)**
PLACES variants — pick one approach below:
- Using hosted provider:
PLACES_PROVIDER=hosted
OSM_PLACES_API_KEY=your_hosted_osm_key_here
- Using public Nominatim:
PLACES_PROVIDER=nomatim
# no key required; if you use Nominatim, keep OSM_PLACES_API_KEY empty

Other variables:
DATABASE_URL=sqlite+aiosqlite:///./backend/db/bb.db
REDIS_URL=redis://localhost:6379/0
LLM_API_KEY=your_llm_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000

**FastAPI loading snippet**
from pydantic import BaseSettings

class Settings(BaseSettings):
    PLACES_PROVIDER: str = "nomatim"
    OSM_PLACES_API_KEY: str | None = None
    DATABASE_URL: str
    REDIS_URL: str | None = None
    LLM_API_KEY: str | None = None
    class Config:
        env_file = ".env"

settings = Settings()
# use settings.OSM_PLACES_API_KEY, settings.DATABASE_URL, etc.

**Docker Compose tip**
- Add `env_file: .env` under the `backend` service. If Redis is in the same compose, set `REDIS_URL=redis://redis:6379/0` in `.env` when composing.

**Windows quick notes**
- Prefer `.env` for dev. To set one-off env in PowerShell:
$env:DATABASE_URL = "sqlite+aiosqlite:///./backend/db/bb.db"
- To persist system-wide (not recommended) use `setx` and restart the shell.

**Security tips**
- Never commit .env.
- Restrict hosted provider keys (HTTP referrers, IPs) where supported.
- Rotate keys and use cloud secret managers for production.

Do you want me to:
- create a `backend/.env.sample` with the above starter values, or
- scaffold Phase 1 backend now using `PLACES_PROVIDER` toggles (Nominatim dev + hosted provider switch)?