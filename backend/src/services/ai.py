import os
from typing import Dict, Any

LLM_KEY = os.getenv("LLM_API_KEY")


async def generate_reasoning(rec: Dict[str, Any], group: Dict[str, Any], cravings: Dict[str, Any]) -> str:
    """Simple reasoning generator. In Phase 2 this can call an LLM if `LLM_API_KEY` is configured.
    For now return a concise, deterministic explanation built from the data available.
    """
    parts = []
    # mention cuisine if available
    if rec.get("cuisine"):
        parts.append(f"Cuisine: {rec['cuisine']}.")
    # price range
    if rec.get("priceRange"):
        parts.append(f"Price: {rec['priceRange']}.")
    # distance
    if rec.get("distance"):
        parts.append(f"Distance: {rec['distance']}.")
    # basic fit sentence
    parts.append(f"Fit score: {rec.get('fitScore', 0)} out of 10 for the group's stated preferences.")

    # If LLM_KEY present we could call the provider here — left as an optional enhancement.
    return " ".join(parts)
