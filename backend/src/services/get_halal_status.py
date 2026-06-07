from src.models.restaurant import HalalStatus
from src.services.check_from_jakim import jakim_service

# set of cuisine types strongly assoc. with halal food
HALAL_CUISINE_TYPES = {
    "malay restaurant", "malaysian restaurant",
    "indian restaurant", "mamak restaurant",
    "middle eastern restaurant", "nasi kandar restaurant",
    "turkish restaurant", "pakistani restaurant",
    "indonesian restaurant", "halal restaurant",
}

# list of name substrings suggesting a restaurant is halal
HALAL_NAME_KEYWORDS = [
    "halal", "muslim", "islamik", "nasi", "warung",
    "mamak", "kandar", "sup ", "al-", "ar-",
]

# name substrings suggesting NOT halal
NOT_HALAL_NAME_KEYWORDS = [
    "pork", "babi", "char siu", "roast pig",
    "bacon", "lard", "beer", "wine", "bar ",
    "brewery", "taproom", "tavern",
    # Vietnamese cuisine — pork used extensively
    "viet", "vietnamese", "pho ", "bun bo", "banh mi", "banh cuon",
    # Chinese non-halal specialists
    "dim sum", "roast duck", "siu yuk", "roast pork", "wonton",
]

# cuisine/place types from google places indicating non-halal
NOT_HALAL_CUISINE_TYPES = {
    "bar", "pub", "night_club",
}


def get_halal_status(
    restaurant_name: str,
    cuisine_types:   list[str],
    google_types:    list[str] = [],
) -> HalalStatus:

    # preprocessing
    name_lower    = restaurant_name.lower()
    cuisines_set  = {c.lower() for c in cuisine_types}
    gtypes_set    = {t.lower() for t in google_types}

    # Signal 1: JAKIM confirmed (highest confidence)
    if jakim_service.is_confirmed_halal(restaurant_name):
        return HalalStatus.CONFIRMED

    # Signal 2: Google halal_food type tag
    if "halal_food" in gtypes_set:
        return HalalStatus.CONFIRMED

    # Signal 3: Strong NOT halal signals
    for kw in NOT_HALAL_NAME_KEYWORDS:
        if kw in name_lower:
            return HalalStatus.UNLIKELY

    if cuisines_set & NOT_HALAL_CUISINE_TYPES: # & operator returns intersection of the sets
        return HalalStatus.UNLIKELY

    # Signal 4: Halal cuisine type
    for cuisine in cuisines_set:
        if any(h in cuisine for h in HALAL_CUISINE_TYPES):
            return HalalStatus.LIKELY

    # Signal 5: Halal name keywords
    for kw in HALAL_NAME_KEYWORDS:
        if kw in name_lower:
            return HalalStatus.LIKELY

    return HalalStatus.UNKNOWN