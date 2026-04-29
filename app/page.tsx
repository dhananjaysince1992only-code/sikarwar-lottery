import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
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

async function getOpenQuestions() {
  return prisma.question.findMany({
    where: { status: 'OPEN' },
    include: { _count: { select: { bets: { where: { utrStatus: 'APPROVED' } } } } },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })
}

async function getRecentWinners() {
  return prisma.ticket.findMany({
    where: { isWinner: true, scratchedAt: { not: null } },
    include: { user: { select: { name: true } }, lottery: { select: { name: true } } },
    orderBy: { scratchedAt: 'desc' },
    take: 12,
  })
}

async function getUserStats(userId: string) {
  const [myTickets, myWins] = await Promise.all([
    prisma.ticket.count({ where: { userId, utrStatus: 'APPROVED' } }),
    prisma.ticket.findMany({
      where: { userId, isWinner: true },
      select: { prizeAmount: true },
    }),
  ])
  const totalWon = myWins.reduce((s, t) => s + (t.prizeAmount ?? 0), 0)
  return { myTickets, myWins: myWins.length, totalWon }
}

export default async function HomePage() {
  const [{ lotteries, settings }, recentWinners, openQuestions, session] = await Promise.all([
    getData(),
    getRecentWinners(),
    getOpenQuestions(),
    getSession(),
  ])

  const userStats = session ? await getUserStats(session.id) : null
  const announcement = settings['announcement'] ?? ''

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Announcement */}
      {announcement && (
        <div className="mb-6 bg-purple-900/30 border border-purple-700/40 rounded-xl px-4 py-3 text-purple-300 text-sm text-center">
          📢 {announcement}
        </div>
      )}

      {/* Hero — changes based on auth state */}
      {session ? (
        /* Logged-in: personalized dashboard */
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-white">
                Welcome back, <span className="text-gold-400">{session.name.split(' ')[0]}</span> 👋
              </h1>
              <p className="text-gray-500 text-sm mt-1">Ready to try your luck today?</p>
            </div>
            <Link href="/tickets" className="btn-gold px-5 py-2.5 rounded-xl text-sm font-black hidden md:block">
              My Tickets →
            </Link>
          </div>

          {/* User stats */}
          <div className="grid grid-cols-3 gap-3 mb-2">
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-purple-400">{userStats?.myTickets ?? 0}</div>
              <div className="text-gray-600 text-xs mt-0.5">Tickets Bought</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-green-400">{userStats?.myWins ?? 0}</div>
              <div className="text-gray-600 text-xs mt-0.5">Times Won</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-gold-400">
                ₹{(userStats?.totalWon ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="text-gray-600 text-xs mt-0.5">Total Won</div>
            </div>
          </div>
        </div>
      ) : (
        /* Guest: marketing hero */
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 text-gold-400 text-xs font-bold mb-4 uppercase tracking-widest">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Now
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-3">
            <span className="bg-gold-shimmer bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
              Your Luck
            </span>
            <br />
            <span className="text-white">Starts Here</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-6">
            Scratch your card, match your number, claim your prize.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/register" className="btn-gold text-base px-8 py-3 rounded-xl inline-block font-black">
              Register & Play 🎰
            </Link>
            <Link href="/login" className="px-8 py-3 rounded-xl border border-gray-700 text-gray-300 hover:border-gray-500 transition-colors font-medium text-base">
              Login
            </Link>
          </div>
        </div>
      )}

      {/* Live feed */}
      <div className="mb-6">
        <LiveFeed />
      </div>

      {/* Recent winners ticker */}
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

      {/* Site stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Active Lotteries', value: lotteries.length, icon: '🎰' },
          { label: 'Winners This Week', value: recentWinners.length, icon: '🏆' },
          { label: 'Prize Pool %', value: '70%', icon: '💰' },
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
          <div className="text-gray-600 text-sm mt-2">Check back soon!</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {lotteries.map(l => (
            <LotteryCard key={l.id} lottery={l as Parameters<typeof LotteryCard>[0]['lottery']} loggedIn={!!session} />
          ))}
        </div>
      )}

      {/* Predictions preview */}
      {openQuestions.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              Prediction Markets
            </h2>
            <Link href="/predictions" className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-bold">
              View All →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {openQuestions.map(q => (
              <Link key={q.id} href={`/predictions/${q.id}`}>
                <div className="card p-4 hover:border-blue-500/40 transition-all cursor-pointer group">
                  <div className="text-xs text-blue-400 font-bold mb-2 uppercase tracking-widest">Live · {q._count.bets} bets</div>
                  <p className="text-white font-bold text-sm mb-3 line-clamp-2 group-hover:text-blue-300 transition-colors">{q.question}</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg py-1.5 text-center">
                      <div className="text-green-400 text-xs font-black">{q.optionA}</div>
                    </div>
                    <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg py-1.5 text-center">
                      <div className="text-red-400 text-xs font-black">{q.optionB}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* How it works — only for guests */}
      {!session && (
        <div className="mb-8">
          <h2 className="text-2xl font-black text-center text-white mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '01', icon: '💳', title: 'Pay via UPI', desc: 'Scan QR and pay the ticket price' },
              { step: '02', icon: '🔢', title: 'Enter UTR', desc: 'Submit your UPI transaction ID' },
              { step: '03', icon: '✅', title: 'Get Verified', desc: 'Admin confirms your payment' },
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
      )}
    </div>
  )
}
