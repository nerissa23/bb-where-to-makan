"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Utensils, MapPin, ArrowLeft, Sparkles } from "lucide-react"

export interface CravingData {
  freeText: string
  cuisineMood: string[]
  location: string
}

const cuisineOptions = [
  "Malaysian",
  "Chinese",
  "Japanese",
  "Korean",
  "Thai",
  "Indian",
  "Western",
  "Middle Eastern",
  "Fusion",
]

const cravingSuggestions = [
  "Something warm and comforting",
  "Light and healthy",
  "Spicy and flavorful",
  "Sweet dessert spot",
  "Quick casual bite",
]

interface CravingInputProps {
  cravingData: CravingData
  setCravingData: (data: CravingData) => void
  onNext: () => void
  onBack: () => void
}

export function CravingInput({
  cravingData,
  setCravingData,
  onNext,
  onBack,
}: CravingInputProps) {
  const toggleCuisine = (cuisine: string) => {
    const newCuisines = cravingData.cuisineMood.includes(cuisine)
      ? cravingData.cuisineMood.filter((c) => c !== cuisine)
      : [...cravingData.cuisineMood, cuisine]
    setCravingData({ ...cravingData, cuisineMood: newCuisines })
  }

  const applySuggestion = (suggestion: string) => {
    setCravingData({ ...cravingData, freeText: suggestion })
  }

  const surpriseMe = () => {
    const surpriseCuisines = cuisineOptions.filter(
      (c) => !cravingData.cuisineMood.includes(c)
    )
    const randomCuisine =
      surpriseCuisines[Math.floor(Math.random() * surpriseCuisines.length)]
    const surpriseMoods = [
      "Something adventurous and new",
      "Chef's recommendation vibes",
      "Hidden gem discovery",
      "Popular trending spot",
    ]
    const randomMood = surpriseMoods[Math.floor(Math.random() * surpriseMoods.length)]
    setCravingData({
      ...cravingData,
      freeText: randomMood,
      cuisineMood: [randomCuisine],
    })
  }

  const canProceed = cravingData.location.trim()

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Utensils className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">What are you craving?</h2>
        <p className="text-muted-foreground">Tell us what sounds good to your group</p>
      </div>

      <Button variant="outline" onClick={surpriseMe} className="w-full border-dashed border-primary/50 hover:bg-primary/5">
        <Sparkles className="w-4 h-4 mr-2 text-primary" />
        Surprise Me - Try something new!
      </Button>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="craving" className="text-sm font-medium">Describe your craving</Label>
          <Textarea
            id="craving"
            placeholder="e.g., Something spicy and salty, good for sharing..."
            value={cravingData.freeText}
            onChange={(e) => setCravingData({ ...cravingData, freeText: e.target.value })}
            className="bg-card min-h-[80px] resize-none"
          />
          <div className="flex flex-wrap gap-2">
            {cravingSuggestions.map((suggestion) => (
              <Badge key={suggestion} variant="secondary" className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => applySuggestion(suggestion)}>
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Cuisine mood (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {cuisineOptions.map((cuisine) => (
              <Badge key={cuisine} variant={
                cravingData.cuisineMood.includes(cuisine) ? "default" : "outline"
              } className="cursor-pointer transition-colors" onClick={() => toggleCuisine(cuisine)}>
                {cuisine}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location / Area
          </Label>
          <Input id="location" placeholder="e.g., Bangsar, KL or near Pavilion" value={cravingData.location} onChange={(e) => setCravingData({ ...cravingData, location: e.target.value })} className="bg-card" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1">Find Restaurants</Button>
      </div>
    </div>
  )
}
