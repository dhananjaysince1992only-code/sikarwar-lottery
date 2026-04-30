import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import LotteryCard from '@/components/LotteryCard'
import Link from 'next/link'

export const revalidate = 10

async function getData() {
  const [lotteries, settings, questions] = await Promise.all([
    prisma.lottery.findMany({
      where: { status: { in: ['ACTIVE', 'SCRATCH_OPEN'] } },
      include: {
        prizeTiers: { orderBy: { rank: 'asc' } },
        _count: { select: { tickets: { where: { utrStatus: 'APPROVED' } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.siteSetting.findMany(),
    prisma.question.findMany({
      where: { status: 'OPEN' },
      include: {
        bets: { where: { utrStatus: 'APPROVED' }, select: { option: true, amount: true } },
        _count: { select: { bets: { where: { utrStatus: 'APPROVED' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ])
  const settingsMap: Record<string, string> = {}
  for (const s of settings) settingsMap[s.key] = s.value
  return { lotteries, settings: settingsMap, questions }
}

async function getRecentWinners() {
  return prisma.ticket.findMany({
    where: { isWinner: true, scratchedAt: { not: null } },
    include: { user: { select: { name: true } }, lottery: { select: { name: true } } },
    orderBy: { scratchedAt: 'desc' },
    take: 12,
  })
}

export default async function HomePage() {
  const [{ lotteries, settings, questions }, recentWinners, session] = await Promise.all([
    getData(),
    getRecentWinners(),
    getSession(),
  ])

  const announcement = settings['announcement'] ?? ''

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Announcement banner */}
      {announcement && (
        <div className="mb-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-300 text-sm text-center flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
          {announcement}
        </div>
      )}

      {/* Hero */}
      {!session ? (
        <div className="text-center mb-10 pt-4">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-xs font-semibold mb-5 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live Now · {lotteries.length} Active Lotteries
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 leading-tight">
            <span className="text-white">Win Big with </span>
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Sikarwar</span>
          </h1>
          <p className="text-gray-400 text-base max-w-md mx-auto mb-6">
            Buy lottery tickets, predict outcomes, win real money. Transparent UPI payouts.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/register" className="btn-gold text-sm px-7 py-3 rounded-xl inline-block font-black">
              Start Playing
            </Link>
            <Link href="/login" className="px-7 py-3 rounded-xl border border-white/10 text-gray-300 hover:border-white/20 hover:text-white transition-all font-semibold text-sm">
              Login
            </Link>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white mb-1">
            Hey, <span className="text-gold-400">{session.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm">Ready to play today?</p>
        </div>
      )}

      {/* Recent winners ticker */}
      {recentWinners.length > 0 && (
        <div className="mb-7 overflow-hidden rounded-xl bg-green-500/5 border border-green-500/10 py-2.5 px-4">
          <div className="flex gap-12 animate-marquee whitespace-nowrap w-max">
            {[...recentWinners, ...recentWinners].map((w, i) => (
              <span key={i} className="text-xs text-green-400 inline-flex items-center gap-2">
                <span className="text-green-500">🏆</span>
                <span className="font-semibold">{w.user.name.split(' ')[0]}</span>
                <span className="text-green-600">won</span>
                <span className="font-bold">₹{w.prizeAmount?.toLocaleString('en-IN')}</span>
                <span className="text-green-700">in {w.lottery.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lotteries section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <h2 className="text-lg font-black text-white">Lotteries</h2>
            {lotteries.length > 0 && <span className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">{lotteries.length} live</span>}
          </div>
          <Link href="/tickets" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            My Tickets →
          </Link>
        </div>

        {lotteries.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-3">🎰</div>
            <div className="text-gray-400 font-semibold">No active lotteries right now</div>
            <div className="text-gray-600 text-sm mt-1">Check back soon!</div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lotteries.map(l => (
              <LotteryCard key={l.id} lottery={l as Parameters<typeof LotteryCard>[0]['lottery']} loggedIn={!!session} />
            ))}
          </div>
        )}
      </section>

      {/* Predictions section */}
      {questions.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <h2 className="text-lg font-black text-white">Prediction Markets</h2>
            </div>
            <Link href="/predictions" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              View All →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {questions.map(q => {
              const approved = q.bets
              const poolA = approved.filter(b => b.option === 'A').reduce((s, b) => s + b.amount, 0)
              const poolB = approved.filter(b => b.option === 'B').reduce((s, b) => s + b.amount, 0)
              const total = poolA + poolB
              const pctA = total > 0 ? Math.round((poolA / total) * 100) : 50
              const pctB = 100 - pctA
              return (
                <Link key={q.id} href={`/predictions/${q.id}`}>
                  <div className="card p-4 hover:border-purple-500/40 transition-all cursor-pointer group h-full">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0">Live</span>
                      <span className="text-gray-600 text-[10px]">{q._count.bets} bets · ₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-white font-bold text-sm mb-4 leading-snug group-hover:text-purple-300 transition-colors line-clamp-2">
                      {q.question}
                    </p>
                    <div className="space-y-2">
                      <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-600/80 to-green-500/60 rounded-lg transition-all" style={{ width: `${pctA}%` }} />
                        <div className="absolute inset-0 flex items-center justify-between px-2.5">
                          <span className="text-white text-xs font-bold truncate pr-2">{q.optionA}</span>
                          <span className="text-white text-xs font-black shrink-0">{pctA}%</span>
                        </div>
                      </div>
                      <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600/80 to-red-500/60 rounded-lg transition-all" style={{ width: `${pctB}%` }} />
                        <div className="absolute inset-0 flex items-center justify-between px-2.5">
                          <span className="text-white text-xs font-bold truncate pr-2">{q.optionB}</span>
                          <span className="text-white text-xs font-black shrink-0">{pctB}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* How it works — guests only */}
      {!session && (
        <section className="mb-6">
          <h2 className="text-lg font-black text-white mb-4 text-center">How It Works</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '💳', title: 'Pay via UPI', desc: 'Scan QR and pay the ticket price' },
              { icon: '🔢', title: 'Enter UTR', desc: 'Submit your UPI transaction ID' },
              { icon: '✅', title: 'Get Verified', desc: 'Admin confirms within minutes' },
              { icon: '🏆', title: 'Win Prizes', desc: 'Scratch & win or predict right' },
            ].map(s => (
              <div key={s.title} className="card p-4 text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-white font-bold text-xs mb-1">{s.title}</div>
                <div className="text-gray-500 text-xs">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
