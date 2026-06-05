import Link from "next/link"
import Image from "next/image"

export function AppHeader() {
  return (
    <div className="flex justify-center">
      <Link href="/" aria-label="Go to home page" className="inline-flex hover:opacity-80 transition-opacity">
        <Image src="/bb-logo.png" alt="BB Where to Makan" width={72} height={72} className="object-contain drop-shadow-sm" />
      </Link>
    </div>
  )
}
