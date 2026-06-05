"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getGroup, addMember } from "@/lib/api"
import { MemberPreferencesForm } from "@/components/member-preferences-form"
import { AppHeader } from "@/components/app-header"
import { FoodDecorations } from "@/components/food-decorations"

export default function JoinPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [groupName, setGroupName] = useState<string | null>(null)
  const [existingMembers, setExistingMembers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getGroup(id)
      .then((g) => {
        if (g.status !== "open") {
          router.push(`/group/${id}/results`)
          return
        }
        setGroupName(g.group_name)
        setExistingMembers(g.members.map((m) => m.name))
      })
      .catch(() => setError("Could not load group."))
      .finally(() => setIsLoading(false))
  }, [id, router])

  const handleJoin = async (data: { name: string; dietary: string[]; budget_rm: number }) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await addMember(id, data)
      router.push(`/group/${id}/waiting`)
    } catch (err) {
      setError("Failed to join group. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (error && !groupName) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <p className="text-destructive text-sm">{error}</p>
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
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-1">
              <p className="text-muted-foreground text-sm">You&apos;ve been invited to join</p>
              <h2 className="text-2xl font-bold text-foreground">{groupName}</h2>
              {existingMembers.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Members so far: {existingMembers.join(", ")}
                </p>
              )}
            </div>

            <hr className="border-border" />

            <MemberPreferencesForm
              submitLabel="Join the group →"
              onSubmit={handleJoin}
              isLoading={isSubmitting}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
