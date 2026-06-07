import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload

from src.db.models import Group, Member, Vote


def _group_to_dict(group: Group) -> dict:
    return {
        "group_id": str(group.id),
        "group_name": group.group_name,
        "status": group.status,
        "members": [
            {
                "name": member.name,
                "dietary": list(member.dietary or []),
                "budget_rm": member.budget_rm,
            }
            for member in group.members
        ],
        "results": group.results,
        "votes": {vote.restaurant_id: vote.count for vote in group.votes},
    }


def _get_group(session: Session, group_id: str) -> Group | None:
    try:
        parsed_id = uuid.UUID(group_id)
    except ValueError:
        return None

    return session.get(
        Group,
        parsed_id,
        options=(
            selectinload(Group.members),
            selectinload(Group.votes),
        ),
    )


def get_group_or_404(session: Session, group_id: str) -> Group:
    group = _get_group(session, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


def create_group(session: Session, group_name: str) -> str:
    group = Group(group_name=group_name, status="open", results=None)
    session.add(group)
    session.flush()
    return str(group.id)


def get_group_dict(session: Session, group_id: str) -> dict:
    group = get_group_or_404(session, group_id)
    return _group_to_dict(group)


def add_member(
    session: Session,
    group_id: str,
    name: str,
    dietary: list[str],
    budget_rm: float,
) -> int:
    group = get_group_or_404(session, group_id)
    if group.status != "open":
        raise HTTPException(status_code=409, detail="Group is no longer accepting members")

    session.add(
        Member(
            group_id=group.id,
            name=name,
            dietary=dietary,
            budget_rm=budget_rm,
        )
    )
    session.flush()
    session.refresh(group, attribute_names=["members"])
    return len(group.members)


def cast_vote(session: Session, group_id: str, restaurant_id: str, delta: int) -> None:
    group = get_group_or_404(session, group_id)
    vote = next((v for v in group.votes if v.restaurant_id == restaurant_id), None)
    if vote is None:
        vote = Vote(group_id=group.id, restaurant_id=restaurant_id, count=0)
        session.add(vote)
        group.votes.append(vote)

    vote.count = max(0, vote.count + delta)


def lock_group(session: Session, group_id: str) -> dict:
    group = get_group_or_404(session, group_id)
    group.status = "locked"
    session.flush()
    return _group_to_dict(group)


def unlock_group(session: Session, group_id: str) -> None:
    group = get_group_or_404(session, group_id)
    group.status = "open"


def save_results(session: Session, group_id: str, results: list[dict]) -> None:
    group = get_group_or_404(session, group_id)
    group.results = results
    group.status = "done"


def get_results_state(session: Session, group_id: str) -> dict:
    group = get_group_or_404(session, group_id)
    if group.status == "open":
        raise HTTPException(status_code=404, detail="Recommendations not started yet")
    if group.status == "locked":
        return {"status": "locked", "recommendations": None}
    return {"status": "done", "recommendations": group.results}
