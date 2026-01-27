import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Poppins, Playfair_Display, Caveat, Inter } from 'next/font/google'


// export const poppins = Poppins({
//   subsets: ['latin'],
//   weight: ['400', '500', '600'],
//   variable: '--font-poppins',
// })

// export const playfair = Playfair_Display({
//   subsets: ['latin'],
//   variable: '--font-playfair',
// })

// export const caveat = Caveat({
//   subsets: ['latin'],
//   variable: '--font-caveat',
// })

const _inter = Inter({ subsets: ["latin"] });
const _caveat = Caveat({ subsets: ["latin"], variable: '--font-handwriting' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f7f3ed',
}

export const metadata: Metadata = {
  title: 'Beautiful Notes - Aesthetic Note Taking',
  description: 'Beautiful note-taking app with aesthetic templates and handwriting fonts',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Beautiful Notes',
  },
  icons: {
    icon: [
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${_caveat.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
