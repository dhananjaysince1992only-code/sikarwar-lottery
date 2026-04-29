import { prisma } from '@/lib/db'
import Link from 'next/link'

export const revalidate = 0

export default async function AdminDashboard() {
  const [pendingUtr, claimedPayouts, users, lotteries] = await Promise.all([
    prisma.ticket.count({ where: { utrStatus: 'PENDING' } }),
    prisma.ticket.count({ where: { isWinner: true, payoutStatus: 'CLAIMED' } }),
    prisma.user.count({ where: { isAdmin: false } }),
    prisma.lottery.findMany({
      include: {
        _count: { select: { tickets: { where: { utrStatus: 'APPROVED' } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const approvedTickets = await prisma.ticket.findMany({
    where: { utrStatus: 'APPROVED' },
    include: { lottery: { select: { ticketPrice: true } } },
  })
  const revenue = approvedTickets.reduce((sum, t) => sum + t.lottery.ticketPrice, 0)

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending UTRs', value: pendingUtr, color: 'text-yellow-400', icon: '🔔', href: '/admin/utr-queue', urgent: pendingUtr > 0 },
          { label: 'Pending Payouts', value: claimedPayouts, color: 'text-red-400', icon: '💰', href: '/admin/payouts', urgent: claimedPayouts > 0 },
          { label: 'Total Users', value: users, color: 'text-purple-400', icon: '👥', href: '/admin/users', urgent: false },
          { label: 'Total Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, color: 'text-green-400', icon: '📈', href: '#', urgent: false },
        ].map(s => (
          <Link key={s.label} href={s.href} className={`card p-4 hover:border-purple-700/50 transition-all ${s.urgent ? 'border-yellow-500/40 animate-pulse-gold' : ''}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-gray-600 text-xs">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Active lotteries */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-white">Lotteries</h2>
        <Link href="/admin/lotteries/create" className="btn-gold px-4 py-2 text-sm rounded-xl">+ Create New</Link>
      </div>

      <div className="space-y-3">
        {lotteries.slice(0, 8).map(lottery => {
          const filled = lottery._count.tickets
          const pct = Math.round((filled / lottery.maxParticipants) * 100)
          return (
            <Link key={lottery.id} href={`/admin/lotteries/${lottery.id}`} className="card p-4 flex items-center gap-4 hover:border-purple-700/50 transition-all block">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold truncate">{lottery.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    lottery.status === 'ACTIVE' ? 'bg-purple-500/20 text-purple-300' :
                    lottery.status === 'SCRATCH_OPEN' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-700 text-gray-500'
                  }`}>{lottery.status}</span>
                </div>
                <div className="text-gray-600 text-xs mt-1">{filled}/{lottery.maxParticipants} · ₹{lottery.ticketPrice}/ticket</div>
              </div>
              <div className="w-24">
                <div className="h-1.5 bg-gray-800 rounded-full">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-gray-600 text-xs text-right mt-0.5">{pct}%</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
