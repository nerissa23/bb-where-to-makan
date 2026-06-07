import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-12 px-6 relative overflow-hidden">
      <img
        src="/avocado.svg"
        alt="" aria-hidden
        className="absolute -top-6 -left-6 w-44 h-44 opacity-75 -rotate-[15deg] pointer-events-none select-none"
      />
      <img
        src="/tomatoes.svg"
        alt="" aria-hidden
        className="absolute -top-2 -right-6 w-36 h-36 opacity-70 rotate-[20deg] pointer-events-none select-none"
      />
      <img
        src="/pancakes.svg"
        alt="" aria-hidden
        className="absolute -bottom-6 -left-8 w-48 h-48 opacity-70 rotate-[10deg] pointer-events-none select-none"
      />
      <img
        src="/bread.svg"
        alt="" aria-hidden
        className="absolute -bottom-4 -right-6 w-44 h-44 opacity-70 -rotate-[20deg] pointer-events-none select-none"
      />

      <img
        src="/banana.svg"
        alt="" aria-hidden
        className="absolute top-1/3 -left-10 w-28 h-28 opacity-55 rotate-[35deg] pointer-events-none select-none"
      />
      <img
        src="/roast.svg"
        alt="" aria-hidden
        className="absolute top-1/2 -right-8 w-32 h-32 opacity-55 -rotate-[25deg] pointer-events-none select-none"
      />

      <div className="relative z-10 w-full mx-auto text-center space-y-8">
        <div className="flex justify-center">
          <Image
            src="/bb-logo.png"
            alt="BB Where to Makan"
            width={150}
            height={150}
            className="object-contain drop-shadow-md"
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
            Where to Makan?
          </h1>
          <p className="text-lg text-muted-foreground">
            Restaurant Recommendations for Big Backs, By Big Backs ♡
          </p>
        </div>

        <Link href="/group/new" className="block max-w-sm mx-auto">
          <Button size="lg" className="w-full text-base rounded-full shadow-md">
            Find somewhere to makan →
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground">
          Powered by AI — group dining decisions made easy
        </p>
      </div>
    </main>
  )
}
