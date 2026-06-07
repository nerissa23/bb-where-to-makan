"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { CravingInput, type CravingData } from "@/components/craving-input"
import { getRecommendations } from "@/lib/api"
import { AppHeader } from "@/components/app-header"
import { FoodDecorations } from "@/components/food-decorations"

export default function CravingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [cravingData, setCravingData] = useState<CravingData>({
    freeText: "",
    cuisineMood: [],
    location: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await getRecommendations(id, {
        craving: cravingData.freeText,
        cuisine_mood: cravingData.cuisineMood,
        meal_time: "lunch",
        location: cravingData.location,
        radius_metres: 8000,
      })
      router.push(`/group/${id}/results`)
    } catch (err) {
      setError("Failed to get recommendations. Please try again.")
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push(`/group/${id}/lobby`)
  }

  if (isLoading) {
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
            <CravingInput
              cravingData={cravingData}
              setCravingData={setCravingData}
              onNext={handleNext}
              onBack={handleBack}
            />
            {error && <p className="text-sm text-destructive mt-4">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
