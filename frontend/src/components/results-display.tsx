"use client"

import { useState } from "react"
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

export interface Recommendation {
  id: string
  name: string
  cuisine: string
  priceRange: string
  distance: string
  fitScore: number
  reasoning: string
  conflicts: string[]
  votes?: number
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
}: ResultsDisplayProps) {
  const [recommendations, setRecommendations] = useState(initialRecommendations)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [votedItems, setVotedItems] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [budgetFilter, setBudgetFilter] = useState([50])
  const [distanceFilter, setDistanceFilter] = useState([5])
  const [showAlternatives, setShowAlternatives] = useState(false)

  const handleVote = (id: string) => {
    if (votedItems.has(id)) {
      setVotedItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      setVotes((prev) => ({ ...prev, [id]: (prev[id] || 1) - 1 }))
    } else {
      setVotedItems((prev) => new Set(prev).add(id))
      setVotes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
    }
  }

  const getVoteCount = (rec: Recommendation) => {
    return (rec.votes || 0) + (votes[rec.id] || 0)
  }

  const alternativeRestaurants: Recommendation[] = [
    {
      id: "alt-1",
      name: "Village Park Restaurant",
      cuisine: "Malaysian",
      priceRange: "RM12-20",
      distance: "3.5 km",
      fitScore: 7,
      reasoning:
        "Famous for nasi lemak. Slightly further but worth the drive for authentic flavors. Halal-certified.",
      conflicts: ["Further from your location"],
    },
    {
      id: "alt-2",
      name: "Baba Low's",
      cuisine: "Chinese-Malaysian",
      priceRange: "RM20-35",
      distance: "4.2 km",
      fitScore: 6,
      reasoning:
        "Great Nyonya cuisine option if you expand your search radius. Good for sharing dishes.",
      conflicts: ["Outside initial search area", "May not suit all dietary needs"],
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4 py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 animate-pulse">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Finding the perfect spot...</h2>
            <p className="text-muted-foreground">Our AI is analyzing restaurants for {groupName}</p>
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

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Star className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Top Picks for {groupName}</h2>
        <p className="text-muted-foreground">AI-powered recommendations based on {participantCount} members&apos; preferences</p>
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
              <Button size="sm" className="w-full">Apply Filters</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {showVoting && Object.keys(votes).length > 0 && (
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
        {sortedRecommendations.map((rec, index) => (
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
                  <div className="text-2xl font-bold text-primary">{rec.fitScore}</div>
                  <div className="text-xs text-muted-foreground">Fit Score</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-foreground leading-relaxed">{rec.reasoning}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {members.map((member) => {
                  const hasDietaryConflict = rec.conflicts.some((c) => c.toLowerCase().includes(member.name.toLowerCase())) || (member.dietaryRestrictions.includes("Vegetarian") && !rec.reasoning.toLowerCase().includes("vegetarian"))
                  return (
                    <Badge key={member.name} variant={hasDietaryConflict ? "destructive" : "secondary"} className="text-xs">
                      {hasDietaryConflict ? <AlertTriangle className="w-3 h-3 mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                      {member.name}
                    </Badge>
                  )
                })}
              </div>

              {rec.conflicts.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-medium text-destructive">Constraint conflicts: </span>
                    <span className="text-muted-foreground">{rec.conflicts.join(", ")}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Progress value={rec.fitScore * 10} className="h-2 flex-1 mr-4" />
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

      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => setShowAlternatives(!showAlternatives)} className="w-full justify-between text-muted-foreground hover:text-foreground">
          <span className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            {showAlternatives ? "Hide" : "Show"} Nearby Alternatives
          </span>
          {showAlternatives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {showAlternatives && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Expanded radius options if top picks don&apos;t work out
            </p>
            {alternativeRestaurants.map((rec) => (
              <Card key={rec.id} className="bg-muted/20 border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-medium">{rec.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {rec.cuisine}
                        </Badge>
                        <span>{rec.priceRange}</span>
                        <span>{rec.distance}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {rec.reasoning}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-muted-foreground">
                        {rec.fitScore}
                      </div>
                      <div className="text-xs text-muted-foreground">Fit</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
