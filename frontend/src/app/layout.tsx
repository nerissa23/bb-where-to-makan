import type { Metadata } from 'next'
import { Playfair_Display, Raleway } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' })
const raleway = Raleway({ subsets: ["latin"], variable: '--font-raleway' })

export const metadata: Metadata = {
  title: 'Where to Makan?',
  description: 'A tasty solution for group dining decisions',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${raleway.variable} bg-background`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
