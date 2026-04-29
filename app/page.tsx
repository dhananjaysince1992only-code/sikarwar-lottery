import { prisma } from '@/lib/db'
import LotteryCard from '@/components/LotteryCard'
import LiveFeed from '@/components/LiveFeed'
import Link from 'next/link'

export const revalidate = 10

async function getData() {
  const [lotteries, settings] = await Promise.all([
    prisma.lottery.findMany({
      where: { status: { in: ['ACTIVE', 'SCRATCH_OPEN'] } },
      include: {
        prizeTiers: { orderBy: { rank: 'asc' } },
        _count: { select: { tickets: { where: { utrStatus: 'APPROVED' } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.siteSetting.findMany(),
  ])
  const settingsMap: Record<string, string> = {}
  for (const s of settings) settingsMap[s.key] = s.value
  return { lotteries, settings: settingsMap }
}

async function getRecentWinners() {
  return prisma.ticket.findMany({
    where: { isWinner: true, scratchedAt: { not: null } },
    include: { user: { select: { name: true } }, lottery: { select: { name: true } } },
    orderBy: { scratchedAt: 'desc' },
    take: 10,
  })
}

export default async function HomePage() {
  const { lotteries, settings } = await getData()
  const recentWinners = await getRecentWinners()

  const announcement = settings['announcement'] ?? ''

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 text-gold-400 text-xs font-bold mb-4 uppercase tracking-widest">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live Lottery
        </div>
        <h1 className="text-5xl md:text-6xl font-black mb-3">
          <span className="bg-gold-shimmer bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
            Your Luck
          </span>
          <br />
          <span className="text-white">Starts Here</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Scratch your card, match your number, claim your prize. Simple. Thrilling. Real.
        </p>

        {announcement && (
          <div className="mt-4 bg-purple-900/30 border border-purple-700/40 rounded-xl px-4 py-3 text-purple-300 text-sm max-w-2xl mx-auto">
            📢 {announcement}
          </div>
        )}
      </div>

      {/* Live feed */}
      <div className="mb-8">
        <LiveFeed />
      </div>

      {/* Recent winners marquee */}
      {recentWinners.length > 0 && (
        <div className="mb-8 bg-green-500/5 border border-green-500/20 rounded-xl py-2 px-4 overflow-hidden">
          <div className="flex gap-10 animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
            {[...recentWinners, ...recentWinners].map((w, i) => (
              <span key={i} className="text-xs text-green-400 inline-flex items-center gap-2">
                🏆 <span className="font-bold">{w.user.name}</span> won ₹{w.prizeAmount?.toLocaleString('en-IN')} in {w.lottery.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Active Lotteries', value: lotteries.length, icon: '🎰' },
          { label: 'Winners This Week', value: recentWinners.length, icon: '🏆' },
          { label: 'Max Win %', value: '20%', icon: '🎯' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black text-gold-400">{s.value}</div>
            <div className="text-gray-600 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active lotteries */}
      <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        Active Lotteries
      </h2>

      {lotteries.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎰</div>
          <div className="text-gray-400 text-lg font-bold">No active lotteries right now</div>
          <div className="text-gray-600 text-sm mt-2">Check back soon — new lotteries drop regularly!</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lotteries.map(l => (
            <LotteryCard key={l.id} lottery={l as Parameters<typeof LotteryCard>[0]['lottery']} />
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="mt-16 mb-8">
        <h2 className="text-2xl font-black text-center text-white mb-8">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: '01', icon: '💳', title: 'Pay via UPI', desc: 'Scan QR and pay the ticket price' },
            { step: '02', icon: '🔢', title: 'Enter UTR', desc: 'Submit your UPI transaction reference' },
            { step: '03', icon: '✅', title: 'Get Verified', desc: 'Admin confirms your payment instantly' },
            { step: '04', icon: '🎰', title: 'Scratch & Win', desc: 'Match your number with winners board' },
          ].map(s => (
            <div key={s.step} className="card p-5 text-center relative overflow-hidden">
              <div className="absolute top-2 right-3 text-5xl font-black text-purple-900/40">{s.step}</div>
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="text-white font-bold text-sm mb-1">{s.title}</div>
              <div className="text-gray-500 text-xs">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <Link href="/register" className="btn-gold text-lg px-10 py-4 rounded-xl inline-block font-black">
          Join Now & Try Your Luck 🎰
        </Link>
        <p className="text-gray-700 text-xs mt-3">18+ only · Play responsibly</p>
      </div>
    </div>
  )
}
