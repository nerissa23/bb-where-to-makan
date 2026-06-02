from pydantic import BaseModel
from enum import Enum


class DietaryRestriction(str, Enum):
    HALAL = "halal"
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    NO_PORK = "no_pork"
    NO_SEAFOOD = "no_seafood"


class Member(BaseModel):
    name: str
    dietary: list[DietaryRestriction] = []
    budget_rm: float


class Group(BaseModel):
    group_name: str
    members: list[Member]


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
