import uuid
from fastapi import APIRouter, HTTPException
from src.models.group import Group

router = APIRouter(prefix="/groups", tags=["groups"])

# In-memory store for now — replace with Neon DB later
_groups: dict[str, dict] = {}


@router.post("")
def create_group(group: Group):
    group_id = str(uuid.uuid4())
    _groups[group_id] = group.model_dump()
    return {"group_id": group_id}


@router.get("/{group_id}")
def get_group(group_id: str):
    if group_id not in _groups:
        raise HTTPException(status_code=404, detail="Group not found")
    return _groups[group_id]