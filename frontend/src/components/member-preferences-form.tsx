"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export const DIETARY_OPTIONS = [
  "Halal",
  "Vegetarian",
  "Vegan",
  "No Pork",
  "No Beef",
  "No Seafood",
  "Gluten-Free",
  "Dairy-Free",
]

export const DIETARY_MAP: Record<string, string> = {
  Halal: "halal",
  Vegetarian: "vegetarian",
  Vegan: "vegan",
  "No Pork": "no_pork",
  "No Beef": "no_beef",
  "No Seafood": "no_seafood",
  "Gluten-Free": "gluten_free",
  "Dairy-Free": "dairy_free",
}

export interface MemberFormData {
  name: string
  dietary: string[]
  budget_rm: number
}

interface MemberPreferencesFormProps {
  submitLabel: string
  onSubmit: (data: MemberFormData) => Promise<void>
  isLoading?: boolean
}

export function MemberPreferencesForm({
  submitLabel,
  onSubmit,
  isLoading = false,
}: MemberPreferencesFormProps) {
  const [name, setName] = useState("")
  const [dietary, setDietary] = useState<string[]>([])
  const [budget, setBudget] = useState(25)

  const toggleDietary = (option: string) => {
    setDietary((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    )
  }

  const handleSubmit = async () => {
    await onSubmit({
      name: name.trim(),
      dietary: dietary.map((d) => DIETARY_MAP[d]).filter(Boolean),
      budget_rm: budget,
    })
  }

  const canSubmit = name.trim().length > 0 && !isLoading

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="member-name">Your name</Label>
        <Input
          id="member-name"
          placeholder="e.g. Aiman"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-card"
        />
      </div>

      <div className="space-y-2">
        <Label>Dietary restrictions</Label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((option) => (
            <Badge
              key={option}
              variant={dietary.includes(option) ? "default" : "outline"}
              className="cursor-pointer text-xs transition-colors"
              onClick={() => toggleDietary(option)}
            >
              {option}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Budget per pax</Label>
          <span className="text-sm font-medium text-primary">RM {budget}</span>
        </div>
        <input
          type="range"
          min={5}
          max={150}
          step={5}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>RM 5</span>
          <span>RM 150</span>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full" size="lg">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  )
}
