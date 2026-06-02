const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface BackendMember {
  name: string
  dietary: string[]
  budget_rm: number
}

export interface BackendGroup {
  group_name: string
  members: BackendMember[]
}

export interface BackendCravingRequest {
  craving: string
  cuisine_mood: string[]
  meal_time: string
  location: string
  radius_metres?: number
}

export interface BackendRestaurant {
  place_id: string
  name: string
  address: string
  cuisine_types: string[]
  price_level: number | null
  price_range_rm: string | null
  rating: number | null
  user_ratings_total: number | null
  halal_status: "confirmed" | "likely" | "unlikely" | "unknown"
  vegetarian_status: "friendly" | "unfriendly" | "unknown"
  is_open: boolean | null
  distance_km: number
  lat: number
  lng: number
}

export async function createGroup(group: BackendGroup): Promise<{ group_id: string }> {
  const res = await fetch(`${BASE_URL}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(group),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)")
    throw new Error(`Failed to create group: ${res.status} ${body}`)
  }
  return res.json()
}

export async function getRecommendations(
  groupId: string,
  craving: BackendCravingRequest
): Promise<{ group_id: string; recommendations: BackendRestaurant[] }> {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(craving),
  })
  if (!res.ok) throw new Error("Failed to get recommendations")
  return res.json()
}
