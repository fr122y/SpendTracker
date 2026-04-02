import { Inter, JetBrains_Mono } from 'next/font/google'

import { Providers } from '@/providers'

import type { Metadata } from 'next'

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
  title: 'SpendTracker',
  description:
    'Track expenses, organize budgets, and monitor spending in one place.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
