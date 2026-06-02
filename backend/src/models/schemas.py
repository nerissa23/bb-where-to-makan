from pydantic import BaseModel
from typing import List, Optional


class Member(BaseModel):
    id: Optional[str]
    name: str
    budget: str
    dietaryRestrictions: List[str] = []


class GroupData(BaseModel):
    name: str
    members: List[Member] = []


class CravingData(BaseModel):
    freeText: str
    cuisineMood: List[str] = []
    location: str


class Recommendation(BaseModel):
    id: str
    name: str
    cuisine: Optional[str] = None
    priceRange: Optional[str] = None
    distance: Optional[str] = None
    fitScore: int
    reasoning: str
    conflicts: List[str] = []
    votes: Optional[int] = 0
