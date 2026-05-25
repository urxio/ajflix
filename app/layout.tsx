import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'ajflix',
  description: 'Watch and discover movies',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white min-h-screen">
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  )
}
