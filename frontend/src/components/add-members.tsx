"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Plus, X, ArrowLeft } from "lucide-react"
import type { GroupData, Member } from "./group-setup"

const dietaryOptions = [
  "Halal",
  "Vegetarian",
  "Vegan",
  "No Pork",
  "No Beef",
  "No Seafood",
  "Gluten-Free",
  "Dairy-Free",
]

interface AddMembersProps {
  groupData: GroupData
  setGroupData: (data: GroupData) => void
  onNext: () => void
  onBack: () => void
}

export function AddMembers({ groupData, setGroupData, onNext, onBack }: AddMembersProps) {
  const addMember = () => {
    const newMember: Member = {
      id: Date.now().toString(),
      name: "",
      budget: "30",
      dietaryRestrictions: [],
    }
    setGroupData({
      ...groupData,
      members: [...groupData.members, newMember],
    })
  }

  const removeMember = (id: string) => {
    setGroupData({
      ...groupData,
      members: groupData.members.filter((m) => m.id !== id),
    })
  }

  const updateMember = (id: string, field: keyof Member, value: string | string[]) => {
    setGroupData({
      ...groupData,
      members: groupData.members.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    })
  }

  const toggleDietary = (memberId: string, restriction: string) => {
    const member = groupData.members.find((m) => m.id === memberId)
    if (!member) return

    const newRestrictions = member.dietaryRestrictions.includes(restriction)
      ? member.dietaryRestrictions.filter((r) => r !== restriction)
      : [...member.dietaryRestrictions, restriction]

    updateMember(memberId, "dietaryRestrictions", newRestrictions)
  }

  const canProceed =
    groupData.members.length > 0 &&
    groupData.members.every((m) => m.name.trim())

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Add Team Members</h2>
        <p className="text-muted-foreground">Add everyone joining for {groupData.name || "this meal"}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Members ({groupData.members.length})</Label>
          <Button variant="outline" size="sm" onClick={addMember} className="h-8">
            <Plus className="w-4 h-4 mr-1" />
            Add Member
          </Button>
        </div>

        {groupData.members.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm">No members yet. Click &quot;Add Member&quot; to get started.</p>
          </div>
        )}

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {groupData.members.map((member, index) => (
            <div key={member.id} className="p-4 border rounded-lg bg-secondary/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Member {index + 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMember(member.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input placeholder="Enter name" value={member.name} onChange={(e) => updateMember(member.id, "name", e.target.value)} className="bg-card h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Budget (RM)</Label>
                  <Input type="number" placeholder="30" value={member.budget} onChange={(e) => updateMember(member.id, "budget", e.target.value)} className="bg-card h-9" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Dietary Restrictions</Label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((option) => (
                    <Badge key={option} variant={member.dietaryRestrictions.includes(option) ? "default" : "outline"} className="cursor-pointer text-xs transition-colors" onClick={() => toggleDietary(member.id, option)}>
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1" size="lg">
          Next: Cravings
        </Button>
      </div>
    </div>
  )
}
