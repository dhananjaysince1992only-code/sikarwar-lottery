import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export const revalidate = 5

async function getRounds() {
  return prisma.colorRound.findMany({
    where: { status: 'OPEN' },
    include: {
      bets: { where: { utrStatus: 'APPROVED' }, select: { color: true, amount: true } },
      _count: { select: { bets: { where: { utrStatus: 'APPROVED' } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function getRecentResults() {
  return prisma.colorRound.findMany({
    where: { status: 'RESOLVED' },
    select: { result: true, resolvedAt: true },
    orderBy: { resolvedAt: 'desc' },
    take: 20,
  })
}

const COLOR_CONFIG = {
  red: { label: 'Red', bg: 'bg-red-600/20', border: 'border-red-500/40', text: 'text-red-400', dot: 'bg-red-500', multiplier: '1.9×' },
  green: { label: 'Green', bg: 'bg-green-600/20', border: 'border-green-500/40', text: 'text-green-400', dot: 'bg-green-500', multiplier: '1.9×' },
  violet: { label: 'Violet', bg: 'bg-violet-600/20', border: 'border-violet-500/40', text: 'text-violet-400', dot: 'bg-violet-500', multiplier: '4.5×' },
}

export default async function ColorGamePage() {
  const [rounds, recent, session] = await Promise.all([getRounds(), getRecentResults(), getSession()])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 text-violet-400 text-xs font-bold mb-3 uppercase tracking-widest">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
          Instant Color Game
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-2">
          <span className="text-red-400">Red</span>
          <span className="text-gray-600 mx-2">·</span>
          <span className="text-green-400">Green</span>
          <span className="text-gray-600 mx-2">·</span>
          <span className="text-violet-400">Violet</span>
        </h1>
        <p className="text-gray-400 text-sm">Pick your color · Pay via UPI · Win up to <span className="text-gold-400 font-black">4.5×</span> your bet</p>
      </div>

      {/* Multipliers */}
      <div className="grid grid-cols-3 gap-3 mb-8 max-w-md mx-auto">
        {Object.entries(COLOR_CONFIG).map(([color, cfg]) => (
          <div key={color} className={`${cfg.bg} border ${cfg.border} rounded-2xl p-3 text-center`}>
            <div className={`w-8 h-8 ${cfg.dot} rounded-full mx-auto mb-1.5`} />
            <div className={`font-black text-sm ${cfg.text}`}>{cfg.label}</div>
            <div className="text-white font-black text-xl">{cfg.multiplier}</div>
          </div>
        ))}
      </div>

      {/* Recent results ticker */}
      {recent.length > 0 && (
        <div className="mb-8 bg-casino-800 border border-purple-900/40 rounded-xl py-2 px-4 overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="text-gray-600 text-xs shrink-0">Recent:</span>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {recent.map((r, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 shrink-0 rounded-full inline-block ${
                    r.result === 'red' ? 'bg-red-500' :
                    r.result === 'green' ? 'bg-green-500' : 'bg-violet-500'
                  }`}
                  title={r.result ?? ''}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Open rounds */}
      {rounds.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎰</div>
          <div className="text-gray-400 font-bold text-lg">No open rounds right now</div>
          <div className="text-gray-600 text-sm mt-1">Check back soon — new rounds open frequently</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rounds.map(round => {
            const poolRed = round.bets.filter(b => b.color === 'red').reduce((s, b) => s + b.amount, 0)
            const poolGreen = round.bets.filter(b => b.color === 'green').reduce((s, b) => s + b.amount, 0)
            const poolViolet = round.bets.filter(b => b.color === 'violet').reduce((s, b) => s + b.amount, 0)
            const total = poolRed + poolGreen + poolViolet

            return (
              <Link key={round.id} href={`/color-game/${round.id}`}>
                <div className="card p-5 hover:border-violet-500/40 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">🟢 OPEN</span>
                    <span className="text-gray-600 text-xs">{round._count.bets} players</span>
                  </div>

                  <h3 className="text-white font-black text-lg mb-3 group-hover:text-violet-400 transition-colors">
                    {round.title}
                  </h3>

                  {/* Color pools */}
                  <div className="space-y-1.5 mb-4">
                    {[
                      { color: 'red', pool: poolRed, cfg: COLOR_CONFIG.red },
                      { color: 'green', pool: poolGreen, cfg: COLOR_CONFIG.green },
                      { color: 'violet', pool: poolViolet, cfg: COLOR_CONFIG.violet },
                    ].map(({ color, pool, cfg }) => (
                      <div key={color} className="flex items-center gap-2 text-xs">
                        <span className={`w-3 h-3 rounded-full ${cfg.dot} shrink-0`} />
                        <span className={`${cfg.text} font-bold w-12`}>{cfg.label}</span>
                        <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cfg.dot}`}
                            style={{ width: total > 0 ? `${(pool / total) * 100}%` : '33%', opacity: 0.7 }}
                          />
                        </div>
                        <span className="text-gray-500 w-16 text-right">₹{pool.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-800 pt-3 flex justify-between text-xs">
                    <span className="text-gray-600">Total pool</span>
                    <span className="text-gold-400 font-black">₹{total.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="mt-3 btn-gold text-center py-2.5 rounded-xl text-sm font-black">
                    {session ? '🎰 Play Now →' : '🎰 Join & Play →'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
