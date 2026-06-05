"use client"

import { useState, useEffect, useCallback } from "react"
import { castVote } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Star,
  AlertTriangle,
  RotateCcw,
  Users,
  ThumbsUp,
  Check,
  Filter,
  ChevronDown,
  ChevronUp,
  Compass,
} from "lucide-react"

function parsePriceLow(priceRange: string | null | undefined): number {
  if (!priceRange || priceRange === "Price N/A") return 0
  const match = priceRange.match(/\d+/)
  return match ? parseInt(match[0]) : 0
}

export interface Recommendation {
  id: string
  name: string
  cuisine: string
  priceRange: string
  distance: string
  halal_status?: "confirmed" | "likely" | "unlikely" | "unknown"
  vegetarian_status?: "friendly" | "unfriendly" | "unknown"
  fitScore: number | null
  reasoning: string | null
  dietary_fit?: string
  cravings_match?: string
  conflicts: string[]
  votes?: number
  isAlternative?: boolean
  memberFit?: { name: string; satisfied: boolean; note?: string }[]
}

interface ResultsDisplayProps {
  recommendations: Recommendation[]
  groupName: string
  participantCount: number
  members: { name: string; dietaryRestrictions: string[] }[]
  onBack: () => void
  onStartOver: () => void
  isLoading: boolean
  showVoting?: boolean
  groupId?: string
  serverVotes?: Record<string, number>
}

export function ResultsDisplay({
  recommendations: initialRecommendations,
  groupName,
  participantCount,
  members,
  onBack,
  onStartOver,
  isLoading,
  showVoting = true,
  groupId,
  serverVotes = {},
}: ResultsDisplayProps) {
  const [recommendations, setRecommendations] = useState(initialRecommendations)
  const [votedItems, setVotedItems] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [budgetFilter, setBudgetFilter] = useState([50])
  const [distanceFilter, setDistanceFilter] = useState([5])
  const [showAlternatives, setShowAlternatives] = useState(false)

  useEffect(() => {
    setRecommendations(initialRecommendations)
  }, [initialRecommendations])

  const handleVote = useCallback((id: string) => {
    const isVoted = votedItems.has(id)
    const delta = isVoted ? -1 : 1
    setVotedItems((prev) => {
      const next = new Set(prev)
      isVoted ? next.delete(id) : next.add(id)
      return next
    })
    if (groupId) castVote(groupId, id, delta)
  }, [votedItems, groupId])

  const getVoteCount = (rec: Recommendation) => serverVotes[rec.id] ?? 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4 py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 animate-pulse">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Finding the perfect spot...</h2>
            <p className="text-muted-foreground">Searching restaurants for {groupName}</p>
          </div>
          <div className="max-w-xs mx-auto space-y-2">
            <Progress value={66} className="h-2" />
            <p className="text-xs text-muted-foreground">Matching {participantCount} members&apos; preferences</p>
          </div>
        </div>
      </div>
    )
  }

  const sortedRecommendations = [...recommendations].sort((a, b) => getVoteCount(b) - getVoteCount(a))
  const filteredRecommendations = sortedRecommendations.filter((r) => {
    const dist = parseFloat(r.distance)
    const priceLow = parsePriceLow(r.priceRange)
    return dist <= distanceFilter[0] && priceLow <= budgetFilter[0]
  })
  const topPicks = filteredRecommendations.filter((r) => !r.isAlternative)
  const alternatives = filteredRecommendations.filter((r) => r.isAlternative)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Star className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Top Picks for <span className="text-primary">{groupName}</span></h2>
        <p className="text-muted-foreground">Recommendations based on {participantCount} members&apos; preferences</p>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Group participants</span>
            </div>
            <Badge variant="secondary">{participantCount} members</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => (
              <Badge key={member.name} variant="outline" className="text-xs">
                {member.name}
                {member.dietaryRestrictions.length > 0 && (
                  <span className="ml-1 text-muted-foreground">({member.dietaryRestrictions.join(", ")})</span>
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="w-full justify-between">
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Adjust Filters
          </span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {showFilters && (
          <Card className="bg-muted/20">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Max Budget</Label>
                  <span className="text-muted-foreground">RM{budgetFilter[0]}</span>
                </div>
                <Slider value={budgetFilter} onValueChange={setBudgetFilter} max={150} min={10} step={5} className="py-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Max Distance</Label>
                  <span className="text-muted-foreground">{distanceFilter[0]} km</span>
                </div>
                <Slider value={distanceFilter} onValueChange={setDistanceFilter} max={10} min={1} step={0.5} className="py-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showVoting && Object.keys(serverVotes).length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Group&apos;s Top Choice:</span>
              <Badge className="bg-primary">{sortedRecommendations[0]?.name} ({getVoteCount(sortedRecommendations[0])} votes)</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {topPicks.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">
            No restaurants match your filters. Try widening the budget or distance.
          </p>
        )}
        {topPicks.map((rec, index) => (
          <Card key={rec.id} className={`overflow-hidden transition-all hover:shadow-md ${index === 0 ? "border-primary border-2" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{rec.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">{rec.cuisine}</Badge>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{rec.priceRange}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rec.distance}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-primary">{rec.fitScore ?? "?"}/10</div>
                  <div className="text-xs text-muted-foreground">Match</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {rec.reasoning !== null && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-foreground leading-relaxed">{rec.reasoning}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {rec.dietary_fit && (
                  <Badge variant={rec.dietary_fit === "incompatible" ? "destructive" : rec.dietary_fit === "compatible" ? "default" : "secondary"} className="text-xs">
                    {rec.dietary_fit === "incompatible"
                      ? <AlertTriangle className="w-3 h-3 mr-1" />
                      : rec.dietary_fit === "compatible"
                      ? <Check className="w-3 h-3 mr-1" />
                      : null}
                    Diet: {rec.dietary_fit}
                  </Badge>
                )}
                {rec.cravings_match && (
                  <Badge variant={rec.cravings_match === "no" ? "destructive" : rec.cravings_match === "yes" ? "default" : "secondary"} className="text-xs">
                    {rec.cravings_match === "yes"
                      ? <Check className="w-3 h-3 mr-1" />
                      : rec.cravings_match === "no"
                      ? <AlertTriangle className="w-3 h-3 mr-1" />
                      : null}
                    Craving: {rec.cravings_match}
                  </Badge>
                )}
                {members.map((member) => {
                  if (member.dietaryRestrictions.length === 0) return null
                  const needsHalal = member.dietaryRestrictions.includes("halal")
                  const needsVeg =
                    member.dietaryRestrictions.includes("vegetarian") ||
                    member.dietaryRestrictions.includes("vegan")

                  let state: "satisfied" | "uncertain" | "conflict" = "satisfied"
                  let conflictReason: string | null = null

                  if (needsHalal) {
                    if (rec.halal_status === "unlikely") {
                      state = "conflict"
                      conflictReason = "not halal"
                    } else if (rec.halal_status === "unknown") {
                      state = "uncertain"
                      conflictReason = "halal unverified"
                    }
                  }
                  if (needsVeg && state !== "conflict") {
                    if (rec.vegetarian_status === "unfriendly") {
                      state = "conflict"
                      conflictReason = "no veg options"
                    } else if (rec.vegetarian_status === "unknown") {
                      state = "uncertain"
                      conflictReason = "veg unverified"
                    }
                  }

                  return (
                    <Badge key={member.name} variant={state === "conflict" ? "destructive" : "secondary"} className="text-xs">
                      {state === "conflict"
                        ? <AlertTriangle className="w-3 h-3 mr-1" />
                        : state === "satisfied"
                        ? <Check className="w-3 h-3 mr-1" />
                        : null}
                      {member.name}
                      {conflictReason && <span className="ml-1 opacity-80">({conflictReason})</span>}
                    </Badge>
                  )
                })}
              </div>


              <div className="flex items-center justify-between">
                <Progress value={(rec.fitScore ?? 0) * 10} className="h-2 flex-1 mr-4" />
                {showVoting && (
                  <Button variant={votedItems.has(rec.id) ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => handleVote(rec.id)}>
                    <ThumbsUp className={`w-4 h-4 mr-1 ${votedItems.has(rec.id) ? "fill-current" : ""}`} />
                    Vote ({getVoteCount(rec)})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {alternatives.length > 0 && (
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => setShowAlternatives(!showAlternatives)} className="w-full justify-between text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4" />
              {showAlternatives ? "Hide" : "Show"} Nearby Alternatives ({alternatives.length})
            </span>
            {showAlternatives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          {showAlternatives && (
            <div className="space-y-3">
              {alternatives.map((rec, index) => (
                <Card key={rec.id} className="bg-muted/20 border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">#{topPicks.length + index + 1}</span>
                          <h4 className="font-medium truncate">{rec.name}</h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          <Badge variant="outline" className="text-xs">{rec.cuisine}</Badge>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{rec.priceRange}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rec.distance}</span>
                        </div>
                        {rec.conflicts.length > 0 && (
                          <p className="text-xs text-destructive mt-1">{rec.conflicts.join(", ")}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {rec.fitScore != null && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{rec.fitScore}/10</div>
                            <div className="text-xs text-muted-foreground">Match</div>
                          </div>
                        )}
                        {showVoting && (
                          <Button variant={votedItems.has(rec.id) ? "default" : "outline"} size="sm" onClick={() => handleVote(rec.id)}>
                            <ThumbsUp className={`w-4 h-4 mr-1 ${votedItems.has(rec.id) ? "fill-current" : ""}`} />
                            {getVoteCount(rec)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" size="lg" className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Adjust Preferences
        </Button>
        <Button onClick={onStartOver} variant="outline" size="lg" className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    </div>
  )
}
