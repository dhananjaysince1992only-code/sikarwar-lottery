import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const revalidate = 30

async function getLeaderboard() {
  const tickets = await prisma.ticket.findMany({
    where: { isWinner: true, prizeAmount: { not: null } },
    select: { userId: true, prizeAmount: true, user: { select: { name: true } } },
  })

  const byUser: Record<string, { name: string; totalWon: number; wins: number }> = {}
  for (const t of tickets) {
    if (!byUser[t.userId]) byUser[t.userId] = { name: t.user.name, totalWon: 0, wins: 0 }
    byUser[t.userId].totalWon += t.prizeAmount ?? 0
    byUser[t.userId].wins += 1
  }

  return Object.entries(byUser)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.totalWon - a.totalWon)
    .slice(0, 50)
}

async function getStats() {
  const [totalTickets, totalWinners, totalPaidOut] = await Promise.all([
    prisma.ticket.count({ where: { utrStatus: 'APPROVED' } }),
    prisma.ticket.count({ where: { isWinner: true } }),
    prisma.ticket.aggregate({ where: { isWinner: true }, _sum: { prizeAmount: true } }),
  ])
  return { totalTickets, totalWinners, totalPaidOut: totalPaidOut._sum.prizeAmount ?? 0 }
}

const medals = ['🥇', '🥈', '🥉']

export default async function LeaderboardPage() {
  const [leaders, stats, session] = await Promise.all([getLeaderboard(), getStats(), getSession()])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-white mb-2">🏆 Leaderboard</h1>
        <p className="text-gray-500 text-sm">Top winners across all lotteries</p>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Tickets', value: stats.totalTickets.toLocaleString('en-IN'), icon: '🎟️' },
          { label: 'Total Winners', value: stats.totalWinners.toLocaleString('en-IN'), icon: '🏆' },
          { label: 'Total Paid Out', value: `₹${stats.totalPaidOut.toLocaleString('en-IN')}`, icon: '💰' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-black text-gold-400">{s.value}</div>
            <div className="text-gray-600 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {leaders.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎰</div>
          <div className="text-gray-400 font-bold">No winners yet — be the first!</div>
        </div>
      ) : (
        <div className="space-y-2">
          {leaders.map((leader, i) => {
            const isMe = session?.id === leader.id
            return (
              <div
                key={leader.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  i === 0 ? 'bg-gold-500/10 border-gold-500/30' :
                  i === 1 ? 'bg-gray-400/5 border-gray-400/20' :
                  i === 2 ? 'bg-orange-900/10 border-orange-700/20' :
                  isMe ? 'bg-purple-900/20 border-purple-700/40' :
                  'bg-casino-800/50 border-gray-800/50'
                }`}
              >
                {/* Rank */}
                <div className="w-10 text-center flex-shrink-0">
                  {i < 3 ? (
                    <span className="text-2xl">{medals[i]}</span>
                  ) : (
                    <span className="text-gray-500 font-black text-lg">#{i + 1}</span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-black truncate ${
                      i === 0 ? 'text-gold-400 text-lg' : i < 3 ? 'text-white' : 'text-gray-300'
                    }`}>
                      {leader.name}
                    </span>
                    {isMe && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-gray-600 text-xs">{leader.wins} win{leader.wins !== 1 ? 's' : ''}</div>
                </div>

                {/* Total won */}
                <div className="text-right flex-shrink-0">
                  <div className={`font-black text-lg ${i === 0 ? 'text-gold-400' : 'text-green-400'}`}>
                    ₹{leader.totalWon.toLocaleString('en-IN')}
                  </div>
                  <div className="text-gray-600 text-xs">total won</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
