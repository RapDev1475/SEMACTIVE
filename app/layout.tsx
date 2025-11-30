import type { Metadata } from "next"
import { Manrope, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SEMACTIVE - Gestion d'Inventaire",
  description: "Application de gestion d'inventaire avec traçabilité complète - Scanner de codes-barres, suivi des mouvements, gestion des stocks",
  keywords: "inventaire, gestion de stock, traçabilité, codes-barres, QR code",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${manrope.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}