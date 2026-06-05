"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link2, Copy, Check, Users, Loader2 } from "lucide-react"
import { getGroup, addMember, type GroupState } from "@/lib/api"
import { MemberPreferencesForm } from "@/components/member-preferences-form"

export default function LobbyPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [group, setGroup] = useState<GroupState | null>(null)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/group/${id}/join` : ""

  const fetchGroup = useCallback(async () => {
    try {
      const data = await getGroup(id)
      setGroup(data)
    } catch {
      setError("Could not load group.")
    }
  }, [id])

  useEffect(() => {
    fetchGroup()
    const interval = setInterval(fetchGroup, 5000)
    return () => clearInterval(interval)
  }, [fetchGroup])

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSavePrefs = async (data: { name: string; dietary: string[]; budget_rm: number }) => {
    setIsSaving(true)
    setError(null)
    try {
      await addMember(id, data)
      setPrefsSaved(true)
      fetchGroup()
    } catch (err) {
      setError("Failed to save preferences. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleStart = () => {
    router.push(`/group/${id}/craving`)
  }

  if (!group) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Where to Makan?</h1>
          <p className="text-muted-foreground">Find the perfect restaurant for your group</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-6">
            {/* Group name */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">{group.group_name}</h2>
            </div>

            {/* Invite link */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Link2 className="w-4 h-4" />
                Invite your group
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-secondary/40 rounded-md px-3 py-2 text-sm text-muted-foreground truncate border">
                  {inviteLink}
                </div>
                <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <hr className="border-border" />

            {/* Organiser preferences */}
            {!prefsSaved ? (
              <div className="space-y-4">
                <p className="text-sm font-medium">Your preferences (organiser)</p>
                <MemberPreferencesForm
                  submitLabel="Save my preferences"
                  onSubmit={handleSavePrefs}
                  isLoading={isSaving}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                Preferences saved
              </div>
            )}

            <hr className="border-border" />

            {/* Members list */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="w-4 h-4" />
                Members joined ({group.members.length})
              </div>
              {group.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet — share the link above.</p>
              ) : (
                <div className="space-y-2">
                  {group.members.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground">—</span>
                      {m.dietary.length > 0 ? (
                        m.dietary.map((d) => (
                          <Badge key={d} variant="secondary" className="text-xs capitalize">
                            {d.replace(/_/g, " ")}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">No restrictions</span>
                      )}
                      <span className="ml-auto text-muted-foreground text-xs">RM{m.budget_rm}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-border" />

            {/* Start button */}
            <div className="space-y-1">
              <Button
                onClick={handleStart}
                disabled={!prefsSaved || group.members.length === 0}
                className="w-full"
                size="lg"
              >
                Find somewhere to makan →
              </Button>
              <p className="text-center text-xs text-muted-foreground">only you can start this</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
