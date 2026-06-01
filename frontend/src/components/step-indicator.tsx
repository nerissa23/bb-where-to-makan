"use client"

import { Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  steps: string[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${isCompleted ? "bg-primary text-primary-foreground" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
              </div>
              <span className={`text-xs mt-1 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 mb-5 ${isCompleted ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
