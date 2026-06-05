from fastapi import APIRouter, HTTPException, Response
from src.models.group import CravingRequest, PlacesRequest
from src.services.get_google_places import places_service

# Reference same in-memory store — will move to DB later
from src.routers.groups import _groups

router = APIRouter(prefix="/groups", tags=["recommendations"])


@router.post("/{group_id}/recommend")
def get_recommendations(group_id: str, craving: CravingRequest):
    if group_id not in _groups:
        raise HTTPException(status_code=404, detail="Group not found")

    group_data = _groups[group_id]
    members = group_data["members"]

    if not members:
        raise HTTPException(status_code=400, detail="Group has no members yet")

    # Lock the group so friends get redirected to results
    group_data["status"] = "locked"

    # Derive constraints from group members
    all_dietary: set[str] = set()
    for m in members:
        all_dietary.update(m["dietary"])

    halal_required = "halal" in all_dietary
    vegetarian_required = "vegetarian" in all_dietary or "vegan" in all_dietary
    no_pork_required = "no_pork" in all_dietary or halal_required
    no_beef_required = "no_beef" in all_dietary
    no_seafood_required = "no_seafood" in all_dietary
    gluten_free_required = "gluten_free" in all_dietary
    dairy_free_required = "dairy_free" in all_dietary
    budget_ceiling = min(m["budget_rm"] for m in members)

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
        group_data["status"] = "open"
        raise HTTPException(status_code=500, detail=str(e))

    results = [r.model_dump() for r in candidates]
    group_data["results"] = results
    group_data["status"] = "done"

    return {"group_id": group_id, "recommendations": results}


@router.get("/{group_id}/results")
def get_results(group_id: str, response: Response):
    if group_id not in _groups:
        raise HTTPException(status_code=404, detail="Group not found")

    group_data = _groups[group_id]

    if group_data["status"] == "open":
        raise HTTPException(status_code=404, detail="Recommendations not started yet")

    if group_data["status"] == "locked":
        response.status_code = 202
        return {"status": "locked", "recommendations": None}

    return {"status": "done", "recommendations": group_data["results"]}
