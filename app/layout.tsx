import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Sikarwar Lottery — Your Luck Starts Here',
  description: 'India\'s most exciting online lottery. Scratch, win, and celebrate!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
        <footer className="border-t border-purple-900/30 text-center py-6 text-gray-700 text-xs">
          © 2024 Sikarwar Lottery · Play Responsibly · 18+ Only
        </footer>
      </body>
    </html>
  )
}
