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
        <main className="min-h-[calc(100vh-56px)] pb-16 md:pb-0">{children}</main>
        <footer className="hidden md:block border-t border-white/5 text-center py-5 text-gray-700 text-xs">
          © 2024 Sikarwar · Play Responsibly · 18+ Only
        </footer>
      </body>
    </html>
  )
}
