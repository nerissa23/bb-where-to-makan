"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { GroupSetup, type GroupData, type Member } from "@/components/group-setup"
import { AddMembers } from "@/components/add-members"
import { CravingInput, type CravingData } from "@/components/craving-input"
import { ResultsDisplay, type Recommendation } from "@/components/results-display"
import { StepIndicator } from "@/components/step-indicator"

const steps = ["Group", "Members", "Cravings", "Results"]

const mockRecommendations: Recommendation[] = [
  {
    id: "1",
    name: "Restoran Nasi Kandar Pelita",
    cuisine: "Malaysian",
    priceRange: "RM15-25",
    distance: "0.8 km",
    fitScore: 9,
    reasoning:
      "Perfect match for your group! This halal-certified restaurant fits within everyone's budget. The casual atmosphere suits a group gathering and they have extensive options to satisfy different tastes.",
    conflicts: [],
    votes: 2,
  },
  {
    id: "2",
    name: "Rakuzen Japanese Restaurant",
    cuisine: "Japanese",
    priceRange: "RM25-45",
    distance: "1.2 km",
    fitScore: 8,
    reasoning:
      "Great option for Japanese cuisine lovers. They have a dedicated halal menu section and vegetarian options available with tofu and vegetable sets.",
    conflicts: ["Some items at upper budget limit"],
    votes: 1,
  },
  {
    id: "3",
    name: "Murni Discovery SS2",
    cuisine: "Fusion",
    priceRange: "RM18-35",
    distance: "2.1 km",
    fitScore: 7,
    reasoning:
      "A solid backup with extensive menu variety covering Malaysian, Western, and Thai cuisines. Halal-certified with many vegetarian options. Known for generous portions.",
    conflicts: ["Slightly further from meeting point", "Can be crowded on Fridays"],
  },
]

export default function WhereToMakan() {
  const [currentStep, setCurrentStep] = useState(1)
  const [groupData, setGroupData] = useState<GroupData>({
    name: "",
    members: [],
  })
  const [cravingData, setCravingData] = useState<CravingData>({
    freeText: "",
    cuisineMood: [],
    location: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

  const handleGroupNext = () => {
    setCurrentStep(2)
  }

  const handleMembersNext = () => {
    setCurrentStep(3)
  }

  const handleCravingNext = () => {
    setIsLoading(true)
    setCurrentStep(4)
    // Simulate API call
    setTimeout(() => {
      setRecommendations(mockRecommendations)
      setIsLoading(false)
    }, 2500)
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handleStartOver = () => {
    setCurrentStep(1)
    setGroupData({
      name: "",
      members: [],
    })
    setCravingData({
      freeText: "",
      cuisineMood: [],
      location: "",
    })
    setRecommendations([])
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Where to Makan?
          </h1>
          <p className="text-muted-foreground">
            Find the perfect restaurant for your group
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* Main Content Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            {currentStep === 1 && (
              <GroupSetup
                groupData={groupData}
                setGroupData={setGroupData}
                onNext={handleGroupNext}
              />
            )}

            {currentStep === 2 && (
              <AddMembers
                groupData={groupData}
                setGroupData={setGroupData}
                onNext={handleMembersNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 3 && (
              <CravingInput
                cravingData={cravingData}
                setCravingData={setCravingData}
                onNext={handleCravingNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 4 && (
              <ResultsDisplay
                recommendations={recommendations}
                groupName={groupData.name || "your group"}
                participantCount={groupData.members.length}
                members={groupData.members.map((m) => ({
                  name: m.name,
                  dietaryRestrictions: m.dietaryRestrictions,
                }))}
                onBack={handleBack}
                onStartOver={handleStartOver}
                isLoading={isLoading}
                showVoting={true}
              />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">Powered by AI - Group dining decisions made easy</p>
      </div>
    </main>
  )
}
