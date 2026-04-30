import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import BetForm from './BetForm'

export const revalidate = 5

const COLOR_CONFIG = {
  red: { label: 'Red', bg: 'bg-red-900/20', border: 'border-red-500/40', text: 'text-red-400', dot: 'bg-red-500', multiplier: 1.9 },
  green: { label: 'Green', bg: 'bg-green-900/20', border: 'border-green-500/40', text: 'text-green-400', dot: 'bg-green-500', multiplier: 1.9 },
  violet: { label: 'Violet', bg: 'bg-violet-900/20', border: 'border-violet-500/40', text: 'text-violet-400', dot: 'bg-violet-500', multiplier: 4.5 },
}

export default async function ColorRoundPage({ params }: { params: { id: string } }) {
  const [round, session] = await Promise.all([
    prisma.colorRound.findUnique({
      where: { id: params.id },
      include: {
        bets: {
          where: { utrStatus: 'APPROVED' },
          select: { color: true, amount: true, userId: true },
        },
      },
    }),
    getSession(),
  ])

  if (!round) notFound()

  const poolRed = round.bets.filter(b => b.color === 'red').reduce((s, b) => s + b.amount, 0)
  const poolGreen = round.bets.filter(b => b.color === 'green').reduce((s, b) => s + b.amount, 0)
  const poolViolet = round.bets.filter(b => b.color === 'violet').reduce((s, b) => s + b.amount, 0)
  const total = poolRed + poolGreen + poolViolet

  const userBetRaw = session ? await prisma.colorBet.findFirst({
    where: { roundId: params.id, userId: session.id },
    select: { color: true, amount: true, utrStatus: true, payout: true, payoutStatus: true },
  }) : null

  const isResolved = round.status === 'RESOLVED'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href="/color-game" className="text-gray-600 hover:text-gray-400 text-sm">← Color Game</a>
        <span className={`text-xs font-black px-3 py-1 rounded-full ${
          isResolved ? 'bg-gray-700 text-gray-400' : 'bg-green-500/20 text-green-400 border border-green-500/30'
        }`}>
          {isResolved ? 'RESOLVED' : '🟢 OPEN'}
        </span>
      </div>

      <h1 className="text-3xl font-black text-white mb-6">{round.title}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Color pools + result */}
        <div className="space-y-5">
          {/* Result banner */}
          {isResolved && round.result && (
            <div className={`${COLOR_CONFIG[round.result as keyof typeof COLOR_CONFIG].bg} border ${COLOR_CONFIG[round.result as keyof typeof COLOR_CONFIG].border} rounded-2xl p-5 text-center`}>
              <div className="text-gray-400 text-sm mb-2">Result</div>
              <div className={`w-16 h-16 ${COLOR_CONFIG[round.result as keyof typeof COLOR_CONFIG].dot} rounded-full mx-auto mb-2`} />
              <div className={`font-black text-2xl ${COLOR_CONFIG[round.result as keyof typeof COLOR_CONFIG].text}`}>
                {COLOR_CONFIG[round.result as keyof typeof COLOR_CONFIG].label} Wins!
              </div>
              <div className="text-gray-400 text-sm mt-1">
                {COLOR_CONFIG[round.result as keyof typeof COLOR_CONFIG].multiplier}× payout
              </div>
            </div>
          )}

          {/* Color breakdown */}
          <div className="card p-5">
            <h3 className="text-gray-400 font-bold text-sm mb-4 uppercase tracking-widest">Pool Breakdown</h3>
            <div className="space-y-3">
              {[
                { color: 'red', pool: poolRed },
                { color: 'green', pool: poolGreen },
                { color: 'violet', pool: poolViolet },
              ].map(({ color, pool }) => {
                const cfg = COLOR_CONFIG[color as keyof typeof COLOR_CONFIG]
                const pct = total > 0 ? (pool / total) * 100 : 33
                const winners = round.bets.filter(b => b.color === color).length
                const isWinner = isResolved && round.result === color
                return (
                  <div key={color} className={`rounded-xl p-3 border ${isWinner ? cfg.border : 'border-gray-900'} ${isWinner ? cfg.bg : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 ${cfg.dot} rounded-full`} />
                        <span className={`font-black text-sm ${isWinner ? cfg.text : 'text-gray-300'}`}>{cfg.label}</span>
                        {isWinner && <span className="text-xs font-bold text-white bg-white/10 px-1.5 rounded">WINNER {cfg.multiplier}×</span>}
                      </div>
                      <span className={`font-bold text-sm ${isWinner ? cfg.text : 'text-white'}`}>
                        ₹{pool.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                      <div className={`h-full ${cfg.dot} rounded-full`} style={{ width: `${pct}%`, opacity: 0.8 }} />
                    </div>
                    <div className="text-gray-600 text-xs mt-1">{winners} bets · {Math.round(pct)}%</div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-900 flex justify-between text-sm">
              <span className="text-gray-500">Total pool</span>
              <span className="text-gold-400 font-black">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* How payouts work */}
          <div className="card p-4">
            <div className="text-gray-600 text-xs uppercase tracking-widest mb-3">Payout Multipliers</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-red-400">🔴 Red wins</span>
                <span className="text-white font-bold">Bet × 1.9</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400">🟢 Green wins</span>
                <span className="text-white font-bold">Bet × 1.9</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-violet-400">🟣 Violet wins</span>
                <span className="text-gold-400 font-black">Bet × 4.5 🔥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Bet form */}
        <div>
          <BetForm
            roundId={round.id}
            upiId={round.upiId}
            qrImage={round.qrImage}
            loggedIn={!!session}
            userBet={userBetRaw}
            isResolved={isResolved}
            result={round.result}
          />
        </div>
      </div>
    </div>
  )
}
