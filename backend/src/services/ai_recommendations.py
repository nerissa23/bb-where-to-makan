import json
import logging
import os
import re
from src.models.restaurant import Restaurant, Recommendation
from src.models.group import PlacesRequest
from src.services.prompt_model import prompt_model, ModelConfig
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

AI_CONFIG = ModelConfig(temperature=0.3, seed=42)


def _build_prompt(
    candidates: list[Restaurant],
    request: PlacesRequest,
    halal_required: bool,
    vegetarian_required: bool,
    no_pork_required: bool = False,
    no_beef_required: bool = False,
    no_seafood_required: bool = False,
    gluten_free_required: bool = False,
    dairy_free_required: bool = False,
) -> str:
    lines: list[str] = [
        "You are a dietary and cuisine analysis assistant for restaurant recommendations in Malaysia.",
        "",
        "Analyze each restaurant below for suitability against the group's constraints.",
        "",
        "Malaysian cuisine includes Malay, Mamak, Nasi Kandar, Nyonya, and local Chinese/Indian fusion.",
        "Only classify as non-Malaysian when clearly foreign (mainland dim sum specialist, authentic Japanese, Korean BBQ, Italian fine dining).",
        "Use the restaurant NAME to infer cuisine — ignore generic Google types like 'restaurant' or 'cafe'.",
        "",
        "Group constraints:",
        f"- Halal required: {halal_required}",
        f"- Vegetarian/Vegan required: {vegetarian_required}",
        f"- No pork required: {no_pork_required}",
        f"- No beef required: {no_beef_required}",
        f"- No seafood required: {no_seafood_required}",
        f"- Gluten-free required: {gluten_free_required}",
        f"- Dairy-free required: {dairy_free_required}",
        f"- Cuisine mood: {request.cuisine_mood}",
        f"- Meal time: {request.meal_time}",
        f"- Budget ceiling (RM): {request.budget_ceiling_rm}",
        "",
        "IMPORTANT — Halal scoring rules (apply strictly when halal_required is true):",
        "  - halal_status 'confirmed' or 'likely' → dietary_fit = compatible",
        "  - halal_status 'unknown' → dietary_fit = uncertain; cap suitability_score at 0.35",
        "  - halal_status 'unlikely' → dietary_fit = incompatible; suitability_score = 0.0",
        "When halal_required is false, ignore halal_status in scoring.",
        "IMPORTANT — Vegetarian scoring rules (apply when vegetarian_required is true):",
        "  - vegetarian_status 'friendly' → compatible",
        "  - vegetarian_status 'unknown' → uncertain; cap suitability_score at 0.35",
        "  - vegetarian_status 'unfriendly' → incompatible; suitability_score = 0.0",
        "IMPORTANT — No-pork scoring rules (apply when no_pork_required is true):",
        "  - Clearly pork-heavy cuisines (char siu, bak kut teh, wonton noodle, dim sum, Vietnamese with pork, Chinese BBQ) → incompatible; suitability_score = 0.0",
        "  - Malay, Mamak, Indian, Middle Eastern restaurants → compatible",
        "  - Others → uncertain; cap suitability_score at 0.35",
        "IMPORTANT — No-beef scoring rules (apply when no_beef_required is true):",
        "  - Steakhouses, burger chains, Korean BBQ, beef-specialist restaurants → incompatible; suitability_score = 0.0",
        "  - Pure seafood, pure vegetarian, pure chicken/lamb restaurants → compatible",
        "  - Mixed restaurants (most Malay, Chinese, Indian) → uncertain; no score penalty",
        "IMPORTANT — No-seafood scoring rules (apply when no_seafood_required is true):",
        "  - Seafood restaurants, fish head curry specialists, oyster/prawn-focused venues → incompatible; suitability_score = 0.0",
        "  - Land-protein focused (chicken rice, beef, lamb, vegetarian) → compatible",
        "  - Mixed restaurants → uncertain; no score penalty",
        "IMPORTANT — Gluten-free scoring rules (apply when gluten_free_required is true):",
        "  - Ramen, dim sum, pasta/Italian, naan-heavy Indian, bread-focused venues → uncertain; cap suitability_score at 0.35",
        "  - Rice-based restaurants (Malay nasi, Indian rice meals, Chinese rice) → compatible",
        "  - Mixed/unclear → uncertain; cap suitability_score at 0.5",
        "IMPORTANT — Dairy-free scoring rules (apply when dairy_free_required is true):",
        "  - Restaurants heavy on dairy (paneer, lassi, cheese-focused, Western pastries) → uncertain; cap suitability_score at 0.35",
        "  - Chinese, Malay, most Southeast Asian cuisines → compatible",
        "  - Mixed/unclear → uncertain; cap suitability_score at 0.5",
        "Apply ALL applicable constraint rules. The final suitability_score is the lowest score after all caps are applied.",
        "dietary_fit should reflect the worst-case constraint: 'incompatible' if any constraint fails, 'uncertain' if any is uncertain, 'compatible' only if all pass.",
        "IMPORTANT — Cuisine mood scoring rules:",
        "  - cravings_match 'yes' → no penalty from mood",
        "  - cravings_match 'no' → cap suitability_score at 0.6 (apply after dietary caps)",
        "  - cravings_match 'uncertain' → no penalty from mood",
        "",
        "Restaurants:",
    ]

    for i, r in enumerate(candidates):
        lines.append(
            f"{i}: {r.name} | google_types: {r.cuisine_types} "
            f"| price_level: {r.price_level} "
            f"| rating: {r.rating} "
            f"| distance: {r.distance_km}km"
            f" | halal_status: {r.halal_status.value}"
            f" | vegetarian_status: {r.vegetarian_status.value}"
        )

    lines.extend([
        "",
        "For each restaurant, infer the actual cuisine from its NAME and the Malaysian cuisine rules above.",
        "Then decide if it matches the cuisine mood.",
        "Return ONLY a valid JSON array with no markdown, no backticks, no extra text:",
        '[',
        '  {',
        '    "index": 0,',
        '    "suitability_score": 0.95,',
        '    "dietary_fit": "compatible",',
        '    "dietary_reasoning": "Brief reason about halal/vegetarian fit",',
        '    "cravings_match": "yes",',
        '    "cravings_reasoning": "Brief reason about cuisine mood match (mention inferred cuisine)",',
        '    "recommended": true',
        '  }',
        ']',
    ])

    return "\n".join(lines)


def _parse_response(text: str, count: int) -> list[dict]:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.DOTALL)
    data = json.loads(cleaned)
    if not isinstance(data, list):
        raise ValueError("LLM response is not a list")
    return data


def rank_with_ai(
    candidates: list[Restaurant],
    request: PlacesRequest,
    halal_required: bool,
    vegetarian_required: bool,
    no_pork_required: bool = False,
    no_beef_required: bool = False,
    no_seafood_required: bool = False,
    gluten_free_required: bool = False,
    dairy_free_required: bool = False,
) -> list[Recommendation]:
    if not candidates:
        return []

    model = os.getenv("MODEL")
    if not model:
        logger.warning("MODEL env var not set — skipping AI ranking, using default scores")
        return [
            Recommendation(
                restaurant=r,
                suitability_score=0.5,
                dietary_fit="uncertain",
                dietary_reasoning="No LLM configured",
                cravings_match="uncertain",
                cravings_reasoning="No LLM configured",
            )
            for r in candidates
        ]

    prompt = _build_prompt(
        candidates, request,
        halal_required, vegetarian_required,
        no_pork_required, no_beef_required,
        no_seafood_required, gluten_free_required, dairy_free_required,
    )
    raw = prompt_model(model, prompt, AI_CONFIG)

    if raw.startswith("[Error") or raw.startswith("[Gemini Error") or raw.startswith("[Ollama Error"):
        logger.warning(f"LLM error: {raw} — falling back to default scores")
        return [
            Recommendation(
                restaurant=r,
                suitability_score=0.5,
                dietary_fit="uncertain",
                dietary_reasoning="LLM unavailable — heuristic check passed",
                cravings_match="uncertain",
                cravings_reasoning="LLM unavailable",
            )
            for r in candidates
        ]

    try:
        parsed = _parse_response(raw, len(candidates))
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        logger.warning(f"Failed to parse LLM response: {e}\nRaw: {raw[:500]}")
        parsed = []

    index_map = {item["index"]: item for item in parsed if "index" in item}
    results: list[Recommendation] = []
    for i, r in enumerate(candidates):
        item = index_map.get(i, {})
        results.append(
            Recommendation(
                restaurant=r,
                suitability_score=float(item.get("suitability_score", 0.5)),
                dietary_fit=str(item.get("dietary_fit", "uncertain")),
                dietary_reasoning=str(item.get("dietary_reasoning", "")),
                cravings_match=str(item.get("cravings_match", "uncertain")),
                cravings_reasoning=str(item.get("cravings_reasoning", "")),
            )
        )

    results.sort(key=lambda x: x.suitability_score, reverse=True)
    return results
