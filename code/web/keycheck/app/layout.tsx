import type React from "react"
import "@/app/globals.css"
import DigitalRain from "@/components/digital-rain"
import { ThemeProvider } from "@/components/theme-provider"
import { config } from "@fortawesome/fontawesome-svg-core"
import { Analytics } from "@vercel/analytics/react"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "@fortawesome/fontawesome-svg-core/styles.css"

const inter = Inter({ subsets: ["latin"] })

// Add this line before the export const metadata to prevent Font Awesome from auto-adding CSS
// which can cause content layout shift
config.autoAddCss = false

export const metadata = {
  title: "Keycheck",
  description:
    "Check if your private key has been compromised on the dark web. A security awareness tool for developers.",
  keywords: ["security", "private key", "SSH", "PKCS#8", "cybersecurity", "key checker", "security tool"],
  authors: [{ name: "Dave", url: "https://cv.dave.io" }],
  creator: "Dave",
  publisher: "Dave",
  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://keycheck.vercel.app",
    title: "Keycheck",
    description:
      "Check if your private key has been compromised on the dark web. A security awareness tool for developers.",
    siteName: "Keycheck",
    images: [
      {
        url: "/main_social_preview_1200x630.png",
        width: 1200,
        height: 630,
        alt: "Keycheck - Security awareness tool"
      }
    ]
  },
  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Keycheck",
    description:
      "Check if your private key has been compromised on the dark web. A security awareness tool for developers.",
    images: ["/twitter_card_1200x600.png"],
    creator: "@dave_io"
  },
  // App-specific metadata
  applicationName: "Keycheck",
  appleWebApp: {
    capable: true,
    title: "Keycheck",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  },
  themeColor: "#0f172a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/app_icon_192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/app_icon_512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/app_icon_192x192.png" }],
    other: [
      {
        rel: "manifest",
        url: "/manifest.json"
      }
    ]
  },
  generator: "v0.dev"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} dark`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          <DigitalRain opacity={0.15} />
          <Suspense>{children}</Suspense>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
