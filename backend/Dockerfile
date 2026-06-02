# ------ this Dockerfile is a set of instructions that tells Docker how to build an image
# ------ image: frozen, complete snapshot of the entire app; not running yet
# ------ container: image that is actually running; can run multiple containers with same image

# to run the backend, need:
#    - docker build -t bb-backend .
#    - docker run --name bb-backend --rm -p 8000:8000 bb-backend

# alternatively, use docker-compose.yml file to run the full-stack completely
#    - docker-compose up --build

# docker hub - cloud registry like github where u can push or pull image (sharing publicly/privately)

# 1. pull pre-built image from docker hub that alrdy has python installed, so we build on top of it
FROM python:3.14.4-bookworm

# 2. setup dependencies
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# 3. copy entire application code
COPY src/ ./src/

# 4. by default runs: uv run uvicorn --app-dir src --host 0.0.0.0 app:app
# can customise CMD by running `docker run <app-name> <new-CMD>`
ENTRYPOINT ["uv", "run", "uvicorn"]
CMD ["src.app:app", "--host", "0.0.0.0", "--port", "8000"]
