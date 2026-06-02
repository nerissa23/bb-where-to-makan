from src.models.restaurant import VegetarianStatus

# Well-known chains with no meaningful vegetarian menu in Malaysia
MEAT_CHAIN_KEYWORDS = [
    "kfc", "kentucky fried",
    "mcdonald", "mcdonalds",
    "burger king",
    "texas chicken",
    "popeyes", "popeye's",
    "church's chicken",
    "nando", "nandos",
    "a&w",
    "carl's jr", "carls jr",
]

# Dish or cuisine keywords that indicate primarily meat
MEAT_DISH_KEYWORDS = [
    "bak kut teh",
    "roast duck", "duck rice",
    "steak house", "steakhouse",
    "yakiniku", "teppanyaki", "gyudon",
    "seafood restaurant",
]

UNFRIENDLY_CUISINE_TYPES = {
    "steak house",
    "seafood restaurant",
}

FRIENDLY_NAME_KEYWORDS = [
    "vegetarian", "vegan", "veggie",
    "purely veg", "pure veg",
]

FRIENDLY_CUISINE_TYPES = {
    "vegetarian restaurant",
    "vegan restaurant",
}


def get_vegetarian_status(
    restaurant_name: str,
    cuisine_types: list[str],
    google_types: list[str] = [],
) -> VegetarianStatus:

    name_lower = restaurant_name.lower()
    cuisines_set = {c.lower() for c in cuisine_types}

    # Positive: explicitly vegetarian/vegan
    for kw in FRIENDLY_NAME_KEYWORDS:
        if kw in name_lower:
            return VegetarianStatus.FRIENDLY
    if cuisines_set & FRIENDLY_CUISINE_TYPES:
        return VegetarianStatus.FRIENDLY

    # Negative: known meat-only chains or dish types
    for kw in MEAT_CHAIN_KEYWORDS + MEAT_DISH_KEYWORDS:
        if kw in name_lower:
            return VegetarianStatus.UNFRIENDLY
    if cuisines_set & UNFRIENDLY_CUISINE_TYPES:
        return VegetarianStatus.UNFRIENDLY

    return VegetarianStatus.UNKNOWN
