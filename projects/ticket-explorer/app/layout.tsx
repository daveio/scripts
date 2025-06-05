import type React from 'react'
import './globals.css'
import './synthwave.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata, Viewport } from 'next'
import { Inter, Orbitron } from 'next/font/google'

// Optimize font loading by specifying only the weights and subsets we need
const inter = Inter({
  subsets: ['latin'],
  display: 'swap' // Use 'swap' to prevent FOIT (Flash of Invisible Text)
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '700'] // Only preload the weights we actually use
})

// Define viewport export for viewport and themeColor properties
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000'
}

export const metadata: Metadata = {
  title: 'Linear Ticket Explorer',
  description: 'Explore and analyze Linear tickets',
  metadataBase: new URL('https://ticket-explorer.vercel.app'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black'
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  openGraph: {
    title: 'Linear Ticket Explorer',
    description: 'Explore and analyze Linear tickets',
    type: 'website',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Linear Ticket Explorer Logo'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linear Ticket Explorer',
    description: 'Explore and analyze Linear tickets',
    images: ['/android-chrome-512x512.png'],
    creator: '@syn'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${orbitron.variable}`}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="ticket-explorer-theme">
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
