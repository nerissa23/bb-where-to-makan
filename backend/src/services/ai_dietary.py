import json
import logging
import os
import re
from src.models.restaurant import Restaurant, HalalStatus, VegetarianStatus
from src.services.prompt_model import prompt_model, ModelConfig
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

AI_CONFIG = ModelConfig(temperature=0.2, seed=42)


def _build_prompt(unknowns: list[tuple[int, Restaurant]]) -> str:
    lines = [
        "You are a dietary status classifier for Malaysian restaurants.",
        "",
        "Given each restaurant's name and Google types, classify its halal and vegetarian status.",
        "",
        "Rules for halal in Malaysia:",
        "- Malay, Indian Muslim (Mamak), and Middle Eastern restaurants -> likely",
        "- Major chains (McDonald's, KFC, Texas Chicken, Pizza Hut, Burger King,",
        "  Domino's, Subway, Sushi King, Sushi Zanmai) -> likely (JAKIM certified in Malaysia)",
        "- Japanese restaurants: some are halal, some use pork-based broth -> unknown",
        "- Korean BBQ: some halal, some serve pork -> unknown",
        "- Chinese restaurants: varies -> unknown unless name suggests halal",
        "- Vietnamese restaurants (pho, banh mi, bun bo, 'viet' in name) -> unlikely (pork used extensively)",
        "- Chinese roast meat, dim sum, wonton noodle specialists -> unlikely (pork-based)",
        "- Pubs, bars, breweries -> unlikely",
        "- Pork/bacon/BBQ specialist, beer/alcohol in name -> unlikely",
        "- If uncertain -> unknown",
        "",
        "Rules for vegetarian in Malaysia:",
        "- Indian restaurants (pure veg or South Indian) -> friendly",
        "- Salad/health food places -> friendly",
        "- Steakhouses, BBQ, burger chains (non-halal ones) -> unfriendly",
        "- Most Malay/Chinese restaurants -> unknown (mixed options available)",
        "- If uncertain -> unknown",
        "",
        "Restaurants to classify:",
    ]

    for idx, (_, r) in enumerate(unknowns):
        lines.append(f"{idx}: {r.name} | google_types: {r.cuisine_types}")

    lines.extend([
        "",
        "Return ONLY a valid JSON array with no markdown, no backticks:",
        '[',
        '  {',
        '    "index": 0,',
        '    "halal": "likely",',
        '    "vegetarian": "unknown"',
        '  }',
        ']',
        "",
        "Valid halal values: likely, unlikely, unknown",
        "Valid vegetarian values: friendly, unfriendly, unknown",
    ])

    return "\n".join(lines)


def _parse_response(text: str) -> list[dict]:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.DOTALL)
    data = json.loads(cleaned)
    if not isinstance(data, list):
        raise ValueError("LLM response is not a list")
    return data


def enhance_dietary_status(restaurants: list[Restaurant]) -> list[Restaurant]:
    unknowns = [
        (i, r) for i, r in enumerate(restaurants)
        if r.halal_status == HalalStatus.UNKNOWN
        or r.vegetarian_status == VegetarianStatus.UNKNOWN
    ]

    if not unknowns:
        return restaurants

    model = os.getenv("MODEL")
    if not model:
        return restaurants

    prompt = _build_prompt(unknowns)
    raw = prompt_model(model, prompt, AI_CONFIG)

    if raw.startswith("[Error") or raw.startswith("[Gemini Error") or raw.startswith("[Ollama Error"):
        logger.warning(f"Dietary AI error: {raw} — keeping heuristic statuses")
        return restaurants

    try:
        parsed = _parse_response(raw)
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        logger.warning(f"Failed to parse dietary AI response: {e}")
        return restaurants

    index_map = {item["index"]: item for item in parsed if "index" in item}
    for batch_idx, (orig_idx, r) in enumerate(unknowns):
        item = index_map.get(batch_idx, {})
        halal_raw = str(item.get("halal", "")).strip().lower()
        veg_raw = str(item.get("vegetarian", "")).strip().lower()

        if r.halal_status == HalalStatus.UNKNOWN and halal_raw in ("likely", "unlikely", "unknown"):
            restaurants[orig_idx].halal_status = HalalStatus(halal_raw)
        if r.vegetarian_status == VegetarianStatus.UNKNOWN and veg_raw in ("friendly", "unfriendly", "unknown"):
            restaurants[orig_idx].vegetarian_status = VegetarianStatus(veg_raw)

    enhanced = sum(1 for i, _ in unknowns if restaurants[i].halal_status != HalalStatus.UNKNOWN or restaurants[i].vegetarian_status != VegetarianStatus.UNKNOWN)
    if enhanced:
        logger.info(f"AI enhanced dietary status for {enhanced}/{len(unknowns)} restaurants")

    return restaurants
