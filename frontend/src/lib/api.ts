const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface BackendMember {
  name: string
  dietary: string[]
  budget_rm: number
}

export interface GroupState {
  group_id: string
  group_name: string
  status: "open" | "locked" | "done"
  members: BackendMember[]
  results: BackendRecommendation[] | null
  votes: Record<string, number>
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

export interface BackendRecommendation {
  restaurant: BackendRestaurant
  suitability_score: number
  dietary_fit: string
  dietary_reasoning: string
  cravings_match: string
  cravings_reasoning: string
}

export async function createGroup(group_name: string): Promise<{ group_id: string }> {
  const res = await fetch(`${BASE_URL}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group_name }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)")
    throw new Error(`Failed to create group: ${res.status} ${body}`)
  }
  return res.json()
}

export async function getGroup(groupId: string): Promise<GroupState> {
  const res = await fetch(`${BASE_URL}/groups/${groupId}`)
  if (!res.ok) throw new Error(`Group not found: ${res.status}`)
  return res.json()
}

export async function addMember(
  groupId: string,
  member: { name: string; dietary: string[]; budget_rm: number }
): Promise<{ ok: boolean; member_count: number }> {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(member),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)")
    throw new Error(`Failed to add member: ${res.status} ${body}`)
  }
  return res.json()
}

export async function getRecommendations(
  groupId: string,
  craving: BackendCravingRequest
): Promise<{ group_id: string; recommendations: BackendRecommendation[] }> {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(craving),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)")
    throw new Error(`Failed to get recommendations: ${res.status} ${body}`)
  }
  return res.json()
}

export async function castVote(
  groupId: string,
  restaurantId: string,
  delta: number
): Promise<void> {
  await fetch(`${BASE_URL}/groups/${groupId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurant_id: restaurantId, delta }),
  })
}

export async function getResults(
  groupId: string
): Promise<{ status: string; recommendations: BackendRecommendation[] | null }> {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/results`)
  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)")
    throw new Error(`Failed to get results: ${res.status} ${body}`)
  }
  return res.json()
}
