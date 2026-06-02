import os
import math
from typing import List, Dict, Any, Optional
import httpx

SEARCH_RADIUS = int(os.getenv("SEARCH_RADIUS_METRES", "3000"))
PLACES_PROVIDER = os.getenv("PLACES_PROVIDER", "nomatim")
OSM_KEY = os.getenv("OSM_PLACES_API_KEY")
GOOGLE_KEY = os.getenv("GOOGLE_PLACES_API_KEY")


def haversine(lat1, lon1, lat2, lon2):
    # returns distance in kilometres
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


async def geocode_location(location: str) -> Optional[Dict[str, float]]:
    if PLACES_PROVIDER == "nomatim":
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": location, "format": "jsonv2", "limit": 1}
        headers = {"User-Agent": "bb-where-to-makan/1.0 (dev)", "Accept": "application/json"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, params=params, headers=headers)
            r.raise_for_status()
            data = r.json()
            if not data:
                return None
            return {"lat": float(data[0]["lat"]), "lon": float(data[0]["lon"])}

    # Fallback: Google Places geocoding (if key provided)
    if GOOGLE_KEY:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {"address": location, "key": GOOGLE_KEY}
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
            if not data.get("results"):
                return None
            loc = data["results"][0]["geometry"]["location"]
            return {"lat": loc["lat"], "lon": loc["lng"]}

    return None


async def find_restaurants(lat: float, lon: float, radius_m: int = SEARCH_RADIUS) -> List[Dict[str, Any]]:
    """Return a list of restaurant-like places near the provided lat/lon.
    Each item includes at least: id, name, lat, lon, tags.
    """
    if PLACES_PROVIDER == "nomatim":
        # Use Overpass API to query restaurants
        overpass = "https://overpass-api.de/api/interpreter"
        # amenity=restaurant, or shop=food etc. Use a simple overpass query
        query = f"[out:json][timeout:25];(node[amenity=restaurant](around:{radius_m},{lat},{lon});way[amenity=restaurant](around:{radius_m},{lat},{lon});relation[amenity=restaurant](around:{radius_m},{lat},{lon}););out center;"
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(overpass, content=query)
            r.raise_for_status()
            data = r.json()
            results = []
            for el in data.get("elements", []):
                if el.get("type") == "node":
                    plat = el.get("lat")
                    plon = el.get("lon")
                else:
                    center = el.get("center") or {}
                    plat = center.get("lat")
                    plon = center.get("lon")

                tags = el.get("tags", {})
                results.append({
                    "id": str(el.get("id")),
                    "name": tags.get("name") or tags.get("brand") or "Unknown",
                    "lat": plat,
                    "lon": plon,
                    "tags": tags,
                })
            return results

    # If GOOGLE_KEY present, use Google Places Nearby Search
    if GOOGLE_KEY:
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {"key": GOOGLE_KEY, "location": f"{lat},{lon}", "radius": radius_m, "type": "restaurant"}
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
            results = []
            for place in data.get("results", []):
                loc = place["geometry"]["location"]
                results.append({
                    "id": place.get("place_id"),
                    "name": place.get("name"),
                    "lat": loc.get("lat"),
                    "lon": loc.get("lng"),
                    "tags": {"types": place.get("types", [])},
                    "rating": place.get("rating"),
                })
            return results

    return []
