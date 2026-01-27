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
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
