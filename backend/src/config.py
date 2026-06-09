from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent


def load_env() -> None:
    load_dotenv(PROJECT_ROOT / ".env")
    load_dotenv(BACKEND_ROOT / ".env")
