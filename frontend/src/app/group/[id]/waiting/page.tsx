"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getGroup, type GroupState } from "@/lib/api"

export default function WaitingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [group, setGroup] = useState<GroupState | null>(null)

  const poll = useCallback(async () => {
    try {
      const data = await getGroup(id)
      setGroup(data)
      if (data.status === "locked" || data.status === "done") {
        router.push(`/group/${id}/results`)
      }
    } catch {
      // silent — keep polling
    }
  }, [id, router])

  useEffect(() => {
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [poll])

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Where to Makan?</h1>
          <p className="text-muted-foreground">Find the perfect restaurant for your group</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-2xl font-bold text-foreground">You&apos;re in!</p>
              {group && (
                <p className="text-lg font-medium text-muted-foreground">{group.group_name}</p>
              )}
            </div>

            {group && group.members.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {group.members.map((m) => m.name).join(", ")}
              </p>
            )}

            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Waiting for the organiser to find somewhere to makan...
              </p>
              <p className="text-xs text-muted-foreground">(this page will update automatically)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
