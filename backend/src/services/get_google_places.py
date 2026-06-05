import googlemaps
import redis
import json
import hashlib
import logging
import os
import math
from src.models.restaurant import (
    Restaurant,
    Recommendation,
    HalalStatus,
    VegetarianStatus,
)
from src.services.ai_recommendations import rank_with_ai
from src.services.ai_dietary import enhance_dietary_status
from src.models.group import PlacesRequest
from src.services.get_halal_status import get_halal_status
from src.services.get_vegetarian_status import get_vegetarian_status
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

PRICE_LEVEL_TO_RM = {
    1: (5, 15),
    2: (15, 35),
    3: (35, 80),
    4: (80, 999),
}


def _rm_range(level: int | None) -> str | None:
    if level is None:
        return None
    lo, hi = PRICE_LEVEL_TO_RM.get(level, (0, 999))
    return f"RM {lo}–{hi}"


def _fits_budget(level: int | None, budget: float) -> bool:
    if level is None:
        return True
    lo, _ = PRICE_LEVEL_TO_RM.get(level, (0, 999))
    return lo <= budget


def _haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


class PlacesService:
    def __init__(self):
        api_key = os.getenv("PLACES_API_KEY")
        if not api_key:
            raise ValueError("PLACES_API_KEY not set")
        self.client = googlemaps.Client(key=api_key)

        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.cache = redis.from_url(redis_url, decode_responses=True)
        self.ttl = int(os.getenv("CACHE_TTL_SECONDS", 1800))

    # ── Cache ──────────────────────────────────────────────────────────────

    def _key(self, req: PlacesRequest) -> str:
        raw = f"{req.location}:{req.radius_metres}"
        return "places:" + hashlib.md5(raw.encode()).hexdigest()

    def _get_cache(self, key: str) -> list[Restaurant] | None:
        try:
            hit = self.cache.get(key)
            if hit:
                logger.info(f"Cache hit: {key}")
                return [Restaurant(**r) for r in json.loads(hit)]
        except Exception as e:
            logger.warning(f"Cache read error: {e}")
        return None

    def _set_cache(self, key: str, data: list[Restaurant]):
        try:
            self.cache.setex(key, self.ttl, json.dumps([r.model_dump() for r in data]))
        except Exception as e:
            logger.warning(f"Cache write error: {e}")

    # ── Geocode ────────────────────────────────────────────────────────────

    def _geocode(self, location: str) -> tuple[float, float]:
        result = self.client.geocode(location)
        if not result:
            raise ValueError(f"Cannot geocode: {location}")
        loc = result[0]["geometry"]["location"]
        return loc["lat"], loc["lng"]

    # ── Fetch ──────────────────────────────────────────────────────────────

    def _fetch(self, lat: float, lng: float, radius: int) -> list[dict]:
        seen, results = set(), []

        for place_type in ["restaurant", "cafe", "meal_takeaway"]:
            resp = self.client.places_nearby(
                location=(lat, lng),
                radius=radius,
                type=place_type,
            )
            for r in resp.get("results", []):
                if r["place_id"] not in seen:
                    seen.add(r["place_id"])
                    results.append(r)

        return results

    # ── Normalise ──────────────────────────────────────────────────────────

    # places that may carry a secondary "cafe" or "restaurant" tag but are not dining venues
    NON_RESTAURANT_PRIMARY_TYPES = {
        "gas_station",
        "convenience_store",
        "supermarket",
        "grocery_or_supermarket",
        "pharmacy",
        "hardware_store",
        "clothing_store",
        "department_store",
        "shopping_mall",
        "lodging",
        "hospital",
        "bicycle_store",
        "gym",
    }

    def _normalise(self, raw: dict, olat: float, olng: float) -> Restaurant:
        loc = raw["geometry"]["location"]
        name = raw.get("name", "Unknown")
        gtypes = raw.get("types", [])

        # reject venues primarily classified as non-restaurant even if they carry a cafe/restaurant tag
        if any(t in self.NON_RESTAURANT_PRIMARY_TYPES for t in gtypes):
            return None

        food_types = {
            "restaurant",
            "cafe",
            "meal_takeaway",
            "meal_delivery",
            "food",
            "bakery",
        }
        if not any(t in food_types for t in gtypes):
            return None  # caller will filter out None values

        cuisine_types = [
            t.replace("_", " ")
            for t in gtypes
            if t not in {"point_of_interest", "establishment", "food", "premise"}
        ]

        price_level = raw.get("price_level")
        halal_status = get_halal_status(name, cuisine_types, gtypes)
        veg_status = get_vegetarian_status(name, cuisine_types, gtypes)

        return Restaurant(
            place_id=raw["place_id"],
            name=name,
            address=raw.get("vicinity", ""),
            cuisine_types=cuisine_types,
            price_level=price_level,
            price_range_rm=_rm_range(price_level),
            rating=raw.get("rating"),
            user_ratings_total=raw.get("user_ratings_total"),
            halal_status=halal_status,
            vegetarian_status=veg_status,
            is_open=raw.get("opening_hours", {}).get("open_now"),
            distance_km=_haversine(olat, olng, loc["lat"], loc["lng"]),
            lat=loc["lat"],
            lng=loc["lng"],
        )

    # ── Filter ─────────────────────────────────────────────────────────────

    def _filter(
        self,
        restaurants: list[Restaurant],
        budget_ceiling_rm: float,
        halal_required: bool,
        vegetarian_required: bool,
    ) -> list[Restaurant]:

        out = []
        for r in restaurants:
            if not _fits_budget(r.price_level, budget_ceiling_rm):
                continue
            if halal_required and r.halal_status == HalalStatus.UNLIKELY:
                continue
            if (
                vegetarian_required
                and r.vegetarian_status == VegetarianStatus.UNFRIENDLY
            ):
                continue
            out.append(r)

        out.sort(key=lambda r: (-(r.rating or 0), r.distance_km or 999))
        return out

    # ── Public ─────────────────────────────────────────────────────────────

    def get_candidates(
        self,
        request: PlacesRequest,
        halal_required: bool = False,
        vegetarian_required: bool = False,
        no_pork_required: bool = False,
        no_beef_required: bool = False,
        no_seafood_required: bool = False,
        gluten_free_required: bool = False,
        dairy_free_required: bool = False,
    ) -> list[Recommendation]:

        cache_key = self._key(request)
        cached = self._get_cache(cache_key)

        if cached:
            print("🔃 Fetching from cache...")
            filtered = self._filter(
                cached,
                request.budget_ceiling_rm,
                halal_required,
                vegetarian_required,
            )
            return rank_with_ai(
                filtered[:10], request,
                halal_required, vegetarian_required,
                no_pork_required, no_beef_required,
                no_seafood_required, gluten_free_required, dairy_free_required,
            )

        print("🔍 Fetching from Places API...")
        lat, lng = self._geocode(request.location)
        raw = self._fetch(lat, lng, request.radius_metres)
        logger.info(f"Places API returned {len(raw)} raw results")

        restaurants = [
            r
            for r in (self._normalise(raw_r, lat, lng) for raw_r in raw)
            if r is not None
        ]
        if halal_required or vegetarian_required:
            restaurants = enhance_dietary_status(restaurants)
        self._set_cache(cache_key, restaurants)

        candidates = self._filter(
            restaurants,
            request.budget_ceiling_rm,
            halal_required,
            vegetarian_required,
        )

        logger.info(f"Returning {len(candidates)} candidates after filtering")
        return rank_with_ai(
            candidates[:10], request,
            halal_required, vegetarian_required,
            no_pork_required, no_beef_required,
            no_seafood_required, gluten_free_required, dairy_free_required,
        )


places_service = PlacesService()
