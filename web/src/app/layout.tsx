import '../styles/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vex - Discord Moderation Bot Dashboard',
  description: 'Configure and manage your Vex moderation bot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
