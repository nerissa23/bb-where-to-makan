import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import load_env
from src.routers import groups, recommendations

load_env()

app = FastAPI()

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(groups.router)
app.include_router(recommendations.router)


@app.get("/health")
def health():
    return {"status": "ok"}
