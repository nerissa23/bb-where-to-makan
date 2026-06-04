import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UtensilsCrossed } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="max-w-lg w-full mx-auto space-y-6">
        <Card className="shadow-lg">
          <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <UtensilsCrossed className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">BB — Where to Makan</h1>
              <p className="text-muted-foreground">A tasty solution for big backs.</p>
            </div>
            <Link href="/group/new" className="w-full">
              <Button size="lg" className="w-full text-base">
                Find somewhere to makan →
              </Button>
            </Link>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          Powered by AI — group dining decisions made easy
        </p>
      </div>
    </main>
  )
}
