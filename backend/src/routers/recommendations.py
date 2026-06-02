from fastapi import APIRouter, HTTPException
from backend.src.db.database import SessionLocal
from backend.src.models.group import Group as GroupModel
from backend.src.models.recommendation import RecommendationSession
from backend.src.models.schemas import CravingData, Recommendation
from backend.src.services import places, ai, cache
from typing import List
import math

router = APIRouter(prefix="/groups/{group_id}", tags=["recommendations"])


@router.post("/recommend")
async def recommend(group_id: str, cravings: CravingData) -> dict:
    db = SessionLocal()
    try:
        g = db.query(GroupModel).get(group_id)
        if not g:
            raise HTTPException(status_code=404, detail="Group not found")
        group = {"name": g.name, "members": g.members}
    finally:
        db.close()

    # 1) geocode the provided location
    geo = await places.geocode_location(cravings.location)
    if not geo:
        # fallback: empty result
        return {"recommendations": []}

    lat = geo["lat"]
    lon = geo["lon"]

    # 2) find nearby restaurants (use cache if available)
    cache_key = f"recs:{group_id}:{cravings.location}:{','.join(cravings.cuisineMood)}"
    cached = cache.get_cached(cache_key)
    if cached:
        return {"recommendations": cached}

    places_list = await places.find_restaurants(lat, lon)

    # 3) score and build recommendations
    recs: List[Recommendation] = []
    for p in places_list[:20]:
        # simple fit score heuristic: prefer places with cuisine matching any cuisineMood
        tags = p.get("tags", {})
        cuisine = tags.get("cuisine") if isinstance(tags, dict) else None
        name = p.get("name")
        # distance
        dist_km = None
        try:
            if p.get("lat") and p.get("lon"):
                dist_km = places.haversine(lat, lon, float(p.get("lat")), float(p.get("lon")))
        except Exception:
            dist_km = None

        # compute a fit score out of 10
        score = 6
        if cravings.cuisineMood and cuisine:
            if any(c.lower() in (cuisine or "").lower() for c in cravings.cuisineMood):
                score += 2
        # penalize if too far
        if dist_km is not None and dist_km > 3:
            score -= 1

        score = max(1, min(10, score))

        distance_str = f"{dist_km:.1f} km" if dist_km is not None else None

        rec = {
            "id": p.get("id"),
            "name": name,
            "cuisine": cuisine or (tags.get("cuisine") if isinstance(tags, dict) else None),
            "priceRange": tags.get("price") if isinstance(tags, dict) else None,
            "distance": distance_str,
            "fitScore": int(score),
            "reasoning": await ai.generate_reasoning({"cuisine": cuisine, "priceRange": tags.get("price"), "distance": distance_str, "fitScore": score}, group, cravings.dict()),
            "conflicts": [],
            "votes": 0,
        }
        recs.append(rec)

    # sort by fitScore descending
    recs_sorted = sorted(recs, key=lambda r: r["fitScore"], reverse=True)
    cache.set_cached(cache_key, recs_sorted)

    db = SessionLocal()
    try:
        session_row = RecommendationSession(
            group_id=group_id,
            cravings=cravings.dict(),
            results=recs_sorted,
            status="ready",
        )
        db.add(session_row)
        db.commit()
    finally:
        db.close()

    return {"recommendations": recs_sorted}
