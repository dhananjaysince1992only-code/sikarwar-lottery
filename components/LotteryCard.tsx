'use client'
import Link from 'next/link'

interface Lottery {
  id: string
  name: string
  description: string
  ticketPrice: number
  maxParticipants: number
  winPercent: number
  poolPercent: number
  status: string
  prizeTiers: { tierName: string; amount: number; rank: number; winnerCount: number }[]
  _count: { tickets: number }
}

export default function LotteryCard({ lottery, loggedIn }: { lottery: Lottery; loggedIn: boolean }) {
  const filled = lottery._count.tickets
  const max = lottery.maxParticipants
  const pct = Math.round((filled / max) * 100)
  const spotsLeft = max - filled
  const topPrize = lottery.prizeTiers[0]?.amount ?? 0
  const isOpen = lottery.status === 'SCRATCH_OPEN'
  const isCompleted = lottery.status === 'COMPLETED'

  const urgency = pct >= 90 ? 'ALMOST FULL!' : pct >= 70 ? 'FILLING FAST' : pct >= 40 ? 'JOIN NOW' : 'JUST OPENED'
  const urgencyColor = pct >= 90 ? 'text-red-400 animate-pulse' : pct >= 70 ? 'text-orange-400' : 'text-green-400'

  return (
    <div className="group relative bg-card-gradient border border-purple-900/50 rounded-2xl p-5 hover:border-gold-500/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col">
      {/* Shimmer on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-gold-500/5 to-transparent pointer-events-none" />

      {/* Status badge */}
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-black px-2 py-1 rounded-full ${
          isOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          isCompleted ? 'bg-gray-500/20 text-gray-400' :
          'bg-purple-500/20 text-purple-300 border border-purple-500/30'
        }`}>
          {isOpen ? '🟢 SCRATCH OPEN' : isCompleted ? 'COMPLETED' : '🎯 ACTIVE'}
        </span>
        {!isCompleted && !isOpen && (
          <span className={`text-xs font-black ${urgencyColor}`}>{urgency}</span>
        )}
      </div>

      <h3 className="text-white font-black text-xl mb-1 group-hover:text-gold-400 transition-colors">{lottery.name}</h3>
      {lottery.description && <p className="text-gray-500 text-xs mb-3 line-clamp-1">{lottery.description}</p>}

      {/* Top prize highlight */}
      {topPrize > 0 && (
        <div className="mb-3 bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 text-center">
          <div className="text-gray-400 text-xs uppercase tracking-widest">Top Prize</div>
          <div className="text-gold-400 font-black text-2xl animate-glow">₹{topPrize.toLocaleString('en-IN')}</div>
        </div>
      )}

      {/* Prize tiers */}
      {lottery.prizeTiers.length > 0 && (
        <div className="mb-3 space-y-1">
          {lottery.prizeTiers.slice(0, 3).map(tier => (
            <div key={tier.rank} className="flex justify-between items-center text-xs">
              <span className="text-gray-500">{tier.tierName} <span className="text-gray-600">×{tier.winnerCount}</span></span>
              <span className="text-white font-bold">₹{tier.amount.toLocaleString('en-IN')}</span>
            </div>
          ))}
          {lottery.prizeTiers.length > 3 && (
            <div className="text-xs text-gray-600 text-center">+{lottery.prizeTiers.length - 3} more tiers</div>
          )}
        </div>
      )}

      <div className="flex justify-between text-sm mb-3">
        <span className="text-gray-400">Ticket Price</span>
        <span className="text-white font-bold">₹{lottery.ticketPrice.toLocaleString('en-IN')}</span>
      </div>

      {!isCompleted && !isOpen && (
        <>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{filled} joined</span>
              <span className={spotsLeft <= 20 ? 'text-red-400 font-bold' : 'text-gray-500'}>
                {spotsLeft} spots left
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct >= 90
                    ? 'linear-gradient(90deg, #EF4444, #F97316)'
                    : 'linear-gradient(90deg, #7C3AED, #EC4899)',
                }}
              />
            </div>
          </div>
          <div className="text-xs text-gray-600 text-center mb-3">{pct}% full</div>
        </>
      )}

      <div className="mt-auto pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-600 mb-3">
        <span>{lottery.winPercent}% winners</span>
        <span>{lottery.poolPercent}% prize pool</span>
      </div>

      {/* CTA button */}
      {!isCompleted && (
        <Link
          href={loggedIn ? `/lottery/${lottery.id}` : '/register'}
          className={`block text-center py-2.5 rounded-xl font-black text-sm transition-all ${
            isOpen
              ? 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30'
              : 'btn-gold'
          }`}
        >
          {isOpen
            ? '🎰 Scratch Your Card →'
            : loggedIn
            ? '🎟️ Buy Ticket →'
            : '🎰 Join & Play →'}
        </Link>
      )}
      {isCompleted && (
        <Link
          href={`/lottery/${lottery.id}`}
          className="block text-center py-2.5 rounded-xl font-black text-sm border border-gray-700 text-gray-400 hover:border-gray-500 transition-all"
        >
          View Results →
        </Link>
      )}
    </div>
  )
}
