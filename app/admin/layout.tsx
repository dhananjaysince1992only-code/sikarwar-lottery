import Link from 'next/link'

const links = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/lotteries', label: 'Lotteries', icon: '🎰' },
  { href: '/admin/predictions', label: 'Predictions', icon: '🔮' },
  { href: '/admin/utr-queue', label: 'UTR Queue', icon: '🔔' },
  { href: '/admin/deposits', label: 'Deposits', icon: '💳' },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: '💸' },
  { href: '/admin/payouts', label: 'Payouts', icon: '💰' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-casino-900 border-r border-purple-900/30 p-4 hidden md:block">
        <div className="text-xs text-gray-700 uppercase tracking-widest font-bold mb-4 px-2">Admin Panel</div>
        <nav className="space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="admin-link">
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-6 pt-6 border-t border-purple-900/30">
          <Link href="/" className="admin-link text-gray-600 text-xs">
            <span>←</span><span>Back to Site</span>
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden w-full bg-casino-900 border-b border-purple-900/30 px-4 py-2 flex gap-3 overflow-x-auto shrink-0 fixed top-16 z-40">
        {links.map(l => (
          <Link key={l.href} href={l.href} className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 py-1">
            {l.icon} {l.label}
          </Link>
        ))}
      </div>

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
