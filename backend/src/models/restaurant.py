from pydantic import BaseModel
from typing import Optional
from enum import Enum


class HalalStatus(str, Enum):
    CONFIRMED = "confirmed"     # matched in JAKIM db
    LIKELY = "likely"           # cuisine/name pattern match
    UNLIKELY = "unlikely"       # strong non-halal signal
    UNKNOWN = "unknown"         # insufficient information


class VegetarianStatus(str, Enum):
    FRIENDLY = "friendly"       # explicitly vegetarian/vegan restaurant
    UNFRIENDLY = "unfriendly"   # known meat-only chain or venue
    UNKNOWN = "unknown"         # mixed menu or insufficient info


class Restaurant(BaseModel):
    place_id: str
    name: str
    address: str
    cuisine_types: list[str]
    price_level: Optional[int] = None
    price_range_rm: Optional[str] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    halal_status: HalalStatus
    vegetarian_status: VegetarianStatus = VegetarianStatus.UNKNOWN
    is_open: Optional[bool] = None
    distance_km: Optional[float] = None
    lat: float
    lng: float


class Recommendation(BaseModel):
    restaurant: Restaurant
    suitability_score: float
    dietary_fit: str
    dietary_reasoning: str
    cravings_match: str
    cravings_reasoning: str