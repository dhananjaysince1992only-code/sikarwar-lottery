'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<{ name: string; isAdmin: boolean; balance?: number } | null | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => setUser(d.user ?? null))
  }, [pathname])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-purple-900/40 bg-casino-900/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎰</span>
          <span className="font-black text-xl bg-gold-shimmer bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
            Sikarwar Lottery
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-5">
          <Link href="/" className="text-gray-400 hover:text-gold-400 text-sm font-medium transition-colors">Lottery</Link>
          <Link href="/crash" className="text-gray-400 hover:text-orange-400 text-sm font-medium transition-colors">🚀 Crash</Link>
          <Link href="/dice" className="text-gray-400 hover:text-blue-400 text-sm font-medium transition-colors">🎲 Dice</Link>
          <Link href="/color-game" className="text-gray-400 hover:text-violet-400 text-sm font-medium transition-colors">🎨 Colors</Link>
          <Link href="/predictions" className="text-gray-400 hover:text-gold-400 text-sm font-medium transition-colors">Predict</Link>
          <Link href="/leaderboard" className="text-gray-400 hover:text-gold-400 text-sm font-medium transition-colors">🏆</Link>
          {user?.isAdmin && <Link href="/admin" className="text-purple-400 hover:text-purple-300 text-sm font-bold transition-colors">Admin</Link>}

          {user === undefined ? (
            <div className="w-16 h-4 bg-gray-800 rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link href="/wallet" className="flex items-center gap-1.5 bg-casino-800 border border-yellow-700/30 hover:border-yellow-500/50 px-3 py-1.5 rounded-lg transition-colors">
                <span className="text-gold-400 font-black text-sm">₹{(user.balance ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                <span className="text-gray-600 text-xs">+</span>
              </Link>
              <span className="text-gray-500 text-sm">{user.name.split(' ')[0]}</span>
              <button onClick={logout} className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5">Login</Link>
              <Link href="/register" className="btn-gold text-sm px-4 py-1.5 rounded-lg">Register</Link>
            </div>
          )}
        </div>

        <button className="md:hidden text-gray-400" onClick={() => setOpen(!open)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-purple-900/40 bg-casino-900 px-4 py-4 flex flex-col gap-4">
          {user && (
            <Link href="/wallet" onClick={() => setOpen(false)} className="flex items-center justify-between bg-casino-800 border border-yellow-700/30 px-4 py-3 rounded-xl">
              <span className="text-gray-400 text-sm">Balance</span>
              <span className="text-gold-400 font-black">₹{(user.balance ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </Link>
          )}
          <Link href="/" onClick={() => setOpen(false)} className="text-gray-300">🎰 Lottery</Link>
          <Link href="/crash" onClick={() => setOpen(false)} className="text-orange-400 font-medium">🚀 Crash</Link>
          <Link href="/dice" onClick={() => setOpen(false)} className="text-blue-400 font-medium">🎲 Dice</Link>
          <Link href="/color-game" onClick={() => setOpen(false)} className="text-violet-400 font-medium">🎨 Colors</Link>
          <Link href="/predictions" onClick={() => setOpen(false)} className="text-gray-300">🔮 Predict</Link>
          <Link href="/leaderboard" onClick={() => setOpen(false)} className="text-gray-300">🏆 Leaderboard</Link>
          {user && <Link href="/tickets" onClick={() => setOpen(false)} className="text-gray-300">🎫 My Tickets</Link>}
          {user?.isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className="text-purple-400 font-bold">⚙️ Admin Panel</Link>}
          {user ? (
            <button onClick={() => { logout(); setOpen(false) }} className="text-red-400 text-left font-medium">Logout</button>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="text-gray-300">Login</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="text-gold-400 font-bold">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
