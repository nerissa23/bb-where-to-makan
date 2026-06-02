from fastapi import APIRouter, HTTPException
from backend.src.models.schemas import GroupData
from backend.src.db.database import SessionLocal, init_db
from backend.src.models.group import Group as GroupModel

router = APIRouter(prefix="/groups", tags=["groups"])


@router.on_event("startup")
def _init():
    init_db()


@router.post("", status_code=201)
def create_group(group: GroupData):
    db = SessionLocal()
    try:
        g = GroupModel(name=group.name, members=[m.dict() for m in group.members])
        db.add(g)
        db.commit()
        db.refresh(g)
        return {"id": g.id, "group": {"name": g.name, "members": g.members}}
    finally:
        db.close()


@router.get("/{group_id}")
def get_group(group_id: str):
    db = SessionLocal()
    try:
        g = db.query(GroupModel).get(group_id)
        if not g:
            raise HTTPException(status_code=404, detail="Group not found")
        return {"id": g.id, "group": {"name": g.name, "members": g.members}}
    finally:
        db.close()
