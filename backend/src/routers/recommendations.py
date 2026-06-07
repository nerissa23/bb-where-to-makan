from fastapi import APIRouter, HTTPException, Response
from src.db.session import get_session
from src.models.group import CravingRequest, PlacesRequest
from src.repositories import groups as group_repo
from src.services.get_google_places import places_service

router = APIRouter(prefix="/groups", tags=["recommendations"])


@router.post("/{group_id}/recommend")
def get_recommendations(group_id: str, craving: CravingRequest):
    with get_session() as session:
        group_data = group_repo.get_group_dict(session, group_id)
        members = group_data["members"]

    if not members:
        raise HTTPException(status_code=400, detail="Group has no members yet")

    with get_session() as session:
        group_repo.lock_group(session, group_id)

    all_dietary: set[str] = set()
    for member in members:
        all_dietary.update(member["dietary"])

    halal_required = "halal" in all_dietary
    vegetarian_required = "vegetarian" in all_dietary or "vegan" in all_dietary
    no_pork_required = "no_pork" in all_dietary or halal_required
    no_beef_required = "no_beef" in all_dietary
    no_seafood_required = "no_seafood" in all_dietary
    gluten_free_required = "gluten_free" in all_dietary
    dairy_free_required = "dairy_free" in all_dietary
    budget_ceiling = min(member["budget_rm"] for member in members)

    places_request = PlacesRequest(
        location=craving.location,
        budget_ceiling_rm=budget_ceiling,
        cuisine_mood=craving.cuisine_mood,
        meal_time=craving.meal_time,
        radius_metres=craving.radius_metres,
    )

    try:
        candidates = places_service.get_candidates(
            request=places_request,
            halal_required=halal_required,
            vegetarian_required=vegetarian_required,
            no_pork_required=no_pork_required,
            no_beef_required=no_beef_required,
            no_seafood_required=no_seafood_required,
            gluten_free_required=gluten_free_required,
            dairy_free_required=dairy_free_required,
        )
    except Exception as e:
        with get_session() as session:
            group_repo.unlock_group(session, group_id)
        raise HTTPException(status_code=500, detail=str(e))

    results = [candidate.model_dump() for candidate in candidates]
    with get_session() as session:
        group_repo.save_results(session, group_id, results)

    return {"group_id": group_id, "recommendations": results}


@router.get("/{group_id}/results")
def get_results(group_id: str, response: Response):
    with get_session() as session:
        payload = group_repo.get_results_state(session, group_id)

    if payload["status"] == "locked":
        response.status_code = 202

    return payload
