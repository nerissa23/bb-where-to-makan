import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload

from src.db.models import Group, Member, MemberVote, Vote


def _member_votes_dict(group: Group) -> dict[str, list[str]]:
    votes_by_member: dict[str, list[str]] = {}
    for member_vote in group.member_votes:
        member_name = member_vote.member.name
        votes_by_member.setdefault(member_name, []).append(member_vote.restaurant_id)
    return votes_by_member


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
        "member_votes": _member_votes_dict(group),
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
            selectinload(Group.member_votes).selectinload(MemberVote.member),
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


def cast_vote(session: Session, group_id: str, restaurant_id: str, member_name: str) -> dict:
    group = get_group_or_404(session, group_id)
    member = next((m for m in group.members if m.name == member_name), None)
    if member is None:
        raise HTTPException(status_code=400, detail="Member not found in group")

    member_vote = next(
        (
            mv
            for mv in group.member_votes
            if mv.member_id == member.id and mv.restaurant_id == restaurant_id
        ),
        None,
    )
    aggregate_vote = next((v for v in group.votes if v.restaurant_id == restaurant_id), None)

    if member_vote is not None:
        session.delete(member_vote)
        if aggregate_vote is not None:
            aggregate_vote.count = max(0, aggregate_vote.count - 1)
            if aggregate_vote.count == 0:
                session.delete(aggregate_vote)
    else:
        session.add(
            MemberVote(
                group_id=group.id,
                member_id=member.id,
                restaurant_id=restaurant_id,
            )
        )
        if aggregate_vote is None:
            session.add(
                Vote(group_id=group.id, restaurant_id=restaurant_id, count=1)
            )
        else:
            aggregate_vote.count += 1

    session.flush()
    session.refresh(group, attribute_names=["votes", "member_votes"])

    user_votes = [
        mv.restaurant_id
        for mv in group.member_votes
        if mv.member_id == member.id
    ]
    return {
        "votes": {vote.restaurant_id: vote.count for vote in group.votes},
        "user_votes": user_votes,
    }


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