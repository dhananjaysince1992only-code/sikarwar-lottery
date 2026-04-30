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

  const navLinks = [
    { href: '/', label: 'Lottery', icon: '🎰' },
    { href: '/predictions', label: 'Predict', icon: '🔮' },
  ]

  return (
    <>
      {/* Top navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-casino-900/98 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-sm font-black text-black">S</div>
            <span className="font-black text-base text-white hidden sm:block">Sikarwar</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${pathname === l.href ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                {l.label}
              </Link>
            ))}
            <Link href="/leaderboard" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${pathname === '/leaderboard' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              Leaderboard
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user === undefined ? (
              <div className="w-20 h-8 bg-white/5 rounded-lg animate-pulse" />
            ) : user ? (
              <>
                {user.isAdmin && (
                  <Link href="/admin" className="hidden md:flex text-xs bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-500/30 transition-colors">
                    Admin
                  </Link>
                )}
                <Link href="/wallet" className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-yellow-500/40 px-3 py-1.5 rounded-lg transition-all group">
                  <span className="text-xs text-gray-500 group-hover:text-gray-400">₹</span>
                  <span className="text-gold-400 font-black text-sm">{(user.balance ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  <span className="text-green-500 text-xs font-black leading-none">+</span>
                </Link>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-medium">{user.name.split(' ')[0]}</span>
                  <button onClick={logout} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 hidden sm:block">
                  Login
                </Link>
                <Link href="/register" className="btn-gold text-sm px-4 py-2 rounded-lg font-black">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button className="md:hidden text-gray-400 hover:text-white p-1" onClick={() => setOpen(!open)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden border-t border-white/5 bg-casino-900 px-4 py-3 flex flex-col gap-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${pathname === l.href ? 'bg-white/10 text-white' : 'text-gray-400'}`}>
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
            <Link href="/leaderboard" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-400">
              <span>🏆</span>Leaderboard
            </Link>
            {user && (
              <Link href="/tickets" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-400">
                <span>🎫</span>My Tickets
              </Link>
            )}
            {user?.isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-purple-400">
                <span>⚙️</span>Admin Panel
              </Link>
            )}
            {user ? (
              <button onClick={() => { logout(); setOpen(false) }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 text-left mt-1 border-t border-white/5 pt-3">
                Sign out
              </button>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-400">
                Login
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-casino-900/98 backdrop-blur-md border-t border-white/5">
        <div className="grid grid-cols-4 h-16">
          {[
            { href: '/', icon: '🎰', label: 'Lottery' },
            { href: '/predictions', icon: '🔮', label: 'Predict' },
            { href: '/wallet', icon: '💳', label: 'Wallet' },
            { href: user ? '/tickets' : '/login', icon: user ? '🎫' : '👤', label: user ? 'Tickets' : 'Account' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                pathname === item.href ? 'text-white' : 'text-gray-600 hover:text-gray-300'
              }`}>
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={`text-[10px] font-semibold ${pathname === item.href ? 'text-gold-400' : ''}`}>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
