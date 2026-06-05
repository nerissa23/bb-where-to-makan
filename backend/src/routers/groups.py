import uuid
from fastapi import APIRouter, HTTPException
from src.models.group import CreateGroupRequest, AddMemberRequest, VoteRequest

router = APIRouter(prefix="/groups", tags=["groups"])

# In-memory store for now — replace with Neon DB later
_groups: dict[str, dict] = {}


@router.post("")
def create_group(body: CreateGroupRequest):
    group_id = str(uuid.uuid4())
    _groups[group_id] = {
        "group_id": group_id,
        "group_name": body.group_name,
        "status": "open",
        "members": [],
        "results": None,
        "votes": {},
    }
    return {"group_id": group_id}


@router.get("/{group_id}")
def get_group(group_id: str):
    if group_id not in _groups:
        raise HTTPException(status_code=404, detail="Group not found")
    return _groups[group_id]


@router.post("/{group_id}/vote")
def cast_vote(group_id: str, body: VoteRequest):
    if group_id not in _groups:
        raise HTTPException(status_code=404, detail="Group not found")
    group = _groups[group_id]
    current = group.get("votes", {}).get(body.restaurant_id, 0)
    group.setdefault("votes", {})[body.restaurant_id] = max(0, current + body.delta)
    return {"ok": True}


@router.post("/{group_id}/members")
def add_member(group_id: str, body: AddMemberRequest):
    if group_id not in _groups:
        raise HTTPException(status_code=404, detail="Group not found")
    group = _groups[group_id]
    if group["status"] != "open":
        raise HTTPException(status_code=409, detail="Group is no longer accepting members")
    member = {
        "name": body.name,
        "dietary": [d.value for d in body.dietary],
        "budget_rm": body.budget_rm,
    }
    group["members"].append(member)
    return {"ok": True, "member_count": len(group["members"])}
