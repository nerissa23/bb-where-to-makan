from pydantic import BaseModel
from enum import Enum


class DietaryRestriction(str, Enum):
    HALAL = "halal"
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    NO_PORK = "no_pork"
    NO_SEAFOOD = "no_seafood"


class GroupStatus(str, Enum):
    OPEN = "open"
    LOCKED = "locked"
    DONE = "done"


class Member(BaseModel):
    name: str
    dietary: list[DietaryRestriction] = []
    budget_rm: float


class CreateGroupRequest(BaseModel):
    group_name: str


class AddMemberRequest(BaseModel):
    name: str
    dietary: list[DietaryRestriction] = []
    budget_rm: float


class CravingRequest(BaseModel):
    craving: str
    cuisine_mood: list[str] = []
    meal_time: str
    location: str
    radius_metres: int = 3000


class PlacesRequest(BaseModel):
    location: str
    budget_ceiling_rm: float
    cuisine_mood: list[str] = []
    meal_time: str
    radius_metres: int = 3000


class VoteRequest(BaseModel):
    restaurant_id: str
    delta: int  # +1 to vote, -1 to unvote
