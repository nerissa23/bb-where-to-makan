from fastapi import APIRouter
from src.db.session import get_session
from src.models.group import CreateGroupRequest, AddMemberRequest, VoteRequest
from src.repositories import groups as group_repo

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("")
def create_group(body: CreateGroupRequest):
    with get_session() as session:
        group_id = group_repo.create_group(session, body.group_name)
    return {"group_id": group_id}


@router.get("/{group_id}")
def get_group(group_id: str):
    with get_session() as session:
        return group_repo.get_group_dict(session, group_id)


@router.post("/{group_id}/vote")
def cast_vote(group_id: str, body: VoteRequest):
    with get_session() as session:
        group_repo.cast_vote(session, group_id, body.restaurant_id, body.delta)
    return {"ok": True}


@router.post("/{group_id}/members")
def add_member(group_id: str, body: AddMemberRequest):
    with get_session() as session:
        member_count = group_repo.add_member(
            session,
            group_id,
            body.name,
            [d.value for d in body.dietary],
            body.budget_rm,
        )
    return {"ok": True, "member_count": member_count}
