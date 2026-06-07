"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Users } from "lucide-react"
import { createGroup } from "@/lib/api"
import { AppHeader } from "@/components/app-header"

export default function NewGroupPage() {
  const router = useRouter()
  const [groupName, setGroupName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!groupName.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const { group_id } = await createGroup(groupName.trim())
      router.push(`/group/${group_id}/lobby`)
    } catch (err) {
      setError("Failed to create group. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-8 px-4 relative overflow-hidden">
      <img src="/avocado.svg" alt="" aria-hidden className="absolute -top-6 -left-6 w-44 h-44 opacity-75 -rotate-[15deg] pointer-events-none select-none" />
      <img src="/tomatoes.svg" alt="" aria-hidden className="absolute -top-2 -right-6 w-36 h-36 opacity-70 rotate-[20deg] pointer-events-none select-none" />
      <img src="/pancakes.svg" alt="" aria-hidden className="absolute -bottom-6 -left-8 w-48 h-48 opacity-70 rotate-[10deg] pointer-events-none select-none" />
      <img src="/bread.svg" alt="" aria-hidden className="absolute -bottom-4 -right-6 w-44 h-44 opacity-70 -rotate-[20deg] pointer-events-none select-none" />
      <img src="/banana.svg" alt="" aria-hidden className="absolute top-1/3 -left-10 w-28 h-28 opacity-55 rotate-[35deg] pointer-events-none select-none" />
      <img src="/roast.svg" alt="" aria-hidden className="absolute top-1/2 -right-8 w-32 h-32 opacity-55 -rotate-[25deg] pointer-events-none select-none" />

      <div className="max-w-lg w-full mx-auto space-y-6 relative">
        <div className="text-center space-y-2">
          <AppHeader />
          <p className="text-muted-foreground">Find the perfect restaurant for your group</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Create a group</h2>
              <p className="text-muted-foreground text-sm">What are you calling this group?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                placeholder="e.g. Friday Lunch Crew"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="bg-card"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={!groupName.trim() || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create group →"
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Powered by AI — group dining decisions made easy
        </p>
      </div>
    </main>
  )
}
