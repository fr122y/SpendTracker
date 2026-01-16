import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin', 'cyrillic'],
})

export const metadata: Metadata = {
  title: 'SmartSpend Tracker',
  description: 'Personal Finance SPA - Track your expenses intelligently',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} bg-zinc-950 text-zinc-200 antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
