"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { ResultsDisplay, type Recommendation } from "@/components/results-display"
import { getGroup, type GroupState, type BackendRecommendation } from "@/lib/api"
import { getMemberName } from "@/lib/member-session"
import { AppHeader } from "@/components/app-header"
import { FoodDecorations } from "@/components/food-decorations"

function transformRecommendations(recs: BackendRecommendation[]): Recommendation[] {
  return recs.map((rec) => {
    const r = rec.restaurant
    const reasoningParts: string[] = []
    if (rec.dietary_reasoning) reasoningParts.push(rec.dietary_reasoning)
    if (rec.cravings_reasoning) reasoningParts.push(rec.cravings_reasoning)
    const conflicts: string[] = []
    if (rec.dietary_fit === "incompatible") conflicts.push(`Dietary concern: ${rec.dietary_reasoning}`)
    if (rec.cravings_match === "no") conflicts.push(`Cuisine mood mismatch: ${rec.cravings_reasoning}`)
    return {
      id: r.place_id,
      name: r.name,
      cuisine: r.cuisine_types[0] ?? "Restaurant",
      priceRange: r.price_range_rm ?? "Price N/A",
      distance: `${r.distance_km.toFixed(1)} km`,
      halal_status: r.halal_status,
      vegetarian_status: r.vegetarian_status,
      fitScore: Math.round(rec.suitability_score * 10),
      reasoning: reasoningParts.join(" ") || null,
      dietary_fit: rec.dietary_fit,
      cravings_match: rec.cravings_match,
      conflicts,
      votes: 0,
      isAlternative: r.distance_km > 3,
    }
  })
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [group, setGroup] = useState<GroupState | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isDone, setIsDone] = useState(false)
  const [memberName, setMemberName] = useState<string | null>(null)

  useEffect(() => {
    setMemberName(getMemberName(id))
  }, [id])

  const poll = useCallback(async () => {
    try {
      const data = await getGroup(id)
      setGroup(data)
      if (data.status === "done" && data.results) {
        setRecommendations(transformRecommendations(data.results))
        setIsDone(true)
      }
    } catch {
      // silent
    }
  }, [id])

  useEffect(() => {
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [poll])

  if (!isDone) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium text-foreground">Finding somewhere to makan...</p>
          <p className="text-sm text-muted-foreground">Our AI is thinking hard for your group</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-8 px-4 relative overflow-hidden">
      <FoodDecorations />
      <div className="max-w-lg mx-auto space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <AppHeader />
          <p className="text-muted-foreground">Find the perfect restaurant for your group</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <ResultsDisplay
              recommendations={recommendations}
              groupName={group?.group_name ?? "your group"}
              participantCount={group?.members.length ?? 0}
              members={(group?.members ?? []).map((m) => ({
                name: m.name,
                dietaryRestrictions: m.dietary,
              }))}
              onBack={() => router.push(`/group/${id}/craving`)}
              onStartOver={() => router.push("/")}
              isLoading={false}
              showVoting={true}
              groupId={id}
              memberName={memberName}
              serverVotes={group?.votes ?? {}}
              memberVotes={group?.member_votes ?? {}}
              onVotesChange={(votes, userVotes) => {
                setGroup((prev) =>
                  prev
                    ? {
                        ...prev,
                        votes,
                        member_votes: memberName
                          ? { ...prev.member_votes, [memberName]: userVotes }
                          : prev.member_votes,
                      }
                    : prev
                )
              }}
            />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Powered by AI — group dining decisions made easy
        </p>
      </div>
    </main>
  )
}