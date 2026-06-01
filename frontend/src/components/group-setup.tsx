"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Link2, Copy, Check } from "lucide-react"

export interface Member {
  id: string
  name: string
  budget: string
  dietaryRestrictions: string[]
}

export interface GroupData {
  name: string
  members: Member[]
}

interface GroupSetupProps {
  groupData: GroupData
  setGroupData: (data: GroupData) => void
  onNext: () => void
}

export function GroupSetup({ groupData, setGroupData, onNext }: GroupSetupProps) {
  const [copied, setCopied] = useState(false)
  const [shareCode] = useState(
    "WTM-" + Math.random().toString(36).substring(2, 8).toUpperCase()
  )
  const shareLink = `https://wheretomakan.app/join/${shareCode}`

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canProceed = groupData.name.trim().length > 0

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Create Your Group</h2>
        <p className="text-muted-foreground">Name your group and share the invite link</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="groupName" className="text-sm font-medium">
            Group Name
          </Label>
          <Input
            id="groupName"
            placeholder="e.g., Friday Lunch Crew"
            value={groupData.name}
            onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
            className="bg-card"
          />
        </div>

        {groupData.name.trim() && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Invitation Link</Label>
            </div>
            <p className="text-xs text-muted-foreground">Share this link to let others join and add their preferences</p>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="bg-card text-xs h-9" />
              <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 h-9">
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Button onClick={onNext} disabled={!canProceed} className="w-full" size="lg">
        Next: Add Team Members
      </Button>
    </div>
  )
}
